// API Configuration and Client Setup for CortexAI Backend

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
}

// Helper function to get auth token
const getAuthToken = (): string | null => {
  return localStorage.getItem('cortex-token');
};

// Helper function to make authenticated requests
const authenticatedFetch = async (
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> => {
  const token = getAuthToken();
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });
};

// ============= AUTHENTICATION API =============

export interface User {
  id: number;
  username: string;
  email: string;
  full_name?: string;
  created_at?: string;
  last_login?: string;
}

export interface GoogleAuthResponse {
  message: string;
  token: string;
  user: User;
}

export interface AuthResponse {
  message: string;
  user: User;
  token: string;
}

export const authAPI = {
  async register(
    username: string,
    email: string,
    password: string,
    fullName?: string
  ): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username,
        email,
        password,
        full_name: fullName,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Registration failed');
    }

    return data;
  },

  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Login failed');
    }

    return data;
  },

  async googleLogin(credential: string): Promise<GoogleAuthResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credential }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Google login failed');
    }

    return data;
  },

  async logout(): Promise<void> {
    const response = await authenticatedFetch('/auth/logout', {
      method: 'POST',
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Logout failed');
    }
  },

  async getCurrentUser(): Promise<User> {
    const response = await authenticatedFetch('/auth/me');
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to get user info');
    }

    return data.user;
  },

  async changePassword(oldPassword: string, newPassword: string): Promise<void> {
    const response = await authenticatedFetch('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({
        old_password: oldPassword,
        new_password: newPassword,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to change password');
    }
  },

  async forgotPassword(email: string): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to send reset email');
    }

    return data;
  },
};

// ============= CHAT API =============

export interface Message {
  role: 'user' | 'model' | 'assistant';
  content: string;
  timestamp: string;
  image?: string;
  images?: string[];
}

export interface Conversation {
  id: string;
  title: string;
  created_at: string;
  message_count?: number;
  messages?: Message[];
}

export interface ChatResponse {
  conversation_id: string;
  message: string;
  timestamp: string;
  model: string;
}

