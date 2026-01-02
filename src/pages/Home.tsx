import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Logo } from '@/components/Logo';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ArrowRight, Sparkles, Info } from 'lucide-react';

export default function Home() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [aboutOpen, setAboutOpen] = useState(false);

  return (
    <div className="min-h-screen relative overflow-hidden">
      <AnimatedBackground />
      
      {/* Gradient orbs */}
      <div className="absolute top-20 left-1/4 w-[500px] h-[500px] bg-primary/15 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-20 right-1/4 w-[400px] h-[400px] bg-accent/15 rounded-full blur-3xl animate-float" style={{ animationDelay: '-3s' }} />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between p-6">
        <Logo size="md" />
        <ThemeSwitcher />
      </header>

      {/* Hero Section */}
      <main className="relative z-10 flex flex-col items-center justify-center px-4 pt-20 pb-32">
        <div className="text-center max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-8 animate-slide-up">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm">Powered by Advanced AI</span>
          </div>

          {/* Main heading */}
          <h1 className="text-5xl md:text-7xl font-bold mb-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            Your Intelligent
            <br />
            <span className="gradient-text">AI Companion</span>
          </h1>

          {/* Subheading */}
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            Experience the future of conversation with AI that truly understands you. 
            Get instant, accurate responses powered by cutting-edge technology. 
            Transform the way you work, learn, and create.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <Button
              onClick={() => navigate(isAuthenticated ? '/chat' : '/auth')}
              variant="glow"
              size="xl"
            >
              Start Chatting
              <ArrowRight className="w-5 h-5" />
            </Button>
            <Button
              variant="glass"
              size="xl"
              onClick={() => navigate('/learn-more')}
            >
              Learn More
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
