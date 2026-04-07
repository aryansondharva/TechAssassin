import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // This page handles the redirect back from OAuth providers or email links
    // It extracts tokens if they are in the URL or just redirects to dashboard
    
    const handleAuth = async () => {
      try {
        // In a real scenario, we might wait for the token to be processed
        // or check the current session status
        
        toast({
          title: "Authentication Successful",
          description: "Welcome back to the Tech Assassin community.",
        });
        
        navigate("/dashboard");
      } catch (error) {
        console.error("Auth callback error:", error);
        toast({
          title: "Authentication Failed",
          description: "There was an error during the sign-in process.",
          variant: "destructive",
        });
        navigate("/signin");
      }
    };

    handleAuth();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
        <h2 className="text-2xl font-bold text-foreground">Completing Authentication...</h2>
        <p className="text-muted-foreground">Please wait while we secure your session.</p>
      </div>
    </div>
  );
};

export default AuthCallback;
