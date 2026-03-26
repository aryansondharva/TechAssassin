import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '@/services';
import { ApiError } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { Loader2, Mail, ArrowLeft, ArrowRight, Shield, Clock, Zap } from 'lucide-react';

export default function MagicLink() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [formData, setFormData] = useState({
    email: '',
    otp: '',
  });
  const [timeLeft, setTimeLeft] = useState(0);
  const [resendEnabled, setResendEnabled] = useState(false);

  // Countdown timer for OTP
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setResendEnabled(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [timeLeft]);

  const handleSendMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email) {
      toast({
        title: 'Validation Error',
        description: 'Please enter your email address',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      await authService.sendMagicLink(formData.email);
      
      setStep('otp');
      setTimeLeft(60);
      setResendEnabled(false);
      
      toast({
        title: 'OTP Sent',
        description: 'Check your email for the 6-digit login code.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof ApiError ? error.message : 'Failed to send magic link.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.otp || formData.otp.length !== 6) {
      toast({
        title: 'Validation Error',
        description: 'Please enter a valid 6-digit OTP',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      await authService.verifyMagicLink(formData.email, formData.otp);
      
      toast({
        title: 'Welcome!',
        description: 'You have successfully signed in.',
      });
      
      navigate('/dashboard');
    } catch (error) {
      toast({
        title: 'Verification Failed',
        description: error instanceof ApiError ? error.message : 'Invalid code.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-hero-bg via-hero-bg to-hero-bg p-4 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-72 h-72 bg-primary rounded-full filter blur-[120px] opacity-10 animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-72 h-72 bg-primary rounded-full filter blur-[120px] opacity-10 animate-pulse animation-delay-2000"></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        <Card className="bg-card/80 backdrop-blur-lg border-border shadow-2xl">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4">
              <Zap className="w-12 h-12 text-primary animate-bounce" />
            </div>
            
            <CardTitle className="text-2xl font-bold text-card-foreground">
              {step === 'email' ? 'Magic Link' : 'Enter One-Time Code'}
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              {step === 'email' 
                ? 'Sign in instantly without a password' 
                : `We've sent a 6-digit code to ${formData.email}`}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {step === 'email' ? (
              <form onSubmit={handleSendMagicLink} className="space-y-4">
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
                      className="pl-10 bg-background border-input text-card-foreground"
                    />
                  </div>
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full bg-primary text-primary-foreground font-semibold py-6"
                  disabled={isLoading}
                >
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Get Magic Link'}
                  {!isLoading && <ArrowRight className="ml-2 h-4 w-4" />}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOTP} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="otp" className="text-card-foreground font-medium">6-Digit Code</Label>
                  <div className="relative">
                    <Shield className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="otp"
                      type="text"
                      placeholder="· · · · · ·"
                      value={formData.otp}
                      onChange={(e) => setFormData({ ...formData, otp: e.target.value.replace(/\D/g, '') })}
                      disabled={isLoading}
                      maxLength={6}
                      className="pl-10 text-center text-3xl font-bold tracking-[0.5em] bg-background border-input h-14"
                    />
                  </div>
                </div>
                
                {timeLeft > 0 ? (
                  <div className="text-center text-sm text-muted-foreground">
                    Resend code in {formatTime(timeLeft)}
                  </div>
                ) : (
                  <Button 
                    type="button" 
                    variant="link" 
                    className="w-full text-xs text-primary" 
                    onClick={handleSendMagicLink}
                  >
                    Didn't receive code? Resend
                  </Button>
                )}
                
                <Button 
                  type="submit" 
                  className="w-full bg-primary text-primary-foreground font-semibold py-6"
                  disabled={isLoading}
                >
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Verify & Sign In'}
                </Button>
              </form>
            )}

            <div className="text-center">
              <Link to="/signin" className="text-sm text-primary hover:underline inline-flex items-center">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Sign In
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
