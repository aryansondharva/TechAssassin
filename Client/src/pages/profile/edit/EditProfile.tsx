import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { profileService, authService } from '@/services';
import { useAuth, useUser } from '@clerk/react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { 
  Loader2, 
  User, 
  Phone, 
  GraduationCap,
  Plus,
  X,
  Target,
  Briefcase,
  Globe,
  Github,
  Linkedin,
  Twitter,
  Trash2,
  FileText
} from 'lucide-react';
import type { Profile, ProfileUpdateRequest } from '@/types/api';
import Navbar from '@/components/Navbar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { motion } from 'framer-motion';

const splitFullName = (fullName?: string | null) => {
  const parts = (fullName || '').trim().split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] || '',
    lastName: parts.slice(1).join(' '),
  };
};

const getFullName = (firstName?: string, lastName?: string, fallback?: string | null) => {
  return [firstName, lastName].filter(Boolean).join(' ').trim() || fallback || '';
};

const isGeneratedUsername = (username?: string | null) => /^user_[a-zA-Z0-9_]{4,}$/i.test(username || '');

const normalizeClerkUsername = (value?: string | null) => {
  const normalized = (value || '')
    .trim()
    .replace(/^@+/, '')
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 30);

  return normalized.length >= 3 ? normalized : '';
};

const normalizeHandle = (value?: string | null) => (value || '').trim().replace(/^@+/, '').replace(/^\/+/, '');

const normalizeUrl = (value?: string | null) => {
  const trimmed = (value || '').trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed.replace(/^\/+/, '')}`;
};

const normalizeSocialUrl = (field: keyof ProfileUpdateRequest, value?: string | null) => {
  const trimmed = (value || '').trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;

  const handle = normalizeHandle(trimmed);
  if (field === 'github_url') return `https://github.com/${handle.replace(/^github\.com\//i, '')}`;
  if (field === 'linkedin_url') return `https://www.linkedin.com/in/${handle.replace(/^(www\.)?linkedin\.com\/in\//i, '')}`;
  if (field === 'twitter_url') return `https://x.com/${handle.replace(/^(www\.)?(twitter|x)\.com\//i, '')}`;
  return normalizeUrl(trimmed);
};

const normalizeProfilePayload = (data: ProfileUpdateRequest): ProfileUpdateRequest => ({
  ...data,
  interests: data.interests || data.skills || [],
  github_url: normalizeSocialUrl('github_url', data.github_url),
  linkedin_url: normalizeSocialUrl('linkedin_url', data.linkedin_url),
  twitter_url: normalizeSocialUrl('twitter_url', data.twitter_url),
  portfolio_url: normalizeUrl(data.portfolio_url),
  resume_url: normalizeUrl(data.resume_url),
});

const getClerkProfileFallback = (clerkUser: any, userId?: string | null): Partial<Profile> => {
  const email = clerkUser?.primaryEmailAddress?.emailAddress || '';
  const username = normalizeClerkUsername(clerkUser?.username) || normalizeClerkUsername(email.split('@')[0]);

  return {
    id: userId || clerkUser?.id || '',
    username,
    email,
    first_name: '',
    last_name: '',
    full_name: '',
    avatar_url: null,
  };
};

const arrayToText = (items?: string[] | null) => (items || []).join(', ');
const textToArray = (value: string) => value.split(',').map(item => item.trim()).filter(Boolean);

const mergeProfileWithFallback = (data: Partial<Profile>, fallback: Partial<Profile>): Partial<Profile> => {
  return {
    ...fallback,
    ...data,
    username: isGeneratedUsername(data.username) ? fallback.username || '' : data.username || fallback.username || '',
    email: data.email || fallback.email || '',
    first_name: data.first_name || fallback.first_name || '',
    last_name: data.last_name || fallback.last_name || '',
    full_name: data.full_name || fallback.full_name || '',
    avatar_url: data.avatar_url || fallback.avatar_url || null,
  };
};

