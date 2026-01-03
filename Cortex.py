import os
import json
import requests
import base64
from io import BytesIO
from PIL import Image as PILImage
from flask import Flask, request, jsonify, Response, stream_with_context, session
from flask_cors import CORS
import google.generativeai as genai
from dotenv import load_dotenv
from datetime import datetime, timedelta
import uuid
import psycopg2
from psycopg2.extras import RealDictCursor
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
from functools import wraps
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'your-secret-key-change-this')
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'jwt-secret-key-change-this')
app.config['JWT_EXPIRATION_HOURS'] = int(os.getenv('JWT_EXPIRATION_HOURS', 24))
CORS(app, supports_credentials=True)  # Enable CORS for all routes with credentials

# SendGrid Configuration
SENDGRID_API_KEY = os.getenv('SENDGRID_API_KEY')
SENDGRID_FROM_EMAIL = os.getenv('SENDGRID_FROM_EMAIL')

# Google OAuth Configuration
GOOGLE_CLIENT_ID = os.getenv('GOOGLE_CLIENT_ID')
GOOGLE_CLIENT_SECRET = os.getenv('GOOGLE_CLIENT_SECRET')

# Frontend URL Configuration
FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:5173')

# Configure Gemini API
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY not found in environment variables")

genai.configure(api_key=GEMINI_API_KEY)

# PostgreSQL Database Configuration
DATABASE_URL = os.getenv('DATABASE_URL')
if not DATABASE_URL:
    raise ValueError("DATABASE_URL not found in environment variables")


# Database connection function
def get_db_connection():
    """Create and return a database connection"""
    try:
        conn = psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)
        return conn
    except Exception as e:
        print(f"Database connection error: {e}")
        raise


