import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '@/services';
import { ApiError } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { Loader2, Mail, Lock, Eye, EyeOff, Shield, Zap, Trophy, Users, ArrowRight } from 'lucide-react';

export default function SignIn() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.email || !formData.password) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all fields',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      toast({
        title: 'Validation Error',
        description: 'Please enter a valid email address',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      await authService.signIn({
        email: formData.email,
        password: formData.password,
      });

      toast({
        title: 'Welcome back!',
        description: 'You have successfully signed in.',
      });

      // Redirect to dashboard or home
      navigate('/dashboard');
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 401) {
          toast({
            title: 'Sign In Failed',
            description: 'Invalid email or password',
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'Sign In Failed',
            description: error.message,
            variant: 'destructive',
          });
        }
      } else {
        toast({
          title: 'Error',
          description: 'An unexpected error occurred',
          variant: 'destructive',
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-hero-bg via-hero-bg to-hero-bg p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-72 h-72 bg-primary rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-72 h-72 bg-primary rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary rounded-full mix-blend-multiply filter blur-xl opacity-5 animate-pulse animation-delay-4000"></div>
      </div>

      <div className="relative z-10 w-full max-w-6xl grid lg:grid-cols-2 gap-8">
        {/* Left side - Welcome Back */}
        <div className="hidden lg:flex flex-col justify-center p-8">
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-5xl font-bold text-hero-black">
                Welcome Back to <span className="text-primary">Tech Assassin</span>
              </h1>
              <p className="text-xl text-hero-muted mb-6">
                Continue your journey. Build, innovate, and conquer with the community.
              </p>
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 w-fit backdrop-blur-sm">
                <div className="flex -space-x-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="w-10 h-10 rounded-full border-2 border-[#0a0a0b] overflow-hidden shadow-xl ring-2 ring-primary/20">
                      <img 
                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=user${i}`} 
                        alt="Operative" 
                        className="w-full h-full object-cover" 
                      />
                    </div>
                  ))}
                </div>
                <div>
                  <div className="text-sm font-black italic text-hero-foreground font-heading uppercase tracking-widest leading-none mb-1">Elite Operatives</div>
                  <div className="text-[10px] font-bold text-primary uppercase tracking-[0.2em]">156+ Active In-Field</div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
                  <Zap className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-hero-foreground">Quick Access</h3>
                  <p className="text-hero-muted">Jump back into your projects and collaborations</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
                  <Shield className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-hero-foreground">Secure Login</h3>
                  <p className="text-hero-muted">Your data and projects are protected with enterprise-grade security</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
                  <Trophy className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-hero-foreground">Track Progress</h3>
                  <p className="text-hero-muted">Monitor your hackathon journey and achievements</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Sign In Form */}
        <Card className="bg-card/80 backdrop-blur-lg border-border shadow-2xl">
          <CardHeader className="space-y-1 text-center">
            <div className="mx-auto mb-4">
              <img 
                src="/favicon.ico" 
                alt="TechAssassin" 
                className="w-16 h-16 mx-auto mb-2"
              />
            </div>
            <CardTitle className="text-3xl font-bold text-card-foreground">Sign In</CardTitle>
            <CardDescription className="text-muted-foreground">
              Welcome back! Enter your credentials to continue
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-card-foreground font-medium">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    disabled={isLoading}
                    required
                    className="pl-10 bg-background border-input text-card-foreground placeholder-muted-foreground focus:border-primary"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-card-foreground font-medium">Password</Label>
                  <Link 
                    to="/forgot-password" 
                    className="text-sm text-primary hover:text-primary/80 hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    disabled={isLoading}
                    required
                    className="pl-10 pr-10 bg-background border-input text-card-foreground placeholder-muted-foreground focus:border-primary"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-muted-foreground hover:text-card-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </CardContent>
            <div className="px-6 pb-6 space-y-4">
              <Button 
                type="submit" 
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold py-3 transition-all duration-200 transform hover:scale-[1.02]" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
              <p className="text-sm text-center text-muted-foreground">
                Don't have an account?{' '}
                <Link to="/signup" className="text-primary hover:text-primary/80 hover:underline font-medium">
                  Sign up
                </Link>
              </p>
            </div>
          </form>
        </Card>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 0.3; }
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}
