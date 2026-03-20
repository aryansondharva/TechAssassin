import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import CommunitySection from "@/components/CommunitySection";
import WhySection from "@/components/WhySection";
import FAQSection from "@/components/FAQSection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      <HeroSection />
      <CommunitySection />
      <WhySection />
      <FAQSection />
      <Footer />
    </div>
  );
};

export default Index;
