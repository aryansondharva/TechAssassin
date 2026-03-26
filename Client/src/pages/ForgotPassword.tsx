import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { authService } from '@/services';
import { ApiError } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { Loader2, Mail, ArrowLeft, ArrowRight, Shield, Clock } from 'lucide-react';

export default function ForgotPassword() {
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'email' | 'otp' | 'success'>('email');
  const [formData, setFormData] = useState({
    email: '',
    otp: '',
  });
  const [emailSent, setEmailSent] = useState(false);
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

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email) {
      toast({
        title: 'Validation Error',
        description: 'Please enter your email address',
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
      await authService.forgotPassword({ email: formData.email });
      
      setEmailSent(true);
      setStep('otp');
      setTimeLeft(60); // 60 seconds countdown
      setResendEnabled(false);
      
      toast({
        title: 'OTP Sent',
        description: 'A 6-digit OTP has been sent to your email',
      });
    } catch (error) {
      if (error instanceof ApiError) {
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Error',
          description: 'Failed to send OTP. Please try again.',
          variant: 'destructive',
        });
      }
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
      await authService.verifyOTP({ 
        email: formData.email, 
        otp: formData.otp 
      });
      
      setStep('success');
      
      toast({
        title: 'Success',
        description: 'OTP verified successfully. You can now reset your password.',
      });
    } catch (error) {
      if (error instanceof ApiError) {
        toast({
          title: 'Verification Failed',
          description: error.message,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Error',
          description: 'Invalid OTP. Please try again.',
          variant: 'destructive',
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setResendEnabled(false);
    setTimeLeft(60);
    await handleSendOTP({ preventDefault: () => {} } as React.FormEvent);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-hero-bg via-hero-bg to-hero-bg p-4">
      {/* Animated background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-72 h-72 bg-primary rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-72 h-72 bg-primary rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse animation-delay-2000"></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        <Card className="bg-card/80 backdrop-blur-lg border-border shadow-2xl">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4">
              <img 
                src="/favicon.ico" 
                alt="TechAssassin" 
                className="w-16 h-16 mx-auto"
              />
            </div>
            
            {step === 'email' && (
              <>
                <CardTitle className="text-2xl font-bold text-card-foreground">Forgot Password</CardTitle>
                <CardDescription className="text-muted-foreground">
                  Enter your email address to receive a password reset OTP
                </CardDescription>
              </>
            )}
            
            {step === 'otp' && (
              <>
                <CardTitle className="text-2xl font-bold text-card-foreground">Enter OTP</CardTitle>
                <CardDescription className="text-muted-foreground">
                  We've sent a 6-digit code to {formData.email}
                </CardDescription>
              </>
            )}
            
            {step === 'success' && (
              <>
                <CardTitle className="text-2xl font-bold text-card-foreground text-green-600">OTP Verified!</CardTitle>
                <CardDescription className="text-muted-foreground">
                  You can now reset your password. Check your email for the reset link.
                </CardDescription>
              </>
            )}
          </CardHeader>

          <CardContent className="space-y-6">
            {step === 'email' && (
              <form onSubmit={handleSendOTP}>
                <div className="space-y-4">
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
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold py-3"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending OTP...
                    </>
                  ) : (
                    <>
                      Send OTP
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>
            )}

            {step === 'otp' && (
              <form onSubmit={handleVerifyOTP}>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="otp" className="text-card-foreground font-medium">6-Digit OTP</Label>
                    <div className="relative">
                      <Shield className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="otp"
                        type="text"
                        placeholder="123456"
                        value={formData.otp}
                        onChange={(e) => setFormData({ ...formData, otp: e.target.value.replace(/\D/g, '') })}
                        disabled={isLoading}
                        maxLength={6}
                        className="pl-10 text-center text-2xl tracking-widest bg-background border-input text-card-foreground placeholder-muted-foreground focus:border-primary"
                      />
                    </div>
                  </div>
                  
                  {timeLeft > 0 && (
                    <div className="flex items-center justify-center text-sm text-muted-foreground">
                      <Clock className="mr-2 h-4 w-4" />
                      Resend OTP in {formatTime(timeLeft)}
                    </div>
                  )}
                  
                  {resendEnabled && (
                    <Button 
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={handleResendOTP}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Resending...
                        </>
                      ) : (
                        'Resend OTP'
                      )}
                    </Button>
                  )}
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold py-3"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      Verify OTP
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>
            )}

            {step === 'success' && (
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-8 h-8 text-green-600" />
                </div>
                <Link to="/signin">
                  <Button className="w-full">
                    Back to Sign In
                    <ArrowLeft className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            )}

            <div className="text-center">
              <Link 
                to="/signin" 
                className="text-sm text-primary hover:text-primary/80 hover:underline"
              >
                <ArrowLeft className="inline mr-1 h-3 w-3" />
                Back to Sign In
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
