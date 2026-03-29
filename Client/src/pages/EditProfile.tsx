import { useEffect, useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { profileService, authService } from '@/services';
import { ApiError } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
  Trash2,
  Plus
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
      toast({ title: 'Success', description: 'Profile photo updated!' });
    } catch (error: any) {
      toast({ title: 'Failed', description: error.message, variant: 'destructive' });
    } finally {
      setIsUploading(false);
    }
  };

  const handleBannerChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingBanner(true);
    try {
      const response = await profileService.uploadBanner(file);
      setFormData(prev => ({ ...prev, banner_url: response.banner_url }));
      toast({ title: 'Success', description: 'Banner updated!' });
    } catch (error: any) {
      toast({ title: 'Upload Failed', description: error.message, variant: 'destructive' });
    } finally {
      setIsUploadingBanner(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const submissionData = {
        ...formData,
        graduation_year: formData.graduation_year ? parseInt(formData.graduation_year) : null,
        skills: formData.skills,
        interests: formData.interests,
      };

      await profileService.update(submissionData);
      toast({ title: 'Success', description: 'Profile updated successfully!' });
      navigate('/profile');
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddSkill = () => {
    const skill = skillInput.trim();
    if (skill && !formData.skills.includes(skill)) {
      setFormData(prev => ({ ...prev, skills: [...prev.skills, skill] }));
      setSkillInput('');
    }
  };

  const handleAddInterest = () => {
    const interest = interestInput.trim();
    if (interest && !formData.interests.includes(interest)) {
      setFormData(prev => ({ ...prev, interests: [...prev.interests, interest] }));
      setInterestInput('');
    }
  };

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Loader2 className="h-10 w-10 animate-spin text-gray-400" />
    </div>
  );

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      <main className="max-w-4xl mx-auto px-4 py-24">
        <div className="flex items-center justify-between mb-8 pb-6 border-b border-gray-100">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Personal Information</h1>
            <p className="text-gray-500 mt-1">Update your profile details and preferences</p>
          </div>
          <Link to="/profile">
            <Button variant="ghost" className="text-gray-500 hover:text-gray-900">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Profile
            </Button>
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="space-y-12">
          {/* Visual Identity Section */}
          <section className="space-y-6">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Visual Identity</h2>
            
            <div className="flex flex-col md:flex-row gap-8 items-start">
              <div className="relative group">
                <Avatar className="h-32 w-32 border-4 border-white shadow-lg">
                  <AvatarImage src={formData.avatar_url} className="object-cover" />
                  <AvatarFallback className="bg-gray-100 text-2xl font-medium text-gray-400">
                    {formData.username?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <button 
                  type="button" 
                  onClick={handleAvatarClick}
                  className="absolute bottom-0 right-0 p-2 bg-white border border-gray-200 rounded-full shadow-md text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                </button>
                <input type="file" ref={fileInputRef} onChange={handleAvatarChange} className="hidden" accept="image/*" />
              </div>

              <div className="flex-1 w-full">
                <div className="relative h-32 w-full bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden group">
                  {formData.banner_url ? (
                    <img src={formData.banner_url} className="w-full h-full object-cover" alt="Banner" />
                  ) : (
                    <div className="text-gray-400 flex flex-col items-center">
                      <Plus className="h-6 w-6 mb-1" />
                      <span className="text-xs font-medium">Add Profile Banner</span>
                    </div>
                  )}
                  <button 
                    type="button" 
                    onClick={handleBannerClick}
                    className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                  >
                    <span className="bg-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm">
                      {isUploadingBanner ? 'Uploading...' : 'Change Banner'}
                    </span>
                  </button>
                  <input type="file" ref={bannerInputRef} onChange={handleBannerChange} className="hidden" accept="image/*" />
                </div>
              </div>
            </div>
          </section>

          {/* Core Info Section */}
          <section className="space-y-6">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Basic Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="full_name" className="text-sm font-medium text-gray-700">Full Name</Label>
                <Input id="full_name" value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} placeholder="e.g. Jane Doe" className="h-11 border-gray-200 focus:ring-1 focus:ring-gray-900" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm font-medium text-gray-700">Username</Label>
                <Input id="username" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value.toLowerCase()})} placeholder="jane_doe" className="h-11 border-gray-200 focus:ring-1 focus:ring-gray-900" />
              </div>
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="bio" className="text-sm font-medium text-gray-700">Bio</Label>
                <Textarea id="bio" value={formData.bio} onChange={e => setFormData({...formData, bio: e.target.value})} placeholder="Tell us a bit about yourself..." className="min-h-[100px] border-gray-200 focus:ring-1 focus:ring-gray-900 resize-none" />
              </div>
            </div>
          </section>

          {/* Professional Section */}
          <section className="space-y-6">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Professional Info</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="university" className="text-sm font-medium text-gray-700">University / Institution</Label>
                <Input id="university" value={formData.university} onChange={e => setFormData({...formData, university: e.target.value})} placeholder="e.g. Stanford University" className="h-11 border-gray-200" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="education" className="text-sm font-medium text-gray-700">Major/Degree</Label>
                  <Input id="education" value={formData.education} onChange={e => setFormData({...formData, education: e.target.value})} placeholder="B.S. CS" className="h-11 border-gray-200" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="grad_year" className="text-sm font-medium text-gray-700">Grad Year</Label>
                  <Input id="grad_year" type="number" value={formData.graduation_year} onChange={e => setFormData({...formData, graduation_year: e.target.value})} placeholder="2025" className="h-11 border-gray-200" />
                </div>
              </div>
              
              <div className="space-y-4">
                <Label className="text-sm font-medium text-gray-700">Skills</Label>
                <div className="flex gap-2">
                  <Input value={skillInput} onChange={e => setSkillInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())} placeholder="Add a skill..." className="h-10 border-gray-200" />
                  <Button type="button" onClick={handleAddSkill} variant="outline" size="icon" className="h-10 w-10 shrink-0"><Plus className="h-4 w-4" /></Button>
                </div>
                <div className="flex flex-wrap gap-2 min-h-[44px] p-2 bg-gray-50 rounded-lg">
                  {formData.skills.map(s => (
                    <Badge key={s} variant="secondary" className="bg-white border-gray-200 text-gray-700 px-3 py-1 flex gap-2 items-center">
                      {s}
                      <button type="button" onClick={() => setFormData(p => ({...p, skills: p.skills.filter(x => x !== s)}))} className="hover:text-red-500">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <Label className="text-sm font-medium text-gray-700">Interests</Label>
                <div className="flex gap-2">
                  <Input value={interestInput} onChange={e => setInterestInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddInterest())} placeholder="Add interest..." className="h-10 border-gray-200" />
                  <Button type="button" onClick={handleAddInterest} variant="outline" size="icon" className="h-10 w-10 shrink-0"><Plus className="h-4 w-4" /></Button>
                </div>
                <div className="flex flex-wrap gap-2 min-h-[44px] p-2 bg-gray-50 rounded-lg">
                  {formData.interests.map(i => (
                    <Badge key={i} variant="outline" className="bg-white border-gray-200 text-gray-600 px-3 py-1 flex gap-2 items-center">
                      {i}
                      <button type="button" onClick={() => setFormData(p => ({...p, interests: p.interests.filter(x => x !== i)}))} className="hover:text-red-500">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Contact & Social Section */}
          <section className="space-y-6">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Contact & Social</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="phone" className="text-sm font-medium text-gray-700">Phone Number</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">Public</span>
                    <Switch checked={formData.is_phone_public} onCheckedChange={c => setFormData({...formData, is_phone_public: c})} />
                  </div>
                </div>
                <Input id="phone" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="+1 (555) 000-0000" className="h-11 border-gray-200" />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="address" className="text-sm font-medium text-gray-700">Location</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">Public</span>
                    <Switch checked={formData.is_address_public} onCheckedChange={c => setFormData({...formData, is_address_public: c})} />
                  </div>
                </div>
                <Input id="address" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} placeholder="City, Country" className="h-11 border-gray-200" />
              </div>

              <div className="md:col-span-2 p-4 bg-gray-50 rounded-xl flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-900">Email Visibility</p>
                  <p className="text-xs text-gray-500">Allow others to see your registered email address</p>
                </div>
                <Switch checked={formData.is_email_public} onCheckedChange={c => setFormData({...formData, is_email_public: c})} />
              </div>

              <SocialInput icon={Github} label="GitHub URL" value={formData.github_url} onChange={v => setFormData({...formData, github_url: v})} />
              <SocialInput icon={Linkedin} label="LinkedIn URL" value={formData.linkedin_url} onChange={v => setFormData({...formData, linkedin_url: v})} />
              <SocialInput icon={Globe} label="Portfolio URL" value={formData.portfolio_url} onChange={v => setFormData({...formData, portfolio_url: v})} />
            </div>
          </section>

          {/* Action Footer */}
          <div className="pt-10 border-t border-gray-100 flex flex-col md:flex-row gap-4 justify-end items-center">
            <Link to="/profile" className="w-full md:w-auto">
              <Button type="button" variant="ghost" className="w-full md:w-auto text-gray-400">Cancel</Button>
            </Link>
            <Button type="submit" disabled={isSaving} className="w-full md:w-80 h-12 bg-gray-900 hover:bg-black text-white rounded-xl shadow-lg shadow-gray-200 transition-all">
              {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <span>Update Profile</span>}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}

function SocialInput({ icon: Icon, label, value, onChange }: any) {
  return (
    <div className="space-y-2">
      <Label className="text-xs font-semibold text-gray-500 flex items-center gap-2">
        <Icon className="h-3 w-3" /> {label}
      </Label>
      <Input value={value} onChange={e => onChange(e.target.value)} placeholder="https://..." className="h-11 border-gray-200 bg-gray-50/50 focus:bg-white text-sm" />
    </div>
  );
}