export const chatAPI = {
  async sendMessage(
    message: string,
    conversationId?: string,
    systemPrompt?: string
  ): Promise<ChatResponse> {
    const response = await authenticatedFetch('/chat', {
      method: 'POST',
      body: JSON.stringify({
        message,
        conversation_id: conversationId,
        system_prompt: systemPrompt,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to send message');
    }

    return data;
  },

  async streamMessage(
    message: string,
    conversationId?: string,
    systemPrompt?: string,
    model?: string,
    image?: string,
    onChunk?: (chunk: string) => void,
    onComplete?: (fullResponse: string) => void,
    onError?: (error: string) => void
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const token = getAuthToken();
      let timeoutId: NodeJS.Timeout;
      
      // Set a timeout for the entire operation
      const timeout = setTimeout(() => {
        const error = 'Request timeout - no response from server';
        console.error(error);
        onError?.(error);
        reject(new Error(error));
      }, 60000); // 60 second timeout
      
      console.log('🚀 Starting stream request to:', `${API_BASE_URL}/chat/stream`);
      
      fetch(`${API_BASE_URL}/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          message,
          conversation_id: conversationId,
          system_prompt: systemPrompt,
          model: model,
          image: image,
        }),
      })
        .then(async (response) => {
          console.log('📡 Response received, status:', response.status);
          
          if (!response.ok) {
            clearTimeout(timeout);
            const data = await response.json();
            throw new Error(data.error || 'Failed to stream message');
          }

          const reader = response.body?.getReader();
          const decoder = new TextDecoder();
          let fullResponse = '';
          let hasReceivedData = false;

          if (!reader) {
            clearTimeout(timeout);
            throw new Error('Response body is not readable');
          }

          console.log('📖 Starting to read stream...');

          while (true) {
            const { done, value } = await reader.read();
            
            if (done) {
              console.log('✅ Stream ended');
              break;
            }

            hasReceivedData = true;
            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const jsonData = JSON.parse(line.slice(6));
                  console.log('📦 Received:', jsonData.type);

                  if (jsonData.type === 'content') {
                    fullResponse += jsonData.content;
                    onChunk?.(jsonData.content);
                  } else if (jsonData.type === 'image') {
                    // Handle generated images - append as markdown
                    const imageMarkdown = `\n\n![Generated Image](${jsonData.image})\n\n`;
                    fullResponse += imageMarkdown;
                    onChunk?.(imageMarkdown);
                    console.log('🎨 Generated image received');
                  } else if (jsonData.type === 'end') {
                    clearTimeout(timeout);
                    console.log('✅ Stream completed successfully');
                    onComplete?.(jsonData.full_response || fullResponse);
                    resolve(jsonData.full_response || fullResponse);
                    return;
                  } else if (jsonData.type === 'error') {
                    clearTimeout(timeout);
                    console.error('❌ Stream error:', jsonData.error);
                    onError?.(jsonData.error);
                    reject(new Error(jsonData.error));
                    return;
                  }
                } catch (e) {
                  console.warn('⚠️ Failed to parse JSON:', line);
                  // Skip invalid JSON lines
                }
              }
            }
          }
          
          // If we got here, stream ended without 'end' message
          clearTimeout(timeout);
          if (hasReceivedData && fullResponse) {
            console.log('⚠️ Stream ended without completion message, using collected response');
            onComplete?.(fullResponse);
            resolve(fullResponse);
          } else {
            const error = 'Stream ended without data';
            console.error('❌', error);
            onError?.(error);
            reject(new Error(error));
          }
        })
        .catch((error) => {
          clearTimeout(timeout);
          console.error('❌ Fetch error:', error);
          onError?.(error.message);
          reject(error);
        });
    });
  },

  async getConversations(): Promise<Conversation[]> {
    const response = await authenticatedFetch('/conversations');
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to get conversations');
    }

    return data.conversations || [];
  },

  async getConversation(conversationId: string): Promise<Conversation> {
    const response = await authenticatedFetch(`/conversations/${conversationId}`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to get conversation');
    }

    return data;
  },

  async deleteConversation(conversationId: string): Promise<void> {
    const response = await authenticatedFetch(`/conversations/${conversationId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Failed to delete conversation');
    }
  },

  async createConversation(title?: string): Promise<string> {
    const response = await authenticatedFetch('/conversations/new', {
      method: 'POST',
      body: JSON.stringify({ title }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to create conversation');
    }

    return data.conversation_id;
  },

  async clearConversation(conversationId: string): Promise<void> {
    const response = await authenticatedFetch(`/conversations/${conversationId}/clear`, {
      method: 'POST',
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Failed to clear conversation');
    }
  },
};

// ============= MODELS API =============

export interface Model {
  name: string;
  display_name: string;
  description: string;
}

export const modelsAPI = {
  async getModels(): Promise<{ models: Model[]; current_model: string }> {
    const response = await fetch(`${API_BASE_URL}/models`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to get models');
    }

    return data;
  },
};

// ============= IMAGE GENERATION API =============

export interface ImageGenerationResponse {
  success: boolean;
  image: string; // Base64 encoded image
  prompt: string;
}

export const imageAPI = {
  async generateImage(prompt: string): Promise<ImageGenerationResponse> {
    const response = await authenticatedFetch('/generate-image', {
      method: 'POST',
      body: JSON.stringify({ prompt }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to generate image');
    }

    return data;
  },
};

// ============= HEALTH CHECK =============

export const healthAPI = {
  async check(): Promise<{ status: string; timestamp: string; api_configured: boolean }> {
    const response = await fetch(`${API_BASE_URL}/health`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Health check failed');
    }

    return data;
  },
};

export { API_BASE_URL };
