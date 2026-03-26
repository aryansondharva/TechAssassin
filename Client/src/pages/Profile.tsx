import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { authService, profileService } from "@/services";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "@/hooks/use-toast";
import { 
  Github, 
  Linkedin, 
  MapPin, 
  Calendar, 
  Trophy, 
  Code, 
  ExternalLink,
  Share2,
  Terminal,
  Shield,
  Zap,
  Globe,
  Camera,
  Loader2,
  Edit3,
  Mail,
  Phone,
  GraduationCap,
  Sparkles,
  Award,
  BookOpen,
  Plus,
  Layout,
  Instagram,
  Twitter,
  Settings as SettingsIcon,
  MessageCircle,
  Briefcase,
  Image as ImageIcon
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from "@/components/ui/button";
import Footer from "@/components/Footer";

export default function Profile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  
  const { username } = useParams<{ username: string }>();
  // If no username param, it's the own logged in profile
  const isOwnProfile = !username;

  useEffect(() => {
    if (isOwnProfile && !authService.isAuthenticated()) {
      navigate('/signin');
      return;
    }
    fetchProfile();
  }, [navigate, username]);

  const fetchProfile = async () => {
    setIsLoading(true);
    try {
      let data;
      if (isOwnProfile) {
        data = await profileService.getMyProfile();
      } else if (username) {
        data = await profileService.getByUsername(username);
      }
      setProfile(data);
    } catch (error) {
      console.error("Failed to load profile", error);
      if (!isOwnProfile) {
        toast({ title: "Not Found", description: "Operative dossier not found in the network.", variant: "destructive" });
        navigate('/community');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleBannerClick = () => {
    bannerInputRef.current?.click();
  };

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "Error", description: "Image size must be under 2MB", variant: "destructive" });
      return;
    }

    setIsUploading(true);
    try {
       const response = await profileService.uploadAvatar(file);
       setProfile((prev: any) => ({ ...prev, avatar_url: response.avatar_url }));
       
       const currentUser = authService.getUser();
       if (currentUser) {
         currentUser.avatar_url = response.avatar_url;
         localStorage.setItem('auth_user', JSON.stringify(currentUser));
       }
       toast({ title: "Success", description: "Profile photo updated!" });
    } catch (error) {
       toast({ title: "Error", description: "Update failed", variant: "destructive" });
    } finally {
       setIsUploading(false);
    }
  };

  const handleBannerChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      toast({ title: "Error", description: "Banner size must be under 3MB", variant: "destructive" });
      return;
    }

    setIsUploadingBanner(true);
    try {
       // Re-using the same generic upload if it exists, or update profile with a mock/direct path
       // Assuming profileService has a method or we can just use update
       // For now, let's assume we can update the profile directly with a URL if we had one
       // In a real scenario, we'd have a separate endpoint for banners.
       // I'll simulate it by updating the profile field.
       
       // Just as a demonstration, let's toast and update the state
       // Ideally we'd upload to Supabase storage first.
       toast({ title: "Feature Pending", description: "Banner upload logic requires storage bucket for banners." });
    } catch (error) {
       toast({ title: "Error", description: "Update failed", variant: "destructive" });
    } finally {
       setIsUploadingBanner(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  const identity = profile || {};

  return (
    <div className="min-h-screen bg-[#F3F4F6]">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 pt-24 pb-12">
        <div className="flex items-center gap-2 text-[12px] text-gray-500 mb-6 uppercase tracking-wider font-bold">
           <Link to="/" className="hover:text-red-600 transition-colors">Home</Link>
           <span>/</span>
           <span className="text-gray-900">User Profile</span>
        </div>

        <div className="w-full space-y-8">
          <div className="space-y-8">
            <div className="bg-white rounded-[2rem] overflow-hidden shadow-md border border-gray-100 relative transition-all hover:shadow-lg">
               <div className="h-56 md:h-72 bg-[#0c0c0c] relative overflow-hidden group">
                  {identity.banner_url ? (
                    <img src={identity.banner_url} className="w-full h-full object-cover opacity-60" alt="Banner" />
                  ) : (
                    <div className="absolute inset-0 opacity-20" style={{ 
                      backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)',
                      backgroundSize: '40px 40px'
                    }}></div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 top-0 flex items-center justify-center pointer-events-none">
                     <h1 className="text-white text-5xl md:text-8xl font-black italic tracking-tighter opacity-10 select-none uppercase">
                        {identity.full_name || identity.username}
                     </h1>
                  </div>
                   {isOwnProfile && (
                    <>
                      <button 
                        onClick={handleBannerClick}
                        className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/30 rounded-full backdrop-blur-xl text-white border border-white/20 transition-all opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100"
                      >
                        <ImageIcon className="w-5 h-5" />
                      </button>
                      <input type="file" ref={bannerInputRef} onChange={handleBannerChange} className="hidden" accept="image/*" />
                    </>
                  )}
               </div>

               <div className="px-10 pb-10 relative">
                  <div className="relative inline-block -mt-24 md:-mt-32 mb-6 group">
                    <div className="p-2 bg-white rounded-full shadow-2xl">
                      <Avatar className="h-40 w-40 md:h-52 md:w-52 border-8 border-white">
                        <AvatarImage src={identity.avatar_url} className="object-cover" />
                        <AvatarFallback className="bg-blue-50 text-5xl font-black text-blue-200">
                          {identity.username?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                     {isOwnProfile && (
                      <>
                        <button 
                          onClick={handleAvatarClick}
                          disabled={isUploading}
                          className="absolute bottom-4 right-4 p-3 bg-red-600 text-white rounded-full shadow-2xl border-4 border-white hover:bg-red-700 transition-all z-20"
                        >
                          {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Camera className="w-5 h-5" />}
                        </button>
                        <input type="file" ref={fileInputRef} onChange={handleAvatarChange} className="hidden" accept="image/*" />
                      </>
                    )}
                  </div>

                   {isOwnProfile && (
                    <div className="absolute top-6 right-10 flex gap-4">
                       <Link to="/edit-profile">
                          <Button className="rounded-xl h-12 px-6 bg-red-600 text-white font-black uppercase text-xs tracking-[0.2em] shadow-xl shadow-red-500/20 hover:bg-red-700 transition-all">
                             <Edit3 className="w-4 h-4 mr-2" /> Edit Identity
                          </Button>
                       </Link>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mt-4">
                     <div className="space-y-5">
                        <div className="flex items-center gap-3">
                          <h2 className="text-4xl font-black text-gray-900 uppercase italic tracking-tighter">{identity.full_name || identity.username}</h2>
                        </div>
                        
                        <div className="space-y-3 text-[14px] font-black text-gray-400 uppercase tracking-widest leading-relaxed">
                           {(isOwnProfile || identity.is_address_public) && (
                             <div className="flex items-center gap-3"><MapPin className="w-4 h-4 text-red-600" /> <span className="text-gray-600">{identity.address || 'UNDEFINED LOCATION'}</span></div>
                           )}
                           <div className="flex items-center gap-3"><span className="text-red-600 font-black">@</span> <span className="text-gray-800 lowercase">{identity.username}</span></div>
                           <div className="flex items-start gap-3 italic normal-case font-bold text-gray-500 text-lg">
                             {identity.education || 'No active academic mission identified...'}
                           </div>
                        </div>

                        <div className="pt-4 space-y-3">
                           {(isOwnProfile || identity.is_email_public) && (
                             <div className="flex items-center gap-3 text-sm font-black text-blue-600">
                                <Mail className="w-4 h-4 text-gray-400" /> 
                                <span className="hover:underline cursor-pointer lowercase">{identity.email}</span>
                             </div>
                           )}
                           <div className="flex items-center gap-8 text-[13px] font-black text-gray-900">
                              {(isOwnProfile || identity.is_phone_public) && (
                                <div className="flex items-center gap-3"><Phone className="w-4 h-4 text-gray-400" /> {identity.phone || 'UNKNOWN'}</div>
                              )}
                           </div>
                        </div>
                     </div>

                     <div className="space-y-8 bg-gray-50/50 p-8 rounded-3xl border border-gray-100">
                        <div className="space-y-3">
                           <div className="flex items-center justify-between">
                              <span className="text-[12px] font-black uppercase text-gray-400 tracking-[0.3em]">Skillset Matrix</span>
                              <Link to="/edit-profile"><Edit3 className="w-4 h-4 text-gray-300 hover:text-red-600 transition-all" /></Link>
                           </div>
                           <div className="flex flex-wrap gap-3">
                              {identity.skills?.length > 0 ? identity.skills.map((s: string) => (
                                <Badge key={s} variant="secondary" className="bg-gray-900 text-white rounded-xl text-[11px] font-black uppercase tracking-widest px-5 py-2 border-none transition-all hover:bg-red-600 shadow-md">
                                  {s}
                                </Badge>
                              )) : <span className="text-[12px] text-gray-300 italic font-bold">Waiting for skill transmission...</span>}
                           </div>
                        </div>

                        <div className="space-y-3">
                           <div className="flex items-center justify-between">
                              <span className="text-[12px] font-black uppercase text-gray-400 tracking-[0.3em]">Combat Interests</span>
                              <Link to="/edit-profile"><Edit3 className="w-4 h-4 text-gray-300 hover:text-red-600 transition-all" /></Link>
                           </div>
                           <div className="flex flex-wrap gap-3">
                              {identity.interests?.length > 0 ? identity.interests.map((it: string) => (
                                <Badge key={it} variant="outline" className="border-gray-300 text-gray-700 rounded-xl text-[11px] uppercase font-black px-5 py-2 hover:border-red-500 hover:text-red-500 transition-all">
                                  {it}
                                </Badge>
                              )) : (
                                <div className="flex flex-wrap gap-2 opacity-40">
                                   <Badge variant="outline" className="rounded-xl px-4 py-2 border-dashed">Cybersecurity</Badge>
                                   <Badge variant="outline" className="rounded-xl px-4 py-2 border-dashed">BlockChain</Badge>
                                </div>
                              )}
                           </div>
                        </div>

                        <div className="space-y-3">
                           <div className="flex items-center justify-between">
                               <span className="text-[12px] font-black uppercase text-gray-400 tracking-[0.3em]">Social Neural-Link</span>
                               {isOwnProfile && <Link to="/edit-profile"><Edit3 className="w-4 h-4 text-gray-300 hover:text-red-600 transition-all" /></Link>}
                            </div>
                           <div className="flex items-center gap-5">
                              {identity.linkedin_url && (
                                <a href={identity.linkedin_url} target="_blank" rel="noreferrer" className="text-blue-600 hover:scale-125 transition-all drop-shadow-md">
                                  <Linkedin className="w-7 h-7 fill-current" />
                                </a>
                              )}
                              {identity.github_url && (
                                <a href={identity.github_url} target="_blank" rel="noreferrer" className="text-gray-900 hover:scale-125 transition-all drop-shadow-md">
                                  <Github className="w-7 h-7" />
                                </a>
                              )}
                              {identity.portfolio_url && (
                                <a href={identity.portfolio_url} target="_blank" rel="noreferrer" className="text-red-600 hover:scale-125 transition-all drop-shadow-md">
                                  <Globe className="w-7 h-7" />
                                </a>
                              )}
                           </div>
                        </div>
                     </div>
                  </div>
               </div>
            </div>

            <div className="grid grid-cols-1 gap-8">
               <Section title="Operational Biography" onEdit={isOwnProfile ? () => navigate('/edit-profile') : undefined}>
                  <p className="text-lg text-gray-600 leading-relaxed font-medium italic">
                    "{identity.bio || 'This operative has not yet transmitted an identity bio...'}"
                  </p>
               </Section>

               <Section title="Active Initiatives" onAdd={isOwnProfile ? () => navigate('/events') : undefined}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <InitiativeCard 
                        title="AMD Slingshot" 
                        org="AMD OPERATIONS" 
                        image="https://tech-assassin.vercel.app/favicon.ico" 
                     />
                     <InitiativeCard 
                        title="Gen AI Academy APAC" 
                        org="GOOGLE CLOUD" 
                        image="https://upload.wikimedia.org/wikipedia/commons/5/53/Google_Logos_Search.png" 
                     />
                  </div>
               </Section>

                <Section title="Academic Foundation" onAdd={isOwnProfile ? () => navigate('/edit-profile') : undefined}>
                  <Card className="border-gray-100 shadow-sm bg-white p-8 rounded-3xl transition-all hover:border-red-100">
                     <div className="flex gap-8">
                        <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center shrink-0 border border-blue-100">
                           <GraduationCap className="h-8 w-8 text-blue-600" />
                        </div>
                        <div className="flex-1 space-y-2">
                           <div className="flex justify-between items-start">
                              <h4 className="text-xl font-black text-gray-900 uppercase italic tracking-tight">{identity.university || 'UNSPECIFIED ACADEMY'}</h4>
                              {isOwnProfile && <Link to="/edit-profile" className="text-gray-300 hover:text-red-600 transition-all"><Edit3 className="w-5 h-5" /></Link>}
                           </div>
                           <p className="text-sm font-black text-red-600 uppercase tracking-widest italic">{identity.education || 'DEGREE NOT TRANSMITTED'}</p>
                           <div className="flex items-center gap-3 pt-4">
                              <Badge className="bg-gray-100 text-gray-600 border-none rounded-lg text-xs font-black uppercase px-4 py-2">Computer Intelligence</Badge>
                           </div>
                           <div className="flex justify-between items-center text-xs pt-6 text-gray-400 font-black uppercase tracking-widest">
                              <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-red-500" /> Class of {identity.graduation_year || '20XX'}</div>
                              <div className="bg-gray-50 px-4 py-1 rounded-full text-[10px] border border-gray-100">Grade: ELITE</div>
                           </div>
                        </div>
                     </div>
                  </Card>
               </Section>

               <Section title="Combat Projects" onAdd={isOwnProfile ? () => navigate('/community') : undefined}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <ProjectCard 
                        title="Tech Assassins" 
                        date="July 25, 2024 - Active" 
                        authors={["ARYAN"]} 
                        description="Dismantling tech, mastering code, and weaponizing creativity in the digital hunt. A high-performance community engine."
                     />
                     <ProjectCard 
                        title="Neural Portfolio" 
                        date="Jan 20, 2024 - Active" 
                        authors={[]}
                        description="A cinematic operative dashboard showcasing tactical development skills and lethal UI components."
                     />
                  </div>
               </Section>

                {isOwnProfile && (
                   <>
                     <Section title="Experience Ledger" onAdd={() => navigate('/edit-profile')} isEmpty={!identity.experience} />
                     <Section title="Certifications" onAdd={() => navigate('/edit-profile')} isEmpty={!identity.licenses} />

                     <div className="bg-white rounded-[2.5rem] p-10 shadow-md border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-8 transition-all hover:shadow-xl">
                        <div className="text-center md:text-left">
                           <h3 className="text-2xl font-black text-gray-900 uppercase italic tracking-tighter">Tactical Settings</h3>
                           <p className="text-sm text-gray-500 mt-2 font-bold uppercase tracking-widest">Control your operative privacy and manage deployment notifications.</p>
                        </div>
                        <Link to="/edit-profile">
                           <Button className="rounded-2xl h-14 bg-black text-white px-10 font-black uppercase text-xs tracking-[0.3em] hover:bg-gray-800 transition-all shadow-xl shadow-black/10">Configure System</Button>
                        </Link>
                     </div>
                   </>
                 )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

// --- SUB-COMPONENTS ---

function Section({ title, onAdd, onEdit, children, isEmpty }: any) {
   return (
      <div className="bg-white rounded-[2.5rem] p-10 shadow-md border border-gray-100 space-y-6 transition-all hover:border-red-100/30">
         <div className="flex items-center justify-between border-b-2 border-gray-50 pb-5 mb-4">
            <h3 className="text-lg font-black text-gray-900 uppercase italic tracking-widest border-l-4 border-red-600 pl-4">{title}</h3>
            <div className="flex gap-4">
               {onAdd && (
                  <Button variant="outline" className="h-9 px-5 rounded-xl border-gray-200 text-gray-900 font-black text-[10px] uppercase tracking-widest hover:bg-gray-50" onClick={onAdd}>
                     <Plus className="w-4 h-4 mr-2" /> Deploy
                  </Button>
               )}
               {onEdit && (
                  <button onClick={onEdit} className="p-2 text-gray-300 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"><Edit3 className="w-5 h-5" /></button>
               )}
            </div>
         </div>
         {isEmpty ? (
            <div className="py-8 text-center border-2 border-dashed border-gray-100 rounded-3xl">
               <Shield className="w-12 h-12 text-gray-100 mx-auto mb-3" />
               <p className="text-xs text-gray-300 font-black uppercase italic tracking-[0.3em]">No data records existing in the database...</p>
            </div>
         ) : children}
      </div>
   );
}

function InitiativeCard({ title, org, image }: any) {
   return (
      <div className="flex items-center gap-6 p-6 bg-white rounded-3xl border border-gray-100 hover:border-red-500/20 hover:shadow-lg transition-all group cursor-pointer">
         <div className="w-16 h-16 rounded-2xl bg-gray-50 p-3 shadow-inner border border-gray-100 shrink-0 overflow-hidden flex items-center justify-center">
            <img src={image} alt={org} className="max-w-full max-h-full object-contain grayscale group-hover:grayscale-0 transition-all" />
         </div>
         <div className="flex-1 min-w-0">
            <h4 className="text-lg font-black text-gray-900 uppercase italic tracking-tighter truncate group-hover:text-red-600 transition-colors">{title}</h4>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Initiative: <span className="text-gray-900">{org}</span></p>
         </div>
      </div>
   );
}

function ProjectCard({ title, date, authors, description }: any) {
   return (
      <Card className="border-gray-100 shadow-none bg-white hover:shadow-xl transition-all group p-8 rounded-3xl border-r-8 border-r-red-600/10 hover:border-r-red-600 transition-all">
         <div className="flex justify-between items-start mb-4">
            <div>
               <div className="flex items-center gap-3">
                  <h4 className="text-xl font-black text-gray-900 uppercase italic tracking-tighter">{title}</h4>
                  <Badge className="bg-blue-600 text-white border-none rounded-lg text-[10px] font-black uppercase px-3 py-1">Mission</Badge>
               </div>
               <div className="flex items-center gap-2 text-[10px] text-gray-400 font-black uppercase tracking-widest mt-2">
                  <Calendar className="w-4 h-4 text-red-500" /> {date}
               </div>
            </div>
            {isOwnProfile && <button className="p-2 text-gray-200 group-hover:text-red-600 transition-all"><Edit3 className="w-5 h-5" /></button>}
         </div>
         
         <p className="text-sm text-gray-500 leading-relaxed font-bold italic border-l-2 border-gray-100 pl-4">
            {description}
         </p>
      </Card>
   );
}
