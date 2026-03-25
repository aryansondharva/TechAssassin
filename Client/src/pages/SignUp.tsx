import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '@/services';
import { ApiError } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { Loader2, User, Mail, Lock, Check, Eye, EyeOff, Zap, Shield, Trophy, Users } from 'lucide-react';

export default function SignUp() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const passwordRequirements = [
    { regex: /.{8,}/, text: 'At least 8 characters' },
    { regex: /[A-Z]/, text: 'One uppercase letter' },
    { regex: /[a-z]/, text: 'One lowercase letter' },
    { regex: /[0-9]/, text: 'One number' },
    { regex: /[^A-Za-z0-9]/, text: 'One special character' },
  ];

  useEffect(() => {
    const strength = passwordRequirements.filter(req => req.regex.test(formData.password)).length;
    setPasswordStrength(strength);
  }, [formData.password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name || !formData.email || !formData.password) {
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

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: 'Validation Error',
        description: 'Passwords do not match',
        variant: 'destructive',
      });
      return;
    }

    if (passwordStrength < 3) {
      toast({
        title: 'Weak Password',
        description: 'Please create a stronger password',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      await authService.signUp({
        username: formData.name.toLowerCase().replace(/\s+/g, '_'),
        full_name: formData.name,
        email: formData.email,
        password: formData.password,
      });

      toast({
        title: 'Success!',
        description: 'Account created successfully. Please check your email to verify your account.',
      });

      // Redirect to sign in page
      navigate('/signin');
    } catch (error) {
      if (error instanceof ApiError) {
        toast({
          title: 'Sign Up Failed',
          description: error.message,
          variant: 'destructive',
        });
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
        {/* Left side - Features */}
        <div className="hidden lg:flex flex-col justify-center p-8">
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-5xl font-bold text-hero-foreground">
                      
                Tech <span className="text-primary"> Assassin</span>
              
              </h1>
               <p className="text-xl text-hero-muted mb-6">
                Build. Innovate. Conquer. The ultimate hackathon experience awaits.
              </p>
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 w-fit backdrop-blur-sm">
                <div className="flex -space-x-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="w-10 h-10 rounded-full border-2 border-[#0a0a0b] overflow-hidden shadow-xl ring-2 ring-primary/20">
                      <img 
                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=user${i+3}`} 
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
                  <Trophy className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-hero-foreground">Win Amazing Prizes</h3>
                  <p className="text-hero-muted">Compete for $10,000+ in prizes and recognition</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-hero-foreground">Join 500+ Innovators</h3>
                  <p className="text-hero-muted">Connect with talented developers and designers</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
                  <Shield className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-hero-foreground">Skill Development</h3>
                  <p className="text-hero-muted">Learn cutting-edge technologies and frameworks</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Registration Form */}
        <Card className="bg-card/80 backdrop-blur-lg border-border shadow-2xl">
          <CardHeader className="space-y-1 text-center">
            <div className="mx-auto mb-4">
              <img 
                src="/favicon.ico" 
                alt="TechAssassin" 
                className="w-16 h-16 mx-auto mb-2"
              />
  
            </div>
            <CardTitle className="text-3xl font-bold text-card-foreground">Create Account</CardTitle>
            <CardDescription className="text-muted-foreground">
              Join the ultimate hackathon community
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-card-foreground font-medium">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    disabled={isLoading}
                    required
                    className="pl-10 bg-background border-input text-card-foreground placeholder-muted-foreground focus:border-primary"
                  />
                </div>
              </div>

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
                <Label htmlFor="password" className="text-card-foreground font-medium">Password</Label>
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
                
                {/* Password Strength Indicator */}
                {formData.password && (
                  <div className="space-y-2">
                    <div className="flex space-x-1">
                      {[1, 2, 3, 4, 5].map((level) => (
                        <div
                          key={level}
                          className={`h-2 flex-1 rounded-full transition-all duration-300 ${
                            level <= passwordStrength
                              ? passwordStrength <= 2
                                ? 'bg-destructive'
                                : passwordStrength <= 3
                                ? 'bg-yellow-500'
                                : 'bg-green-500'
                              : 'bg-muted'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {passwordStrength <= 2 && 'Weak password'}
                      {passwordStrength === 3 && 'Fair password'}
                      {passwordStrength >= 4 && 'Strong password'}
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-card-foreground font-medium">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    disabled={isLoading}
                    required
                    className="pl-10 pr-10 bg-background border-input text-card-foreground placeholder-muted-foreground focus:border-primary"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-3 text-muted-foreground hover:text-card-foreground"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {formData.confirmPassword && formData.password && (
                  <div className="flex items-center space-x-2">
                    {formData.password === formData.confirmPassword ? (
                      <>
                        <Check className="h-4 w-4 text-green-500" />
                        <span className="text-xs text-green-500">Passwords match</span>
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4 text-destructive" />
                        <span className="text-xs text-destructive">Passwords do not match</span>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Password Requirements */}
              {formData.password && (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground font-medium">Password requirements:</p>
                  <div className="space-y-1">
                    {passwordRequirements.map((req, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <Check className={`h-3 w-3 ${req.regex.test(formData.password) ? 'text-green-500' : 'text-muted'}`} />
                        <span className={`text-xs ${req.regex.test(formData.password) ? 'text-green-500' : 'text-muted-foreground'}`}>
                          {req.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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
                    Creating account...
                  </>
                ) : (
                  'Create Account'
                )}
              </Button>
              <p className="text-sm text-center text-muted-foreground">
                Already have an account?{' '}
                <Link to="/signin" className="text-primary hover:text-primary/80 hover:underline font-medium">
                  Sign in
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
