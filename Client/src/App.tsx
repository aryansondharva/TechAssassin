import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { Suspense, lazy, type ReactNode } from "react";
import { SignUp, SignIn } from "@clerk/react";
import ScrollToTop from "./components/ScrollToTop";

const Index = lazy(() => import("./pages/Index"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const MagicLink = lazy(() => import("./pages/MagicLink"));
const ResetPasswordConfirm = lazy(() => import("./pages/ResetPasswordConfirm"));
const AuthCallback = lazy(() => import("./pages/AuthCallback"));
const Profile = lazy(() => import("./pages/profile/view/Profile"));
const EditProfile = lazy(() => import("./pages/profile/edit/EditProfile"));
const Events = lazy(() => import("./pages/Events"));
const EventDetails = lazy(() => import("./pages/EventDetails"));
const Mentorship = lazy(() => import("./pages/Mentorship"));
const Missions = lazy(() => import("./pages/Missions"));
const About = lazy(() => import("./pages/About"));
const Contact = lazy(() => import("./pages/Contact"));
const Collaborate = lazy(() => import("./pages/Collaborate"));
const Aura = lazy(() => import("./pages/Aura"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const PageLoader = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="h-8 w-8 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
  </div>
);

const withSuspense = (page: ReactNode) => (
  <Suspense fallback={<PageLoader />}>{page}</Suspense>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={withSuspense(<Index />)} />
          <Route path="/signup/*" element={<div className="min-h-screen flex items-center justify-center bg-background"><SignUp routing="path" path="/signup" forceRedirectUrl="/edit-profile" fallbackRedirectUrl="/edit-profile" /></div>} />
          <Route path="/signin/*" element={<div className="min-h-screen flex items-center justify-center bg-background"><SignIn routing="path" path="/signin" /></div>} />
          <Route path="/forgot-password" element={withSuspense(<ForgotPassword />)} />
          <Route path="/magic-link" element={withSuspense(<MagicLink />)} />
          <Route path="/reset-password/confirm" element={withSuspense(<ResetPasswordConfirm />)} />
          <Route path="/auth/callback" element={withSuspense(<AuthCallback />)} />
          <Route path="/profile/edit" element={withSuspense(<EditProfile />)} />
          <Route path="/edit-profile" element={withSuspense(<EditProfile />)} />
          <Route path="/events" element={withSuspense(<Events />)} />
          <Route path="/events/:id" element={withSuspense(<EventDetails />)} />
          <Route path="/mentorship" element={withSuspense(<Mentorship />)} />
          <Route path="/missions" element={withSuspense(<Missions />)} />
          <Route path="/about" element={withSuspense(<About />)} />
          <Route path="/contact" element={withSuspense(<Contact />)} />
          <Route path="/collaborate" element={withSuspense(<Collaborate />)} />
          <Route path="/aura" element={withSuspense(<Aura />)} />
          <Route path="/projects" element={withSuspense(<NotFound />)} />
          <Route path="/profile" element={withSuspense(<Profile />)} />
          <Route path="/dashboard" element={withSuspense(<Profile />)} />
          <Route path="/@:username" element={withSuspense(<Profile />)} />
          <Route path="/:username" element={withSuspense(<Profile />)} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={withSuspense(<NotFound />)} />
        </Routes>
      </BrowserRouter>
      <SpeedInsights />
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
