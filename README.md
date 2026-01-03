# 🤖 CortexAI - AI Chat Application

CortexAI is a modern, responsive AI chat app with a sleek UI, secure auth, and Flask backend—ideal for real-time, intelligent conversations on any device.

## ✨ Features

- 🎨 **Modern Glassmorphism Design** - Beautiful glass-effect UI with dynamic theming
- 🤖 **AI Chat Interface** - Integrated AI chatbot with conversational abilities
- 🔐 **User Authentication** - Secure login and registration system
- 📱 **Fully Responsive** - Optimized for all devices and screen sizes
- 🌓 **Three Themes Available** - Seamless theme switching with persistent preferences
- 💬 **Chat History** - Save and manage multiple chat conversations
- 🎭 **Animated UI** - Smooth animations and interactive components

## 🛠️ Tech Stack

### Frontend
- **Framework:** React 18 with TypeScript
- **Build Tool:** Vite
- **Package Manager:** Bun
- **Styling:** Tailwind CSS with custom animations
- **UI Components:** Radix UI primitives + shadcn/ui
- **State Management:** React Context API
- **Form Handling:** React Hook Form + Zod validation
- **Routing:** React Router DOM

### Backend
- **Framework:** Flask (Python)
- **API Integration:** AI/ML model integration
- **CORS:** Flask-CORS

### Deployment
- **Frontend:** Vercel
- **Backend:** Render
- **Version Control:** Git & GitHub

## 📂 Project Structure

```
CortexAI/
├── src/
│   ├── components/           # Reusable UI components
│   │   ├── ui/              # shadcn/ui components
│   │   ├── chat/            # Chat-specific components
│   │   │   ├── ChatInput.tsx
│   │   │   ├── ChatMessage.tsx
│   │   │   ├── ChatSidebar.tsx
│   │   │   └── EmptyChat.tsx
│   │   ├── AnimatedBackground.tsx
│   │   ├── Logo.tsx
│   │   ├── NavLink.tsx
│   │   └── ThemeSwitcher.tsx
│   ├── pages/               # Page components
│   │   ├── Index.tsx        # Landing page
│   │   ├── Home.tsx         # Home dashboard
│   │   ├── Chat.tsx         # Main chat interface
│   │   ├── Auth.tsx         # Authentication page
│   │   ├── ForgotPassword.tsx
│   │   ├── LearnMore.tsx    # About/Info page
│   │   └── NotFound.tsx     # 404 page
│   ├── contexts/            # React contexts
│   │   ├── AuthContext.tsx  # Authentication state
│   │   └── ThemeContext.tsx # Theme management
│   ├── hooks/               # Custom React hooks
│   │   ├── use-mobile.tsx
│   │   └── use-toast.ts
│   ├── lib/                 # Utility functions
│   │   ├── api.ts           # API client
│   │   └── utils.ts         # Helper functions
│   └── App.tsx              # Main app component
├── public/                  # Static assets
│   └── robots.txt
├── Cortex.py                # Flask backend
├── requirements.txt         # Python dependencies
├── package.json             # Node dependencies
├── bun.lockb                # Bun lock file
├── components.json          # shadcn/ui configuration
├── tailwind.config.ts       # Tailwind configuration
├── tsconfig.json            # TypeScript configuration
└── vite.config.ts           # Vite configuration
```



```

Made with ❤️ by Manas Rohilla
