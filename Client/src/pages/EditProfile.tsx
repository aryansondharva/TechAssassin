import { useEffect, useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { profileService, authService } from '@/services';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { 
  Loader2, 
  ArrowLeft, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  GraduationCap,
  Plus,
  X,
  Target,
  Briefcase,
  Globe,
  Github,
  Linkedin,
  Twitter,
  Settings,
  ShieldCheck,
  ChevronRight,
  FileText,
  Clock,
  Shirt,
  Heart,
  Links,
  Trash2,
  AlertCircle
} from 'lucide-react';
import type { Profile } from '@/types/api';
import Navbar from '@/components/Navbar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { motion } from 'framer-motion';

export default function EditProfile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeSection, setActiveSection] = useState('about');

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
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <Loader2 className="h-10 w-10 animate-spin text-[#3770FF]" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F7F9FC]">
      <Navbar dark={false} />
      
      <div className="max-w-6xl mx-auto px-6 pt-32 pb-20">
        <div className="flex flex-col lg:flex-row gap-12 items-start">
          
          {/* Left Sticky Sidebar */}
          <aside className="w-full lg:w-64 lg:sticky lg:top-32 space-y-2">
            <SidebarLink 
              active={activeSection === 'about'} 
              onClick={() => setActiveSection('about')} 
              icon={User} 
              label="About" 
            />
            <SidebarLink 
              active={activeSection === 'education'} 
              onClick={() => setActiveSection('education')} 
              icon={GraduationCap} 
              label="Education" 
            />
            <SidebarLink 
              active={activeSection === 'experience'} 
              onClick={() => setActiveSection('experience')} 
              icon={Briefcase} 
              label="Experience" 
            />
             <SidebarLink 
              active={activeSection === 'links'} 
              onClick={() => setActiveSection('links')} 
              icon={Globe} 
              label="Links" 
            />
            <SidebarLink 
              active={activeSection === 'contact'} 
              onClick={() => setActiveSection('contact')} 
              icon={Phone} 
              label="Contact" 
            />
            
            <div className="pt-8 border-t border-slate-200 mt-8">
               <Link to="/profile" className="flex items-center gap-3 px-6 py-3 text-slate-400 hover:text-slate-600 font-bold uppercase tracking-widest text-[11px] transition-all">
                  <Target className="w-4 h-4" /> My Assassin
               </Link>
            </div>
          </aside>

          {/* Main Form Area */}
          <main className="flex-1 space-y-10">
            
            {/* Dynamic Sections Based on Active Sidebar Selection */}
            {activeSection === 'about' && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                <SectionCard title="Basic Info" subtitle="Just the essentials.">
                  <div className="grid grid-cols-2 gap-6">
                    <Field label="First name" placeholder="E.g. Aryan" />
                    <Field label="Last name" placeholder="E.g. Sondharva" />
                  </div>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-[12px] font-bold text-slate-800 uppercase tracking-widest mb-2 block">I identify as</Label>
                      <Select>
                        <SelectTrigger className="h-14 bg-slate-50 border-none rounded-xl font-medium px-5">
                          <SelectValue placeholder="Choose your preference" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-slate-100 shadow-xl">
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                          <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-[10px] text-slate-400 font-bold uppercase mt-2">Choose prefer not to say if you are not comfortable sharing</p>
                    </div>

                    <div>
                      <Label className="text-[12px] font-bold text-slate-800 uppercase tracking-widest mb-2 block">T-shirt size</Label>
                      <Select>
                        <SelectTrigger className="h-14 bg-slate-50 border-none rounded-xl font-medium px-5">
                          <SelectValue placeholder="Pick a T-shirt size" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-slate-100 shadow-xl">
                          <SelectItem value="s">Small (S)</SelectItem>
                          <SelectItem value="m">Medium (M)</SelectItem>
                          <SelectItem value="l">Large (L)</SelectItem>
                          <SelectItem value="xl">XL</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Field label="City" placeholder="E.g. Surat" />
                  </div>
                </SectionCard>

                <SectionCard title="About You" subtitle="Tell your story.">
                   <div className="space-y-6">
                      <div className="space-y-2">
                        <Label className="text-[12px] font-bold text-slate-800 uppercase tracking-widest block">Bio</Label>
                        <Textarea placeholder="Add a bio." className="min-h-[100px] bg-slate-50 border-none rounded-xl font-medium p-6 resize-none" />
                      </div>
                      
                      <div className="space-y-4">
                        <Label className="text-[12px] font-bold text-slate-800 uppercase tracking-widest block">Readme.md</Label>
                        <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                           <div className="bg-slate-50 px-6 py-3 border-b border-slate-100 flex items-center justify-between">
                              <div className="flex gap-4">
                                 <button className="text-[10px] font-black uppercase text-[#3770FF] border-b-2 border-[#3770FF]">Write</button>
                                 <button className="text-[10px] font-black uppercase text-slate-400">Preview</button>
                              </div>
                              <div className="flex gap-4 text-slate-300">
                                 <FileText className="w-3.5 h-3.5" />
                                 <Plus className="w-3.5 h-3.5" />
                              </div>
                           </div>
                           <Textarea 
                              className="min-h-[200px] border-none bg-white p-8 font-mono text-sm leading-relaxed focus-visible:ring-0" 
                              placeholder="This is your chance to tell us more about yourself! Things you're good at, what drives you and interesting projects you've built."
                           />
                           <div className="bg-slate-50/50 px-6 py-3 text-[10px] text-slate-400 font-bold uppercase italic">
                              Attach images by dragging & dropping, selecting or pasting them
                           </div>
                        </div>
                      </div>
                   </div>
                </SectionCard>

                <SectionCard title="Dietary Preferences" subtitle="Optional, but useful.">
                   <div className="space-y-8">
                      <RadioGroup defaultValue="non-vegetarian" className="space-y-3">
                        <div className="flex items-center space-x-3 p-5 rounded-xl border border-slate-100 bg-white hover:border-slate-200 transition-all">
                          <RadioGroupItem value="vegetarian" id="veg" className="text-[#3770FF]" />
                          <Label htmlFor="veg" className="flex-1 font-bold text-sm text-slate-700">Vegetarian</Label>
                        </div>
                        <div className="flex items-center space-x-3 p-5 rounded-xl border border-slate-100 bg-white hover:border-slate-200 transition-all">
                          <RadioGroupItem value="non-vegetarian" id="non-veg" className="text-[#3770FF]" />
                          <Label htmlFor="non-veg" className="flex-1 font-bold text-sm text-slate-700">Non-Vegetarian</Label>
                        </div>
                        <div className="flex items-center space-x-3 p-5 rounded-xl border border-slate-100 bg-white hover:border-slate-200 transition-all">
                          <RadioGroupItem value="jain" id="jain" className="text-[#3770FF]" />
                          <Label htmlFor="jain" className="flex-1 font-bold text-sm text-slate-700">Jain</Label>
                        </div>
                      </RadioGroup>
                      
                      <Field label="Allergies" placeholder="Add allergies." />
                   </div>
                </SectionCard>
              </motion.div>
            )}

            {activeSection === 'education' && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                <SectionCard title="Education" subtitle="All journeys count.">
                  <div className="space-y-6">
                    <div className="flex items-center space-x-4 p-6 rounded-2xl border border-dashed border-slate-200 bg-white group cursor-pointer hover:border-[#3770FF]/30 transition-all">
                       <Checkbox id="no-edu" />
                       <Label htmlFor="no-edu" className="font-bold text-slate-500 cursor-pointer">I don't have a formal education</Label>
                    </div>

                    <div>
                      <Label className="text-[12px] font-bold text-slate-800 uppercase tracking-widest mb-2 block">Degree type</Label>
                      <Select defaultValue="bachelors">
                        <SelectTrigger className="h-14 bg-slate-50 border-none rounded-xl font-medium px-5">
                          <SelectValue placeholder="Select degree" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-slate-100 shadow-xl">
                          <SelectItem value="bachelors">Bachelors</SelectItem>
                          <SelectItem value="masters">Masters</SelectItem>
                          <SelectItem value="phd">PhD</SelectItem>
                          <SelectItem value="high-school">High School</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Field label="Educational Institution" placeholder="E.g. GIDC Degree Engineering College" />

                    <div className="flex items-center space-x-3 p-2">
                       <Checkbox id="current" defaultChecked />
                       <Label htmlFor="current" className="font-bold text-slate-700 text-sm">I currently study here</Label>
                    </div>

                    <Field label="Field of study" placeholder="E.g. Computer Science & Engineering" />

                    <div className="grid grid-cols-2 gap-6">
                       <div>
                          <Label className="text-[12px] font-bold text-slate-800 uppercase tracking-widest mb-2 block">Expected year of graduation</Label>
                          <Select defaultValue="2029">
                            <SelectTrigger className="h-14 bg-slate-50 border-none rounded-xl font-medium px-5">
                              <SelectValue placeholder="2024" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border-slate-100 shadow-xl">
                              <SelectItem value="2024">2024</SelectItem>
                              <SelectItem value="2025">2025</SelectItem>
                              <SelectItem value="2028">2028</SelectItem>
                              <SelectItem value="2029">2029</SelectItem>
                            </SelectContent>
                          </Select>
                       </div>
                       <div>
                          <Label className="text-[12px] font-bold text-slate-800 uppercase tracking-widest mb-2 block">Expected month of graduation</Label>
                          <Select defaultValue="april">
                            <SelectTrigger className="h-14 bg-slate-50 border-none rounded-xl font-medium px-5">
                              <SelectValue placeholder="May" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border-slate-100 shadow-xl">
                               <SelectItem value="april">April</SelectItem>
                               <SelectItem value="may">May</SelectItem>
                               <SelectItem value="june">June</SelectItem>
                            </SelectContent>
                          </Select>
                       </div>
                    </div>
                  </div>
                </SectionCard>
              </motion.div>
            )}

            {activeSection === 'experience' && (
               <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-10">
                  <SectionCard title="What Describes You Best?" subtitle="Choose all that fit">
                     <div className="grid grid-cols-2 gap-4">
                        <RoleToggle label="Designer" active />
                        <RoleToggle label="Frontend Developer" active />
                        <RoleToggle label="Backend Developer" active />
                        <RoleToggle label="Mobile Developer" />
                        <RoleToggle label="Blockchain Developer" />
                        <RoleToggle label="Other" />
                     </div>
                  </SectionCard>

                  <SectionCard title="Top Tech Skills" subtitle="What you're best at">
                     <div className="space-y-4">
                        <Label className="text-[12px] font-bold text-slate-400 uppercase tracking-[0.2em] block">Add upto 5 skills</Label>
                        <Input placeholder="E.g. React" className="h-14 bg-slate-50 border-none rounded-xl px-5 font-bold" />
                        <div className="flex flex-wrap gap-2 pt-2">
                           <SkillBadge label="React" />
                           <SkillBadge label="Data Analysis" />
                           <SkillBadge label="Machine Learning" />
                           <SkillBadge label="Data Science" />
                           <SkillBadge label="Natural Language Processing" />
                        </div>
                     </div>
                  </SectionCard>

                  <SectionCard title="Resume" subtitle="Your latest resume, here.">
                     <div className="border-2 border-dashed border-[#3770FF]/20 rounded-3xl p-12 bg-[#3770FF]/5 flex flex-col items-center justify-center text-center">
                        <div className="bg-[#3770FF] text-white px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-[#3770FF]/10 mb-4">
                           RESUME_ARYANSONDHARVA
                        </div>
                        <Button variant="outline" className="mt-4 border-slate-200 rounded-xl h-11 px-8 font-bold text-slate-500 hover:text-slate-700">Update</Button>
                     </div>
                  </SectionCard>

                  <SectionCard title="Work Experience" subtitle="Roles you've taken on.">
                     <div className="p-8 border border-slate-100 bg-white rounded-3xl flex items-center justify-between group">
                        <div className="flex items-center gap-4">
                           <Checkbox id="no-work" defaultChecked />
                           <Label htmlFor="no-work" className="font-bold text-slate-500">I am yet to find my first work opportunity</Label>
                        </div>
                        <Button variant="ghost" className="text-slate-300 hover:text-[#3770FF] font-bold uppercase tracking-widest text-[10px] items-center gap-2">
                           <Plus className="w-4 h-4" /> Add an experience
                        </Button>
                     </div>
                  </SectionCard>
               </motion.div>
            )}

            {activeSection === 'links' && (
               <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                  <SectionCard title="Links" subtitle="Links that speak for you.">
                     <div className="space-y-4">
                        <SocialLinkInput icon={Github} value="https://github.com/aryansondharva" />
                        <SocialLinkInput icon={Linkedin} value="https://linkedin.com/in/aryan-sondharva" color="text-blue-600" />
                        <SocialLinkInput icon={Twitter} value="https://x.com/aryansondharva" />
                        
                        <div className="flex justify-center pt-8">
                           <Button variant="outline" className="rounded-full h-12 px-8 border-slate-200 text-slate-500 font-bold uppercase tracking-widest text-[10px] flex items-center gap-2 hover:bg-slate-50">
                              <Plus className="w-4 h-4" /> Add new link
                           </Button>
                        </div>
                     </div>
                  </SectionCard>
               </motion.div>
            )}

            {activeSection === 'contact' && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-10">
                   <SectionCard title="How Can We Reach You?" subtitle="For updates and communication.">
                      <div className="space-y-6">
                        <div className="space-y-2">
                           <Label className="text-[12px] font-bold text-slate-800 uppercase tracking-widest block mb-2">Email address</Label>
                           <div className="flex gap-4">
                              <Input defaultValue="aryansondharva25@gmail.com" readOnly className="flex-1 h-14 bg-slate-50 border-none rounded-xl px-6 font-bold text-slate-400" />
                              <Button variant="outline" className="h-14 px-8 border-slate-200 rounded-xl font-bold text-slate-600">Verify email</Button>
                           </div>
                        </div>

                        <div>
                           <Label className="text-[12px] font-bold text-slate-800 uppercase tracking-widest block mb-2">Phone number</Label>
                           <div className="flex gap-4">
                              <div className="w-40">
                                 <Select defaultValue="india">
                                    <SelectTrigger className="h-14 bg-slate-50 border-none rounded-xl font-medium px-5">
                                       <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl border-slate-100">
                                       <SelectItem value="india">India</SelectItem>
                                       <SelectItem value="usa">USA</SelectItem>
                                    </SelectContent>
                                 </Select>
                              </div>
                              <div className="flex-1 relative">
                                 <Input defaultValue="+91 9913386244" className="h-14 bg-slate-50 border-none rounded-xl px-6 font-bold pl-12" />
                                 <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                                     <div className="w-5 h-3.5 bg-green-700 rounded-sm" title="India" />
                                 </div>
                              </div>
                           </div>
                        </div>
                      </div>
                   </SectionCard>

                   <SectionCard title="Emergency Contact" subtitle="For emergencies during events.">
                      <div className="space-y-6">
                        <Field label="Emergency contact name" placeholder="" />
                        <div>
                           <Label className="text-[12px] font-bold text-slate-800 uppercase tracking-widest block mb-2">Emergency contact number</Label>
                           <div className="flex gap-4">
                              <div className="w-40">
                                 <Select defaultValue="india">
                                    <SelectTrigger className="h-14 bg-slate-50 border-none rounded-xl font-medium px-5">
                                       <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl border-slate-100">
                                       <SelectItem value="india">India</SelectItem>
                                    </SelectContent>
                                 </Select>
                              </div>
                              <Input defaultValue="+91" className="flex-1 h-14 bg-slate-50 border-none rounded-xl px-6 font-bold" />
                           </div>
                        </div>
                      </div>
                   </SectionCard>
                </motion.div>
            )}
          </main>
        </div>

        {/* Footer Navigation */}
        <footer className="mt-32 pt-12 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6 text-slate-400 font-bold uppercase tracking-widest text-[10px]">
           <p>© 2026, NSB CLASSIC PTE LTD</p>
           <div className="flex gap-8">
              <a href="#" className="hover:text-slate-600 transition-colors">Terms</a>
              <a href="#" className="hover:text-slate-600 transition-colors">Privacy</a>
           </div>
           <div className="flex gap-8">
              <a href="#" className="hover:text-slate-600 transition-colors">About</a>
              <a href="#" className="hover:text-slate-600 transition-colors">Contact us</a>
           </div>
        </footer>
      </div>
    </div>
  );
}

