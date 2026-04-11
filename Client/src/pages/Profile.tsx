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
  Globe,
  Camera,
  Loader2,
  Edit3,
  Mail,
  Phone,
  GraduationCap,
  MessageCircle,
  Twitter,
  ChevronRight,
  Star,
  GitFork,
  BookOpen
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from '@/components/ui/card';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Profile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>({});
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("home");
  const [githubData, setGithubData] = useState<{repos: any[], stars: number, totalRepos: number, followers: number} | null>(null);
  
  const { username } = useParams<{ username: string }>();
  const isOwnProfile = !username;

  useEffect(() => {
    if (isOwnProfile && !authService.isAuthenticated()) {
      navigate('/signin');
      return;
    }
    fetchProfile();
  }, [navigate, username]);

  const fetchGithubData = async (githubUrl: string) => {
    try {
      const getUsername = (url: string) => {
        try {
          const match = url.match(/github\.com\/([^/]+)/);
          if (match) return match[1];
          const parts = url.split('/').filter(Boolean);
          return parts[parts.length - 1].replace('@', '');
        } catch {
          return null;
        }
      };
      
      const username = getUsername(githubUrl);
      if (!username) throw new Error("Invalid Github Username");
      
      const [userRes, reposRes, htmlRes] = await Promise.all([
        fetch(`https://api.github.com/users/${username}`),
        fetch(`https://api.github.com/users/${username}/repos?sort=updated&per_page=100`),
        fetch(`https://api.allorigins.win/raw?url=https://github.com/${username}`)
      ]);
      
      if (!userRes.ok || !reposRes.ok) {
        throw new Error(`Github API Error: ${userRes.statusText}`);
      }
      
      const userData = await userRes.json();
      const allRepos = await reposRes.json();
      let displayRepos = [];
      
      if (htmlRes.ok) {
        const html = await htmlRes.text();
        const pinnedNames = [...html.matchAll(/<span class="repo"[^>]*>([^<]+)<\/span>/g)].map(m => m[1].trim());
        if (pinnedNames.length > 0) {
           displayRepos = allRepos.filter((r: any) => pinnedNames.includes(r.name));
           // Preserve github's custom pinning sort order
           displayRepos.sort((a: any, b: any) => pinnedNames.indexOf(a.name) - pinnedNames.indexOf(b.name));
        }
      }
      
      // Fallback: If no pinned repos (or proxy blocked), show top 6 repos by stars
      if (displayRepos.length === 0) {
         displayRepos = [...allRepos].sort((a: any, b: any) => b.stargazers_count - a.stargazers_count).slice(0, 6);
      }
      
      const stars = allRepos.reduce((acc: number, curr: any) => acc + curr.stargazers_count, 0);
      
      setGithubData({
        repos: displayRepos,
        stars: stars,
        totalRepos: userData.public_repos,
        followers: userData.followers
      });
    } catch (e) {
      console.error("Github scraping failed", e);
      // Fallback empty state so UI stops spinning
      setGithubData({
        repos: [], 
        stars: 0,
        totalRepos: 0,
        followers: 0
      });
    }
  };

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
      
      if (data?.github_url) {
        fetchGithubData(data.github_url);
      }
    } catch (error) {
      console.error("Failed to load profile", error);
      if (!isOwnProfile) {
        toast({ title: "Not Found", description: "Operative dossier not found.", variant: "destructive" });
        navigate('/community');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <Loader2 className="h-10 w-10 animate-spin text-red-600" />
    </div>
  );

  const user = profile || {};

  return (
    <div className="min-h-screen bg-[#F7F9FC] font-sans">
      <Navbar dark={false} />
      
      {/* Devfolio Style Header */}
      <header className="bg-white border-b border-slate-100 pt-32 pb-12">
        <div className="max-w-5xl mx-auto px-6">
          <div className="flex flex-col md:flex-row gap-8 items-start">
            {/* Profile Picture */}
            <div className="relative group shrink-0">
               <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-white shadow-xl overflow-hidden bg-slate-50">
                  <Avatar className="w-full h-full rounded-none">
                    <AvatarImage src={user.avatar_url || ''} className="object-cover" />
                    <AvatarFallback className="bg-slate-100 text-3xl font-bold text-slate-300">
                       {user.username?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
               </div>
               {isOwnProfile && (
                 <button className="absolute bottom-1 right-1 p-2.5 bg-white shadow-lg rounded-full text-slate-400 hover:text-red-600 transition-all border border-slate-100">
                    <Camera className="w-4 h-4" />
                 </button>
               )}
            </div>

            {/* Info Section */}
            <div className="flex-1 space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h1 className="text-3xl font-extrabold text-[#1E293B] tracking-tight uppercase">{user.full_name || user.username}</h1>
                  <p className="text-red-600 font-semibold text-sm mt-1">@{user.username}</p>
                </div>
                {isOwnProfile && (
                  <Link to="/edit-profile">
                    <Button variant="outline" className="rounded-xl border-slate-200 text-slate-600 font-bold px-6 hover:bg-slate-50 hover:text-red-600 hover:border-red-200">
                       Edit Profile
                    </Button>
                  </Link>
                )}
              </div>

              <p className="text-slate-600 text-lg leading-relaxed font-medium italic opacity-80 uppercase tracking-tight">
                {user.bio || "Si vis pacem, para bellum"}
              </p>

              <div className="flex flex-wrap gap-2 pt-2">
                {(user.skills || ["React", "Data Analysis", "Machine Learning", "Data Science"]).map((skill: string) => (
                  <Badge key={skill} variant="secondary" className="bg-white border border-slate-100 text-slate-600 px-4 py-1.5 rounded-lg text-xs font-bold shadow-sm">
                    {skill}
                  </Badge>
                ))}
              </div>

              <div className="flex items-center gap-6 pt-4 text-slate-400">
                <div className="flex items-center gap-2 text-sm font-bold">
                  <MapPin className="w-4 h-4" />
                  <span>{user.address || "Surat, India"}</span>
                </div>
                <div className="flex items-center gap-4">
                  <SocialIcon icon={Github} href={user.github_url} />
                  <SocialIcon icon={Linkedin} href={user.linkedin_url} />
                  <SocialIcon icon={Twitter} />
                </div>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="mt-12">
            <Tabs defaultValue="home" className="w-full" onValueChange={setActiveTab}>
              <TabsList className="bg-transparent border-b border-slate-100 w-full justify-center gap-8 rounded-none h-auto p-0">
                <TabsTrigger value="home" className="data-[state=active]:border-red-600 data-[state=active]:text-red-600 border-b-4 border-transparent rounded-none px-6 py-4 text-xs font-black uppercase tracking-widest text-slate-400 transition-all bg-transparent shadow-none">Home</TabsTrigger>
                <TabsTrigger value="projects" className="data-[state=active]:border-red-600 data-[state=active]:text-red-600 border-b-4 border-transparent rounded-none px-6 py-4 text-xs font-black uppercase tracking-widest text-slate-400 transition-all bg-transparent shadow-none">Projects</TabsTrigger>
                <TabsTrigger value="readme" className="data-[state=active]:border-red-600 data-[state=active]:text-red-600 border-b-4 border-transparent rounded-none px-6 py-4 text-xs font-black uppercase tracking-widest text-slate-400 transition-all bg-transparent shadow-none">README.md</TabsTrigger>
              </TabsList>

              <div className="py-12">
                <TabsContent value="home" className="m-0 focus-visible:ring-0">
                   <div className="space-y-12">
                      {/* GitHub Activity Section */}
                      <Card className="border-none shadow-sm rounded-3xl bg-white overflow-hidden">
                        <div className="p-8">
                          <div className="flex items-center justify-between mb-8">
                             <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Github Activity</h3>
                             <button className="text-slate-300"><ChevronRight className="w-5 h-5" /></button>
                          </div>
                          
                          <div className="flex flex-col md:flex-row items-center gap-12">
                             <div className="text-center md:text-left shrink-0">
                                <p className="text-5xl font-black text-slate-900 tracking-tighter">908</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Contributions in last year</p>
                             </div>
                             
                             <div className="flex-1 w-full overflow-hidden">
                                <img 
                                  src={`https://ghchart.rshah.org/DC2626/${user.github_url?.split('/').pop() || 'aryansondharva'}`} 
                                  className="w-full h-auto opacity-90 rounded-xl"
                                  alt="Github Chart" 
                                />
                             </div>
                          </div>

                          <div className="grid grid-cols-3 gap-8 mt-12 pt-8 border-t border-slate-50">
                             <div className="text-center">
                                <p className="text-2xl font-black text-slate-900">{githubData?.stars ?? '--'}</p>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Stars Earned</p>
                             </div>
                             <div className="text-center">
                                <p className="text-2xl font-black text-slate-900">{githubData?.totalRepos ?? '--'}</p>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Repositories</p>
                             </div>
                             <div className="text-center">
                                <p className="text-2xl font-black text-slate-900">{githubData?.followers ?? '--'}</p>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Followers</p>
                             </div>
                          </div>
                        </div>
                      </Card>

                      {/* Projects Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         {githubData?.repos ? (
                            githubData.repos.length > 0 ? (
                              githubData.repos.map((repo: any) => (
                                 <RepoCard 
                                  key={repo.id}
                                  title={repo.name} 
                                  desc={repo.description || "No description provided"} 
                                  lang={repo.language || "Code"}
                                  stars={repo.stargazers_count}
                                  forks={repo.forks_count}
                                  url={repo.html_url}
                                 />
                              ))
                            ) : (
                               <div className="col-span-1 md:col-span-2 h-48 rounded-[2rem] bg-slate-50 border border-slate-100 flex flex-col items-center justify-center gap-3 text-slate-400">
                                  <Github className="w-8 h-8 opacity-50" />
                                  <span className="text-xs font-bold uppercase tracking-widest">No Projects Found / Rate Limited</span>
                               </div>
                            )
                         ) : (
                            [1,2,3,4].map(i => (
                               <div key={i} className="h-48 rounded-[2rem] bg-slate-50 border border-slate-100 flex items-center justify-center animate-pulse gap-3">
                                  <Loader2 className="w-5 h-5 animate-spin text-slate-300" />
                                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading Repos</span>
                               </div>
                            ))
                         )}
                      </div>
                   </div>
                </TabsContent>
                
                <TabsContent value="projects">
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {/* Project cards could go here */}
                      <RepoCard title="Coming Soon" desc="Strategic initiatives currently in development..." lang="In Progress" stars={0} forks={0} />
                   </div>
                </TabsContent>

                <TabsContent value="readme">
                   <Card className="border-none shadow-sm rounded-3xl bg-white p-10">
                      <article className="prose prose-slate max-w-none">
                         <h2 className="text-slate-900 font-extrabold tracking-tight">Expertise & Vision</h2>
                         <p className="text-slate-600 font-medium leading-relaxed italic">
                           Highly motivated and detail-oriented computer science student with a strong passion for software development and artificial intelligence.
                         </p>
                         <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 list-none p-0 mt-8">
                            <li className="bg-slate-50 p-6 rounded-2xl border border-slate-100 flex items-center gap-4">
                               <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-red-600">
                                  <Code className="w-5 h-5" />
                                </div>
                                <div>
                                   <p className="text-sm font-black text-slate-900 uppercase">Architecture</p>
                                   <p className="text-xs text-slate-500">MERN, Next.js, Python</p>
                                </div>
                            </li>
                            <li className="bg-slate-50 p-6 rounded-2xl border border-slate-100 flex items-center gap-4">
                               <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-red-600">
                                  <Trophy className="w-5 h-5" />
                                </div>
                                <div>
                                   <p className="text-sm font-black text-slate-900 uppercase">Performance</p>
                                   <p className="text-xs text-slate-500">Optimized Deployment</p>
                                </div>
                            </li>
                         </ul>
                      </article>
                   </Card>
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </div>
      </header>

      {/* Simplified Footer */}
      <footer className="bg-white border-t border-slate-100 py-12">
        <div className="max-w-5xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
           <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">© 2026 Tech Assassin • Powered by NSB Classic</p>
           <div className="flex gap-8 text-[11px] font-black uppercase tracking-widest text-slate-400">
              <a href="#" className="hover:text-red-600 transition-colors">About</a>
              <a href="#" className="hover:text-red-600 transition-colors">Contact</a>
              <a href="#" className="hover:text-red-600 transition-colors">Privacy</a>
           </div>
        </div>
      </footer>
    </div>
  );
}

function SocialIcon({ icon: Icon, href }: { icon: any, href?: string }) {
  return (
    <a 
      href={href || "#"} 
      target="_blank" 
      rel="noreferrer" 
      className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-white hover:shadow-md transition-all border border-slate-100/50"
    >
      <Icon className="w-5 h-5" />
    </a>
  );
}

function RepoCard({ title, desc, lang, stars, forks, url }: any) {
  return (
    <a href={url || "#"} target="_blank" rel="noopener noreferrer" className="block outline-none">
      <Card className="border border-slate-100 shadow-none bg-white hover:shadow-xl hover:border-red-600/20 transition-all duration-500 p-8 rounded-[2rem] flex flex-col group h-full">
         <div className="flex-1 space-y-3">
            <h4 className="text-lg font-black text-slate-900 group-hover:text-red-600 transition-colors line-clamp-1">{title}</h4>
            <p className="text-xs text-slate-500 font-medium leading-relaxed line-clamp-2 italic">{desc}</p>
         </div>
         <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-50">
            <div className="flex items-center gap-4">
               <div className="flex items-center gap-1.5">
                  <div 
                     className={`w-2 h-2 rounded-full ${lang === 'TypeScript' ? 'bg-blue-600' : lang === 'JavaScript' ? 'bg-yellow-400' : 'bg-red-600'}`} 
                  />
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{lang}</span>
               </div>
               <div className="flex items-center gap-1.5 text-slate-400">
                  <Star className="w-3 h-3" />
                  <span className="text-[10px] font-bold">{stars}</span>
               </div>
               <div className="flex items-center gap-1.5 text-slate-400">
                  <GitFork className="w-3 h-3" />
                  <span className="text-[10px] font-bold">{forks}</span>
               </div>
            </div>
            <button className="text-slate-300 group-hover:text-slate-600 transition-colors"><ExternalLink className="w-4 h-4" /></button>
         </div>
      </Card>
    </a>
  );
}
