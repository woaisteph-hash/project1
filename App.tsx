import React, { useState } from 'react';
import { AppView } from './types';
import CpuSimulator from './components/CpuSimulator';
import InterfaceLab from './components/InterfaceLab';
import AiTutor from './components/AiTutor';
import Syllabus from './components/Syllabus';
import ExamGenerator from './components/ExamGenerator';
import { Cpu, MessageSquare, Terminal, GraduationCap, BookOpen, BrainCircuit } from 'lucide-react';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.SYLLABUS); // Default to Syllabus for review context

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
      onClick={() => setCurrentView(view)}
      className={`flex items-center gap-3 px-4 py-3 rounded-lg w-full transition-all duration-200 ${
        currentView === view 
          ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' 
          : 'text-slate-400 hover:bg-slate-800 hover:text-white'
      }`}
    >
      {icon}
      <span className="font-medium">{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex overflow-hidden">
      
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col hidden md:flex">
        <div className="p-6 border-b border-slate-800">
           <div className="flex items-center gap-2 text-blue-400">
              <GraduationCap size={28} />
              <h1 className="font-bold text-xl tracking-tight text-white">微机原理考研版</h1>
           </div>
           <p className="text-xs text-slate-500 mt-2">复试专项复习助手</p>
        </div>

        <nav className="flex-1 p-4 space-y-2">
            <NavItem view={AppView.SYLLABUS} icon={<BookOpen size={20} />} label="复习大纲" />
            <NavItem view={AppView.SIMULATOR_8086} icon={<Terminal size={20} />} label="汇编仿真 (8086)" />
            <NavItem view={AppView.INTERFACE_LAB} icon={<Cpu size={20} />} label="接口实验 (825x)" />
            <NavItem view={AppView.EXAM_GENERATOR} icon={<BrainCircuit size={20} />} label="智能题库" />
            <NavItem view={AppView.AI_TUTOR} icon={<MessageSquare size={20} />} label="AI 教授答疑" />
        </nav>

        <div className="p-6 border-t border-slate-800">
           <div className="bg-slate-800/50 rounded p-3 text-xs text-slate-500 text-center">
             由 Gemini 3 Flash 驱动
           </div>
        </div>
      </aside>

      {/* Mobile Header (Only visible on small screens) */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-slate-900 border-b border-slate-800 p-4 z-50 flex justify-between items-center">
         <span className="font-bold text-white">考研复习助手</span>
         <div className="flex gap-4">
            <button onClick={() => setCurrentView(AppView.SYLLABUS)} className={currentView === AppView.SYLLABUS ? 'text-blue-400' : 'text-slate-400'}><BookOpen size={24}/></button>
            <button onClick={() => setCurrentView(AppView.EXAM_GENERATOR)} className={currentView === AppView.EXAM_GENERATOR ? 'text-blue-400' : 'text-slate-400'}><BrainCircuit size={24}/></button>
            <button onClick={() => setCurrentView(AppView.SIMULATOR_8086)} className={currentView === AppView.SIMULATOR_8086 ? 'text-blue-400' : 'text-slate-400'}><Terminal size={24}/></button>
         </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-hidden h-screen pt-20 md:pt-8">
         <div className="h-full max-w-7xl mx-auto">
            {renderContent()}
         </div>
      </main>
    </div>
  );
};

export default App;