const mapProfileToFormData = (data: Partial<Profile>, fallback: Partial<Profile> = {}): ProfileUpdateRequest => {
  const merged = mergeProfileWithFallback(data, fallback);
  const fallbackName = splitFullName(merged.full_name);
  const firstName = merged.first_name || fallbackName.firstName;
  const lastName = merged.last_name || fallbackName.lastName;

  return {
    first_name: firstName,
    last_name: lastName,
    full_name: getFullName(firstName, lastName, merged.full_name),
    username: isGeneratedUsername(merged.username) ? '' : merged.username || '',
    gender: merged.gender || '',
    tshirt_size: merged.tshirt_size || '',
    address: merged.address || '',
    bio: merged.bio || '',
    readme: merged.readme || '',
    dietary_preference: merged.dietary_preference || '',
    allergies: merged.allergies || '',
    has_education: merged.has_education ?? true,
    degree_type: merged.degree_type || '',
    university: merged.university || '',
    graduation_year: merged.graduation_year || undefined,
    graduation_month: merged.graduation_month || '',
    education: merged.education || '',
    roles: merged.roles || [],
    skills: merged.skills || merged.interests || [],
    github_url: merged.github_url || '',
    linkedin_url: merged.linkedin_url || '',
    twitter_url: merged.twitter_url || '',
    resume_url: merged.resume_url || '',
    phone: merged.phone || '',
    emergency_contact_name: merged.emergency_contact_name || '',
    emergency_contact_phone: merged.emergency_contact_phone || '',
    is_email_public: merged.is_email_public ?? false,
    is_phone_public: merged.is_phone_public ?? false,
    is_address_public: merged.is_address_public ?? false,
  };
};

