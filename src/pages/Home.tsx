import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Logo } from '@/components/Logo';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles, Zap, Shield, MessageSquare } from 'lucide-react';

export default function Home() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const features = [
    {
      icon: Zap,
      title: 'Lightning Fast',
      description: 'Get instant responses powered by advanced AI technology',
    },
    {
      icon: Shield,
      title: 'Secure & Private',
      description: 'Your conversations are encrypted and never shared',
    },
    {
      icon: MessageSquare,
      title: 'Natural Dialogue',
      description: 'Have fluid conversations that feel human-like',
    },
  ];

  return (
    <div className="min-h-screen relative overflow-hidden">
      <AnimatedBackground />
      
      {/* Gradient orbs */}
      <div className="absolute top-20 left-1/4 w-[500px] h-[500px] bg-primary/15 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-20 right-1/4 w-[400px] h-[400px] bg-accent/15 rounded-full blur-3xl animate-float" style={{ animationDelay: '-3s' }} />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between p-6">
        <Logo size="md" />
        <div className="flex items-center gap-4">
          <ThemeSwitcher />
          {isAuthenticated ? (
            <Button onClick={() => navigate('/chat')} variant="glow">
              Open Chat
              <ArrowRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button onClick={() => navigate('/auth')} variant="glow">
              Get Started
              <ArrowRight className="w-4 h-4" />
            </Button>
          )}
        </div>
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
            Experience the future of conversation. Cortex understands context, 
            remembers your preferences, and delivers insightful responses instantly.
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
              onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Learn More
            </Button>
          </div>
        </div>

        {/* Features */}
        <div id="features" className="mt-32 w-full max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 animate-slide-up">
            Why Choose <span className="gradient-text">Cortex</span>?
          </h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className="glass rounded-2xl p-6 hover:border-primary/50 transition-all duration-300 hover:glow-subtle animate-slide-up"
                style={{ animationDelay: `${0.4 + index * 0.1}s` }}
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border py-6">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <Logo size="sm" />
          <p className="text-sm text-muted-foreground">
            © 2024 Cortex AI. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
