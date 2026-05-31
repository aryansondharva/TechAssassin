import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth, useUser } from '@clerk/react';
import { profileService } from '@/services';
import type { Profile as ProfileType } from '@/types/api';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import {
  Loader2, MapPin, Github, Linkedin, Twitter,
  GraduationCap, Calendar, Mail, ExternalLink, Shield,
  Edit3, Heart, FileText, Home, Link2, Briefcase
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function Profile() {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const { isLoaded, userId } = useAuth();
  const { user } = useUser();

  const [profile, setProfile] = useState<ProfileType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isOwnProfile = !username;

  // Clerk fallbacks
  const clerkFullName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || '';
  const clerkAvatar = user?.imageUrl || '';
  const clerkUsername = user?.username || '';

  useEffect(() => {
    if (!isLoaded) return;

    if (!userId) {
      // Pass the current path as redirectUrl so Clerk brings them back after signing in
      const currentPath = window.location.pathname;
      navigate(`/signin?redirect_url=${encodeURIComponent(currentPath)}`);
      return;
    }

    const fetchProfile = async () => {
      try {
        setIsLoading(true);
        setError(null);
        let data: ProfileType;

        if (username) {
          data = await profileService.getByUsername(username);
        } else {
          data = await profileService.getMyProfile();
        }

        setProfile(data);
      } catch (err: any) {
        console.error('Failed to fetch profile:', err);
        setError(err.message || 'Failed to load profile');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [username, isLoaded, userId, isOwnProfile, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <Navbar dark={false} />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-red-600" />
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <Navbar dark={false} />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <Shield className="w-16 h-16 text-slate-300 mb-4" />
          <h2 className="text-2xl font-black text-slate-900 mb-2 uppercase tracking-tight">Profile Not Found</h2>
          <p className="text-slate-500 mb-6">{error || "This operative's dossier could not be located."}</p>
          <Button onClick={() => navigate('/')} className="bg-slate-900 text-white rounded-full px-8 hover:bg-slate-800">
            Return to Base
          </Button>
        </div>
      </div>
    );
  }

  // Resolve display values
  const displayName = profile.full_name || (isOwnProfile ? clerkFullName : '') || profile.username;
  const displayAvatar = profile.avatar_url || (isOwnProfile ? clerkAvatar : '');
  const displayUsername = profile.username || (isOwnProfile ? clerkUsername : '');
  const hasSkills = profile.skills && profile.skills.length > 0;
  const hasInterests = profile.interests && profile.interests.length > 0;
  const hasRoles = profile.roles && profile.roles.length > 0;
  const hasLinks = profile.github_url || profile.linkedin_url || profile.twitter_url || profile.portfolio_url;
  const hasOtherLinks = !!(profile.linkedin_url || profile.twitter_url || profile.portfolio_url);
  const hasEducation = profile.university || profile.degree_type || profile.graduation_year;

  // Social icon buttons
  const socialLinks = [
    { url: profile.github_url, icon: Github, label: 'GitHub', hoverColor: 'hover:text-slate-900' },
    { url: profile.linkedin_url, icon: Linkedin, label: 'LinkedIn', hoverColor: 'hover:text-[#0A66C2]' },
    { url: profile.twitter_url, icon: Twitter, label: 'X', hoverColor: 'hover:text-black' },
    { url: profile.portfolio_url, icon: ExternalLink, label: 'Portfolio', hoverColor: 'hover:text-red-600' },
  ].filter(l => l.url);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar dark={false} />

      {/* ── Profile Header ── */}
      <header className="border-b border-slate-200 bg-white pt-24 pb-6">
        <div className="max-w-4xl mx-auto w-full px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row gap-6 items-start">
            {/* Avatar */}
            <Avatar className="w-28 h-28 sm:w-32 sm:h-32 border-2 border-slate-200 bg-white shadow-sm shrink-0">
              <AvatarImage src={displayAvatar} alt={displayName} className="object-cover" />
              <AvatarFallback className="text-4xl bg-slate-100 text-slate-400 font-black">
                {displayName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            {/* Info */}
            <div className="flex-1 min-w-0">
              {/* Row 1: Name + social icons + edit */}
              <div className="flex flex-wrap items-center gap-3 mb-1">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight uppercase leading-none">
                  {displayName}
                </h1>

                {/* Social icons inline */}
                {socialLinks.length > 0 && (
                  <div className="flex items-center gap-1 ml-auto sm:ml-2">
                    {socialLinks.map(({ url, icon: Icon, label, hoverColor }) => (
                      <a
                        key={label}
                        href={url!}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={label}
                        className={`w-9 h-9 flex items-center justify-center rounded-lg border border-slate-200 text-slate-400 ${hoverColor} hover:border-slate-300 transition-colors`}
                      >
                        <Icon className="w-4 h-4" />
                      </a>
                    ))}
                  </div>
                )}

                {isOwnProfile && (
                  <Button
                    onClick={() => navigate('/edit-profile')}
                    variant="outline"
                    className="rounded-lg text-xs font-semibold px-4 py-2 border-slate-200 hover:bg-slate-50 ml-auto sm:ml-0"
                  >
                    Edit Profile
                  </Button>
                )}
              </div>

              {/* Row 2: @username */}
              <p className="text-slate-500 text-sm mb-2">@{displayUsername}</p>

              {/* Row 3: Bio */}
              {profile.bio && (
                <p className="text-slate-700 text-sm leading-relaxed mb-3 max-w-xl">{profile.bio}</p>
              )}

              {/* Row 4: Skills as outlined pills */}
              {hasSkills && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {profile.skills!.map(skill => (
                    <span
                      key={skill}
                      className="px-3 py-1 text-xs font-medium border border-slate-300 rounded-full text-slate-700 bg-white"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              )}

              {/* Row 5: Location */}
              {profile.address && profile.is_address_public && (
                <div className="flex items-center gap-1.5 text-slate-500 text-sm">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{profile.address}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ── Tabs ── */}
      <main className="flex-1 bg-[#F5F5F5]">
        <Tabs defaultValue="home" className="w-full">
          {/* Tab bar */}
          <div className="bg-white border-b border-slate-200">
            <div className="max-w-4xl mx-auto w-full px-4 sm:px-6">
              <TabsList className="bg-transparent h-auto p-0 gap-0 rounded-none">
                <TabsTrigger
                  value="home"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-red-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-red-600 text-slate-500 font-bold text-xs uppercase tracking-widest px-5 py-3 transition-colors"
                >
                  <Home className="w-3.5 h-3.5 mr-1.5" />
                  Home
                </TabsTrigger>
                <TabsTrigger
                  value="about"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-red-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-red-600 text-slate-500 font-bold text-xs uppercase tracking-widest px-5 py-3 transition-colors"
                >
                  <Briefcase className="w-3.5 h-3.5 mr-1.5" />
                  About
                </TabsTrigger>
                {profile.readme && (
                  <TabsTrigger
                    value="readme"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-red-600 data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-red-600 text-slate-500 font-bold text-xs uppercase tracking-widest px-5 py-3 transition-colors"
                  >
                    <FileText className="w-3.5 h-3.5 mr-1.5" />
                    Readme
                  </TabsTrigger>
                )}
              </TabsList>
            </div>
          </div>

          {/* ───────── HOME TAB ───────── */}
          <TabsContent value="home" className="mt-0">
            <div className="max-w-4xl mx-auto w-full px-4 sm:px-6 py-8 space-y-6">

              {/* GitHub Section */}
              {profile.github_url && (
                <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                      <Github className="w-4 h-4" /> GitHub
                    </h3>
                    <a
                      href={profile.github_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-semibold border border-slate-200 rounded-lg px-4 py-2 text-slate-600 hover:bg-slate-50 transition-colors inline-flex items-center gap-1.5"
                    >
                      View on GitHub
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  {/* GitHub Profile Embed */}
                  <div className="flex items-center gap-4">
                    <img
                      src={`https://ghchart.rshah.org/dc2626/${profile.github_url.replace(/^https?:\/\/(www\.)?github\.com\//, '').replace(/\/.*$/, '')}`}
                      alt="GitHub contribution chart"
                      className="w-full rounded-lg"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  </div>
                </div>
              )}

              {/* Skills, Roles & Interests grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Skills */}
                {hasSkills && (
                  <div className="bg-white rounded-2xl border border-slate-200 p-6">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 mb-4">Technical Matrix</h3>
                    <div className="flex flex-wrap gap-2">
                      {profile.skills!.map(skill => (
                        <span key={skill} className="px-3 py-1.5 bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Roles */}
                {hasRoles && (
                  <div className="bg-white rounded-2xl border border-slate-200 p-6">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 mb-4">Roles</h3>
                    <div className="flex flex-wrap gap-2">
                      {profile.roles!.map(role => (
                        <span key={role} className="px-3 py-1.5 bg-red-50 text-red-700 text-xs font-bold uppercase tracking-wide rounded-lg border border-red-100">
                          {role}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Interests */}
              {hasInterests && (
                <div className="bg-white rounded-2xl border border-slate-200 p-6">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 mb-4 flex items-center gap-2">
                    <Heart className="w-3.5 h-3.5" /> Interests
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {profile.interests!.map(interest => (
                      <span key={interest} className="px-3 py-1.5 bg-amber-50 text-amber-700 text-xs font-semibold rounded-lg border border-amber-100">
                        {interest}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Network Links card */}
              {hasOtherLinks && (
                <div className="bg-white rounded-2xl border border-slate-200 p-6">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 mb-4 flex items-center gap-2">
                    <Link2 className="w-3.5 h-3.5" /> Network Links
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { url: profile.linkedin_url, icon: Linkedin, label: 'LinkedIn', color: 'hover:border-blue-400' },
                      { url: profile.twitter_url, icon: Twitter, label: 'X (Twitter)', color: 'hover:border-slate-400' },
                      { url: profile.portfolio_url, icon: ExternalLink, label: 'Portfolio', color: 'hover:border-red-400' },
                    ].filter(l => l.url).map(({ url, icon: Icon, label, color }) => (
                      <a
                        key={label}
                        href={url!}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`flex items-center gap-3 p-3 rounded-xl border border-slate-200 ${color} transition-colors group`}
                      >
                        <div className="w-9 h-9 rounded-lg bg-slate-50 flex items-center justify-center shrink-0 group-hover:bg-slate-100 transition-colors">
                          <Icon className="w-4 h-4 text-slate-500" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-700">{label}</p>
                          <p className="text-[11px] text-slate-400 truncate">{url!.replace(/^https?:\/\/(www\.)?/, '')}</p>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          {/* ───────── ABOUT TAB ───────── */}
          <TabsContent value="about" className="mt-8 outline-none animate-fade-in-up">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Left Column: Education/Background summary */}
              <div className="lg:col-span-4 space-y-6">
                <div className="bg-white rounded-3xl border border-slate-200/60 p-6 shadow-sm hover:shadow-md transition-all duration-300">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 mb-5 flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-red-500" /> Background Intel
                  </h3>
                  
                  <div className="space-y-5">
                    {hasEducation && (
                      <div className="flex gap-3">
                        <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                          <GraduationCap className="w-4.5 h-4.5 text-slate-400" />
                        </div>
                        <div>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Institution</p>
                          {profile.university && <p className="text-xs font-bold text-slate-800">{profile.university}</p>}
                          {profile.degree_type && <p className="text-[10px] text-slate-500 font-semibold">{profile.degree_type}</p>}
                          {profile.graduation_year && <p className="text-[9px] text-slate-400 font-bold mt-0.5">Class of {profile.graduation_year}</p>}
                        </div>
                      </div>
                    )}

                    {profile.address && profile.is_address_public && (
                      <div className="flex gap-3">
                        <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                          <MapPin className="w-4.5 h-4.5 text-slate-400" />
                        </div>
                        <div>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Location</p>
                          <span className="text-xs font-bold text-slate-800">{profile.address}</span>
                        </div>
                      </div>
                    )}

                    {profile.email && profile.is_email_public && (
                      <div className="flex gap-3">
                        <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                          <Mail className="w-4.5 h-4.5 text-slate-400" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Email Address</p>
                          <a href={`mailto:${profile.email}`} className="text-xs font-bold text-slate-800 hover:text-red-600 transition-colors truncate block">{profile.email}</a>
                        </div>
                      </div>
                    )}

                    {!hasEducation && !(profile.address && profile.is_address_public) && !(profile.email && profile.is_email_public) && (
                      <div className="text-center py-6 bg-slate-50/50 border border-dashed border-slate-200 rounded-2xl">
                        <p className="text-slate-400 text-xs font-semibold mb-3">No background info added yet</p>
                        {isOwnProfile && (
                          <Button onClick={() => navigate('/edit-profile')} variant="outline" size="sm" className="rounded-xl text-[10px] font-black uppercase tracking-wider px-4 py-2 border-slate-200 hover:bg-slate-50 transition-colors">
                            <Edit3 className="w-3 h-3 mr-1.5" /> Initialize Details
                          </Button>
                        )}
                      </div>
                    )}

                    <div className="flex gap-3 pt-4 border-t border-slate-100">
                      <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                        <Calendar className="w-4.5 h-4.5 text-slate-400" />
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Registry Date</p>
                        <span className="text-xs font-bold text-slate-800 text-center">
                          Joined {new Date(profile.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long' })}
                        </span>
                      </div>
                    </div>

                    {profile.resume_url && (
                      <div className="pt-4 border-t border-slate-100">
                        <a
                          href={profile.resume_url}
                          download={profile.resume_url.startsWith('data:') ? 'dossier_resume.pdf' : undefined}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-colors shadow-sm"
                        >
                          <FileText className="w-4 h-4" /> View Dossier Resume
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column: Bio / Long Description */}
              <div className="lg:col-span-8">
                <div className="bg-white rounded-3xl border border-slate-200/60 p-6 sm:p-8 shadow-sm hover:shadow-md transition-all duration-300">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400 mb-4 flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-red-500" /> Detailed Profile Dossier
                  </h3>
                  {profile.bio ? (
                    <p className="text-slate-700 leading-relaxed text-sm font-body whitespace-pre-wrap">{profile.bio}</p>
                  ) : isOwnProfile ? (
                    <div className="text-center py-10 bg-slate-50/50 border border-dashed border-slate-200 rounded-2xl">
                      <p className="text-slate-400 text-xs font-semibold mb-4">No bio added to your dossier yet.</p>
                      <Button onClick={() => navigate('/edit-profile')} variant="outline" size="sm" className="rounded-xl text-xs font-black uppercase tracking-wider">
                        <Edit3 className="w-3 h-3 mr-1.5" /> Initialize Bio
                      </Button>
                    </div>
                  ) : (
                    <p className="text-slate-400 italic text-xs font-medium">No biographical dossier details recorded.</p>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* ───────── README TAB ───────── */}
          {profile.readme && (
            <TabsContent value="readme" className="mt-0">
              <div className="max-w-4xl mx-auto w-full px-4 sm:px-6 py-8">
                <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8">
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-6 flex items-center gap-2">
                    <FileText className="w-4 h-4" /> README.md
                  </h3>
                  <div className="prose prose-slate max-w-none">
                    <p className="whitespace-pre-wrap text-slate-700 leading-relaxed">{profile.readme}</p>
                  </div>
                </div>
              </div>
            </TabsContent>
          )}
        </Tabs>
      </main>

      <Footer />
    </div>
  );
}
