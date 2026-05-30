import { useEffect, useState } from "react";
import { useAuth } from "@clerk/react";
import { QRCodeSVG } from "qrcode.react";
import { motion } from "framer-motion";
import { ArrowLeft, Copy, Check, Download, Share2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "@/lib/api-client";
import { useToast } from "@/components/ui/use-toast";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function QrCodePage() {
  const { isLoaded, isSignedIn } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      navigate("/signin");
      return;
    }

    if (isSignedIn) {
      api
        .get<any>("/profile")
        .then((data) => {
          setProfile(data);
          setLoading(false);
        })
        .catch((error) => {
          console.error("Failed to fetch profile:", error);
          setLoading(false);
        });
    }
  }, [isLoaded, isSignedIn, navigate]);

  const profileUrl = profile?.username
    ? `https://tech-assassin.vercel.app/@${profile.username}`
    : "https://tech-assassin.vercel.app";

  const handleCopy = () => {
    navigator.clipboard.writeText(profileUrl);
    setCopied(true);
    toast({
      title: "Link Copied!",
      description: "Profile URL copied to clipboard.",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const svg = document.getElementById("qr-code-svg");
    if (!svg) return;
    
    // Convert SVG to Canvas
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    
    img.onload = () => {
      // Add padding and background
      canvas.width = img.width + 80;
      canvas.height = img.height + 80;
      if (ctx) {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 40, 40);
        
        // Trigger download
        const pngFile = canvas.toDataURL("image/png");
        const downloadLink = document.createElement("a");
        downloadLink.download = `${profile?.username || 'profile'}-qr.png`;
        downloadLink.href = `${pngFile}`;
        downloadLink.click();
      }
    };
    
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My TechAssassin Profile',
          text: 'Check out my TechAssassin developer profile!',
          url: profileUrl,
        });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      handleCopy();
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-950">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-12 flex flex-col items-center justify-center">
        <div className="w-full max-w-md">
          <Link
            to="/profile"
            className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 mb-8 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Profile
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-xl border border-slate-200 dark:border-slate-800 flex flex-col items-center text-center relative overflow-hidden"
          >
            {/* Background design elements */}
            <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none" />
            
            <div className="relative z-10 mb-6">
              <h1 className="text-2xl font-bold mb-2">My Assassin ID</h1>
              <p className="text-slate-500 dark:text-slate-400 text-sm">
                Scan this QR code to view my complete developer profile and missions.
              </p>
            </div>

            <motion.div 
              className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 mb-8"
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <QRCodeSVG
                id="qr-code-svg"
                value={profileUrl}
                size={220}
                bgColor={"#ffffff"}
                fgColor={"#020617"}
                level={"H"}
                includeMargin={false}
              />
            </motion.div>

            <div className="w-full bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 flex items-center justify-between mb-8">
              <div className="truncate text-sm font-medium text-slate-600 dark:text-slate-300 mr-4">
                tech-assassin.vercel.app/@{profile?.username}
              </div>
              <button
                onClick={handleCopy}
                className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors flex-shrink-0"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4 text-slate-400" />
                )}
              </button>
            </div>

            <div className="flex items-center gap-4 w-full">
              <button
                onClick={handleDownload}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 transition-all active:scale-95 shadow-sm"
              >
                <Download className="h-4 w-4" />
                Save Image
              </button>
              <button
                onClick={handleShare}
                className="flex items-center justify-center p-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-95 shadow-sm"
              >
                <Share2 className="h-5 w-5" />
              </button>
            </div>

          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
