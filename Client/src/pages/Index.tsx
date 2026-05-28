import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import CommunitySection from "@/components/CommunitySection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      <HeroSection />
      <CommunitySection />
      <Footer />
    </div>
  );
};

export default Index;
