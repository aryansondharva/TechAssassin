import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { authService, profileService, murfService } from "@/services";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "@/hooks/use-toast";
import { 
  Github, 
  Linkedin, 
  MapPin, 
  Calendar, 
  ExternalLink,
  Mail,
  Phone,
  GraduationCap,
  Award,
  Zap,
  Trophy,
  Globe,
  Camera,
  Loader2,
  UserCog,
  Plus,
  ChevronRight,
  Trash2,
  Edit2,
  Settings2,
  ShieldAlert,
  X,
  Target,
  Check
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from '@/components/ui/card';
import { Button } from "@/components/ui/button";
import Footer from "@/components/Footer";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

export default function Profile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  
  const { username } = useParams<{ username: string }>();
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
        toast({ title: "Not Found", description: "Profile not found.", variant: "destructive" });
        navigate('/community');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleAvatarClick = () => fileInputRef.current?.click();
  const handleBannerClick = () => bannerInputRef.current?.click();

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
       const response = await profileService.uploadAvatar(file);
       setProfile((prev: any) => ({ ...prev, avatar_url: response.avatar_url }));
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
    setIsUploadingBanner(true);
    try {
       const response = await profileService.uploadBanner(file);
       setProfile((prev: any) => ({ ...prev, banner_url: response.banner_url }));
       toast({ title: "Success", description: "Banner updated!" });
    } catch (error) {
       toast({ title: "Error", description: "Update failed", variant: "destructive" });
    } finally {
       setIsUploadingBanner(false);
    }
  };

  const openProjectModal = (project: any = null) => {
    setSelectedProject(project);
    setIsProjectModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="h-10 w-10 animate-spin text-gray-400" />
      </div>
    );
  }

  const identity = profile || {};

  return (
    <div className="min-h-screen bg-white selection:bg-red-100 selection:text-red-900">
      <Navbar />
      
      <main className="max-w-6xl mx-auto px-4 pt-24 pb-20">
        {/* Header Section (Banner + Avatar) */}
        <div className="relative mb-24">
          {/* Banner */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative h-64 md:h-80 w-full rounded-[2.5rem] overflow-hidden group shadow-2xl shadow-gray-200"
          >
            {identity.banner_url ? (
              <img src={identity.banner_url} className="w-full h-full object-cover" alt="Banner" />
            ) : (
              <div className="w-full h-full bg-[#0a0a0a] flex items-center justify-center relative">
                 <div className="absolute inset-0 opacity-20" style={{ 
                   backgroundImage: 'radial-gradient(circle at 2px 2px, #ffffff 1px, transparent 0)',
                   backgroundSize: '32px 32px' 
                 }}></div>
                 <motion.h1 
                   initial={{ opacity: 0, y: 20 }}
                   animate={{ opacity: 0.05, y: 0 }}
                   className="text-white text-6xl md:text-9xl font-black italic select-none"
                 >
                   {identity.full_name || 'TECH ASSASSIN'}
                 </motion.h1>
              </div>
            )}
            
            {isOwnProfile && (
              <button 
                onClick={handleBannerClick}
                className="absolute top-6 right-6 p-3 bg-black/20 hover:bg-black/40 rounded-full backdrop-blur-xl text-white border border-white/10 transition-all opacity-0 group-hover:opacity-100 z-10"
              >
                <Camera className="w-5 h-5" />
              </button>
            )}
          </motion.div>

          {/* Avatar & Edit Actions (Outside overflow-hidden banner) */}
          <div className="absolute -bottom-16 left-8 md:left-12 flex items-end gap-6 z-20">
            <div className="relative group">
              <Avatar className="h-40 w-40 md:h-52 md:w-52 border-[8px] border-white shadow-2xl">
                <AvatarImage src={identity.avatar_url} className="object-cover" />
                <AvatarFallback className="bg-gray-100 text-4xl font-bold text-gray-400">
                  {identity.username?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {isOwnProfile && (
                <button 
                  onClick={handleAvatarClick}
                  disabled={isUploading}
                  className="absolute bottom-2 right-2 p-3 bg-red-600 text-white rounded-full shadow-lg border-4 border-white hover:scale-110 transition-all z-20"
                >
                  {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                </button>
              )}
            </div>
          </div>
          
          {isOwnProfile && (
            <div className="absolute bottom-8 right-8 z-20">
              <Link to="/edit-profile">
                <Button className="rounded-xl h-10 px-5 bg-red-600 hover:bg-black text-white font-bold uppercase text-[8px] tracking-[0.25em] shadow-xl shadow-red-500/20 transition-all active:scale-95 border-none">
                  <UserCog className="w-3.5 h-3.5 mr-2" /> Update Identity
                </Button>
              </Link>
            </div>
          )}
        </div>

        <input type="file" ref={fileInputRef} onChange={handleAvatarChange} className="hidden" accept="image/*" />
        <input type="file" ref={bannerInputRef} onChange={handleBannerChange} className="hidden" accept="image/*" />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
          {/* Sidebar */}
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="lg:col-span-1 space-y-12"
          >
            <motion.div variants={itemVariants} className="space-y-4">
              <h2 className="text-5xl font-black text-gray-900 tracking-tighter italic uppercase">{identity.full_name || identity.username}</h2>
              <div className="flex items-center gap-3">
                <p className="text-xl text-red-600 font-black lowercase">@{identity.username}</p>
                {identity.is_admin && <Badge className="bg-gray-900 text-white rounded-md text-[10px] font-black uppercase tracking-widest px-2 py-0.5">Admin</Badge>}
              </div>
              
              <div className="flex flex-wrap gap-4 pt-6">
                {[
                  { icon: Linkedin, url: identity.linkedin_url, color: 'hover:text-[#0077B5]' },
                  { icon: Github, url: identity.github_url, color: 'hover:text-black' },
                  { icon: Globe, url: identity.portfolio_url, color: 'hover:text-red-600' }
                ].map((social, i) => social.url && (
                  <a key={i} href={social.url} target="_blank" rel="noreferrer" className={`text-gray-300 ${social.color} transition-all transform hover:scale-125`}>
                    <social.icon className="w-6 h-6" />
                  </a>
                ))}
              </div>
            </motion.div>

            {/* Stats Bar */}
            <motion.div variants={itemVariants} className="grid grid-cols-3 bg-gray-50/50 rounded-3xl p-6 border border-gray-100 backdrop-blur-sm">
                <StatItem label="XP" value={identity.total_xp || 0} icon={Zap} color="text-yellow-500" />
                <StatItem label="Streak" value={identity.current_streak || 0} icon={Award} color="text-red-500" />
                <StatItem label="Rank" value={identity.current_rank_id ? "Elite" : "New"} icon={Trophy} color="text-blue-500" />
            </motion.div>

            <motion.div variants={itemVariants} className="space-y-6">
              <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.3em]">Story</h3>
              <p className="text-lg text-gray-600 leading-relaxed font-bold italic border-l-4 border-red-50 pl-6 py-2">
                "{identity.bio || 'Architecting the digital afterlife...'}"
              </p>
            </motion.div>

            <motion.div variants={itemVariants} className="space-y-6">
              <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.3em]">Credentials</h3>
              <div className="space-y-6">
                {identity.university && (
                  <div className="flex items-start gap-4 p-4 bg-white rounded-2xl border border-gray-50 shadow-sm">
                    <div className="p-3 bg-blue-50 rounded-xl text-blue-600"><GraduationCap className="w-6 h-6" /></div>
                    <div>
                      <p className="text-sm font-black text-gray-900 uppercase italic leading-none mb-1">{identity.university}</p>
                      <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">{identity.education}</p>
                      <div className="mt-2 text-[10px] font-black text-red-500">Class of {identity.graduation_year}</div>
                    </div>
                  </div>
                )}
                <div className="space-y-3 px-1">
                  <ContactInfo icon={MapPin} value={identity.address} isPublic={identity.is_address_public || isOwnProfile} fallback="Global Nomad" className="uppercase" />
                  <ContactInfo icon={Mail} value={identity.email} isPublic={identity.is_email_public || isOwnProfile} fallback="Private Network" className="lowercase" />
                </div>
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="space-y-4">
              <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.3em]">Mastered Skills</h3>
              <div className="flex flex-wrap gap-2">
                {(identity.skills || []).map((s: string) => (
                  <Badge key={s} variant="secondary" className="bg-gray-900 text-white border-none px-4 py-2 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-red-600 transition-colors cursor-default shadow-sm shadow-gray-200">
                    {s}
                  </Badge>
                ))}
              </div>
            </motion.div>
          </motion.div>

          {/* Main Content */}
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="lg:col-span-2 space-y-16"
          >
            <ProfileSection title="Projects" onAdd={isOwnProfile ? () => openProjectModal() : undefined}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <ProjectCard 
                  title="Tech Assasins" 
                  dateRange="February 6, 2026 • Present" 
                  description="We are the TechAssasins : The hunt for bugs sharpens our blades . Dismantling tech, mastering code, and weaponizing creativity in the digital hunt."
                  github="https://github.com"
                  url="https://tech-assassin.vercel.app"
                  contributors={[{ name: 'Aryan', avatar: identity.avatar_url }]}
                  isOwnProfile={isOwnProfile}
                  onEdit={() => openProjectModal({ title: 'Tech Assasins', description: 'We are the TechAssasins : The hunt for bugs sharpens our blades . Dismantling tech, mastering code, and weaponizing creativity in the digital hunt.', url: 'https://tech-assassin.vercel.app' })}
                />
                <ProjectCard 
                  title="My Portfolio" 
                  dateRange="January 23, 2026 • Present" 
                  description="I am Aryan Sondharva, a passionate first-year developer with a strong focus on web application development. I am a quick learner with a self-learning attitude, passionate about problem-solving and exploring new technologies."
                  github="https://github.com"
                  url="#"
                  contributors={[]}
                  isOwnProfile={isOwnProfile}
                  onEdit={() => openProjectModal()}
                />
              </div>
            </ProfileSection>

            <ProfileSection title="Active Missions" onAdd={isOwnProfile ? () => navigate('/events') : undefined}>
              <div className="p-12 bg-gray-50 rounded-[2.5rem] border border-gray-100 flex flex-col items-center justify-center text-center space-y-6">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-100 text-red-600">
                  <ShieldAlert className="w-8 h-8 opacity-50" />
                </div>
                <div className="space-y-2">
                  <h4 className="text-xl font-black text-gray-900 uppercase italic tracking-tighter">Under Calibration</h4>
                  <p className="text-sm text-gray-400 font-bold uppercase tracking-wider max-w-xs">System maintenance in progress. Active mission logs are currently zero.</p>
                </div>
              </div>
            </ProfileSection>

            {isOwnProfile && (
              <motion.div variants={itemVariants} className="p-10 bg-[#0a0a0a] rounded-[2.5rem] flex flex-col md:flex-row items-center justify-between gap-8 group hover:shadow-2xl hover:shadow-red-500/10 transition-all border border-white/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-red-600/5 blur-[100px] -mr-32 -mt-32"></div>
                <div className="text-center md:text-left relative z-10">
                  <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">Tactical Grid</h3>
                  <p className="text-sm text-gray-500 font-bold uppercase tracking-widest mt-2">Manage your global privacy and network visibility</p>
                </div>
                <Link to="/edit-profile" className="relative z-10">
                  <Button className="rounded-2xl h-14 bg-white text-black px-12 font-black uppercase text-xs tracking-[0.3em] hover:bg-gray-100 group transition-all">
                    System Configuration <ChevronRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </motion.div>
            )}
          </motion.div>
        </div>
      </main>
      <Footer />

      <AnimatePresence>
        {isProjectModalOpen && (
          <ProjectModal 
            project={selectedProject} 
            onClose={() => setIsProjectModalOpen(false)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function ProfileSection({ title, onAdd, children }: any) {
  return (
    <motion.div variants={itemVariants} className="space-y-8">
      <div className="flex items-center justify-between border-b-2 border-gray-50 pb-6">
        <h3 className="text-3xl font-black text-gray-900 uppercase italic tracking-tighter">
          {title}
        </h3>
        {onAdd && (
          <Button variant="outline" onClick={onAdd} className="bg-white border-black border-2 rounded-xl text-black font-black uppercase text-[10px] tracking-widest hover:bg-black hover:text-white transition-all px-4 h-10 flex items-center gap-2">
            <Plus className="w-4 h-4 stroke-[3]" /> Add
          </Button>
        )}
      </div>
      {children}
    </motion.div>
  );
}

function ProjectCard({ title, dateRange, description, github, url, isOwnProfile, contributors = [], onEdit }: any) {
  return (
    <Card className="border border-gray-100 shadow-sm bg-white hover:shadow-xl transition-all group p-8 rounded-[2rem] relative overflow-hidden h-full flex flex-col">
      <div className="space-y-6 flex-1">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h4 className="text-xl font-black text-gray-900 uppercase italic tracking-tighter">{title}</h4>
              <a href={url} target="_blank" rel="noreferrer" className="text-blue-500 text-[10px] font-bold underline decoration-2 underline-offset-4 hover:text-red-600 transition-colors uppercase">Project</a>
            </div>
            <div className="flex items-center gap-2 text-gray-400 font-bold">
              <Calendar className="w-3.5 h-3.5" />
              <span className="text-[10px] tracking-tight">Start: {dateRange}</span>
            </div>
          </div>
          {isOwnProfile && (
            <button onClick={onEdit} className="p-2 text-gray-400 hover:text-black hover:bg-gray-50 rounded-lg transition-all">
              <Edit2 className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-3 py-1">
            {contributors.length > 0 ? (
              <>
                <div className="flex -space-x-3">
                  {contributors.map((c: any, i: number) => (
                    <Avatar key={i} className="h-9 w-9 border-4 border-white shadow-sm">
                      <AvatarImage src={c.avatar} className="object-cover" />
                      <AvatarFallback className="bg-gray-100 text-[9px] font-black">{c.name[0]}</AvatarFallback>
                    </Avatar>
                  ))}
                </div>
                <span className="text-gray-400 text-[11px] italic font-bold tracking-tight">{contributors.length} contributors</span>
              </>
            ) : (
              <span className="text-gray-300 text-[11px] font-bold lowercase tracking-tight">No Contributors</span>
            )}
        </div>

        <div className="h-px bg-gray-50 w-full opacity-50"></div>
        
        <p className="text-gray-400 font-bold leading-relaxed text-[13px] line-clamp-4">
          {description}
        </p>
      </div>
    </Card>
  );
}

function ProjectModal({ project, onClose }: any) {
  const [formData, setFormData] = useState({
    title: project?.title || '',
    description: project?.description || '',
    link: project?.url || '',
    startDate: '2026-02-06',
    endDate: '',
    isCurrent: true,
    contributorEmail: ''
  });

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
    >
      <motion.div 
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        className="bg-white rounded-[2.5rem] w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="px-10 py-8 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
          <h2 className="text-2xl font-black text-gray-900 uppercase italic tracking-tighter">{project ? 'Edit Project' : 'New Project'}</h2>
          <button onClick={onClose} className="p-2 bg-gray-50 rounded-full text-gray-400 hover:text-black transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-10 space-y-8 overflow-y-auto flex-1 custom-scrollbar">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1">
              Project Title <span className="text-red-500">*</span> <ShieldAlert className="w-3 h-3 opacity-30" />
            </label>
            <input 
              className="w-full px-6 py-4 bg-gray-50/50 border border-gray-100 rounded-2xl font-bold text-gray-900 focus:outline-none focus:border-red-600/20 focus:bg-white transition-all"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              placeholder="System Identity..."
            />
            <p className="text-right text-[9px] font-bold text-gray-300">13/256</p>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1">
              Description <span className="text-red-500">*</span> <ShieldAlert className="w-3 h-3 opacity-30" />
            </label>
            <textarea 
              rows={4}
              className="w-full px-6 py-4 bg-gray-50/50 border border-gray-100 rounded-2xl font-bold text-gray-900 focus:outline-none focus:border-red-600/20 focus:bg-white transition-all lg:resize-none"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="Dismantling tech stacks..."
            />
            <p className="text-right text-[9px] font-bold text-gray-300">147/1024</p>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1">Link</label>
            <input 
              className="w-full px-6 py-4 bg-gray-50/50 border border-gray-100 rounded-2xl font-bold text-gray-900 focus:outline-none focus:border-red-600/20 focus:bg-white transition-all"
              value={formData.link}
              onChange={(e) => setFormData({...formData, link: e.target.value})}
              placeholder="https://..."
            />
            <p className="text-right text-[9px] font-bold text-gray-300">34/256</p>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Start Date</label>
              <input 
                type="date"
                className="w-full px-6 py-4 bg-gray-50/50 border border-gray-100 rounded-2xl font-bold text-gray-900" 
                value={formData.startDate}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">End Date</label>
              <input 
                type="date"
                className="w-full px-6 py-4 bg-gray-50/50 border border-gray-100 rounded-2xl font-bold text-gray-900 disabled:opacity-30" 
                disabled={formData.isCurrent}
              />
            </div>
          </div>

          <div className="flex items-center gap-3 p-1">
            <div 
               onClick={() => setFormData({...formData, isCurrent: !formData.isCurrent})}
               className={`w-5 h-5 transition-all rounded-md flex items-center justify-center cursor-pointer ${formData.isCurrent ? 'bg-red-600' : 'bg-gray-100 border border-gray-200'}`}
            >
              {formData.isCurrent && <Check className="w-3.5 h-3.5 text-white" strokeWidth={4} />}
            </div>
            <span className="text-[10px] font-black text-gray-600 uppercase tracking-tight">Currently working on this project</span>
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Add Contributors</label>
            <input 
              className="w-full px-6 py-4 bg-gray-50/50 border border-gray-100 rounded-2xl font-bold text-gray-900"
              placeholder="Enter operator email..."
            />
            <div className="flex flex-wrap gap-2">
               <Badge className="bg-blue-50 text-blue-600 border-none px-4 py-2 rounded-full font-black text-[9px] uppercase tracking-widest flex items-center gap-2">
                 manthansingh2601@gmail.com <X className="w-3 h-3 cursor-pointer" />
               </Badge>
            </div>
            <p className="text-right text-[9px] font-bold text-gray-300">1/256</p>
          </div>

          {project && (
            <div className="p-8 bg-red-50/30 rounded-3xl border border-red-100 flex items-center justify-between mt-8">
              <div className="space-y-1">
                <h4 className="text-[11px] font-black text-red-600 uppercase tracking-widest">Delete Project</h4>
                <p className="text-[10px] text-red-900/40 font-bold italic">Irreversible operation. Critical data loss potential.</p>
              </div>
              <Button variant="outline" className="rounded-xl border-red-600 text-red-600 font-black uppercase text-[9px] px-6 hover:bg-red-600 hover:text-white transition-all">
                Terminate Project
              </Button>
            </div>
          )}
        </div>

        <div className="p-10 bg-gray-50/50 border-t border-gray-100 flex items-center justify-end gap-4 sticky bottom-0 z-10">
          <Button onClick={onClose} variant="ghost" className="rounded-xl px-8 font-black uppercase text-[10px] tracking-widest text-gray-400">Cancel</Button>
          <Button className="rounded-xl px-12 h-12 bg-blue-600 hover:bg-black text-white font-black uppercase text-[10px] tracking-widest shadow-lg shadow-blue-500/20 shadow-xl transition-all">Save System Profile</Button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function InitiativeCard({ title, org, image }: any) {
  return (
    <div className="flex items-center gap-6 p-6 bg-white rounded-3xl border border-gray-50 shadow-sm hover:shadow-xl hover:border-red-100 transition-all cursor-pointer group">
      <div className="w-16 h-16 rounded-2xl bg-gray-50 p-3 shrink-0 flex items-center justify-center border border-gray-100 group-hover:scale-110 transition-transform">
        <img src={image} alt={org} className="max-w-full max-h-full object-contain" />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-lg font-black text-gray-900 truncate uppercase italic tracking-tighter group-hover:text-red-600 transition-colors">{title}</h4>
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1 italic">{org}</p>
      </div>
      <ExternalLink className="w-5 h-5 text-gray-200 group-hover:text-red-600 transition-colors" />
    </div>
  );
}

function StatItem({ label, value, icon: Icon, color }: any) {
  return (
    <div className="text-center space-y-1">
      <div className={`p-2 ${color} flex flex-col items-center`}>
        <Icon className="w-5 h-5 mb-1 opacity-50" />
        <span className="text-sm font-black text-gray-900">{value}</span>
      </div>
      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none">{label}</p>
    </div>
  );
}

function ContactInfo({ icon: Icon, value, isPublic, fallback, className }: any) {
  return (
    <div className="flex items-center gap-3">
      <Icon className="w-4 h-4 text-gray-300" />
      <span className={`text-[11px] font-black tracking-widest ${isPublic ? 'text-gray-600' : 'text-gray-400 italic'} ${className}`}>
        {isPublic ? (value || fallback) : 'Classified'}
      </span>
    </div>
  );
}
