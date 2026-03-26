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
  ShieldCheck
} from 'lucide-react';
import type { Profile } from '@/types/api';
import Navbar from '@/components/Navbar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

export default function EditProfile() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  const [formData, setFormData] = useState({
    username: '',
    full_name: '',
    bio: '',
    skills: [] as string[],
    github_url: '',
    linkedin_url: '',
    portfolio_url: '',
    phone: '',
    address: '',
    university: '',
    education: '',
    graduation_year: '',
    avatar_url: '',
  });

  const [skillInput, setSkillInput] = useState('');

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
        github_url: data.github_url || '',
        linkedin_url: data.linkedin_url || '',
        portfolio_url: data.portfolio_url || '',
        phone: data.phone || '',
        address: data.address || '',
        university: data.university || '',
        education: data.education || '',
        graduation_year: data.graduation_year?.toString() || '',
        avatar_url: data.avatar_url || '',
      });
    } catch (error) {
      if (error instanceof ApiError && error.status !== 404) {
        toast({
          title: 'Error',
          description: 'Failed to load profile data',
          variant: 'destructive',
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: 'Error',
        description: 'Image size should be less than 2MB',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);
    try {
      const response = await profileService.uploadAvatar(file);
      setFormData(prev => ({ ...prev, avatar_url: response.avatar_url }));
      toast({
        title: 'Success',
        description: 'Avatar uploaded successfully!',
      });
    } catch (error: any) {
      toast({
        title: 'Upload Failed',
        description: error.message || 'Failed to upload image',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.username.trim()) {
      toast({ title: 'Error', description: 'Username is required', variant: 'destructive' });
      return;
    }

    setIsSaving(true);
    try {
      await profileService.update({
        ...formData,
        graduation_year: formData.graduation_year ? parseInt(formData.graduation_year) : undefined
      });
      toast({ title: 'Success', description: 'Profile updated successfully! 🎉' });
      navigate('/profile');
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Update failed', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddSkill = () => {
    if (skillInput.trim() && !formData.skills.includes(skillInput.trim())) {
      setFormData({
        ...formData,
        skills: [...formData.skills, skillInput.trim()],
      });
      setSkillInput('');
    }
  };

  const handleRemoveSkill = (skill: string) => {
    setFormData({
      ...formData,
      skills: formData.skills.filter(s => s !== skill),
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <Navbar />
      
      <div className="max-w-5xl mx-auto px-4 pt-28 pb-20">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Edit Profile</h1>
            <p className="text-gray-500 mt-1">Customize your public presence on TechAssassin</p>
          </div>
          <Link to="/profile">
            <Button variant="outline" className="group">
              <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
              View Profile
            </Button>
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Avatar & Personal Info Summary */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="border-none shadow-sm overflow-hidden">
              <div className="h-24 bg-gradient-to-r from-red-600 to-red-500"></div>
              <CardContent className="relative pt-0 pb-6 text-center">
                <div className="relative inline-block -mt-12 mb-4 group">
                  <Avatar className="h-24 w-24 border-4 border-white shadow-md cursor-pointer ring-offset-2 ring-primary/20 transition-all hover:ring-2">
                    <AvatarImage src={formData.avatar_url} />
                    <AvatarFallback className="bg-gray-100 text-2xl font-bold border-none">
                      {formData.full_name?.charAt(0) || formData.username?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <button 
                    type="button"
                    onClick={handleAvatarClick}
                    disabled={isUploading}
                    className="absolute bottom-0 right-0 p-2 bg-white rounded-full shadow-lg border border-gray-100 text-primary hover:bg-gray-50 transition-colors"
                  >
                    {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                  </button>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleAvatarChange} 
                    className="hidden" 
                    accept="image/*" 
                  />
                </div>
                <h3 className="text-xl font-bold text-gray-900">{formData.full_name || formData.username}</h3>
                <p className="text-sm text-gray-500">{formData.university || 'TechAssassin Community'}</p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm">
              <CardHeader className="pb-3 border-b border-gray-50">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-red-500" />
                  Profile Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-3">
                <Button 
                  type="submit" 
                  className="w-full bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-500/20 py-6 font-semibold"
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Saving Changes...</>
                  ) : (
                    <><Save className="mr-2 h-5 w-5" /> Save Changes</>
                  )}
                </Button>
                <Link to="/profile">
                  <Button type="button" variant="ghost" className="w-full text-gray-500" disabled={isSaving}>
                    Cancel
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Form Sections */}
          <div className="lg:col-span-2 space-y-8">
            {/* Basic Information */}
            <Card className="border-none shadow-sm">
              <CardHeader className="border-b border-gray-50">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <User className="h-5 w-5 text-red-600" />
                  Basic Information
                </CardTitle>
                <CardDescription>Update your name, username, and professional bio</CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="full_name" className="text-sm font-semibold">Full Name</Label>
                    <Input
                      id="full_name"
                      placeholder="e.g. John Doe"
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      className="h-11 border-gray-200 focus:border-red-500 transition-colors"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="username" className="text-sm font-semibold">Username *</Label>
                    <Input
                      id="username"
                      placeholder="e.g. johndoe_25"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      required
                      className="h-11 border-gray-200 focus:border-red-500 font-medium"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio" className="text-sm font-semibold">Short Bio</Label>
                  <Textarea
                    id="bio"
                    placeholder="Tell the community about your journey and skills..."
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    rows={4}
                    className="resize-none border-gray-200 focus:border-red-500"
                  />
                  <p className="text-xs text-gray-400 text-right">Maximum 500 characters</p>
                </div>
              </CardContent>
            </Card>

            {/* Professional Background */}
            <Card className="border-none shadow-sm">
              <CardHeader className="border-b border-gray-50">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <GraduationCap className="h-5 w-5 text-red-600" />
                  Professional Background
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="university" className="text-sm font-semibold">University / Institution</Label>
                    <Input
                      id="university"
                      placeholder="e.g. Stanford University"
                      value={formData.university}
                      onChange={(e) => setFormData({ ...formData, university: e.target.value })}
                      className="h-11"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="education" className="text-sm font-semibold">Degree</Label>
                      <Input
                        id="education"
                        placeholder="e.g. B.Tech"
                        value={formData.education}
                        onChange={(e) => setFormData({ ...formData, education: e.target.value })}
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="graduation_year" className="text-sm font-semibold">Year</Label>
                      <Input
                        id="graduation_year"
                        type="number"
                        placeholder="2025"
                        value={formData.graduation_year}
                        onChange={(e) => setFormData({ ...formData, graduation_year: e.target.value })}
                        className="h-11"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-sm font-semibold block">Skills & Expertise</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter skill (e.g., React, Python)"
                      value={skillInput}
                      onChange={(e) => setSkillInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
                      className="h-11"
                    />
                    <Button type="button" onClick={handleAddSkill} className="h-11 px-4 bg-gray-900">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 min-h-[40px] p-3 bg-gray-50/50 rounded-lg border border-dashed border-gray-200">
                    {formData.skills.map((skill) => (
                      <Badge 
                        key={skill} 
                        variant="secondary" 
                        className="bg-white text-gray-700 border-gray-200 pl-3 pr-1 py-1 hover:bg-red-50 hover:text-red-700 transition-colors"
                      >
                        {skill}
                        <button type="button" onClick={() => handleRemoveSkill(skill)} className="ml-1 p-1 rounded-full hover:bg-red-100">
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                    {formData.skills.length === 0 && (
                      <span className="text-xs text-gray-400 italic">No skills added yet</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Contact & Social */}
            <Card className="border-none shadow-sm">
              <CardHeader className="border-b border-gray-50">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <Mail className="h-5 w-5 text-red-600" />
                  Connect & Social
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-sm font-semibold flex items-center gap-2">
                      <Phone className="h-3 w-3" /> Phone Number
                    </Label>
                    <Input
                      id="phone"
                      placeholder="+91 XXXXX XXXXX"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address" className="text-sm font-semibold flex items-center gap-2">
                      <MapPin className="h-3 w-3" /> Location
                    </Label>
                    <Input
                      id="address"
                      placeholder="e.g. Mumbai, India"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="h-11"
                    />
                  </div>
                </div>

                <div className="space-y-4 pt-2">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center">
                      <Github className="h-5 w-5 text-gray-700" />
                    </div>
                    <Input
                      placeholder="GitHub Profile URL"
                      value={formData.github_url}
                      onChange={(e) => setFormData({ ...formData, github_url: e.target.value })}
                      className="h-11 flex-1"
                    />
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-lg bg-[#0077b5]/10 flex items-center justify-center">
                      <Linkedin className="h-5 w-5 text-[#0077b5]" />
                    </div>
                    <Input
                      placeholder="LinkedIn Profile URL"
                      value={formData.linkedin_url}
                      onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
                      className="h-11 flex-1"
                    />
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-lg bg-red-100 flex items-center justify-center">
                      <Globe className="h-5 w-5 text-red-600" />
                    </div>
                    <Input
                      placeholder="Portfolio / Personal Website"
                      value={formData.portfolio_url}
                      onChange={(e) => setFormData({ ...formData, portfolio_url: e.target.value })}
                      className="h-11 flex-1"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </form>
      </div>
    </div>
  );
}
