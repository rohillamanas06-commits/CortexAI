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
              onClick={() => navigate(isAuthenticated ? '/chat' : '/auth')}
            >
              Learn More
            </Button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border py-6">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <Logo size="sm" />
          <Dialog open={aboutOpen} onOpenChange={setAboutOpen}>
            <DialogTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm"
                className="gap-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <Info className="w-4 h-4" />
                About Cortex
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3 text-2xl">
                  <Logo size="sm" showText={false} />
                  Cortex AI
                </DialogTitle>
                <DialogDescription className="text-base pt-4 space-y-4">
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">About the Project</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      Cortex AI is an intelligent conversational assistant powered by Google's Gemini 2.5 Flash model. 
                      Built with modern web technologies to provide a seamless, secure, and intuitive chat experience.
                    </p>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">Key Features</h3>
                    <ul className="text-muted-foreground space-y-2 list-none">
                      <li className="flex items-start gap-2">
                        <span className="text-primary mt-0.5">✓</span>
                        <span>Real-time AI-powered conversations</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary mt-0.5">✓</span>
                        <span>Voice input with speech recognition</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary mt-0.5">✓</span>
                        <span>Text-to-speech for AI responses</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary mt-0.5">✓</span>
                        <span>Multiple theme options</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary mt-0.5">✓</span>
                        <span>Secure user authentication</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary mt-0.5">✓</span>
                        <span>Conversation history management</span>
                      </li>
                    </ul>
                  </div>
                </DialogDescription>
              </DialogHeader>
            </DialogContent>
          </Dialog>
        </div>
      </footer>
    </div>
  );
}
