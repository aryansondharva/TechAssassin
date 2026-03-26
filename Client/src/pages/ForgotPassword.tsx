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
  const [step, setStep] = useState<'email' | 'otp' | 'reset' | 'success'>('email');
  const [formData, setFormData] = useState({
    email: '',
    otp: '',
    password: '',
    confirmPassword: '',
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

  const handleSendOTP = async (e?: React.FormEvent) => {
    e?.preventDefault();
    
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
      await authService.forgotPassword({ email: formData.email });
      setStep('otp');
      setTimeLeft(60);
      setResendEnabled(false);
      
      toast({
        title: 'OTP Sent',
        description: 'A verification code has been sent to your email',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to send OTP',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.otp || formData.otp.length !== 6) {
      toast({ title: 'Error', description: 'Please enter 6-digit code', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    try {
      await authService.verifyOTP({ email: formData.email, otp: formData.otp });
      setStep('reset');
      toast({ title: 'Verified', description: 'Please set your new password' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Verification failed', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      toast({ title: 'Error', description: 'Passwords do not match', variant: 'destructive' });
      return;
    }
    if (formData.password.length < 6) {
      toast({ title: 'Error', description: 'At least 6 characters required', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    try {
      await authService.resetPassword({
        email: formData.email,
        otp: formData.otp,
        password: formData.password
      });
      setStep('success');
      toast({ title: 'Success', description: 'Password reset successfully' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Reset failed', variant: 'destructive' });
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
              <img src="/favicon.ico" alt="TechAssassin" className="w-16 h-16 mx-auto" />
            </div>
            <CardTitle className="text-2xl font-bold text-card-foreground">
              {step === 'email' && 'Forgot Password'}
              {step === 'otp' && 'Verify Identity'}
              {step === 'reset' && 'New Password'}
              {step === 'success' && 'Reset Complete'}
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              {step === 'email' && "Enter email to receive a reset code"}
              {step === 'otp' && `Enter the 6-digit code sent to ${formData.email}`}
              {step === 'reset' && "Create a new strong password"}
              {step === 'success' && "Your password has been changed successfully!"}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {step === 'email' && (
              <form onSubmit={handleSendOTP} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
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
                      className="pl-10 h-11"
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full h-11" disabled={isLoading}>
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Send Code"}
                </Button>
              </form>
            )}

            {step === 'otp' && (
              <form onSubmit={handleVerifyOTP} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="otp">6-Digit Code</Label>
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
                      className="pl-10 h-11 text-center text-xl tracking-widest font-mono"
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Button type="submit" className="w-full h-11" disabled={isLoading}>
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Verify Code"}
                  </Button>
                  {timeLeft > 0 ? (
                    <p className="text-center text-xs text-muted-foreground mt-2 flex items-center justify-center">
                      <Clock className="w-3 h-3 mr-1" /> Resend in {formatTime(timeLeft)}
                    </p>
                  ) : (
                    <Button type="button" variant="link" size="sm" onClick={() => handleSendOTP()} disabled={isLoading}>
                      Resend Code
                    </Button>
                  )}
                </div>
              </form>
            )}

            {step === 'reset' && (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">New Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    disabled={isLoading}
                    required
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    disabled={isLoading}
                    required
                    className="h-11"
                  />
                </div>
                <Button type="submit" className="w-full h-11" disabled={isLoading}>
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Update Password"}
                </Button>
              </form>
            )}

            {step === 'success' && (
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-8 h-8 text-green-500" />
                </div>
                <Link to="/signin" className="block w-full">
                  <Button className="w-full h-11">Back to Sign In</Button>
                </Link>
              </div>
            )}

            {step !== 'success' && (
              <div className="text-center pt-2">
                <Link to="/signin" className="text-sm text-primary hover:underline flex items-center justify-center">
                  <ArrowLeft className="w-3 h-3 mr-1" /> Back to Sign In
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
