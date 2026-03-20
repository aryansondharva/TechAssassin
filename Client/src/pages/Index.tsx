import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import CommunitySection from "@/components/CommunitySection";
import PrizesSection from "@/components/PrizesSection";
import TracksSection from "@/components/TracksSection";
import HardwareTrackSection from "@/components/HardwareTrackSection";
import WhySection from "@/components/WhySection";
import FAQSection from "@/components/FAQSection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      <HeroSection />
      <CommunitySection />
      <PrizesSection />
      <TracksSection />
      <HardwareTrackSection />
      <WhySection />
      <FAQSection />
      <Footer />
    </div>
  );
};

export default Index;
