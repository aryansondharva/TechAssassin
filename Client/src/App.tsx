import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SpeedInsights } from "@vercel/speed-insights/react";
import Index from "./pages/Index";
import { SignUp, SignIn } from "@clerk/react";
import ForgotPassword from "./pages/ForgotPassword";
import MagicLink from "./pages/MagicLink";
import ResetPasswordConfirm from "./pages/ResetPasswordConfirm";
import AuthCallback from "./pages/AuthCallback";
import Profile from "./pages/Profile";
import EditProfile from "./pages/EditProfile";
import Events from "./pages/Events";
import EventDetails from "./pages/EventDetails";
import Community from "./pages/Community";
import Mentorship from "./pages/Mentorship";
import Missions from "./pages/Missions";
import Projects from "./pages/Projects";
import Aura from "./pages/Aura";
import CommunityGuidelines from "./pages/CommunityGuidelines";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/signup/*" element={<div className="min-h-screen flex items-center justify-center bg-background"><SignUp routing="path" path="/signup" /></div>} />
          <Route path="/signin/*" element={<div className="min-h-screen flex items-center justify-center bg-background"><SignIn routing="path" path="/signin" /></div>} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/magic-link" element={<MagicLink />} />
          <Route path="/reset-password/confirm" element={<ResetPasswordConfirm />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/profile/edit" element={<EditProfile />} />
          <Route path="/edit-profile" element={<EditProfile />} />
          <Route path="/events" element={<Events />} />
          <Route path="/events/:id" element={<EventDetails />} />
          <Route path="/community" element={<Community />} />
          <Route path="/community/guidelines" element={<CommunityGuidelines />} />
          <Route path="/mentorship" element={<Mentorship />} />
          <Route path="/missions" element={<Missions />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/aura" element={<Aura />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/dashboard" element={<Profile />} />
          <Route path="/@:username" element={<Profile />} />
          <Route path="/:username" element={<Profile />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
      <SpeedInsights />
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
