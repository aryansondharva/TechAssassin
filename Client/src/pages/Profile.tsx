import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
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
  Briefcase
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from "@/components/ui/button";

export default function Profile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    if (!authService.isAuthenticated()) {
      navigate('/signin');
      return;
    }
    fetchProfile();
  }, [navigate]);

  const fetchProfile = async () => {
    setIsLoading(true);
    try {
      const data = await profileService.getMyProfile();
      setProfile(data);
    } catch (error) {
      console.error("Failed to load profile", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
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
      
      {/* Main Layout Container */}
      <main className="max-w-7xl mx-auto px-4 pt-24 pb-12">
        
        {/* Header Breadcrumb */}
        <div className="flex items-center gap-2 text-[10px] text-gray-500 mb-4 uppercase tracking-wider font-semibold">
           <Link to="/" className="hover:text-red-600 transition-colors">Home</Link>
           <span>/</span>
           <span className="text-gray-900">User Profile</span>
        </div>

        <div className="w-full space-y-6">
          
          {/* Main CONTENT AREA */}
          <div className="space-y-6">
            
            {/* HER0 / BANNER SECTION */}
            <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 relative">
               {/* Textured Banner */}
               <div className="h-44 md:h-56 bg-[#1a1a1a] relative overflow-hidden">
                  <div className="absolute inset-0 opacity-20" style={{ 
                    backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)',
                    backgroundSize: '30px 30px'
                  }}></div>
                  <div className="absolute inset-x-0 bottom-0 top-0 flex items-center justify-center pointer-events-none">
                     <h1 className="text-white text-4xl md:text-6xl font-black italic tracking-tighter opacity-10 select-none">
                        {identity.full_name || 'TECH ASSASSIN'}
                     </h1>
                  </div>
                  <button className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full backdrop-blur-md text-white border border-white/20 transition-all">
                    <Edit3 className="w-4 h-4" />
                  </button>
               </div>

               {/* Avatar & Basic Info Details */}
               <div className="px-8 pb-8 relative">
                  {/* Avatar (Overlapping) */}
                  <div className="relative inline-block -mt-16 mb-4 group">
                    <div className="p-1 bgColor-white rounded-full bg-white shadow-xl">
                      <Avatar className="h-32 w-32 md:h-40 md:w-40 border-4 border-white">
                        <AvatarImage src={identity.avatar_url} className="object-cover" />
                        <AvatarFallback className="bg-gray-100 text-3xl font-black text-gray-300">
                          {identity.username?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    <button 
                      onClick={handleAvatarClick}
                      disabled={isUploading}
                      className="absolute bottom-2 right-2 p-2 bg-white rounded-full shadow-lg border border-gray-100 text-red-600 hover:scale-110 transition-transform"
                    >
                      {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                    </button>
                    <input type="file" ref={fileInputRef} onChange={handleAvatarChange} className="hidden" accept="image/*" />
                  </div>

                  {/* Top Bar Actions */}
                  <div className="absolute top-4 right-8">
                     <Button variant="outline" className="rounded-lg h-9 text-xs font-bold uppercase tracking-wider bg-black text-white hover:bg-black/90">
                        <Terminal className="w-4 h-4 mr-2" /> Public View
                     </Button>
                  </div>

                  {/* Name and Meta */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-2">
                     <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <h2 className="text-2xl font-black text-gray-900 uppercase italic tracking-tight">{identity.full_name}</h2>
                          <button className="text-gray-400 hover:text-red-600 transition-all"><Edit3 className="w-3.5 h-3.5" /></button>
                        </div>
                        
                        <div className="space-y-2 text-[12px] font-bold text-gray-500 uppercase tracking-wide">
                           <div className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5 text-red-600" /> {identity.address || 'Location Not Set'}</div>
                           <div className="flex items-center gap-2 text-red-600">@{identity.username} <Edit3 className="w-3.5 h-3.5 text-gray-300" /></div>
                           <div className="flex items-start gap-2 italic normal-case font-medium text-gray-400">
                             {identity.education || 'No Academic Profile Transmitted'}
                           </div>
                        </div>

                        <div className="pt-2 space-y-2">
                           <div className="flex items-center gap-2 text-[11px] font-bold text-blue-600 hover:underline cursor-pointer">
                              <Mail className="w-3.5 h-3.5 text-gray-400" /> {identity.email}
                              <button><Edit3 className="w-3.5 h-3.5 text-gray-300" /></button>
                           </div>
                           <div className="flex items-center gap-4 text-[11px] font-black text-gray-800">
                              <div className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-gray-400" /> {identity.phone || '91XXXXXXXX'}</div>
                              <div className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-gray-400" /> {identity.phone || '91XXXXXXXX'}</div>
                           </div>
                        </div>
                     </div>

                     {/* Right side of top area - Skills, Interests etc */}
                     <div className="space-y-6">
                        <div className="space-y-2">
                           <div className="flex items-center justify-between">
                              <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Skills</span>
                              <button className="text-gray-400 hover:text-red-600 transition-all"><Edit3 className="w-3.5 h-3.5" /></button>
                           </div>
                           <div className="flex flex-wrap gap-2">
                              {identity.skills?.length > 0 ? identity.skills.map((s: string) => (
                                <Badge key={s} variant="secondary" className="bg-gray-800 text-white rounded-md text-[10px] font-bold uppercase tracking-widest px-3 py-1 border-none hover:bg-red-600">
                                  {s}
                                </Badge>
                              )) : <span className="text-[10px] text-gray-300">No skills identified.</span>}
                              {identity.skills?.length > 4 && <span className="text-[10px] font-bold text-blue-600 cursor-pointer">+4 More</span>}
                           </div>
                        </div>

                        <div className="space-y-2">
                           <div className="flex items-center justify-between">
                              <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Interests</span>
                              <button className="text-gray-400 hover:text-red-600 transition-all"><Edit3 className="w-3.5 h-3.5" /></button>
                           </div>
                           <div className="flex flex-wrap gap-2">
                              <Badge variant="outline" className="border-gray-200 text-gray-600 rounded-md text-[10px] uppercase font-bold px-3 py-1">Cybersecurity</Badge>
                              <Badge variant="secondary" className="bg-gray-800 text-white rounded-md text-[10px] font-bold px-3 py-1">C</Badge>
                              <Badge variant="secondary" className="bg-gray-800 text-white rounded-md text-[10px] font-bold px-3 py-1">C++</Badge>
                              <span className="text-[10px] font-bold text-blue-600 cursor-pointer">+3 More</span>
                           </div>
                        </div>

                        <div className="space-y-2">
                           <div className="flex items-center justify-between">
                              <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Social Handles</span>
                              <button className="text-gray-400 hover:text-red-600 transition-all"><Edit3 className="w-3.5 h-3.5" /></button>
                           </div>
                           <div className="flex items-center gap-3">
                              <a href={identity.linkedin_url} className="text-blue-600 hover:scale-110 transition-transform"><Linkedin className="w-5 h-5 fill-current" /></a>
                              <a href={identity.github_url} className="text-gray-900 hover:scale-110 transition-transform"><Github className="w-5 h-5" /></a>
                              <div className="w-5 h-5 bg-orange-500 rounded flex items-center justify-center text-white text-[10px] font-bold cursor-pointer hover:scale-110 transition-transform">L</div>
                              <div className="w-5 h-5 bg-pink-500 rounded flex items-center justify-center text-white cursor-pointer hover:scale-110 transition-transform"><Instagram className="w-3.5 h-3.5" /></div>
                           </div>
                        </div>
                     </div>
                  </div>
               </div>
            </div>

            {/* CONTENT SECTIONS */}
            <div className="grid grid-cols-1 gap-6">
               
               {/* About Section */}
               <Section title="About" onEdit={() => {}}>
                  <p className="text-xs text-gray-400">
                    {identity.bio || 'No Operative Personnel Description Loaded...'}
                  </p>
               </Section>

               {/* Initiatives */}
               <Section title="Initiatives" onAdd={() => {}}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <InitiativeCard 
                        title="AMD Slingshot" 
                        org="AMD" 
                        image="https://tech-assassin.vercel.app/favicon.ico" 
                     />
                     <InitiativeCard 
                        title="Gen AI Academy APAC..." 
                        org="Google Cloud" 
                        image="https://upload.wikimedia.org/wikipedia/commons/5/53/Google_Logos_Search.png" 
                     />
                  </div>
               </Section>

                {/* Education Section */}
                <Section title="Education" onAdd={() => {}}>
                  <Card className="border-gray-100 shadow-none bg-white p-4">
                     <div className="flex gap-4">
                        <div className="w-12 h-12 bg-gray-50 rounded-lg flex items-center justify-center shrink-0 border border-gray-100">
                           <GraduationCap className="h-6 w-6 text-blue-500" />
                        </div>
                        <div className="flex-1 space-y-1">
                           <div className="flex justify-between items-start">
                              <h4 className="text-xs font-bold text-gray-600 uppercase tracking-tight">{identity.university || 'GIDC DEGREE ENGINEERING COLLEGE, NAVSARI'}</h4>
                              <button className="text-gray-400 hover:text-red-600 transition-all"><Edit3 className="w-3.5 h-3.5" /></button>
                           </div>
                           <p className="text-[11px] font-black text-gray-900 uppercase italic leading-tight">Bachelor Of Engineering (B.E)</p>
                           <div className="flex items-center gap-2 pt-1">
                              <Badge className="bg-blue-500 text-white border-none rounded-md text-[9px] font-bold uppercase py-0.5">Computer Engineering</Badge>
                           </div>
                           <div className="flex justify-between items-center text-[10px] pt-3 text-gray-400 font-bold">
                              <div className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> - End: January 4, 2024</div>
                              <div>Grade: -</div>
                           </div>
                        </div>
                     </div>
                  </Card>
               </Section>

               {/* Projects Section */}
               <Section title="Projects" onAdd={() => {}}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <ProjectCard 
                        title="Tech Assassins" 
                        date="July 25, 2024 - Present" 
                        authors={["ARYAN"]} 
                        description="We are the TechAssassins : The hunt for bugs sharpens our blades. Dismantling tech, mastering code, and weaponizing creativity in the digital hunt."
                     />
                     <ProjectCard 
                        title="My Portfolio" 
                        date="January 23, 2024 - Present" 
                        authors={[]}
                        description="I am Aryan Sondharva, a passionate first-year developer with a strong focus on web application development. I am a quick learner with a self-learning attitude..."
                     />
                  </div>
               </Section>

                {/* Other Empty Sections to match UI */}
                <Section title="Experience" onAdd={() => {}} isEmpty={true} />
                <Section title="Licenses & Certificates" onAdd={() => {}} isEmpty={true} />
                <Section title="Honors & Awards" onAdd={() => {}} isEmpty={true} />

                {/* Settings Section */}
                <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 flex items-center justify-between">
                   <div>
                      <h3 className="text-sm font-black text-gray-900 uppercase italic tracking-wider">Settings</h3>
                      <p className="text-[10px] text-gray-400 mt-1 font-bold">Control your privacy, manage notifications, and more — all from one place.</p>
                   </div>
                   <Link to="/settings">
                      <Button variant="outline" className="rounded-lg h-9 bg-black text-white px-8 font-black uppercase text-[10px] tracking-widest hover:bg-black/80 transition-all">Settings</Button>
                   </Link>
                </div>

            </div>

          </div>
        </div>
      </main>

      {/* FOOTER - Hack2Skill Style */}
      <footer className="bg-[#1a1c31] text-white py-16">
         <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-12">
            
            {/* Brand Section */}
            <div className="space-y-6 col-span-1 md:col-span-1">
               <h2 className="text-3xl font-extrabold italic uppercase tracking-tighter">H2S</h2>
               <p className="text-gray-400 text-xs leading-relaxed font-medium">
                 Equip your company with the most comprehensive innovation management platform, supported by human intelligence.
               </p>
               <div className="flex flex-wrap gap-3">
                  {[Twitter, Instagram, Linkedin, Globe, MessageCircle, Briefcase, Layout].map((Icon, idx) => (
                    <div key={idx} className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/20 transition-all cursor-pointer">
                      <Icon className="w-4 h-4 text-white/70" />
                    </div>
                  ))}
               </div>
               <div className="flex flex-wrap gap-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  <Link to="#" className="hover:text-white transition-colors">Our Blogs</Link>
                  <Link to="#" className="hover:text-white transition-colors">Privacy Policy</Link>
                  <Link to="#" className="hover:text-white transition-colors">Terms of Service</Link>
                  <Link to="#" className="hover:text-white transition-colors">Cookie Policy</Link>
               </div>
               <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Cookie Settings</p>
            </div>

            {/* Contact Information */}
            <div className="space-y-8">
               <div className="space-y-4">
                  <h4 className="text-sm font-black uppercase tracking-widest text-white">Contact with us:</h4>
                  <div className="space-y-4 text-xs font-medium text-gray-400">
                     <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-white/50 mb-1">For Business Inquiry:</p>
                        <div className="flex items-center gap-2"><Mail className="w-3.5 h-3.5" /> info@hack2skill.com</div>
                     </div>
                     <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-white/50 mb-1">For Support & Queries:</p>
                        <div className="flex items-center gap-2"><Mail className="w-3.5 h-3.5" /> support@hack2skill.com</div>
                     </div>
                     <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-white/50 mb-1">Call:</p>
                        <div className="flex items-center gap-2"><Phone className="w-3.5 h-3.5" /> +91 9570330650</div>
                     </div>
                  </div>
               </div>
            </div>

            {/* Corporate Address */}
            <div className="space-y-8 md:col-span-2">
               <h4 className="text-sm font-black uppercase tracking-widest text-white">Corporate Address:</h4>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-[11px] font-medium text-gray-400 leading-relaxed">
                  <div className="space-y-1">
                     <p className="font-black text-white/70">India:</p>
                     <p>Delhi NCR:</p>
                     <p>A-14, 4th Floor, Eco Tower, Sector 125, Noida, Uttar Pradesh 201301</p>
                  </div>
                  <div className="space-y-1">
                     <p className="font-black text-white/70">Bengaluru:</p>
                     <p>WeWork Galaxy, 43, Residency Rd, Shantala Nagar, Ashok Nagar, Bengaluru, Karnataka 560025</p>
                  </div>
                  <div className="space-y-1">
                     <p className="font-black text-white/70">USA:</p>
                     <p>Michigan:</p>
                     <p>2025, Long Lake, Troy, Michigan - 48098 - Zip Code: (313)</p>
                  </div>
                  <div className="flex gap-4 pt-4">
                    <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center">ISO</div>
                    <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center">GDPR</div>
                  </div>
               </div>
            </div>

         </div>
         <div className="max-w-7xl mx-auto px-4 mt-16 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
            <p>2024 © All rights reserved by Hack2Skill</p>
            <div className="flex gap-4">
               {/* Badges/Certifications */}
               <div className="h-10 w-24 bg-white/5 rounded-md flex items-center justify-center opacity-30 grayscale">ISO CERT</div>
               <div className="h-10 w-24 bg-white/5 rounded-md flex items-center justify-center opacity-30 grayscale">GDPR READY</div>
            </div>
         </div>
      </footer>

    </div>
  );
}

// --- SUB-COMPONENTS ---

function Section({ title, onAdd, onEdit, children, isEmpty }: any) {
   return (
      <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 space-y-4">
         <div className="flex items-center justify-between border-b border-gray-50 pb-3 mb-2">
            <h3 className="text-sm font-black text-gray-900 uppercase italic tracking-wider">{title}</h3>
            {onAdd && (
               <Button variant="outline" className="h-7 px-3 rounded-md border-gray-200 text-gray-600 font-bold text-[9px] uppercase hover:bg-gray-50" onClick={onAdd}>
                  <Plus className="w-3 h-3 mr-1" /> Add
               </Button>
            )}
            {onEdit && (
               <button onClick={onEdit} className="text-gray-400 hover:text-red-600 transition-all"><Edit3 className="w-4 h-4" /></button>
            )}
         </div>
         {isEmpty ? (
            <div className="py-2">
               <p className="text-[10px] text-gray-300 font-bold uppercase italic italic tracking-widest">Nothing to see here... yet!</p>
            </div>
         ) : children}
      </div>
   );
}

function InitiativeCard({ title, org, image }: any) {
   return (
      <div className="flex items-center gap-4 p-4 bg-[#fafafa] rounded-xl border border-gray-100 hover:border-red-500/20 transition-all group">
         <div className="w-12 h-12 rounded-lg bg-white p-2 shadow-sm border border-gray-100 shrink-0 overflow-hidden">
            <img src={image} alt={org} className="w-full h-full object-contain" />
         </div>
         <div className="flex-1 min-w-0">
            <h4 className="text-[11px] font-black text-gray-900 uppercase italic tracking-tight truncate group-hover:text-red-600 transition-colors">{title}</h4>
            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Organized by: <span className="text-gray-600 font-black">{org}</span></p>
         </div>
      </div>
   );
}

function ProjectCard({ title, date, authors, description }: any) {
   return (
      <Card className="border-gray-100 shadow-none bg-[#fafafa] hover:bg-white hover:shadow-md transition-all group p-5 border-l-4 border-l-red-600">
         <div className="flex justify-between items-start mb-2">
            <div>
               <div className="flex items-center gap-2">
                  <h4 className="text-[11px] font-black text-gray-900 uppercase italic tracking-tight">{title}</h4>
                  <span className="text-[8px] font-bold text-blue-600 uppercase tracking-widest">Project</span>
               </div>
               <div className="flex items-center gap-1 text-[9px] text-gray-400 font-bold mt-1">
                  <Calendar className="w-3 h-3" /> {date} <Globe className="w-3 h-3 ml-1" />
               </div>
            </div>
            <button className="text-gray-300 group-hover:text-red-600 transition-all"><Edit3 className="w-3.5 h-3.5" /></button>
         </div>
         
         {authors.length > 0 && (
            <div className="flex items-center gap-2 mb-3">
               <div className="flex -space-x-2">
                  <div className="w-6 h-6 rounded-full border-2 border-white bg-gray-200"></div>
                  <div className="w-6 h-6 rounded-full border-2 border-white bg-gray-300"></div>
               </div>
               <span className="text-[9px] font-bold text-gray-400">{authors.length} (Contributors)</span>
            </div>
         )}
         
         <p className="text-[10px] text-gray-500 leading-relaxed line-clamp-3 font-medium">
            {description}
         </p>
      </Card>
   );
}

function Facebook() { return <Shield /> } // Dummy icon placeholders for mapping