export default function EditProfile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Partial<Profile> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeSection, setActiveSection] = useState('about');
  const [skillsText, setSkillsText] = useState('');
  
  const { isLoaded, userId } = useAuth();
  const { user: clerkUser } = useUser();
  
  // Advanced state mapping for the expanded Supabase schema
  const [formData, setFormData] = useState<ProfileUpdateRequest>({});

  useEffect(() => {
    if (!isLoaded) return;
    
    if (!userId) {
      navigate('/signin');
      return;
    }
    fetchProfile();
  }, [
    navigate,
    isLoaded,
    userId,
    clerkUser?.id,
    clerkUser?.username,
    clerkUser?.fullName,
    clerkUser?.imageUrl,
    clerkUser?.primaryEmailAddress?.emailAddress,
  ]);

  const fetchProfile = async () => {
    setIsLoading(true);
    const fallback = getClerkProfileFallback(clerkUser, userId);
    try {
      const data = await profileService.getMyProfile();
      const mergedProfile = mergeProfileWithFallback(data, fallback);
      const nextFormData = mapProfileToFormData(mergedProfile, fallback);
      setProfile(mergedProfile);
      setFormData(nextFormData);
      setSkillsText(arrayToText(nextFormData.skills));
    } catch (error) {
      console.error(error);
      const nextFormData = mapProfileToFormData(fallback);
      setProfile(fallback);
      setFormData(nextFormData);
      setSkillsText(arrayToText(nextFormData.skills));
    } finally {
      setIsLoading(false);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleUpdateField = (field: keyof ProfileUpdateRequest, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const payload: ProfileUpdateRequest = normalizeProfilePayload({
        ...formData,
      });
      if (!payload.username?.trim()) {
        delete payload.username;
      }
      const fullName = getFullName(formData.first_name, formData.last_name, formData.full_name);
      if (fullName) {
        payload.full_name = fullName;
      }
      const updatedData = await profileService.update(payload);
      const fallback = getClerkProfileFallback(clerkUser, userId);
      const mergedProfile = mergeProfileWithFallback(updatedData, fallback);
      const nextFormData = mapProfileToFormData(mergedProfile, fallback);
      setProfile(mergedProfile);
      setFormData(nextFormData);
      setSkillsText(arrayToText(nextFormData.skills));
      
      // Update the stored user data for real-time sync across the app
      authService.updateUser({
        first_name: updatedData.first_name,
        last_name: updatedData.last_name,
        full_name: `${updatedData.first_name} ${updatedData.last_name}`.trim(),
        username: updatedData.username,
        avatar_url: updatedData.avatar_url,
        bio: updatedData.bio,
        address: updatedData.address
      });
      
      const timeString = new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: true });
      toast({ title: 'Profile Updated', description: `Successfully updated at ${timeString} (IST)` });
    } catch (error) {
       toast({ title: 'Sync Failed', description: 'Could not write to the central database.', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const toggleRole = (role: string) => {
     const currentRoles = formData.roles || [];
     if (currentRoles.includes(role)) {
        handleUpdateField('roles', currentRoles.filter(r => r !== role));
     } else {
        handleUpdateField('roles', [...currentRoles, role]);
     }
  };

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <Loader2 className="h-10 w-10 animate-spin text-red-600" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F7F9FC]">
      <Navbar dark={false} />
      
      <div className="max-w-6xl mx-auto px-6 pt-32 pb-20">
        <div className="flex flex-col lg:flex-row gap-12 items-start">
          
          <aside className="w-full lg:w-64 lg:sticky lg:top-32 space-y-2">
            <SidebarLink active={activeSection === 'about'} onClick={() => setActiveSection('about')} icon={User} label="About" />
            <SidebarLink active={activeSection === 'education'} onClick={() => setActiveSection('education')} icon={GraduationCap} label="Education" />
            <SidebarLink active={activeSection === 'experience'} onClick={() => setActiveSection('experience')} icon={Briefcase} label="Experience" />
            <SidebarLink active={activeSection === 'links'} onClick={() => setActiveSection('links')} icon={Globe} label="Links" />
            <SidebarLink active={activeSection === 'contact'} onClick={() => setActiveSection('contact')} icon={Phone} label="Contact" />
            
            <div className="pt-8 border-t border-slate-200 mt-8">
               <Link to="/profile" className="flex items-center gap-3 px-6 py-3 text-slate-400 hover:text-red-500 font-bold uppercase tracking-widest text-[11px] transition-all">
                  <Target className="w-4 h-4" /> My Assassin
               </Link>
            </div>
          </aside>

          <main className="flex-1 space-y-10">
            {activeSection === 'about' && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                <SectionCard title="Basic Info" subtitle="Just the essentials." onSave={handleSave} isSaving={isSaving}>
                  <div className="grid grid-cols-2 gap-6">
                    <Field label="First name" value={formData.first_name} onChange={(v) => handleUpdateField('first_name', v)} />
                    <Field label="Last name" value={formData.last_name} onChange={(v) => handleUpdateField('last_name', v)} />
                  </div>
                  <Field label="Username" value={formData.username} onChange={(v) => handleUpdateField('username', v)} placeholder="Choose your unique username" />
                  <div className="space-y-4">
                    <div>
                      <Label className="text-[12px] font-bold text-slate-800 uppercase tracking-widest mb-2 block">I identify as</Label>
                      <Select value={formData.gender || ''} onValueChange={(v) => handleUpdateField('gender', v)}>
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
                    </div>
                    <div>
                      <Label className="text-[12px] font-bold text-slate-800 uppercase tracking-widest mb-2 block">T-shirt size</Label>
                      <Select value={formData.tshirt_size || ''} onValueChange={(v) => handleUpdateField('tshirt_size', v)}>
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
                    <Field label="City" value={formData.address} onChange={(v) => handleUpdateField('address', v)} />
                  </div>
                </SectionCard>

                <SectionCard title="About You" subtitle="Tell your story." onSave={handleSave} isSaving={isSaving}>
                   <div className="space-y-6">
                      <div className="space-y-2">
                        <Label className="text-[12px] font-bold text-slate-800 uppercase tracking-widest block">Bio</Label>
                        <Textarea 
                          value={formData.bio || ''} 
                          onChange={(e) => handleUpdateField('bio', e.target.value)}
                          placeholder="Add a bio." 
                          className="min-h-[100px] bg-slate-50 border-none rounded-xl font-medium p-6 resize-none" 
                        />
                      </div>
                      <div className="space-y-4">
                        <Label className="text-[12px] font-bold text-slate-800 uppercase tracking-widest block">Readme.md</Label>
                        <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                           <div className="bg-slate-50 px-6 py-3 border-b border-slate-100 flex items-center justify-between">
                              <div className="flex gap-4"><button className="text-[10px] font-black uppercase text-red-600 border-b-2 border-red-600">Write</button></div>
                           </div>
                           <Textarea 
                              value={formData.readme || ''}
                              onChange={(e) => handleUpdateField('readme', e.target.value)}
                              className="min-h-[200px] border-none bg-white p-8 font-mono text-sm leading-relaxed focus-visible:ring-0" 
                              placeholder="Describe your expertise and vision here..."
                           />
                        </div>
                      </div>
                   </div>
                </SectionCard>

                <SectionCard title="Dietary Preferences" subtitle="Optional." onSave={handleSave} isSaving={isSaving}>
                   <div className="space-y-8">
                      <RadioGroup value={formData.dietary_preference || ''} onValueChange={(v) => handleUpdateField('dietary_preference', v)} className="space-y-3">
                        <RadioItem value="vegetarian" label="Vegetarian" />
                        <RadioItem value="non-vegetarian" label="Non-Vegetarian" />
                        <RadioItem value="jain" label="Jain" />
                      </RadioGroup>
                      <Field label="Allergies" value={formData.allergies} onChange={(v) => handleUpdateField('allergies', v)} />
                   </div>
                </SectionCard>
              </motion.div>
            )}

            {activeSection === 'education' && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                <SectionCard title="Education" subtitle="Your academic background." onSave={handleSave} isSaving={isSaving}>
                  <div className="space-y-6">
                    <div className="flex items-center space-x-4 p-6 rounded-2xl border border-dashed border-slate-200 bg-white group cursor-pointer hover:border-red-500/30 transition-all">
                       <Checkbox 
                        id="no-edu" 
                        checked={!formData.has_education} 
                        onCheckedChange={(c) => handleUpdateField('has_education', !c)}
                        className="border-slate-300 data-[state=checked]:bg-red-500 data-[state=checked]:border-red-500" 
                       />
                       <Label htmlFor="no-edu" className="font-bold text-slate-500 cursor-pointer">I don't have a formal education</Label>
                    </div>

                    {formData.has_education && (
                      <div className="space-y-6">
                        <div>
                          <Label className="text-[12px] font-bold text-slate-800 uppercase tracking-widest mb-2 block">Degree type</Label>
                          <Select value={formData.degree_type || ''} onValueChange={(v) => handleUpdateField('degree_type', v)}>
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
                        <Field label="Educational Institution" value={formData.university} onChange={(v) => handleUpdateField('university', v)} />
                        <Field label="Field of study" value={formData.education} onChange={(v) => handleUpdateField('education', v)} />
                        
                        <div className="grid grid-cols-2 gap-6">
                           <div>
                              <Label className="text-[12px] font-bold text-slate-800 uppercase tracking-widest mb-2 block">Graduation Year</Label>
                              <Select value={formData.graduation_year?.toString()} onValueChange={(v) => handleUpdateField('graduation_year', parseInt(v))}>
                                <SelectTrigger className="h-14 bg-slate-50 border-none rounded-xl font-medium px-5">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl border-slate-100 shadow-xl">
                                  {["2024", "2025", "2026", "2027", "2028", "2029"].map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                                </SelectContent>
                              </Select>
                           </div>
                           <div>
                              <Label className="text-[12px] font-bold text-slate-800 uppercase tracking-widest mb-2 block">Graduation Month</Label>
                              <Select value={formData.graduation_month || ''} onValueChange={(v) => handleUpdateField('graduation_month', v)}>
                                <SelectTrigger className="h-14 bg-slate-50 border-none rounded-xl font-medium px-5">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl border-slate-100 shadow-xl">
                                   {["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"].map(m => (
                                     <SelectItem key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</SelectItem>
                                   ))}
                                </SelectContent>
                              </Select>
                           </div>
                        </div>
                      </div>
                    )}
                  </div>
                </SectionCard>
              </motion.div>
            )}

            {activeSection === 'experience' && (
               <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-10">
                  <SectionCard title="What Describes You Best?" subtitle="Choose all that fit" onSave={handleSave} isSaving={isSaving}>
                     <div className="space-y-8">
                        <div className="grid grid-cols-2 gap-4">
                          {['Designer', 'Frontend Developer', 'Backend Developer', 'Mobile Developer', 'Blockchain Developer', 'Other'].map(role => (
                            <RoleToggle
                              key={role}
                              label={role}
                              active={(formData.roles || []).includes(role)}
                              onToggle={() => toggleRole(role)}
                            />
                          ))}
                        </div>
                        <Field
                          label="Skills"
                          value={skillsText}
                          onChange={(v) => {
                            setSkillsText(v);
                            const skills = textToArray(v);
                            handleUpdateField('skills', skills);
                            handleUpdateField('interests', skills);
                          }}
                          placeholder="React, Node.js, Python"
                        />
                     </div>
                  </SectionCard>

                  <SectionCard title="Resume" subtitle="Your latest resume, here." onSave={handleSave} isSaving={isSaving}>
                      <Field label="Resume Link" value={formData.resume_url} onChange={(v) => handleUpdateField('resume_url', v)} placeholder="https://..." />
                  </SectionCard>
               </motion.div>
            )}

            {activeSection === 'links' && (
               <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                  <SectionCard title="Links" subtitle="Your digital identity." onSave={handleSave} isSaving={isSaving}>
                     <div className="space-y-4">
                        <SocialLinkInput icon={Github} value={formData.github_url} onChange={(v) => handleUpdateField('github_url', v)} placeholder="github.com/username or username" />
                        <SocialLinkInput icon={Linkedin} value={formData.linkedin_url} onChange={(v) => handleUpdateField('linkedin_url', v)} placeholder="linkedin.com/in/username or username" color="text-red-500" />
                        <SocialLinkInput icon={Twitter} value={formData.twitter_url} onChange={(v) => handleUpdateField('twitter_url', v)} placeholder="x.com/username or @username" />
                        <SocialLinkInput icon={Globe} value={formData.portfolio_url} onChange={(v) => handleUpdateField('portfolio_url', v)} placeholder="your-portfolio.com" />
                     </div>
                  </SectionCard>
               </motion.div>
            )}

            {activeSection === 'contact' && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-10">
                   <SectionCard title="Communication" subtitle="Reachability parameters." onSave={handleSave} isSaving={isSaving}>
                      <div className="space-y-6">
                        <div className="space-y-2">
                           <Label className="text-[12px] font-bold text-slate-800 uppercase tracking-widest block mb-1.5">Email (Public ID)</Label>
                           <Input value={profile?.email || ''} readOnly className="h-14 bg-slate-50 border-none rounded-xl px-6 font-bold text-slate-400" />
                        </div>
                        <Field label="Phone number" value={formData.phone} onChange={(v) => handleUpdateField('phone', v)} />
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <PrivacyToggle
                            id="email-public"
                            checked={formData.is_email_public}
                            label="Public email"
                            onChange={(v: boolean) => handleUpdateField('is_email_public', v)}
                          />
                          <PrivacyToggle
                            id="phone-public"
                            checked={formData.is_phone_public}
                            label="Public phone"
                            onChange={(v: boolean) => handleUpdateField('is_phone_public', v)}
                          />
                          <PrivacyToggle
                            id="address-public"
                            checked={formData.is_address_public}
                            label="Public city"
                            onChange={(v: boolean) => handleUpdateField('is_address_public', v)}
                          />
                        </div>
                      </div>
                   </SectionCard>

                   <SectionCard title="Emergency Contact" subtitle="In-field logistics." onSave={handleSave} isSaving={isSaving}>
                      <div className="space-y-6">
                        <Field label="Contact name" value={formData.emergency_contact_name} onChange={(v) => handleUpdateField('emergency_contact_name', v)} />
                        <Field label="Contact number" value={formData.emergency_contact_phone} onChange={(v) => handleUpdateField('emergency_contact_phone', v)} />
                      </div>
                   </SectionCard>
                </motion.div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

// --- SUB-COMPONENTS ---

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function SidebarLink({ active, onClick, icon: Icon, label }: any) {
  return (
    <button onClick={onClick} className={`flex items-center gap-4 w-full px-6 py-4 rounded-xl transition-all font-bold text-xs uppercase tracking-[0.2em] group ${active ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' : 'text-slate-400 hover:text-red-500 hover:bg-white/50'}`}>
      <Icon className={`w-4 h-4 transition-transform group-hover:scale-110 ${active ? 'text-white' : 'text-inherit'}`} />
      <span>{label}</span>
    </button>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function SectionCard({ title, subtitle, children, onSave, isSaving }: any) {
  return (
    <Card className="border-none shadow-sm rounded-[2rem] bg-white overflow-hidden">
      <div className="p-10">
        <div className="mb-10">
           <h3 className="text-xl font-bold text-slate-900 tracking-tight">{title}</h3>
           <p className="text-sm text-slate-400 mt-1 font-medium">{subtitle}</p>
        </div>
        <div className="space-y-8">{children}</div>
        <div className="flex justify-end pt-10 border-t border-slate-50 mt-10">
           <Button onClick={onSave} disabled={isSaving} className="rounded-xl h-11 px-8 bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md">
             {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Changes"}
           </Button>
        </div>
      </div>
    </Card>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function Field({ label, placeholder, value, onChange }: any) {
  return (
    <div className="space-y-2">
      <Label className="text-[12px] font-bold text-slate-800 uppercase tracking-widest mb-2 block">{label}</Label>
      <Input 
        placeholder={placeholder} 
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        className="h-14 bg-slate-50 border-none rounded-xl px-5 font-bold focus-visible:ring-red-500/10 transition-all"
      />
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function RoleToggle({ label, active, onToggle }: any) {
  return (
     <div onClick={onToggle} className={`p-5 rounded-xl border flex items-center gap-4 cursor-pointer transition-all ${active ? 'bg-red-50 border-red-200' : 'bg-white border-slate-100 hover:border-slate-200'}`}>
        <Checkbox checked={active} className="border-slate-300 data-[state=checked]:bg-red-500 data-[state=checked]:border-red-500" />
        <Label className={`font-bold text-sm cursor-pointer ${active ? 'text-red-600' : 'text-slate-600'}`}>{label}</Label>
     </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function SocialLinkInput({ icon: Icon, value, onChange, placeholder, color = "text-slate-900" }: any) {
   return (
      <div className="flex items-center gap-4 w-full">
         <div className="flex-1 relative flex items-center">
            <div className={`absolute left-5 ${color}`}><Icon className={`w-5 h-5`} /></div>
            <Input value={value || ''} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} className="h-14 bg-slate-50 border-none rounded-xl font-bold px-14 text-slate-600 w-full focus-visible:ring-red-500/10" />
         </div>
         <button onClick={() => onChange('')} className="p-3 text-slate-200 hover:text-red-600 transition-colors"><Trash2 className="w-5 h-5" /></button>
      </div>
   );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function RadioItem({ value, label }: any) {
  return (
    <div className="flex items-center space-x-3 p-5 rounded-xl border border-slate-100 bg-white hover:border-slate-200 transition-all">
      <RadioGroupItem value={value} id={value} className="text-red-500 border-red-200" />
      <Label htmlFor={value} className="flex-1 font-bold text-sm text-slate-700 cursor-pointer">{label}</Label>
    </div>
  );
}

function PrivacyToggle({ id, checked, label, onChange }: any) {
  return (
    <div className="flex items-center gap-3 p-4 rounded-xl border border-slate-100 bg-white">
      <Checkbox
        id={id}
        checked={!!checked}
        onCheckedChange={(value) => onChange(value === true)}
        className="border-slate-300 data-[state=checked]:bg-red-500 data-[state=checked]:border-red-500"
      />
      <Label htmlFor={id} className="text-xs font-bold text-slate-600 uppercase tracking-widest cursor-pointer">
        {label}
      </Label>
    </div>
  );
}
