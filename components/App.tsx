import React, { useState } from 'react';
import { AppView } from '../types';
import CpuSimulator from './components/CpuSimulator';
import InterfaceLab from './components/InterfaceLab';
import AiTutor from './components/AiTutor';
import Syllabus from './components/Syllabus';
import ExamGenerator from './components/ExamGenerator';
import { Cpu, MessageSquare, Terminal, GraduationCap, BookOpen, BrainCircuit, Menu } from 'lucide-react';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.SYLLABUS);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const renderContent = () => {
    switch (currentView) {
      case AppView.SYLLABUS:
        return <Syllabus />;
      case AppView.SIMULATOR_8086:
        return <CpuSimulator />;
      case AppView.INTERFACE_LAB:
        return <InterfaceLab />;
      case AppView.AI_TUTOR:
        return <AiTutor />;
      case AppView.EXAM_GENERATOR:
        return <ExamGenerator />;
      default:
        return <Syllabus />;
    }
  };

  const NavItem: React.FC<{ view: AppView; icon: React.ReactNode; label: string }> = ({ view, icon, label }) => (
    <button
      onClick={() => {
          setCurrentView(view);
          setIsMobileMenuOpen(false);
      }}
      className={`group flex items-center gap-3 px-4 py-3.5 rounded-xl w-full transition-all duration-300 border border-transparent ${
        currentView === view 
          ? 'bg-blue-600/90 text-white shadow-lg shadow-blue-900/50 border-blue-500/50' 
          : 'text-slate-400 hover:bg-slate-800/50 hover:text-white hover:border-slate-700/50'
      }`}
    >
      <div className={`${currentView === view ? 'text-white' : 'text-slate-500 group-hover:text-blue-400'} transition-colors`}>
        {icon}
      </div>
      <span className="font-medium tracking-wide text-sm">{label}</span>
      {currentView === view && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_white]"></div>}
    </button>
  );

  return (
    <div className="h-screen bg-slate-950 text-slate-100 font-sans flex overflow-hidden relative selection:bg-blue-500/30">
      
      {/* Background Effects */}
      <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-blue-900/10 via-slate-950/80 to-slate-950"></div>
          <div className="absolute bottom-0 right-0 w-2/3 h-2/3 bg-[radial-gradient(circle_at_bottom_right,_var(--tw-gradient-stops))] from-indigo-900/10 via-transparent to-transparent"></div>
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>
      </div>

      {/* Sidebar (Desktop) */}
      <aside className="w-72 bg-slate-900/60 backdrop-blur-xl border-r border-white/5 flex flex-col hidden md:flex z-20 shadow-2xl relative">
        <div className="p-8 pb-6">
           <div className="flex items-center gap-3 text-white mb-1">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg shadow-lg shadow-blue-900/50">
                <GraduationCap size={24} className="text-white" />
              </div>
              <div>
                  <h1 className="font-bold text-lg tracking-tight leading-none">微机原理</h1>
                  <span className="text-xs text-blue-400 font-medium tracking-wider uppercase">考研复试助手</span>
              </div>
           </div>
        </div>

        <nav className="flex-1 px-4 space-y-2 overflow-y-auto custom-scrollbar py-4">
            <div className="text-xs font-bold text-slate-500 px-4 mb-2 uppercase tracking-widest">学习模块</div>
            <NavItem view={AppView.SYLLABUS} icon={<BookOpen size={20} />} label="复习大纲" />
            <NavItem view={AppView.SIMULATOR_8086} icon={<Terminal size={20} />} label="汇编仿真 (8086)" />
            <NavItem view={AppView.INTERFACE_LAB} icon={<Cpu size={20} />} label="接口实验 (825x)" />
            
            <div className="text-xs font-bold text-slate-500 px-4 mt-8 mb-2 uppercase tracking-widest">备考工具</div>
            <NavItem view={AppView.EXAM_GENERATOR} icon={<BrainCircuit size={20} />} label="智能题库" />
            <NavItem view={AppView.AI_TUTOR} icon={<MessageSquare size={20} />} label="AI 教授答疑" />
        </nav>

        <div className="p-6 border-t border-white/5 bg-slate-900/40">
           <div className="bg-slate-800/50 rounded-lg p-3 text-xs text-slate-500 text-center border border-white/5">
             <span className="block mb-1">Powered by</span>
             <span className="font-bold text-slate-400">Gemini 2.5 Flash</span>
           </div>
        </div>
      </aside>

      {/* Mobile Header & Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-slate-950/90 z-40 md:hidden backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)}></div>
      )}
      
      {/* Sidebar (Mobile) */}
      <div className={`fixed inset-y-0 left-0 w-64 bg-slate-900 border-r border-slate-800 z-50 transform transition-transform duration-300 md:hidden ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="p-6 border-b border-slate-800 flex justify-between items-center">
             <span className="font-bold text-white">菜单</span>
          </div>
          <nav className="p-4 space-y-2">
            <NavItem view={AppView.SYLLABUS} icon={<BookOpen size={20} />} label="复习大纲" />
            <NavItem view={AppView.SIMULATOR_8086} icon={<Terminal size={20} />} label="汇编仿真" />
            <NavItem view={AppView.INTERFACE_LAB} icon={<Cpu size={20} />} label="接口实验" />
            <NavItem view={AppView.EXAM_GENERATOR} icon={<BrainCircuit size={20} />} label="智能题库" />
            <NavItem view={AppView.AI_TUTOR} icon={<MessageSquare size={20} />} label="AI 答疑" />
          </nav>
      </div>

      <div className="md:hidden fixed top-0 left-0 right-0 bg-slate-900/80 backdrop-blur border-b border-white/5 p-4 z-30 flex justify-between items-center">
         <div className="flex items-center gap-2">
             <GraduationCap className="text-blue-500" size={24} />
             <span className="font-bold text-white">微机原理</span>
         </div>
         <button onClick={() => setIsMobileMenuOpen(true)} className="text-slate-300 p-1 rounded hover:bg-slate-800">
             <Menu size={24} />
         </button>
      </div>

      {/* Main Content - Simplified Scrolling */}
      <main className="flex-1 relative z-10 h-screen overflow-y-auto custom-scrollbar pt-16 md:pt-0">
         <div className="max-w-[1800px] mx-auto p-4 md:p-8 lg:p-10 pb-24 animate-in fade-in duration-500">
            {renderContent()}
         </div>
      </main>
    </div>
  );
};

export default App;