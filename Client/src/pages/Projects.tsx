import { motion } from "framer-motion";
import { Github, ExternalLink, Shield, Zap, Target, ArrowRight, Code, Terminal, Globe, Brain } from "lucide-react";
import Navbar from "@/components/Navbar";
import { Link } from "react-router-dom";

const projectList = [
  {
    id: "aura",
    number: "01",
    title: "Project Aura",
    tagline: "The Next Generation AI Learning Companion",
    description: "A premium, high-performance ecosystem designed to transform study materials into interactive and resumable learning experiences using Deep Analysis AI.",
    image: "/aura_hero.png",
    github: "https://github.com/aryansondharva/Aura",
    live: "https://techassasin.vercel.app",
    path: "/aura",
    tech: ["React 19", "Vite", "Gemini Pro", "Supabase", "Node.js"],
    category: "AI & Education"
  },
];

const Projects = () => {
  return (
    <div className="min-h-screen bg-[#FAFAFA] text-slate-900 font-sans selection:bg-red-100 selection:text-red-600 overflow-x-hidden">
      <Navbar dark={false} />
      
      {/* Background Decorative Elements */}
      <div className="fixed inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:32px_32px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

      {/* Header Section */}
      <section className="relative pt-40 pb-20 overflow-hidden">
        <div className="container mx-auto px-6 relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl"
          >
            <div className="inline-flex items-center gap-3 px-6 py-2.5 rounded-full bg-slate-900 text-white text-[11px] font-black uppercase tracking-[0.3em] mb-10 shadow-xl shadow-slate-200 border border-white/10 group cursor-default">
              <div className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
              TECH ASSASSIN <span className="text-red-500">ARMORY</span> • V.1
            </div>
            <h1 className="text-5xl md:text-7xl font-black italic tracking-tighter text-slate-900 mb-8 uppercase leading-[0.9]">
              THE <span className="text-red-600 underline decoration-red-200 decoration-8 underline-offset-8">PROJECTS</span>
            </h1>
            <p className="text-lg md:text-xl text-slate-500 font-medium leading-relaxed max-w-2xl">
              An elite collection of digital tools and AI infrastructures engineered for 
              <span className="text-slate-900 decoration-red-500 underline decoration-2 underline-offset-4 font-bold"> high-impact performance </span> 
              within the mission perimeter.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Projects Feed */}
      <section className="pb-40 relative">
        <div className="container mx-auto px-6">
          <div className="space-y-32">
            {projectList.map((project, index) => (
              <ProjectBlock key={project.id} project={project} index={index} />
            ))}
            
            {/* Future Placeholder */}
            <motion.div 
              initial={{ opacity: 0.4 }}
              whileInView={{ opacity: 1 }}
              className="relative p-20 rounded-[3rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center bg-white/50 backdrop-blur-sm shadow-sm"
            >
              <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mb-6">
                <Zap className="w-8 h-8 text-slate-300 animate-pulse" />
              </div>
              <h3 className="text-2xl font-black uppercase tracking-widest text-slate-300 mb-2 italic">Next Mission Pending</h3>
              <p className="text-slate-400 font-black uppercase tracking-[0.4em] text-[11px]">Awaiting Technical Clearance</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-24 border-t border-slate-200 text-center bg-white">
        <div className="container mx-auto px-6">
          <div className="flex flex-col items-center gap-6 mb-10">
            <span className="font-black italic tracking-tighter text-3xl md:text-4xl uppercase text-slate-900 hover:text-red-600 transition-all duration-300">
              TECH<span className="text-red-600"> ASSASSIN</span>
            </span>
            <div className="w-24 h-1 px-1 bg-red-600 rounded-full" />
          </div>
          <p className="text-slate-400 text-[10px] uppercase tracking-[0.5em] font-black">
             Projecting Future Intelligence • All Systems Operational
          </p>
        </div>
      </footer>
    </div>
  );
};

const ProjectBlock = ({ project, index }: { project: any, index: number }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 60 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 1, ease: "circOut" }}
      className={`flex flex-col ${index % 2 !== 0 ? 'lg:flex-row-reverse' : 'lg:flex-row'} gap-16 lg:gap-32 items-center group/project`}
    >
      {/* Visual Content */}
      <div className="flex-1 w-full relative">
        <Link to={project.path} className="relative block group/img">
          {/* Subtle Glow behind image */}
          <div className="absolute -inset-10 bg-red-600/5 rounded-full blur-[100px] opacity-0 group-hover/img:opacity-100 transition-opacity duration-1000" />
          
          <div className="relative aspect-[16/10] bg-white rounded-[3rem] overflow-hidden shadow-[0_32px_128px_-20px_rgba(0,0,0,0.08)] border-8 border-white group-hover/img:scale-[1.02] transition-transform duration-700">
            <img 
              src={project.image} 
              alt={project.title} 
              className="w-full h-full object-cover transition-all duration-1000"
            />
            
            <div className="absolute inset-0 bg-red-600/0 group-hover/img:bg-red-600/5 transition-colors duration-500" />
            
            {/* Project ID Tag */}
            <div className="absolute top-10 left-10 flex items-center justify-center w-12 h-12 rounded-2xl bg-red-600 text-white shadow-2xl shadow-red-500/40 border border-white/20">
              <span className="text-xl font-black">{project.number}</span>
            </div>

            {/* View Details Floating Label */}
            <div className="absolute bottom-10 right-10 flex items-center gap-3 opacity-0 translate-y-4 group-hover/img:opacity-100 group-hover/img:translate-y-0 transition-all duration-700">
               <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 font-bold">Clearance Needed</span>
               <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center text-white shadow-lg shadow-red-200">
                  <ArrowRight className="w-5 h-5 group-hover/img:translate-x-0.5 transition-transform" />
               </div>
            </div>
          </div>
        </Link>
      </div>

      {/* Text Content */}
      <div className="flex-1 space-y-12">
        <div className="space-y-6">
          <div className="flex items-center gap-4">
             <div className="w-12 h-px bg-red-600" />
             <span className="text-red-600 font-black uppercase tracking-[0.4em] text-[12px]">
                {project.category}
             </span>
          </div>
          <h2 className="text-4xl md:text-5xl font-black italic tracking-wide text-slate-900 uppercase italic leading-[0.9]">
            {project.title}
          </h2>
          <p className="text-lg text-slate-500 font-medium leading-relaxed max-w-xl">
            {project.description}
          </p>
        </div>

        {/* Tech Stack Matrix */}
        <div className="flex flex-wrap gap-2 pt-2">
          {project.tech.map((t: string) => (
            <span key={t} className="px-5 py-2 rounded-xl bg-slate-50 border border-slate-100 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 group-hover/project:text-red-600 group-hover/project:border-red-100 transition-all">
              {t}
            </span>
          ))}
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-6 pt-6">
          <Link 
            to={project.path}
            className="flex items-center gap-4 px-10 py-5 rounded-full bg-red-600 text-white font-black uppercase tracking-[0.2em] hover:bg-red-700 transition-all hover:scale-105 active:scale-95 shadow-xl shadow-red-200"
          >
            <Target className="w-5 h-5" /> TECHNICAL SPECS
          </Link>
          <a 
            href={project.github} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-4 px-10 py-5 rounded-full bg-white border border-slate-200 text-slate-900 font-black uppercase tracking-[0.2em] hover:bg-slate-50 transition-all hover:scale-105 active:scale-95"
          >
            <Github className="w-5 h-5" /> REPOSITORY
          </a>
        </div>
      </div>
    </motion.div>
  );
};

export default Projects;
