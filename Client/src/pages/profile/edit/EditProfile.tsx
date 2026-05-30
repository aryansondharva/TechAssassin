import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, useUser } from '@clerk/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { profileService } from '@/services';
import type { Profile as ProfileType } from '@/types/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { 
  Loader2, Save, Upload, User, MapPin, Link as LinkIcon, 
  Github, Linkedin, Twitter, Briefcase, GraduationCap
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const profileSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  username: z.string().min(3, 'Username must be at least 3 characters'),
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
  github_url: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  linkedin_url: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  twitter_url: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  portfolio_url: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  address: z.string().optional(),
  university: z.string().optional(),
  degree_type: z.string().optional(),
  graduation_year: z.coerce.number().optional().or(z.literal('')),
  is_email_public: z.boolean(),
  is_address_public: z.boolean(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function EditProfile() {
  const navigate = useNavigate();
  const { isLoaded, userId } = useAuth();
  const { user } = useUser();
  
  const [profile, setProfile] = useState<ProfileType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);

  const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      is_email_public: false,
      is_address_public: false,
    }
  });

  const isEmailPublic = watch('is_email_public');
  const isAddressPublic = watch('is_address_public');

  useEffect(() => {
    if (!isLoaded) return;
    if (!userId) {
      navigate('/signin');
      return;
    }

    const fetchProfile = async () => {
      try {
        const data = await profileService.getMyProfile();
        setProfile(data);
        reset({
          full_name: data.full_name || '',
          username: user?.username || data.username || '',
          bio: data.bio || '',
          github_url: data.github_url || '',
          linkedin_url: data.linkedin_url || '',
          twitter_url: data.twitter_url || '',
          portfolio_url: data.portfolio_url || '',
          address: data.address || '',
          university: data.university || '',
          degree_type: data.degree_type || '',
          graduation_year: data.graduation_year || undefined,
          is_email_public: data.is_email_public || false,
          is_address_public: data.is_address_public || false,
        });
      } catch (err: any) {
        console.error('Failed to fetch profile:', err);
        toast({ title: 'Error', description: 'Failed to load profile data', variant: 'destructive' });
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [isLoaded, userId, navigate, reset]);

  const onSubmit = async (data: ProfileFormValues) => {
    setIsSaving(true);
    try {
      await profileService.update({
        ...data,
        graduation_year: data.graduation_year ? Number(data.graduation_year) : undefined
      });
      toast({ title: 'Success', description: 'Profile updated successfully' });
      navigate('/profile');
    } catch (err: any) {
      toast({ title: 'Update Failed', description: err.message, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'banner') => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (type === 'avatar') setIsUploadingAvatar(true);
    else setIsUploadingBanner(true);

    try {
      if (type === 'avatar') {
        const res = await profileService.uploadAvatar(file);
        setProfile(prev => prev ? { ...prev, avatar_url: res.avatar_url } : null);
        toast({ title: 'Success', description: 'Avatar updated successfully' });
      } else {
        const res = await profileService.uploadBanner(file);
        setProfile(prev => prev ? { ...prev, banner_url: res.banner_url } : null);
        toast({ title: 'Success', description: 'Banner updated successfully' });
      }
    } catch (err: any) {
      toast({ title: 'Upload Failed', description: err.message, variant: 'destructive' });
    } finally {
      if (type === 'avatar') setIsUploadingAvatar(false);
      else setIsUploadingBanner(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
        <Navbar dark={false} />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-red-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      <Navbar dark={false} />
      
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 pt-24 pb-20">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Edit Dossier</h1>
          <p className="text-slate-500 font-medium">Update your tactical information and public presence.</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Images Section */}
          <Card className="rounded-[2rem] border-slate-200/60 shadow-sm overflow-hidden">
            <div className="relative h-48 bg-slate-900 group">
              {profile?.banner_url ? (
                <img src={profile.banner_url} alt="Banner" className="w-full h-full object-cover opacity-80" />
              ) : (
                <div className="w-full h-full bg-gradient-to-tr from-slate-900 via-slate-800 to-red-900/20" />
              )}
              
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                <label className="cursor-pointer bg-white/20 hover:bg-white/30 backdrop-blur-md text-white px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest flex items-center gap-2 transition-colors">
                  {isUploadingBanner ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  Change Cover
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'banner')} disabled={isUploadingBanner} />
                </label>
              </div>
            </div>

            <CardContent className="p-8 pt-0 relative">
              <div className="absolute -top-16 left-8 group">
                <Avatar className="w-32 h-32 border-4 border-white bg-white shadow-xl relative z-10">
                  <AvatarImage src={profile?.avatar_url || ''} className="object-cover" />
                  <AvatarFallback className="text-4xl bg-slate-100 text-slate-400 font-black">
                    {profile?.username?.charAt(0).toUpperCase() || '?'}
                  </AvatarFallback>
                </Avatar>
                <label className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                  {isUploadingAvatar ? (
                    <Loader2 className="w-6 h-6 text-white animate-spin" />
                  ) : (
                    <Upload className="w-6 h-6 text-white" />
                  )}
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'avatar')} disabled={isUploadingAvatar} />
                </label>
              </div>
              
              <div className="mt-20 pt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="full_name" className="text-slate-700 font-bold uppercase tracking-wider text-xs">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input id="full_name" {...register('full_name')} className="pl-10 bg-slate-50 border-slate-200" />
                  </div>
                  {errors.full_name && <p className="text-xs text-red-500">{errors.full_name.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="username" className="text-slate-700 font-bold uppercase tracking-wider text-xs">Callsign (Username)</Label>
                  <Input id="username" {...register('username')} className="bg-slate-100 border-slate-200 text-slate-500" readOnly />
                  <p className="text-[10px] text-slate-400 mt-1">Username is synced from your Clerk account settings.</p>
                  {errors.username && <p className="text-xs text-red-500">{errors.username.message}</p>}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* About Section */}
          <Card className="rounded-[2rem] border-slate-200/60 shadow-sm">
            <CardContent className="p-8 space-y-6">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2 border-b border-slate-100 pb-4">
                <Briefcase className="w-4 h-4" /> Professional Intel
              </h3>

              <div className="space-y-2">
                <Label htmlFor="bio" className="text-slate-700 font-bold uppercase tracking-wider text-xs">Short Bio</Label>
                <Textarea 
                  id="bio" 
                  {...register('bio')} 
                  placeholder="Tell the community about yourself..." 
                  className="bg-slate-50 border-slate-200 min-h-[100px] resize-none"
                />
                {errors.bio && <p className="text-xs text-red-500">{errors.bio.message}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="university" className="text-slate-700 font-bold uppercase tracking-wider text-xs">University / Org</Label>
                  <div className="relative">
                    <GraduationCap className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input id="university" {...register('university')} className="pl-10 bg-slate-50 border-slate-200" />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="degree_type" className="text-slate-700 font-bold uppercase tracking-wider text-xs">Degree / Role</Label>
                  <Input id="degree_type" {...register('degree_type')} className="bg-slate-50 border-slate-200" />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="graduation_year" className="text-slate-700 font-bold uppercase tracking-wider text-xs">Graduation Year</Label>
                  <Input id="graduation_year" type="number" {...register('graduation_year')} className="bg-slate-50 border-slate-200" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address" className="text-slate-700 font-bold uppercase tracking-wider text-xs">Location</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input id="address" {...register('address')} className="pl-10 bg-slate-50 border-slate-200" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Social Links */}
          <Card className="rounded-[2rem] border-slate-200/60 shadow-sm">
            <CardContent className="p-8 space-y-6">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2 border-b border-slate-100 pb-4">
                <LinkIcon className="w-4 h-4" /> Digital Footprint
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="github_url" className="text-slate-700 font-bold uppercase tracking-wider text-xs">GitHub URL</Label>
                  <div className="relative">
                    <Github className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input id="github_url" {...register('github_url')} placeholder="https://github.com/..." className="pl-10 bg-slate-50 border-slate-200" />
                  </div>
                  {errors.github_url && <p className="text-xs text-red-500">{errors.github_url.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="linkedin_url" className="text-slate-700 font-bold uppercase tracking-wider text-xs">LinkedIn URL</Label>
                  <div className="relative">
                    <Linkedin className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input id="linkedin_url" {...register('linkedin_url')} placeholder="https://linkedin.com/in/..." className="pl-10 bg-slate-50 border-slate-200" />
                  </div>
                  {errors.linkedin_url && <p className="text-xs text-red-500">{errors.linkedin_url.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="twitter_url" className="text-slate-700 font-bold uppercase tracking-wider text-xs">X (Twitter) URL</Label>
                  <div className="relative">
                    <Twitter className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input id="twitter_url" {...register('twitter_url')} placeholder="https://x.com/..." className="pl-10 bg-slate-50 border-slate-200" />
                  </div>
                  {errors.twitter_url && <p className="text-xs text-red-500">{errors.twitter_url.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="portfolio_url" className="text-slate-700 font-bold uppercase tracking-wider text-xs">Portfolio URL</Label>
                  <div className="relative">
                    <LinkIcon className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input id="portfolio_url" {...register('portfolio_url')} placeholder="https://..." className="pl-10 bg-slate-50 border-slate-200" />
                  </div>
                  {errors.portfolio_url && <p className="text-xs text-red-500">{errors.portfolio_url.message}</p>}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Privacy Settings */}
          <Card className="rounded-[2rem] border-slate-200/60 shadow-sm bg-slate-50">
            <CardContent className="p-8 space-y-6">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-4">Privacy Controls</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="is_email_public" className="text-base font-medium">Public Email</Label>
                    <p className="text-sm text-slate-500">Allow others to see your email address on your profile.</p>
                  </div>
                  <Switch
                    id="is_email_public"
                    checked={isEmailPublic}
                    onCheckedChange={(val) => setValue('is_email_public', val, { shouldDirty: true })}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="is_address_public" className="text-base font-medium">Public Location</Label>
                    <p className="text-sm text-slate-500">Display your location to the community.</p>
                  </div>
                  <Switch
                    id="is_address_public"
                    checked={isAddressPublic}
                    onCheckedChange={(val) => setValue('is_address_public', val, { shouldDirty: true })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4 pt-4 border-t border-slate-200">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => navigate('/profile')}
              className="rounded-full px-6 uppercase tracking-widest text-xs font-bold"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSaving}
              className="bg-red-600 hover:bg-red-700 text-white rounded-full px-8 shadow-lg shadow-red-600/20 uppercase tracking-widest text-xs font-bold flex items-center gap-2"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Changes
            </Button>
          </div>
        </form>
      </main>
      <Footer />
    </div>
  );
}