// --- SUB-COMPONENTS ---

function SidebarLink({ active, onClick, icon: Icon, label }: any) {
  return (
    <button 
      onClick={onClick}
      className={`
        flex items-center gap-4 w-full px-6 py-4 rounded-xl transition-all font-bold text-xs uppercase tracking-[0.2em] group
        ${active 
          ? 'bg-[#3770FF] text-white shadow-lg shadow-[#3770FF]/20' 
          : 'text-slate-400 hover:text-slate-600 hover:bg-white/50'
        }
      `}
    >
      <Icon className={`w-4 h-4 transition-transform group-hover:scale-110 ${active ? 'text-white' : 'text-inherit'}`} />
      <span>{label}</span>
      {active && <div className="ml-auto w-1 h-4 bg-white/30 rounded-full" />}
    </button>
  );
}

function SectionCard({ title, subtitle, children }: any) {
  return (
    <Card className="border-none shadow-sm rounded-[2rem] bg-white overflow-hidden">
      <div className="p-10">
        <div className="mb-10">
           <h3 className="text-xl font-bold text-slate-900 tracking-tight">{title}</h3>
           <p className="text-sm text-slate-400 mt-1 font-medium">{subtitle}</p>
        </div>
        <div className="space-y-8">
          {children}
        </div>
        <div className="flex justify-end pt-10 border-t border-slate-50 mt-10">
           <Button className="rounded-xl h-11 px-8 bg-[#3770FF] hover:bg-[#2F60E0] text-white font-bold text-xs pb-0.5 shadow-md">
             Save
           </Button>
        </div>
      </div>
    </Card>
  );
}

