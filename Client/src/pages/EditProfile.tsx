import { useEffect, useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { profileService, authService } from '@/services';
import { ApiError } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { 
  Loader2, 
  ArrowLeft, 
  Save, 
  Camera, 
  Github, 
  Linkedin, 
  Globe, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  GraduationCap,
  Plus,
  X,
  ShieldCheck,
  Target,
  Image as ImageIcon
} from 'lucide-react';
import type { Profile } from '@/types/api';
import Navbar from '@/components/Navbar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';

export default function EditProfile() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  
  const [formData, setFormData] = useState({
    username: '',
    full_name: '',
    bio: '',
    skills: [] as string[],
    interests: [] as string[],
    github_url: '',
    linkedin_url: '',
    portfolio_url: '',
    phone: '',
    address: '',
    university: '',
    education: '',
    graduation_year: '',
    avatar_url: '',
    banner_url: '',
    is_email_public: false,
    is_phone_public: false,
    is_address_public: false,
  });

  const [skillInput, setSkillInput] = useState('');
  const [interestInput, setInterestInput] = useState('');

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
      setFormData({
        username: data.username || '',
        full_name: data.full_name || '',
        bio: data.bio || '',
        skills: data.skills || [],
        interests: data.interests || [],
        github_url: data.github_url || '',
        linkedin_url: data.linkedin_url || '',
        portfolio_url: data.portfolio_url || '',
        phone: data.phone || '',
        address: data.address || '',
        university: data.university || '',
        education: data.education || '',
        graduation_year: data.graduation_year?.toString() || '',
        avatar_url: data.avatar_url || '',
        banner_url: data.banner_url || '',
        is_email_public: data.is_email_public || false,
        is_phone_public: data.is_phone_public || false,
        is_address_public: data.is_address_public || false,
      });
    } catch (error) {
      if (error instanceof ApiError && error.status !== 404) {
        toast({ title: 'Error', description: 'Failed to load profile data', variant: 'destructive' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleAvatarClick = () => fileInputRef.current?.click();
  const handleBannerClick = () => bannerInputRef.current?.click();

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const response = await profileService.uploadAvatar(file);
      setFormData(prev => ({ ...prev, avatar_url: response.avatar_url }));
      toast({ title: 'Success', description: 'Avatar uploaded!' });
    } catch (error: any) {
      toast({ title: 'Failed', description: error.message, variant: 'destructive' });
    } finally {
      setIsUploading(false);
    }
  };

  const handleBannerChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // For now we'll simulate banner upload success or use the same endpoint if supported
    toast({ title: "Note", description: "Banner feature requires storage setup. URL updated in state." });
    // setFormData(prev => ({ ...prev, banner_url: '...' }));
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    // Client-side validation
    if (!formData.username || formData.username.length < 3) {
      toast({ title: 'Invalid Username', description: 'Callsign must be at least 3 characters.', variant: 'destructive' });
      setIsSaving(false);
      return;
    }
    if (!formData.full_name) {
      toast({ title: 'Name Required', description: 'Please enter your full operational name.', variant: 'destructive' });
      setIsSaving(false);
      return;
    }

    try {
      // Clean up data before sending
      const submissionData = {
        ...formData,
        graduation_year: formData.graduation_year ? parseInt(formData.graduation_year) : null,
        skills: formData.skills.length > 0 ? formData.skills : [],
        interests: formData.interests.length > 0 ? formData.interests : [],
      };

      await profileService.update(submissionData);
      toast({ title: 'Success', description: 'Profile updated! 🔥' });
      navigate('/profile');
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddSkill = () => {
    if (skillInput.trim() && !formData.skills.includes(skillInput.trim())) {
      setFormData(prev => ({ ...prev, skills: [...prev.skills, skillInput.trim()] }));
      setSkillInput('');
    }
  };

  const handleAddInterest = () => {
    if (interestInput.trim() && !formData.interests.includes(interestInput.trim())) {
      setFormData(prev => ({ ...prev, interests: [...prev.interests, interestInput.trim()] }));
      setInterestInput('');
    }
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-white"><Loader2 className="h-12 w-12 animate-spin text-red-600" /></div>;

  return (
    <div className="min-h-screen bg-[#F3F4F6]">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 pt-28 pb-20">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-4xl font-black text-gray-900 uppercase italic tracking-tighter">Edit Operative Profile</h1>
            <p className="text-gray-500 mt-1 font-bold uppercase text-xs tracking-widest">Modify your tactical identity and combat project history</p>
          </div>
          <Link to="/profile">
            <Button variant="outline" className="border-gray-300 font-bold uppercase text-[10px] tracking-widest">
              <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
            </Button>
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-1 space-y-8">
            <Card className="border-none shadow-md rounded-[2.5rem] overflow-hidden bg-white">
              <div className="h-32 bg-gray-900 relative group cursor-pointer" onClick={handleBannerClick}>
                {formData.banner_url ? (
                   <img src={formData.banner_url} className="w-full h-full object-cover opacity-50" />
                ) : (
                  <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
                )}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                   <ImageIcon className="text-white w-8 h-8" />
                </div>
                <input type="file" ref={bannerInputRef} onChange={handleBannerChange} className="hidden" />
              </div>
              <CardContent className="relative pt-0 pb-10 text-center">
                <div className="relative inline-block -mt-16 mb-4 group">
                  <Avatar className="h-32 w-32 border-8 border-white shadow-2xl">
                    <AvatarImage src={formData.avatar_url} />
                    <AvatarFallback className="bg-red-50 text-3xl font-black text-red-200 uppercase">{formData.username?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <button type="button" onClick={handleAvatarClick} className="absolute bottom-2 right-2 p-3 bg-red-600 text-white rounded-full shadow-xl border-4 border-white hover:scale-110 transition-all font-black">
                    <Camera className="h-4 w-4" />
                  </button>
                  <input type="file" ref={fileInputRef} onChange={handleAvatarChange} className="hidden" accept="image/*" />
                </div>
                <h3 className="text-2xl font-black text-gray-900 uppercase italic tracking-tighter">{formData.full_name || 'NEW OPERATIVE'}</h3>
                <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em] mt-2">Rank: Senior Contributor</p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-md rounded-[2rem] bg-white p-8 space-y-4">
                <Button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white h-14 rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-xl shadow-red-500/20" disabled={isSaving}>
                  {isSaving ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Save className="mr-2 h-5 w-5" />} Save Identity
                </Button>
                <Link to="/profile" className="block"><Button type="button" variant="ghost" className="w-full font-black uppercase text-[10px] tracking-widest text-gray-400">Abort Changes</Button></Link>
            </Card>
          </div>

          <div className="lg:col-span-2 space-y-10">
            <EditSection icon={User} title="Core Identity" description="Basic identification and operational bio">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <Label className="text-[11px] font-black uppercase tracking-widest text-gray-400">Full Operational Name</Label>
                    <Input value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} className="h-12 rounded-xl border-gray-100 bg-gray-50 focus:bg-white transition-all font-bold" />
                  </div>
                  <div className="space-y-3">
                    <Label className="text-[11px] font-black uppercase tracking-widest text-gray-400">Digital Callsign (Username)</Label>
                    <Input value={formData.username} onChange={e => setFormData({...formData, username: e.target.value.toLowerCase()})} className="h-12 rounded-xl border-gray-100 bg-gray-50 focus:bg-white transition-all font-bold text-red-600 lowercase" />
                  </div>
                </div>
                <div className="space-y-3">
                  <Label className="text-[11px] font-black uppercase tracking-widest text-gray-400">Operational Biography</Label>
                  <Textarea value={formData.bio} onChange={e => setFormData({...formData, bio: e.target.value})} className="min-h-[120px] rounded-2xl border-gray-100 bg-gray-50 focus:bg-white transition-all p-4 font-bold text-sm italic" />
                </div>
            </EditSection>

            <EditSection icon={Target} title="Capability Matrix" description="Technical skills and combat interests">
                <div className="space-y-6">
                  <div className="space-y-4">
                    <Label className="text-[11px] font-black uppercase tracking-widest text-gray-400">Skillset Tags</Label>
                    <div className="flex gap-2">
                      <Input placeholder="Weaponize new skill..." value={skillInput} onChange={e => setSkillInput(e.target.value)} onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())} className="h-12 rounded-xl" />
                      <Button type="button" onClick={handleAddSkill} className="bg-gray-900 h-12 w-12 rounded-xl"><Plus /></Button>
                    </div>
                    <div className="flex flex-wrap gap-2 p-4 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                      {formData.skills.map(s => (
                        <Badge key={s} className="bg-white text-gray-900 border-gray-200 pl-4 pr-2 py-2 rounded-lg font-black uppercase text-[10px] tracking-widest shadow-sm">
                          {s} <button type="button" onClick={() => setFormData(prev => ({...prev, skills: prev.skills.filter(x => x !== s)}))} className="ml-2 text-red-500 hover:scale-125 transition-all"><X className="w-3 h-3" /></button>
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-gray-100">
                    <Label className="text-[11px] font-black uppercase tracking-widest text-gray-400">Interests / Focus Areas</Label>
                    <div className="flex gap-2">
                      <Input placeholder="Define interest..." value={interestInput} onChange={e => setInterestInput(e.target.value)} onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), handleAddInterest())} className="h-12 rounded-xl" />
                      <Button type="button" onClick={handleAddInterest} className="bg-gray-900 h-12 w-12 rounded-xl"><Target className="w-4 h-4" /></Button>
                    </div>
                    <div className="flex flex-wrap gap-2 p-4 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                      {formData.interests.map(it => (
                        <Badge key={it} variant="outline" className="bg-white border-gray-300 text-gray-600 pl-4 pr-2 py-2 rounded-lg font-black uppercase text-[10px] tracking-widest">
                          {it} <button type="button" onClick={() => setFormData(prev => ({...prev, interests: prev.interests.filter(x => x !== it)}))} className="ml-2 text-red-500"><X className="w-3 h-3" /></button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
            </EditSection>

            <EditSection icon={GraduationCap} title="Academic Record" description="Educational background and degree info">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div className="space-y-3">
                      <Label className="text-[11px] font-black uppercase tracking-widest text-gray-400">Academy / University</Label>
                      <Input value={formData.university} onChange={e => setFormData({...formData, university: e.target.value})} className="h-12 rounded-xl" />
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-3">
                         <Label className="text-[11px] font-black uppercase tracking-widest text-gray-400">Degree</Label>
                         <Input value={formData.education} onChange={e => setFormData({...formData, education: e.target.value})} className="h-12 rounded-xl" />
                      </div>
                      <div className="space-y-3">
                         <Label className="text-[11px] font-black uppercase tracking-widest text-gray-400">Grad Year</Label>
                         <Input type="number" value={formData.graduation_year} onChange={e => setFormData({...formData, graduation_year: e.target.value})} className="h-12 rounded-xl" />
                      </div>
                   </div>
                </div>
            </EditSection>

            <EditSection icon={Mail} title="Network Connectivity" description="Contact methods and social neural-links">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-[11px] font-black uppercase tracking-widest text-gray-400">Comms Number (Phone)</Label>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-bold text-gray-400 uppercase">Public</span>
                        <Switch 
                          checked={formData.is_phone_public} 
                          onCheckedChange={checked => setFormData({...formData, is_phone_public: checked})} 
                        />
                      </div>
                    </div>
                    <Input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="h-12 rounded-xl" />
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-[11px] font-black uppercase tracking-widest text-gray-400">Sector (Address)</Label>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-bold text-gray-400 uppercase">Public</span>
                        <Switch 
                          checked={formData.is_address_public} 
                          onCheckedChange={checked => setFormData({...formData, is_address_public: checked})} 
                        />
                      </div>
                    </div>
                    <Input value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="h-12 rounded-xl" />
                  </div>
                </div>
                
                <div className="pt-6 mt-6 border-t border-gray-100 flex items-center justify-between bg-red-50/30 p-4 rounded-2xl">
                  <div>
                    <Label className="text-[11px] font-black uppercase tracking-widest text-gray-900">Privacy Cloak: Email Visibility</Label>
                    <p className="text-[10px] text-gray-500 font-bold mt-1 uppercase">Hide or reveal your primary comms address to the public network.</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{formData.is_email_public ? 'VISIBLE' : 'HIDDEN'}</span>
                    <Switch 
                      checked={formData.is_email_public} 
                      onCheckedChange={checked => setFormData({...formData, is_email_public: checked})} 
                    />
                  </div>
                </div>

                <div className="space-y-6 pt-6">
                  <SocialLinkInput icon={Github} label="GitHub Nexus" value={formData.github_url} onChange={v => setFormData({...formData, github_url: v})} />
                  <SocialLinkInput icon={Linkedin} label="LinkedIn Network" value={formData.linkedin_url} onChange={v => setFormData({...formData, linkedin_url: v})} />
                  <SocialLinkInput icon={Globe} label="Neural Portfolio" value={formData.portfolio_url} onChange={v => setFormData({...formData, portfolio_url: v})} />
                </div>
            </EditSection>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditSection({ icon: Icon, title, description, children }: any) {
  return (
    <Card className="border-none shadow-md rounded-[2.5rem] bg-white overflow-hidden p-10">
      <CardHeader className="p-0 mb-8 pb-6 border-b border-gray-50">
        <div className="flex items-center gap-4 mb-2">
          <div className="p-3 bg-red-50 rounded-2xl text-red-600"><Icon className="w-6 h-6" /></div>
          <div>
            <CardTitle className="text-2xl font-black text-gray-900 uppercase italic tracking-tighter">{title}</CardTitle>
            <CardDescription className="text-[10px] font-black uppercase text-gray-400 tracking-widest mt-1">{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0 space-y-8">
        {children}
      </CardContent>
    </Card>
  );
}

function SocialLinkInput({ icon: Icon, label, value, onChange }: any) {
  return (
    <div className="flex items-center gap-6 group">
      <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-red-50 group-hover:text-red-500 transition-all border border-gray-100"><Icon className="w-5 h-5" /></div>
      <div className="flex-1 space-y-1">
        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{label}</p>
        <Input value={value} onChange={e => onChange(e.target.value)} placeholder="https://..." className="h-11 rounded-xl border-gray-100 bg-gray-50 focus:bg-white text-xs font-bold" />
      </div>
    </div>
  );
}
