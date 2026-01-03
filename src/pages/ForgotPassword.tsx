import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Logo } from '@/components/Logo';
import { ThemeSwitcher } from '@/components/ThemeSwitcher';
import { AnimatedBackground } from '@/components/AnimatedBackground';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Mail, CheckCircle, Loader2 } from 'lucide-react';
import { authAPI } from '@/lib/api';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await authAPI.forgotPassword(email);
      setSuccess(true);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <AnimatedBackground />
      
      {/* Gradient orbs */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '-3s' }} />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between p-6">
        <Logo size="md" clickable />
        <ThemeSwitcher />
      </header>

      {/* Main content */}
      <main className="relative z-10 flex items-center justify-center min-h-[calc(100vh-120px)] px-4">
        <div className="w-full max-w-md">
          {/* Glass card */}
          <div className="glass-strong rounded-2xl p-8 animate-slide-up">
            {!success ? (
              <>
                {/* Header */}
                <div className="text-center mb-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                    <Mail className="w-8 h-8 text-primary" />
                  </div>
                  <h1 className="text-3xl font-bold mb-2">
                    Forgot Password?
                  </h1>
                  <p className="text-muted-foreground">
                    No worries! Enter your email and we'll send you reset instructions.
                  </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2">
                      Email Address
                    </label>
                    <Input
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoFocus
                    />
                  </div>

                  {error && (
                    <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                      {error}
                    </div>
                  )}

                  <Button
                    type="submit"
                    variant="glow"
                    size="lg"
                    className="w-full mt-6"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        Send Reset Link
                        <Mail className="w-5 h-5 ml-2" />
                      </>
                    )}
                  </Button>
                </form>
              </>
            ) : (
              <>
                {/* Success message */}
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/10 mb-4">
                    <CheckCircle className="w-8 h-8 text-green-500" />
                  </div>
                  <h1 className="text-3xl font-bold mb-2">
                    Check Your Email
                  </h1>
                  <p className="text-muted-foreground mb-6">
                    We've sent password reset instructions to <span className="font-medium text-foreground">{email}</span>
                  </p>
                  <div className="p-4 rounded-lg bg-muted/50 border border-border text-sm text-muted-foreground mb-6">
                    <p className="mb-2">Didn't receive the email? Check your spam folder or</p>
                    <button
                      type="button"
                      onClick={() => {
                        setSuccess(false);
                        setEmail('');
                      }}
                      className="text-primary hover:underline font-medium"
                    >
                      try another email address
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* Back to login */}
            <div className="mt-6 text-center">
              <Link
                to="/auth"
                className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to login
              </Link>
            </div>
          </div>

          {/* Footer text */}
          <p className="text-center text-muted-foreground text-sm mt-6 animate-fade-in" style={{ animationDelay: '0.3s' }}>
            Remember your password? <Link to="/auth" className="text-primary hover:underline">Sign in</Link>
          </p>
        </div>
      </main>
    </div>
  );
}