# Initialize database tables
def init_db():
    """Initialize database tables"""
    conn = get_db_connection()
    cur = conn.cursor()
    
    # Drop and recreate user_sessions table to fix schema issues
    try:
        cur.execute('DROP TABLE IF EXISTS user_sessions CASCADE')
        conn.commit()
    except Exception as e:
        print(f"Warning dropping user_sessions: {e}")
        conn.rollback()
    
    # Users table
    cur.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            username VARCHAR(50) UNIQUE NOT NULL,
            email VARCHAR(100) UNIQUE NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            full_name VARCHAR(100),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            last_login TIMESTAMP,
            is_active BOOLEAN DEFAULT TRUE,
            reset_token TEXT,
            reset_token_expires TIMESTAMP
        )
    ''')
    
    # Fix existing users with NULL is_active
    try:
        cur.execute("UPDATE users SET is_active = TRUE WHERE is_active IS NULL")
        updated_count = cur.rowcount
        if updated_count > 0:
            print(f"✅ Fixed {updated_count} users with NULL is_active")
        conn.commit()
    except Exception as e:
        print(f"Warning updating is_active: {e}")
        conn.rollback()
    
    # Add reset token columns if they don't exist
    try:
        cur.execute("""
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS reset_token TEXT,
            ADD COLUMN IF NOT EXISTS reset_token_expires TIMESTAMP
        """)
        conn.commit()
        print("✅ Added reset token columns to users table")
    except Exception as e:
        print(f"Warning adding reset token columns: {e}")
        conn.rollback()
    
    # Conversations table
    cur.execute('''
        CREATE TABLE IF NOT EXISTS conversations (
            id UUID PRIMARY KEY,
            user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            title VARCHAR(200) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Messages table
    cur.execute('''
        CREATE TABLE IF NOT EXISTS messages (
            id SERIAL PRIMARY KEY,
            conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
            role VARCHAR(20) NOT NULL,
            content TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Sessions table (recreated with correct schema)
    cur.execute('''
        CREATE TABLE IF NOT EXISTS user_sessions (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            token TEXT UNIQUE NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            expires_at TIMESTAMP NOT NULL,
            is_active BOOLEAN DEFAULT TRUE
        )
    ''')
    
    conn.commit()
    cur.close()
    conn.close()
    print("✅ Database tables initialized successfully")


# JWT Token decorator
def token_required(f):
    """Decorator to protect routes with JWT authentication"""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        
        # Get token from header
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            try:
                token = auth_header.split(" ")[1]  # Bearer <token>
            except IndexError:
                print("❌ Token validation failed: Invalid token format")
                return jsonify({"error": "Invalid token format"}), 401
        
        if not token:
            print("❌ Token validation failed: Token is missing")
            return jsonify({"error": "Token is missing"}), 401
        
        try:
            # Decode token
            data = jwt.decode(token, app.config['JWT_SECRET_KEY'], algorithms=["HS256"])
            print(f"🔑 Token decoded successfully for user_id: {data.get('user_id')}")
            
            # Get user from database
            conn = get_db_connection()
            cur = conn.cursor()
            cur.execute("SELECT * FROM users WHERE id = %s AND (is_active = TRUE OR is_active IS NULL)", (data['user_id'],))
            current_user = cur.fetchone()
            
            if not current_user:
                print(f"❌ Token validation failed: User ID {data['user_id']} not found in database")
                # Check if user exists at all
                cur.execute("SELECT id, is_active FROM users WHERE id = %s", (data['user_id'],))
                any_user = cur.fetchone()
                if any_user:
                    print(f"⚠️ User exists but is_active = {any_user['is_active']}")
                else:
                    print(f"⚠️ User ID {data['user_id']} does not exist in database at all")
            else:
                print(f"✅ Token valid for user: {current_user['username']} (ID: {current_user['id']})")
            
            cur.close()
            conn.close()
            
            if not current_user:
                return jsonify({"error": "User not found"}), 401
            
        except jwt.ExpiredSignatureError:
            print("❌ Token validation failed: Token has expired")
            return jsonify({"error": "Token has expired"}), 401
        except jwt.InvalidTokenError as e:
            print(f"❌ Token validation failed: Invalid token - {str(e)}")
            return jsonify({"error": "Invalid token"}), 401
        except Exception as e:
            print(f"❌ Token validation failed: {str(e)}")
            return jsonify({"error": str(e)}), 401
        
        return f(current_user, *args, **kwargs)
    
    return decorated


# Store conversation histories per user (in production, use a database)
# Format: {user_id: {conversation_id: conversation_data}}
user_conversations = {}

# Model configuration
MODEL_NAME = "gemini-3-flash-preview"
generation_config = {
    "temperature": 0.9,
    "top_p": 0.95,
    "top_k": 40,
    "max_output_tokens": 8192,
}

safety_settings = [
    {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
    {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
    {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
    {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
]


# ============= AUTHENTICATION ENDPOINTS =============

@app.route('/auth/register', methods=['POST'])
def register():
    """Register a new user"""
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['username', 'email', 'password']
        for field in required_fields:
            if field not in data or not data[field]:
                return jsonify({"error": f"{field} is required"}), 400
        
        username = data['username'].strip()
        email = data['email'].lower().strip()  # Normalize email
        password = data['password']
        full_name = data.get('full_name', '').strip()
        
        # Validate email format
        if '@' not in email:
            return jsonify({"error": "Invalid email format"}), 400
        
        # Validate password strength
        if len(password) < 6:
            return jsonify({"error": "Password must be at least 6 characters"}), 400
        
        # Hash password
        password_hash = generate_password_hash(password)
        
        print(f"🔐 Registering user: {username}, email: {email}")
        print(f"🔑 Password length: {len(password)}")
        print(f"🔑 Hash method: pbkdf2:sha256")
        
        # Insert user into database
        conn = get_db_connection()
        cur = conn.cursor()
        
        try:
            cur.execute(
                """INSERT INTO users (username, email, password_hash, full_name) 
                   VALUES (%s, %s, %s, %s) RETURNING id, username, email, full_name, created_at""",
                (username, email, password_hash, full_name)
            )
            user = cur.fetchone()
            conn.commit()
            
            print(f"✅ User registered successfully with ID: {user['id']}")
            
            # Verify user was saved
            cur.execute("SELECT id, username, email FROM users WHERE email = %s", (email,))
            saved_user = cur.fetchone()
            if saved_user:
                print(f"✅ Verified in DB: User {saved_user['username']} (ID: {saved_user['id']}) with email {saved_user['email']}")
            else:
                print(f"⚠️ WARNING: User not found in DB after insert!")
            
            # Generate JWT token
            token = jwt.encode({
                'user_id': user['id'],
                'username': user['username'],
                'exp': datetime.utcnow() + timedelta(hours=app.config['JWT_EXPIRATION_HOURS'])
            }, app.config['JWT_SECRET_KEY'], algorithm="HS256")
            
            # Store session in database
            expires_at = datetime.utcnow() + timedelta(hours=app.config['JWT_EXPIRATION_HOURS'])
            cur.execute(
                "INSERT INTO user_sessions (user_id, token, expires_at) VALUES (%s, %s, %s)",
                (user['id'], token, expires_at)
            )
            conn.commit()
            
            cur.close()
            conn.close()
            
            return jsonify({
                "message": "User registered successfully",
                "user": {
                    "id": user['id'],
                    "username": user['username'],
                    "email": user['email'],
                    "full_name": user['full_name'],
                    "created_at": user['created_at'].isoformat() if user['created_at'] else None
                },
                "token": token
            }), 201
            
        except psycopg2.IntegrityError as e:
            conn.rollback()
            cur.close()
            conn.close()
            if 'username' in str(e):
                return jsonify({"error": "Username already exists"}), 409
            elif 'email' in str(e):
                return jsonify({"error": "Email already exists"}), 409
            else:
                return jsonify({"error": "User already exists"}), 409
                
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/auth/login', methods=['POST'])
def login():
    """Login user"""
    try:
        data = request.get_json()
        
        # Validate required fields
        if not data or 'email' not in data or 'password' not in data:
            return jsonify({"error": "Email and password are required"}), 400
        
        email = data['email'].lower().strip()  # Normalize email
        password = data['password']
        
        print(f"🔍 Login attempt for email: {email}")
        print(f"🔑 Password provided length: {len(password)}")
        
        # Get user from database
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("SELECT * FROM users WHERE LOWER(email) = %s AND is_active = TRUE", (email,))
        user = cur.fetchone()
        
        if not user:
            cur.close()
            conn.close()
            print(f"❌ Login failed: User not found with email {email}")
            return jsonify({"error": "Invalid email or password"}), 401
        
        print(f"✅ User found: ID={user['id']}, username={user['username']}")
        print(f"🔑 Stored hash starts with: {user['password_hash'][:30]}...")
        
        # Verify password
        password_match = check_password_hash(user['password_hash'], password)
        print(f"🔐 Password verification result: {password_match}")
        
        if not password_match:
            cur.close()
            conn.close()
            print(f"❌ Login failed: Invalid password for user {email}")
            return jsonify({"error": "Invalid email or password"}), 401
        
        # Update last login
        cur.execute("UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = %s", (user['id'],))
        conn.commit()
        
        # Generate JWT token
        token = jwt.encode({
            'user_id': user['id'],
            'username': user['username'],
            'exp': datetime.utcnow() + timedelta(hours=app.config['JWT_EXPIRATION_HOURS'])
        }, app.config['JWT_SECRET_KEY'], algorithm="HS256")
        
        # Store session in database
        expires_at = datetime.utcnow() + timedelta(hours=app.config['JWT_EXPIRATION_HOURS'])
        cur.execute(
            "INSERT INTO user_sessions (user_id, token, expires_at) VALUES (%s, %s, %s)",
            (user['id'], token, expires_at)
        )
        conn.commit()
        
        cur.close()
        conn.close()
        
        return jsonify({
            "message": "Login successful",
            "user": {
                "id": user['id'],
                "username": user['username'],
                "email": user['email'],
                "full_name": user['full_name'],
                "last_login": user['last_login'].isoformat() if user['last_login'] else None
            },
            "token": token
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/auth/google', methods=['POST'])
def google_login():
    """Login or register user with Google OAuth"""
    try:
        data = request.get_json()
        
        if not data or 'credential' not in data:
            return jsonify({"error": "Google credential is required"}), 400
        
        credential = data['credential']
        
        print(f"🔍 Google OAuth login attempt")
        
        # Get user info from Google using the access token
        try:
            google_user_info_url = "https://www.googleapis.com/oauth2/v3/userinfo"
            headers = {'Authorization': f'Bearer {credential}'}
            response = requests.get(google_user_info_url, headers=headers)
            
            if response.status_code != 200:
                return jsonify({"error": "Invalid Google token"}), 401
            
            user_info = response.json()
            email = user_info.get('email', '').lower().strip()
            full_name = user_info.get('name', '')
            
            if not email:
                return jsonify({"error": "Email not provided by Google"}), 400
            
            print(f"✅ Google user info retrieved: {email}")
            
        except Exception as e:
            print(f"❌ Error verifying Google token: {e}")
            return jsonify({"error": "Failed to verify Google token"}), 401
        
        # Check if user exists
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("SELECT * FROM users WHERE LOWER(email) = %s", (email,))
        user = cur.fetchone()
        
        if not user:
            # Create new user with Google info
            # Generate username from email
            username = email.split('@')[0]
            # Ensure unique username
            base_username = username
            counter = 1
            while True:
                cur.execute("SELECT id FROM users WHERE username = %s", (username,))
                if not cur.fetchone():
                    break
                username = f"{base_username}{counter}"
                counter += 1
            
            # Create random password (user won't need it for Google login)
            random_password = str(uuid.uuid4())
            password_hash = generate_password_hash(random_password)
            
            print(f"🆕 Creating new user from Google: {username}, {email}")
            
            cur.execute(
                """INSERT INTO users (username, email, password_hash, full_name) 
                   VALUES (%s, %s, %s, %s) RETURNING id, username, email, full_name, created_at""",
                (username, email, password_hash, full_name)
            )
            user = cur.fetchone()
            conn.commit()
            
            print(f"✅ New user created with ID: {user['id']}")
        else:
            print(f"✅ Existing user found: ID={user['id']}, username={user['username']}")
            
            # Update last login
            cur.execute("UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = %s", (user['id'],))
            conn.commit()
        
        # Generate JWT token
        token = jwt.encode({
            'user_id': user['id'],
            'username': user['username'],
            'exp': datetime.utcnow() + timedelta(hours=app.config['JWT_EXPIRATION_HOURS'])
        }, app.config['JWT_SECRET_KEY'], algorithm="HS256")
        
        # Store session in database
        expires_at = datetime.utcnow() + timedelta(hours=app.config['JWT_EXPIRATION_HOURS'])
        cur.execute(
            "INSERT INTO user_sessions (user_id, token, expires_at) VALUES (%s, %s, %s)",
            (user['id'], token, expires_at)
        )
        conn.commit()
        
        cur.close()
        conn.close()
        
        return jsonify({
            "message": "Login successful",
            "user": {
                "id": user['id'],
                "username": user['username'],
                "email": user['email'],
                "full_name": user['full_name']
            },
            "token": token
        })
        
    except Exception as e:
        print(f"❌ Google login error: {e}")
        return jsonify({"error": str(e)}), 500


@app.route('/auth/forgot-password', methods=['POST'])
def forgot_password():
    """Send password reset email"""
    try:
        data = request.get_json()
        
        if not data or 'email' not in data:
            return jsonify({"error": "Email is required"}), 400
        
        email = data['email'].lower().strip()
        
        # Check if user exists
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("SELECT id, username, email, full_name FROM users WHERE LOWER(email) = %s AND is_active = TRUE", (email,))
        user = cur.fetchone()
        
        # Always return success to prevent email enumeration
        if not user:
            cur.close()
            conn.close()
            return jsonify({"message": "If an account exists with that email, you will receive password reset instructions."}), 200
        
        # Generate reset token
        reset_token = jwt.encode({
            'user_id': user['id'],
            'purpose': 'password_reset',
            'exp': datetime.utcnow() + timedelta(hours=1)  # Token expires in 1 hour
        }, app.config['JWT_SECRET_KEY'], algorithm="HS256")
        
        # Store reset token in database (you may want to create a password_resets table)
        cur.execute(
            "UPDATE users SET reset_token = %s, reset_token_expires = %s WHERE id = %s",
            (reset_token, datetime.utcnow() + timedelta(hours=1), user['id'])
        )
        conn.commit()
        cur.close()
        conn.close()
        
        # Send email via SendGrid
        reset_link = f"{FRONTEND_URL}/reset-password?token={reset_token}"
        
        print(f"📧 Preparing to send email to: {email}")
        print(f"📧 From email: {SENDGRID_FROM_EMAIL}")
        print(f"📧 Reset link: {reset_link}")
        
        message = Mail(
            from_email=SENDGRID_FROM_EMAIL,
            to_emails=email,
            subject='Reset Your Cortex AI Password',
            html_content=f'''
            <html>
              <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                  <h2 style="color: #2563eb;">Password Reset Request</h2>
                  <p>Hello {user['full_name'] or user['username']},</p>
                  <p>We received a request to reset your password for your Cortex AI account.</p>
                  <p>Click the button below to reset your password:</p>
                  <div style="text-align: center; margin: 30px 0;">
                    <a href="{reset_link}" 
                       style="background-color: #2563eb; color: white; padding: 12px 30px; 
                              text-decoration: none; border-radius: 5px; display: inline-block;">
                      Reset Password
                    </a>
                  </div>
                  <p>Or copy and paste this link into your browser:</p>
                  <p style="background-color: #f3f4f6; padding: 10px; border-radius: 5px; word-break: break-all;">
                    {reset_link}
                  </p>
                  <p style="color: #ef4444; font-weight: bold;">This link will expire in 1 hour.</p>
                  <p>If you didn't request a password reset, you can safely ignore this email.</p>
                  <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
                  <p style="color: #6b7280; font-size: 12px;">
                    This is an automated email from Cortex AI. Please do not reply to this email.
                  </p>
                </div>
              </body>
            </html>
            '''
        )
        
        try:
            sg = SendGridAPIClient(SENDGRID_API_KEY)
            response = sg.send(message)
            print(f"✅ Password reset email sent to {email}, status code: {response.status_code}")
            print(f"📧 SendGrid Response Body: {response.body}")
            print(f"📧 SendGrid Response Headers: {response.headers}")
        except Exception as email_error:
            print(f"❌ Failed to send email: {str(email_error)}")
            print(f"❌ Error type: {type(email_error).__name__}")
            import traceback
            print(f"❌ Full traceback: {traceback.format_exc()}")
            return jsonify({"error": f"Failed to send reset email: {str(email_error)}"}), 500
        
        return jsonify({"message": "If an account exists with that email, you will receive password reset instructions."}), 200
        
    except Exception as e:
        print(f"❌ Forgot password error: {str(e)}")
        return jsonify({"error": "An error occurred. Please try again later."}), 500


@app.route('/auth/reset-password', methods=['POST'])
def reset_password():
    """Reset user password with token"""
    try:
        data = request.get_json()
        
        if not data or 'token' not in data or 'new_password' not in data:
            return jsonify({"error": "Token and new password are required"}), 400
        
        token = data['token']
        new_password = data['new_password']
        
        if len(new_password) < 8:
            return jsonify({"error": "Password must be at least 8 characters long"}), 400
        
        try:
            payload = jwt.decode(token, app.config['JWT_SECRET_KEY'], algorithms=["HS256"])
            
            if payload.get('purpose') != 'password_reset':
                return jsonify({"error": "Invalid token"}), 400
            
            user_id = payload.get('user_id')
            
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Reset token has expired. Please request a new one."}), 400
        except jwt.InvalidTokenError:
            return jsonify({"error": "Invalid reset token"}), 400
        
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute(
            "SELECT reset_token, reset_token_expires FROM users WHERE id = %s AND is_active = TRUE",
            (user_id,)
        )
        user_data = cur.fetchone()
        
        if not user_data:
            cur.close()
            conn.close()
            return jsonify({"error": "User not found"}), 404
        
        if user_data['reset_token'] != token:
            cur.close()
            conn.close()
            return jsonify({"error": "Invalid or already used reset token"}), 400
        
        if user_data['reset_token_expires'] < datetime.utcnow():
            cur.close()
            conn.close()
            return jsonify({"error": "Reset token has expired"}), 400
        
        hashed_password = generate_password_hash(new_password)
        cur.execute(
            "UPDATE users SET password = %s, reset_token = NULL, reset_token_expires = NULL WHERE id = %s",
            (hashed_password, user_id)
        )
        conn.commit()
        cur.close()
        conn.close()
        
        print(f"✅ Password reset successful for user ID: {user_id}")
        
        return jsonify({"message": "Password has been reset successfully"}), 200
        
    except Exception as e:
        print(f"❌ Reset password error: {str(e)}")
        return jsonify({"error": "An error occurred. Please try again later."}), 500


@app.route('/auth/logout', methods=['POST'])
@token_required
def logout(current_user):
    """Logout user and invalidate token"""
    try:
        # Get token from header
        token = request.headers['Authorization'].split(" ")[1]
        
        # Invalidate session in database
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute(
            "UPDATE user_sessions SET is_active = FALSE WHERE token = %s",
            (token,)
        )
        conn.commit()
        cur.close()
        conn.close()
        
        return jsonify({"message": "Logout successful"})
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/auth/me', methods=['GET'])
@token_required
def get_current_user(current_user):
    """Get current user information"""
    try:
        return jsonify({
            "user": {
                "id": current_user['id'],
                "username": current_user['username'],
                "email": current_user['email'],
                "full_name": current_user['full_name'],
                "created_at": current_user['created_at'].isoformat() if current_user['created_at'] else None,
                "last_login": current_user['last_login'].isoformat() if current_user['last_login'] else None
            }
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/auth/change-password', methods=['POST'])
@token_required
def change_password(current_user):
    """Change user password"""
    try:
        data = request.get_json()
        
        if not data or 'old_password' not in data or 'new_password' not in data:
            return jsonify({"error": "Old password and new password are required"}), 400
        
        old_password = data['old_password']
        new_password = data['new_password']
        
        # Verify old password
        if not check_password_hash(current_user['password_hash'], old_password):
            return jsonify({"error": "Invalid old password"}), 401
        
        # Validate new password strength
        if len(new_password) < 6:
            return jsonify({"error": "New password must be at least 6 characters"}), 400
        
        # Hash new password
        new_password_hash = generate_password_hash(new_password)
        
        # Update password in database
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute(
            "UPDATE users SET password_hash = %s, updated_at = CURRENT_TIMESTAMP WHERE id = %s",
            (new_password_hash, current_user['id'])
        )
        conn.commit()
        
        # Invalidate all existing sessions
        cur.execute("UPDATE user_sessions SET is_active = FALSE WHERE user_id = %s", (current_user['id'],))
        conn.commit()
        
        cur.close()
        conn.close()
        
        return jsonify({"message": "Password changed successfully. Please login again."})
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ============= CHAT ENDPOINTS =============

@app.route('/')
def home():
    """Home endpoint"""
    return jsonify({
        "message": "Welcome to CortexAI API",
        "version": "2.0.0",
        "model": MODEL_NAME,
        "endpoints": {
            "/auth/register": "POST - Register new user",
            "/auth/login": "POST - Login user",
            "/auth/google": "POST - Login/Register with Google OAuth",
            "/auth/logout": "POST - Logout user (Protected)",
            "/auth/me": "GET - Get current user (Protected)",
            "/auth/change-password": "POST - Change password (Protected)",
            "/chat": "POST - Send a chat message (Protected)",
            "/chat/stream": "POST - Stream chat responses (Protected)",
            "/conversations": "GET - List all conversations (Protected)",
            "/conversations/<id>": "GET - Get specific conversation (Protected)",
            "/conversations/<id>": "DELETE - Delete a conversation (Protected)",
            "/conversations/new": "POST - Start new conversation (Protected)",
            "/conversations/<id>/clear": "POST - Clear conversation history (Protected)",
            "/models": "GET - List available models"
        }

    })


@app.route('/chat', methods=['POST'])
@token_required
def chat(current_user):
    """Handle chat requests without streaming"""
    try:
        data = request.get_json()
        
        if not data or 'message' not in data:
            return jsonify({"error": "Message is required"}), 400
        
        user_message = data['message']
        conversation_id = data.get('conversation_id', str(uuid.uuid4()))
        system_prompt = data.get('system_prompt', '')
        
        user_id = current_user['id']
        
        # Initialize user's conversations if not exists
        if user_id not in user_conversations:
            user_conversations[user_id] = {}
        
        # Get or create conversation history
        if conversation_id not in user_conversations[user_id]:
            user_conversations[user_id][conversation_id] = {
                "id": conversation_id,
                "created_at": datetime.now().isoformat(),
                "messages": [],
                "title": user_message[:50] + "..." if len(user_message) > 50 else user_message
            }
        
        # Initialize the model
        model = genai.GenerativeModel(
            model_name=MODEL_NAME,
            generation_config=generation_config,
            safety_settings=safety_settings
        )
        
        # Prepare conversation history for Gemini
        chat_history = []
        for msg in user_conversations[user_id][conversation_id]['messages']:
            chat_history.append({
                "role": msg['role'],
                "parts": [msg['content']]
            })
        
        # Start chat session
        chat_session = model.start_chat(history=chat_history)
        
        # Add system prompt if provided
        full_message = f"{system_prompt}\n\n{user_message}" if system_prompt else user_message
        
        # Send message and get response
        response = chat_session.send_message(full_message)
        assistant_message = response.text
        
        # Store messages in conversation history
        user_conversations[user_id][conversation_id]['messages'].append({
            "role": "user",
            "content": user_message,
            "timestamp": datetime.now().isoformat()
        })
        
        user_conversations[user_id][conversation_id]['messages'].append({
            "role": "model",
            "content": assistant_message,
            "timestamp": datetime.now().isoformat()
        })
        
        return jsonify({
            "conversation_id": conversation_id,
            "message": assistant_message,
            "timestamp": datetime.now().isoformat(),
            "model": MODEL_NAME
        })
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/chat/stream', methods=['POST'])
@token_required
def chat_stream(current_user):
    """Handle chat requests with streaming responses"""
    try:
        print(f"📨 Chat stream request from user: {current_user['username']}")
        data = request.get_json()
        
        if not data or 'message' not in data:
            return jsonify({"error": "Message is required"}), 400
        
        user_message = data['message']
        conversation_id = data.get('conversation_id', str(uuid.uuid4()))
        system_prompt = data.get('system_prompt', '')
        model_name = data.get('model', MODEL_NAME)  # Allow custom model selection
        image_base64 = data.get('image')  # Get base64 image data
        
        user_id = current_user['id']
        
        print(f"💬 Message: {user_message[:50]}...")
        print(f"🆔 Conversation ID: {conversation_id}")
        print(f"🤖 Using model: {model_name}")
        if image_base64:
            print(f"🖼️ Image data received: {len(image_base64)} chars")
        
        # Initialize user's conversations if not exists
        if user_id not in user_conversations:
            user_conversations[user_id] = {}
        
        # Get or create conversation history
        if conversation_id not in user_conversations[user_id]:
            print(f"✨ Creating new conversation: {conversation_id}")
            user_conversations[user_id][conversation_id] = {
                "id": conversation_id,
                "created_at": datetime.now().isoformat(),
                "messages": [],
                "title": user_message[:50] + "..." if len(user_message) > 50 else user_message
            }
        
        # Capture variables for closure
        captured_image = image_base64
        captured_user_msg = user_message
        captured_system_prompt = system_prompt
        captured_model_name = model_name
        captured_conv_id = conversation_id
        
        def generate():
            try:
                print(f"🤖 Initializing Gemini model: {captured_model_name}")
                
                # Only the experimental image generation model can generate images
                is_image_capable = 'image-generation' in captured_model_name.lower()
                print(f"🎨 Image generation capable: {is_image_capable}")
                
                # Initialize the model
                model = genai.GenerativeModel(
                    model_name=captured_model_name,
                    generation_config=generation_config,
                    safety_settings=safety_settings
                )
                
                # Prepare conversation history
                chat_history = []
                for msg in user_conversations[user_id][captured_conv_id]['messages']:
                    chat_history.append({
                        "role": msg['role'],
                        "parts": [msg['content']]
                    })
                
                print(f"📚 Chat history length: {len(chat_history)} messages")
                
                # Start chat session
                chat_session = model.start_chat(history=chat_history)
                
                # Add system prompt for image generation models ONLY
                if is_image_capable and any(keyword in captured_user_msg.lower() for keyword in ['generate', 'create', 'make', 'draw', 'image', 'picture', 'photo']):
                    image_system_prompt = """You are an AI with native image generation capabilities. When the user asks you to generate, create, or make an image, you must DIRECTLY generate and output the image - do not describe it or return JSON. The image will be automatically displayed to the user."""
                    full_message = f"{image_system_prompt}\n\n{captured_system_prompt}\n\n{captured_user_msg}" if captured_system_prompt else f"{image_system_prompt}\n\n{captured_user_msg}"
                else:
                    full_message = f"{captured_system_prompt}\n\n{captured_user_msg}" if captured_system_prompt else captured_user_msg
                
                # Store user message
                user_conversations[user_id][captured_conv_id]['messages'].append({
                    "role": "user",
                    "content": captured_user_msg,
                    "timestamp": datetime.now().isoformat()
                })
                
                # Send metadata first
                yield f"data: {json.dumps({'type': 'start', 'conversation_id': captured_conv_id})}\n\n"
                
                print(f"🚀 Starting Gemini API stream...")
                # Stream response with image if provided
                full_response = ""
                generated_images = []
                
                if captured_image:
                    # Process image from base64
                    try:
                        # Remove data URL prefix if present
                        image_data_str = captured_image
                        if ',' in image_data_str:
                            image_data_str = image_data_str.split(',')[1]
                        
                        # Decode base64 image
                        image_bytes = base64.b64decode(image_data_str)
                        image = PILImage.open(BytesIO(image_bytes))
                        
                        print(f"🖼️ Image processed: {image.format}, {image.size}")
                        
                        # Send message with image
                        response = chat_session.send_message([full_message, image], stream=True)
                    except Exception as img_error:
                        print(f"❌ Image processing error: {str(img_error)}")
                        response = chat_session.send_message(full_message, stream=True)
                else:
                    response = chat_session.send_message(full_message, stream=True)
                
                chunk_count = 0
                for chunk in response:
                    # Debug: Log chunk structure for image gen models
                    if is_image_capable:
                        print(f"🔍 Chunk attributes: {dir(chunk)}")
                        if hasattr(chunk, 'candidates'):
                            print(f"🔍 Has candidates: {len(chunk.candidates)}")
                    
                    # Handle text content
                    if chunk.text:
                        chunk_count += 1
                        full_response += chunk.text
                        yield f"data: {json.dumps({'type': 'content', 'content': chunk.text})}\n\n"
                    
                    # Handle generated images (for image generation models)
                    if hasattr(chunk, 'candidates') and chunk.candidates:
                        for candidate in chunk.candidates:
                            if hasattr(candidate.content, 'parts'):
                                for part in candidate.content.parts:
                                    # Debug log part structure
                                    if is_image_capable:
                                        print(f"🔍 Part attributes: {dir(part)}")
                                        print(f"🔍 Has inline_data: {hasattr(part, 'inline_data')}")
                                        if hasattr(part, 'inline_data') and part.inline_data:
                                            print(f"🔍 inline_data content: {part.inline_data}")
                                            print(f"🔍 inline_data has data: {hasattr(part.inline_data, 'data')}")
                                            if hasattr(part.inline_data, 'data'):
                                                print(f"🔍 inline_data.data is not None: {part.inline_data.data is not None}")
                                                if part.inline_data.data:
                                                    print(f"🔍 inline_data.data length: {len(part.inline_data.data)}")
                                    
                                    # Check for inline data (images)
                                    if (hasattr(part, 'inline_data') and 
                                        part.inline_data and 
                                        hasattr(part.inline_data, 'data') and 
                                        part.inline_data.data):
                                        try:
                                            # Extract image data
                                            image_data = part.inline_data.data
                                            mime_type = part.inline_data.mime_type
                                            
                                            # Convert to base64 data URL
                                            image_base64 = base64.b64encode(image_data).decode('utf-8')
                                            image_url = f"data:{mime_type};base64,{image_base64}"
                                            generated_images.append(image_url)
                                            
                                            print(f"🎨 Generated image found: {mime_type}, {len(image_data)} bytes")
                                            
                                            # Send image immediately
                                            yield f"data: {json.dumps({'type': 'image', 'image': image_url})}\n\n"
                                        except Exception as img_err:
                                            print(f"⚠️ Error processing generated image: {str(img_err)}")
                                            import traceback
                                            traceback.print_exc()
                
                print(f"✅ Stream complete: {chunk_count} chunks, {len(full_response)} chars, {len(generated_images)} images")
                
                # If images were generated, add markdown references to the response (works for any model)
                if generated_images:
                    image_markdown = "\n\n"
                    for i, img_url in enumerate(generated_images):
                        image_markdown += f"![Generated Image {i+1}]({img_url})\n"
                    full_response += image_markdown
                    print(f"📝 Added {len(generated_images)} image(s) to response as markdown")
                
                # Store assistant message
                user_conversations[user_id][captured_conv_id]['messages'].append({
                    "role": "model",
                    "content": full_response,
                    "timestamp": datetime.now().isoformat(),
                    "images": generated_images if generated_images else None
                })
                
                # Send completion signal
                yield f"data: {json.dumps({'type': 'end', 'full_response': full_response, 'images': generated_images})}\n\n"
                
            except Exception as e:
                print(f"❌ Stream error: {str(e)}")
                import traceback
                traceback.print_exc()
                yield f"data: {json.dumps({'type': 'error', 'error': str(e)})}\n\n"
        
        return Response(
            stream_with_context(generate()),
            mimetype='text/event-stream',
            headers={
                'Cache-Control': 'no-cache',
                'X-Accel-Buffering': 'no'
            }
        )
    
    except Exception as e:
        print(f"❌ Chat stream error: {str(e)}")
        return jsonify({"error": str(e)}), 500


@app.route('/conversations', methods=['GET'])
@token_required
def get_conversations(current_user):
    """Get all conversations for current user"""
    try:
        user_id = current_user['id']
        conversations_list = []
        
        if user_id in user_conversations:
            for conv_id, conv_data in user_conversations[user_id].items():
                conversations_list.append({
                    "id": conv_id,
                    "title": conv_data.get('title', 'Untitled'),
                    "created_at": conv_data.get('created_at'),
                    "message_count": len(conv_data.get('messages', []))
                })
        
        # Sort by creation date (newest first)
        conversations_list.sort(key=lambda x: x['created_at'], reverse=True)
        
        return jsonify({
            "conversations": conversations_list,
            "total": len(conversations_list)
        })
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/conversations/<conversation_id>', methods=['GET'])
@token_required
def get_conversation(current_user, conversation_id):
    """Get a specific conversation for current user"""
    try:
        user_id = current_user['id']
        
        if user_id not in user_conversations or conversation_id not in user_conversations[user_id]:
            return jsonify({"error": "Conversation not found"}), 404
        
        return jsonify(user_conversations[user_id][conversation_id])
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/conversations/<conversation_id>', methods=['DELETE'])
@token_required
def delete_conversation(current_user, conversation_id):
    """Delete a conversation for current user"""
    try:
        user_id = current_user['id']
        
        if user_id not in user_conversations or conversation_id not in user_conversations[user_id]:
            return jsonify({"error": "Conversation not found"}), 404
        
        del user_conversations[user_id][conversation_id]
        print(f"🗑️ Deleted conversation {conversation_id} for user {current_user['username']}")
        
        return jsonify({
            "message": "Conversation deleted successfully",
            "conversation_id": conversation_id
        })
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/conversations/new', methods=['POST'])
@token_required
def new_conversation(current_user):
    """Start a new conversation for current user"""
    try:
        user_id = current_user['id']
        data = request.get_json() or {}
        conversation_id = str(uuid.uuid4())
        title = data.get('title', 'New Conversation')
        
        if user_id not in user_conversations:
            user_conversations[user_id] = {}
        
        user_conversations[user_id][conversation_id] = {
            "id": conversation_id,
            "created_at": datetime.now().isoformat(),
            "messages": [],
            "title": title
        }
        
        return jsonify({
            "conversation_id": conversation_id,
            "message": "New conversation created",
            "created_at": user_conversations[user_id][conversation_id]['created_at']
        })
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/conversations/<conversation_id>/clear', methods=['POST'])
@token_required
def clear_conversation(current_user, conversation_id):
    """Clear conversation history for current user"""
    try:
        user_id = current_user['id']
        
        if user_id not in user_conversations or conversation_id not in user_conversations[user_id]:
            return jsonify({"error": "Conversation not found"}), 404
        
        user_conversations[user_id][conversation_id]['messages'] = []
        
        return jsonify({
            "message": "Conversation cleared successfully",
            "conversation_id": conversation_id
        })
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/models', methods=['GET'])
def get_models():
    """Get available models"""
    try:
        models = genai.list_models()
        available_models = []
        
        for model in models:
            if 'generateContent' in model.supported_generation_methods:
                available_models.append({
                    "name": model.name,
                    "display_name": model.display_name,
                    "description": model.description if hasattr(model, 'description') else "",
                })
        
        return jsonify({
            "models": available_models,
            "current_model": MODEL_NAME
        })
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/feedback', methods=['POST'])
def send_feedback():
    """Send feedback via SendGrid"""
    try:
        data = request.get_json()
        
        # Validate required fields
        if not data.get('name') or not data.get('email') or not data.get('message'):
            return jsonify({"error": "Name, email, and message are required"}), 400
        
        name = data.get('name')
        email = data.get('email')
        message = data.get('message')
        
        # Create email content
        email_content = f"""
        <h2>New Feedback from CortexAI</h2>
        <p><strong>From:</strong> {name} ({email})</p>
        <p><strong>Message:</strong></p>
        <p>{message.replace(chr(10), '<br>')}</p>
        <hr>
        <p><small>This feedback was sent via CortexAI feedback form.</small></p>
        """
        
        # Create SendGrid message
        message_obj = Mail(
            from_email=SENDGRID_FROM_EMAIL,
            to_emails=SENDGRID_FROM_EMAIL,  # Send to yourself
            subject=f'CortexAI Feedback from {name}',
            html_content=email_content
        )
        
        # Also set reply-to as the sender's email
        message_obj.reply_to = email
        
        # Send email
        sg = SendGridAPIClient(SENDGRID_API_KEY)
        response = sg.send(message_obj)
        
        print(f"✅ Feedback email sent successfully (status: {response.status_code})")
        
        return jsonify({
            "message": "Feedback sent successfully!",
            "status": "success"
        }), 200
        
    except Exception as e:
        print(f"❌ Error sending feedback: {str(e)}")
        return jsonify({"error": f"Failed to send feedback: {str(e)}"}), 500


@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "api_configured": bool(GEMINI_API_KEY)
    })


@app.errorhandler(404)
def not_found(error):
    return jsonify({"error": "Endpoint not found"}), 404


@app.errorhandler(500)
def internal_error(error):
    return jsonify({"error": "Internal server error"}), 500


if __name__ == '__main__':
    # Initialize database
    try:
        init_db()
    except Exception as e:
        print(f"⚠️  Database initialization warning: {e}")
    
    port = int(os.getenv('PORT', 5000))
    debug = os.getenv('DEBUG', 'True').lower() == 'true'
    
    print(f"""
    ╔═══════════════════════════════════════╗
    ║         CortexAI Backend v2.0         ║
    ╚═══════════════════════════════════════╝
    
    🚀 Server running on http://localhost:{port}
    🤖 Model: {MODEL_NAME}
    🔧 Debug Mode: {debug}
    🗄️  Database: PostgreSQL (Neon)
    
    Authentication Endpoints:
    • POST   /auth/register         - Register new user
    • POST   /auth/login            - Login user
    • POST   /auth/google           - Login/Register with Google OAuth
    • POST   /auth/logout           - Logout (Protected)
    • GET    /auth/me               - Get current user (Protected)
    • POST   /auth/change-password  - Change password (Protected)
    
    Chat Endpoints (All Protected):
    • POST   /chat                  - Send chat message
    • POST   /chat/stream           - Stream chat response
    • GET    /conversations         - List conversations
    • POST   /conversations/new     - Create conversation
    • GET    /conversations/:id     - Get conversation
    • DELETE /conversations/:id     - Delete conversation
    • POST   /conversations/:id/clear - Clear conversation
    • GET    /models                - List available models
    
    Other:
    • GET    /health                - Health check
    • POST   /api/feedback          - Send feedback via email
    
    Press Ctrl+C to stop the server
    """)
    
    app.run(host='0.0.0.0', port=port, debug=debug)