function Field({ label, placeholder, value }: any) {
  return (
    <div className="space-y-2">
      <Label className="text-[12px] font-bold text-slate-800 uppercase tracking-widest mb-2 block">{label}</Label>
      <Input 
        placeholder={placeholder} 
        value={value}
        className="h-14 bg-slate-50 border-none rounded-xl px-5 font-medium focus-visible:ring-[#3770FF]/20 transition-all"
      />
    </div>
  );
}

function RoleToggle({ label, active = false }: { label: string, active?: boolean }) {
  return (
     <div className={`p-5 rounded-xl border flex items-center gap-4 cursor-pointer transition-all ${active ? 'bg-[#3770FF]/5 border-[#3770FF]/30' : 'bg-white border-slate-100 hover:border-slate-200'}`}>
        <Checkbox id={label} defaultChecked={active} />
        <Label htmlFor={label} className={`font-bold text-sm cursor-pointer ${active ? 'text-[#3770FF]' : 'text-slate-600'}`}>{label}</Label>
     </div>
  );
}

function SkillBadge({ label }: { label: string }) {
   return (
      <div className="px-4 py-2 rounded-xl bg-white border border-slate-100 text-slate-600 text-xs font-bold uppercase tracking-tight flex items-center gap-3 group hover:border-[#3770FF]/30 transition-all">
         {label}
         <X className="w-3.5 h-3.5 text-slate-300 group-hover:text-red-500 cursor-pointer" />
      </div>
   );
}

function SocialLinkInput({ icon: Icon, value, color = "text-slate-900" }: any) {
   return (
      <div className="flex items-center gap-4 w-full">
         <div className="flex-1 relative flex items-center">
            <div className="absolute left-5 text-slate-400">
               <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <Input defaultValue={value} className="h-14 bg-slate-50 border-none rounded-xl font-bold px-14 text-slate-600 w-full" />
         </div>
         <button className="p-3 text-red-100 hover:text-red-500 transition-colors">
            <Trash2 className="w-5 h-5" />
         </button>
      </div>
   );
}
