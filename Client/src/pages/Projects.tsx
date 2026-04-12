import { motion } from "framer-motion";
import { Github, ExternalLink, Shield, Zap, Target, ArrowRight, Code, Terminal, Globe } from "lucide-react";
import Navbar from "@/components/Navbar";
import { Link } from "react-router-dom";

const projectList = [
  {
    id: "aura",
    number: "01",
    title: "Project Aura",
    tagline: "The Next Generation Ecosystem for Tech Assassins",
    description: "A premium, high-performance ecosystem designed for the modern digital operative. Engineered for speed, secured for the mission.",
    image: "/aura_hero.png",
    github: "https://github.com/aryansondharva/Aura",
    live: "#",
    path: "/aura",
    tech: ["React", "Typescript", "Framer Motion", "Tailwind"],
    category: "Infrastructure"
  },
  // Future projects will be added here
];

const Projects = () => {
  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-red-100 selection:text-red-600">
      <Navbar dark={false} />
      
      {/* Header Section */}
      <section className="relative pt-32 pb-16 overflow-hidden">
        <div className="container mx-auto px-6 relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-50 border border-red-100 text-red-600 text-[11px] font-black uppercase tracking-[0.2em] mb-8">
              <Terminal className="w-3 h-3" /> Tech Assassin Armory
            </div>
            <h1 className="text-6xl md:text-8xl font-black italic tracking-tighter text-slate-900 mb-6 uppercase">
              The <span className="text-red-600">Projects</span>
            </h1>
            <p className="text-xl text-slate-500 font-medium leading-relaxed max-w-2xl">
              An elite collection of tools, platforms, and ecosystems engineered by the Tech Assassin Group for digital dominance.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Projects Feed */}
      <section className="pb-32">
        <div className="container mx-auto px-6">
          <div className="space-y-32">
            {projectList.map((project, index) => (
              <ProjectBlock key={project.id} project={project} index={index} />
            ))}
            
            {/* Future Placeholder */}
            <motion.div 
              initial={{ opacity: 0.5 }}
              whileInView={{ opacity: 1 }}
              className="relative p-12 rounded-[3rem] border-2 border-dashed border-slate-100 flex flex-col items-center justify-center text-center bg-slate-50/50"
            >
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-6">
                <Zap className="w-8 h-8 text-slate-300" />
              </div>
              <h3 className="text-2xl font-black uppercase tracking-tight text-slate-300 mb-2">Next Mission Pending</h3>
              <p className="text-slate-400 font-medium uppercase tracking-widest text-xs">Awaiting Technical Clearance</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 border-t border-slate-100 text-center bg-slate-50">
        <div className="container mx-auto px-6">
          <div className="mb-8">
            <span className="font-black italic tracking-tighter text-2xl uppercase text-slate-900">
              TECH<span className="text-red-600"> ASSASSIN</span>
            </span>
          </div>
          <p className="text-slate-400 text-sm uppercase tracking-[0.3em] font-black">
            Building the future of digital operations
          </p>
        </div>
      </footer>
    </div>
  );
};

const ProjectBlock = ({ project, index }: { project: any, index: number }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8, delay: index * 0.2 }}
      className={`flex flex-col ${index % 2 !== 0 ? 'lg:flex-row-reverse' : 'lg:flex-row'} gap-12 lg:gap-20 items-center`}
    >
      {/* Visual Content */}
      <div className="flex-1 w-full">
        <Link to={project.path} className="relative group cursor-pointer block">
          <div className="absolute -inset-4 bg-red-600/5 rounded-[3rem] scale-95 group-hover:scale-100 transition-transform duration-700 opacity-0 group-hover:opacity-100" />
          <div className="relative aspect-[16/10] bg-slate-100 rounded-[2.5rem] overflow-hidden shadow-2xl border border-slate-100">
            <img 
              src={project.image} 
              alt={project.title} 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-500" />
            
            {/* Project Number Floating */}
            <div className="absolute top-8 left-8 w-16 h-16 rounded-2xl bg-white flex items-center justify-center shadow-xl border border-slate-100">
              <span className="text-2xl font-black text-red-600">{project.number}</span>
            </div>
          </div>
        </Link>
      </div>

      {/* Text Content */}
      <div className="flex-1 space-y-8">
        <div>
          <span className="text-red-600 font-black uppercase tracking-[0.3em] text-[10px] mb-4 block">
            {project.category}
          </span>
          <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tight text-slate-900 mb-6 italic">
            {project.title}
          </h2>
          <p className="text-lg text-slate-500 font-medium leading-relaxed">
            {project.description}
          </p>
        </div>

        {/* Tech Stack Tags */}
        <div className="flex flex-wrap gap-2">
          {project.tech.map((t: string) => (
            <span key={t} className="px-4 py-1.5 rounded-full bg-slate-50 border border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-400">
              {t}
            </span>
          ))}
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-4 pt-4">
          <Link 
            to={project.path}
            className="flex items-center gap-3 px-8 py-4 rounded-full bg-red-600 text-white font-black uppercase tracking-widest hover:bg-red-700 transition-all hover:scale-105 active:scale-95 shadow-xl shadow-red-500/20"
          >
            <Target className="w-5 h-5" /> Technical Specs
          </Link>
          <a 
            href={project.github} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-8 py-4 rounded-full bg-slate-900 text-white font-black uppercase tracking-widest hover:bg-slate-800 transition-all hover:scale-105 active:scale-95 shadow-xl"
          >
            <Github className="w-5 h-5" /> View Command Center
          </a>
        </div>
      </div>
    </motion.div>
  );
};

export default Projects;
