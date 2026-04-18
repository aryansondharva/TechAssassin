import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Shield, Code, Users, Target, Zap, AlertCircle, 
  CheckCircle, BookOpen, Award, Heart, MessageSquare,
  GitBranch, Lock, Eye, Star
} from "lucide-react";
import Navbar from "@/components/Navbar";

const CommunityGuidelines = () => {
  const [activeSection, setActiveSection] = useState("mission");

  const guidelines = [
    {
      id: "mission",
      title: "Our Mission",
      icon: Target,
      color: "text-red-500",
      content: [
        "Build a collaborative ecosystem for elite developers",
        "Foster innovation through open-source contributions", 
        "Create opportunities for skill development and growth",
        "Maintain high standards of technical excellence"
      ]
    },
    {
      id: "conduct",
      title: "Code of Conduct",
      icon: Shield,
      color: "text-blue-500",
      content: [
        "Be respectful and inclusive in all interactions",
        "Provide constructive feedback and support",
        "Welcome newcomers and help them learn",
        "Report inappropriate behavior to maintainers"
      ]
    },
    {
      id: "contributing",
      title: "Contributing Standards",
      icon: Code,
      color: "text-green-500",
      content: [
        "Follow the project's coding standards and conventions",
        "Write clean, documented, and testable code",
        "Ensure all tests pass before submitting PRs",
        "Provide clear descriptions of changes and improvements"
      ]
    },
    {
      id: "collaboration",
      title: "Collaboration Rules",
      icon: Users,
      color: "text-purple-500",
      content: [
        "Communicate openly about project goals and progress",
        "Respect different opinions and approaches",
        "Give credit where it's due",
        "Help others succeed and learn from experiences"
      ]
    },
    {
      id: "security",
      title: "Security Guidelines",
      icon: Lock,
      color: "text-orange-500",
      content: [
        "Never commit sensitive information or API keys",
        "Follow secure coding practices",
        "Report security vulnerabilities privately",
        "Keep dependencies updated and secure"
      ]
    },
    {
      id: "quality",
      title: "Quality Standards",
      icon: Star,
      color: "text-yellow-500",
      content: [
        "Maintain high code quality and performance",
        "Write comprehensive tests for new features",
        "Document complex logic and decisions",
        "Review code thoroughly before merging"
      ]
    }
  ];

  const principles = [
    { icon: Heart, text: "Supportive Community", color: "text-red-500" },
    { icon: Zap, text: "Innovation First", color: "text-yellow-500" },
    { icon: Eye, text: "Transparency", color: "text-blue-500" },
    { icon: Award, text: "Excellence", color: "text-green-500" }
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar dark={true} />
      
      <div className="pt-32 pb-20 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <h1 className="text-5xl md:text-7xl font-black italic mb-6">
              COMMUNITY <span className="text-red-600">GUIDELINES</span>
            </h1>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              The operative's manual for contributing to Tech Assassin. 
              Follow these protocols to maintain our elite standards.
            </p>
          </motion.div>

          {/* Core Principles */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16"
          >
            {principles.map((principle, index) => (
              <div 
                key={index}
                className="bg-white/5 border border-white/10 rounded-xl p-6 text-center backdrop-blur-sm"
              >
                <principle.icon className={`w-8 h-8 mx-auto mb-3 ${principle.color}`} />
                <h3 className="font-bold text-sm uppercase tracking-wider">{principle.text}</h3>
              </div>
            ))}
          </motion.div>

          {/* Guidelines Navigation */}
          <div className="flex flex-wrap gap-3 mb-12 justify-center">
            {guidelines.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`px-6 py-3 rounded-full font-bold uppercase tracking-wider transition-all ${
                  activeSection === section.id
                    ? "bg-red-600 text-white"
                    : "bg-white/10 text-white/70 hover:bg-white/20"
                }`}
              >
                {section.title}
              </button>
            ))}
          </div>

          {/* Content Sections */}
          <div className="grid md:grid-cols-2 gap-8">
            {guidelines.map((section) => (
              <motion.div
                key={section.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ 
                  opacity: activeSection === section.id ? 1 : 0.3,
                  x: activeSection === section.id ? 0 : 20
                }}
                transition={{ duration: 0.3 }}
                className={`bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm ${
                  activeSection === section.id ? "ring-2 ring-red-600/50" : ""
                }`}
              >
                <div className="flex items-center gap-4 mb-6">
                  <section.icon className={`w-8 h-8 ${section.color}`} />
                  <h3 className="text-2xl font-bold">{section.title}</h3>
                </div>
                
                <ul className="space-y-4">
                  {section.content.map((item, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-300">{item}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>

          {/* Call to Action */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-16 text-center"
          >
            <div className="bg-gradient-to-r from-red-600/20 to-orange-600/20 border border-red-600/30 rounded-2xl p-8 backdrop-blur-sm">
              <MessageSquare className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-2xl font-bold mb-4">Ready to Join the Mission?</h3>
              <p className="text-gray-400 mb-6">
                Start contributing to Tech Assassin and help us build the ultimate developer platform.
              </p>
              <div className="flex gap-4 justify-center">
                <a 
                  href="/community" 
                  className="px-8 py-3 bg-red-600 text-white rounded-full font-bold uppercase tracking-wider hover:bg-red-700 transition-colors"
                >
                  Join Community
                </a>
                <a 
                  href="https://github.com/aryansondharva/TechAssassin"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-8 py-3 bg-white/10 text-white rounded-full font-bold uppercase tracking-wider hover:bg-white/20 transition-colors border border-white/20"
                >
                  View on GitHub
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default CommunityGuidelines;
