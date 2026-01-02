import { useNavigate } from 'react-router-dom';
import { Logo } from '@/components/Logo';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { 
  ArrowLeft, 
  MessageSquare, 
  Zap, 
  Shield, 
  Brain, 
  Sparkles, 
  Mic, 
  Volume2, 
  Moon, 
  History,
  Lock,
  Cpu,
  Globe,
  Users,
  Github,
  Instagram,
  Linkedin,
  Mail,
  Send
} from 'lucide-react';
import { useState } from 'react';

export default function LearnMore() {
  const navigate = useNavigate();
  const [feedbackForm, setFeedbackForm] = useState({
    name: '',
    email: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(feedbackForm),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Feedback sent successfully! Thank you for your input.');
        setFeedbackForm({ name: '', email: '', message: '' });
      } else {
        toast.error(data.error || 'Failed to send feedback. Please try again.');
      }
    } catch (error) {
      toast.error('Network error. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <AnimatedBackground />
      
      {/* Gradient orbs */}
      <div className="absolute top-20 left-1/4 w-[500px] h-[500px] bg-primary/15 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-20 right-1/4 w-[400px] h-[400px] bg-accent/15 rounded-full blur-3xl animate-float" style={{ animationDelay: '-3s' }} />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between p-6 border-b border-border/50">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/')}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <Logo size="md" />
        </div>
        <ThemeSwitcher />
      </header>

      {/* Main Content */}
      <main className="relative z-10 container mx-auto px-4 py-12 max-w-6xl">
        {/* Hero Section */}
        <div className="text-center mb-16 animate-slide-up">
          <Badge className="mb-4" variant="secondary">
            <Sparkles className="w-3 h-3 mr-1" />
            About Cortex AI
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            The Future of
            <br />
            <span className="gradient-text">AI Conversation</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Cortex AI is your intelligent companion, designed to revolutionize the way you interact with artificial intelligence. 
            Powered by Google's cutting-edge Gemini 2.5 Flash model, we bring you a seamless, intuitive, and powerful conversational experience.
          </p>
        </div>

        {/* What is Cortex */}
        <section className="mb-16 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <Card className="glass">
            <CardHeader>
              <CardTitle className="text-3xl flex items-center gap-3">
                <Brain className="w-8 h-8 text-primary" />
                What is Cortex AI?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <p className="text-lg leading-relaxed">
                Cortex AI is an advanced conversational AI platform that combines state-of-the-art natural language processing 
                with an elegant, user-friendly interface. Built from the ground up with modern web technologies, 
                Cortex provides a secure, fast, and intelligent chat experience that adapts to your needs.
              </p>
              <p className="text-lg leading-relaxed">
                Whether you're looking for quick answers, creative brainstorming, detailed explanations, or just a conversation, 
                Cortex is designed to understand context, maintain conversation flow, and deliver responses that feel natural and helpful.
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Key Features */}
        <section className="mb-16 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <h2 className="text-3xl font-bold mb-8 text-center">Key Features</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="glass hover:scale-105 transition-transform">
              <CardHeader>
                <MessageSquare className="w-10 h-10 text-primary mb-2" />
                <CardTitle>Intelligent Conversations</CardTitle>
                <CardDescription>
                  Powered by Google Gemini 2.5 Flash, experience AI that understands context, nuance, and maintains coherent long-form conversations.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="glass hover:scale-105 transition-transform">
              <CardHeader>
                <Zap className="w-10 h-10 text-primary mb-2" />
                <CardTitle>Real-time Streaming</CardTitle>
                <CardDescription>
                  Watch responses appear in real-time with our streaming technology, making conversations feel natural and responsive.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="glass hover:scale-105 transition-transform">
              <CardHeader>
                <Mic className="w-10 h-10 text-primary mb-2" />
                <CardTitle>Voice Input</CardTitle>
                <CardDescription>
                  Speak naturally with advanced speech recognition. Just tap the microphone and start talking - no typing required.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="glass hover:scale-105 transition-transform">
              <CardHeader>
                <Volume2 className="w-10 h-10 text-primary mb-2" />
                <CardTitle>Text-to-Speech</CardTitle>
                <CardDescription>
                  Listen to AI responses with natural-sounding text-to-speech. Perfect for multitasking or accessibility needs.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="glass hover:scale-105 transition-transform">
              <CardHeader>
                <History className="w-10 h-10 text-primary mb-2" />
                <CardTitle>Conversation History</CardTitle>
                <CardDescription>
                  Never lose a conversation. All your chats are saved locally with easy access, search, and organization.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="glass hover:scale-105 transition-transform">
              <CardHeader>
                <Moon className="w-10 h-10 text-primary mb-2" />
                <CardTitle>Beautiful Themes</CardTitle>
                <CardDescription>
                  Choose from multiple elegant themes including light, dark, and custom options that suit your style and reduce eye strain.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="glass hover:scale-105 transition-transform">
              <CardHeader>
                <Shield className="w-10 h-10 text-primary mb-2" />
                <CardTitle>Secure & Private</CardTitle>
                <CardDescription>
                  Your data is protected with secure authentication, encrypted connections, and privacy-first design principles.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="glass hover:scale-105 transition-transform">
              <CardHeader>
                <Cpu className="w-10 h-10 text-primary mb-2" />
                <CardTitle>Lightning Fast</CardTitle>
                <CardDescription>
                  Built with modern technologies like React and Vite for instant loading and smooth, responsive interactions.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="glass hover:scale-105 transition-transform">
              <CardHeader>
                <Globe className="w-10 h-10 text-primary mb-2" />
                <CardTitle>Cross-Platform</CardTitle>
                <CardDescription>
                  Access Cortex from any device - desktop, tablet, or mobile. Your conversations sync seamlessly across platforms.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </section>

        {/* Use Cases */}
        <section className="mb-16 animate-slide-up" style={{ animationDelay: '0.3s' }}>
          <Card className="glass">
            <CardHeader>
              <CardTitle className="text-3xl">Perfect For</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2 text-primary">Students & Learners</h3>
                  <p className="text-muted-foreground">
                    Get explanations, study help, research assistance, and learn new concepts with detailed, patient responses.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2 text-primary">Professionals</h3>
                  <p className="text-muted-foreground">
                    Draft emails, brainstorm ideas, get quick answers, and boost productivity with an AI assistant.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2 text-primary">Developers</h3>
                  <p className="text-muted-foreground">
                    Code assistance, debugging help, documentation lookup, and technical problem-solving support.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2 text-primary">Content Creators</h3>
                  <p className="text-muted-foreground">
                    Generate ideas, refine content, get feedback, and overcome creative blocks with AI collaboration.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2 text-primary">Researchers</h3>
                  <p className="text-muted-foreground">
                    Explore topics, summarize information, organize thoughts, and accelerate your research process.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2 text-primary">Everyone</h3>
                  <p className="text-muted-foreground">
                    From casual conversations to complex queries, Cortex adapts to your needs and communication style.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Developer & Feedback Section */}
        <section className="mb-16 animate-slide-up" style={{ animationDelay: '0.4s' }}>
          <div className="grid md:grid-cols-2 gap-8">
            {/* Meet the Developer */}
            <Card className="glass">
              <CardHeader>
                <CardTitle className="text-2xl">Meet the Developer</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Profile Image */}
                <div className="flex justify-center">
                  <div className="w-40 h-40 rounded-full overflow-hidden border-4 border-primary/20 shadow-xl">
                    <img 
                      src="/founder.Jpg" 
                      alt="Manas Rohilla" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>

                {/* Name and Title */}
                <div className="text-center space-y-2">
                  <h3 className="text-2xl font-bold">Manas</h3>
                  <p className="text-lg text-primary">Founder and Developer</p>
                  <p className="text-muted-foreground font-sans text-base">
                    Dedicated to leveraging Artificial Intelligence to solve real-world problems.
                  </p>
                </div>

                <Separator />

                {/* Social Links */}
                <div className="space-y-3">
                  <p className="text-center text-sm text-muted-foreground">Connect with me</p>
                  <div className="flex justify-center gap-4 flex-wrap">
                    <a
                      href="https://github.com/rohillamanas06-commits"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group"
                    >
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center hover:scale-110 transition-all duration-300 shadow-lg hover:shadow-xl">
                        <Github className="w-6 h-6 text-white" />
                      </div>
                    </a>
                    
                    <a
                      href="https://www.instagram.com/manas_rohilla_/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group"
                    >
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 flex items-center justify-center hover:scale-110 transition-all duration-300 shadow-lg hover:shadow-xl">
                        <Instagram className="w-6 h-6 text-white" />
                      </div>
                    </a>
                    
                    <a
                      href="https://www.linkedin.com/in/manas-rohilla-b73415338/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group"
                    >
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center hover:scale-110 transition-all duration-300 shadow-lg hover:shadow-xl">
                        <Linkedin className="w-6 h-6 text-white" />
                      </div>
                    </a>
                    
                    <a
                      href="https://peerlist.io/rohillamanas06"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group"
                    >
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center hover:scale-110 transition-all duration-300 shadow-lg hover:shadow-xl">
                        <Users className="w-6 h-6 text-white" />
                      </div>
                    </a>
                    
                    <a
                      href="mailto:rohillamanas06@gmail.com"
                      className="group"
                    >
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center hover:scale-110 transition-all duration-300 shadow-lg hover:shadow-xl">
                        <Mail className="w-6 h-6 text-white" />
                      </div>
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Send Feedback */}
            <Card className="glass">
              <CardHeader>
                <CardTitle className="text-2xl">Send Feedback</CardTitle>
                <CardDescription>
                  Have suggestions or feedback? I'd love to hear from you!
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleFeedbackSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="name" className="text-sm font-medium">
                      Name
                    </label>
                    <Input
                      id="name"
                      placeholder="Your name"
                      value={feedbackForm.name}
                      onChange={(e) => setFeedbackForm({ ...feedbackForm, name: e.target.value })}
                      required
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-medium">
                      Email
                    </label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your.email@example.com"
                      value={feedbackForm.email}
                      onChange={(e) => setFeedbackForm({ ...feedbackForm, email: e.target.value })}
                      required
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="message" className="text-sm font-medium">
                      Message
                    </label>
                    <Textarea
                      id="message"
                      placeholder="Share your thoughts, suggestions, or feedback..."
                      value={feedbackForm.message}
                      onChange={(e) => setFeedbackForm({ ...feedbackForm, message: e.target.value })}
                      required
                      disabled={isSubmitting}
                      rows={6}
                      className="resize-none"
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={isSubmitting}
                  >
                    <Send className="w-4 h-4 mr-2" />
                    {isSubmitting ? 'Sending...' : 'Send Feedback'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border/50 py-8 mt-12">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <Logo size="sm" />
        </div>
      </footer>
    </div>
  );
}
