import React, { useState } from 'react';
import { generateQuestion } from '../services/geminiService';
import { ExamQuestion } from '../types';
import { FileQuestion, CheckCircle, XCircle, RefreshCw, Eye, BookOpen, BrainCircuit, Code } from 'lucide-react';

const topics = [
    "数制转换与编码 (BCD/补码)",
    "8086 寄存器与寻址方式",
    "8086 指令系统 (算术/逻辑/传送)",
    "存储器扩展与地址译码",
    "8255 并行接口编程",
    "8253 定时器/计数器",
    "8259 中断控制器",
    "总线周期与时序",
];

const ExamGenerator: React.FC = () => {
  const [topic, setTopic] = useState(topics[1]);
  const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');
  const [questionType, setQuestionType] = useState<'AUTO' | 'CHOICE' | 'SHORT_ANSWER' | 'CODING' | 'READING'>('AUTO');
  
  const [question, setQuestion] = useState<ExamQuestion | null>(null);
  const [loading, setLoading] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);

  const handleGenerate = async () => {
      setLoading(true);
      setQuestion(null);
      setShowAnswer(false);
      setSelectedOption(null);
      
      const q = await generateQuestion(
          topic, 
          difficulty, 
          questionType === 'AUTO' ? undefined : questionType
      );
      setQuestion(q);
      setLoading(false);
  };

  const handleOptionClick = (idx: number) => {
      if (showAnswer) return; // Prevent changing after revealing
      setSelectedOption(idx);
      setShowAnswer(true);
  };

  return (
    <div className="flex flex-col gap-8 w-full max-w-[1800px] mx-auto">
        <div className="flex items-center justify-between shrink-0">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <BrainCircuit className="text-purple-400" /> 智能题库
            </h2>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
            {/* Configuration Panel */}
            <div className="xl:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl sticky top-24">
                <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2 border-b border-white/5 pb-4">
                    <FileQuestion size={20} className="text-purple-400" /> 出题设置
                </h3>
                
                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">知识点范围</label>
                        <select 
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-700 text-white p-3 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition-all hover:border-slate-600"
                        >
                            {topics.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">题目类型</label>
                        <select 
                            value={questionType}
                            onChange={(e) => setQuestionType(e.target.value as any)}
                            className="w-full bg-slate-950 border border-slate-700 text-white p-3 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition-all hover:border-slate-600"
                        >
                            <option value="AUTO">智能随机 (Auto)</option>
                            <option value="CHOICE">单项选择题 (Choice)</option>
                            <option value="READING">程序阅读题 (Reading)</option>
                            <option value="SHORT_ANSWER">简答/计算题 (Short Answer)</option>
                            <option value="CODING">汇编编程题 (Coding)</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-400 mb-2">难度等级</label>
                        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-700">
                            {(['Easy', 'Medium', 'Hard'] as const).map((d) => (
                                <button
                                    key={d}
                                    onClick={() => setDifficulty(d)}
                                    className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                                        difficulty === d 
                                        ? 'bg-purple-600 text-white shadow' 
                                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                                    }`}
                                >
                                    {d === 'Easy' ? '基础' : d === 'Medium' ? '进阶' : '困难'}
                                </button>
                            ))}
                        </div>
                    </div>

                    <button 
                        onClick={handleGenerate}
                        disabled={loading}
                        className="w-full mt-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-purple-900/40 transition-all flex justify-center items-center gap-2 disabled:opacity-50 active:scale-95"
                    >
                        {loading ? <RefreshCw className="animate-spin" /> : <BrainCircuit size={18} />}
                        {loading ? "AI 生成中..." : "生成题目"}
                    </button>
                </div>
            </div>

            {/* Question Display Panel */}
            <div className="xl:col-span-8 flex flex-col gap-6">
                {question ? (
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col animate-in fade-in slide-in-from-bottom-5 duration-500">
                        {/* Question Header */}
                        <div className="bg-slate-950/50 p-8 border-b border-white/5">
                            <div className="flex justify-between items-start mb-6">
                                <span className={`text-xs font-bold px-3 py-1.5 rounded-full border flex items-center gap-1.5 ${
                                    question.type === 'CHOICE' ? 'border-blue-500/30 text-blue-400 bg-blue-500/10' :
                                    question.type === 'CODING' ? 'border-green-500/30 text-green-400 bg-green-500/10' :
                                    question.type === 'READING' ? 'border-purple-500/30 text-purple-400 bg-purple-500/10' :
                                    'border-yellow-500/30 text-yellow-400 bg-yellow-500/10'
                                }`}>
                                    {question.type === 'READING' && <Code size={12}/>}
                                    {question.type === 'CHOICE' ? '单项选择题' : 
                                     question.type === 'CODING' ? '编程题' : 
                                     question.type === 'READING' ? '程序阅读题' : '简答题'}
                                </span>
                                <span className="text-slate-600 text-xs font-mono bg-slate-900 px-2 py-1 rounded">ID: {Date.now().toString().slice(-6)}</span>
                            </div>
                            <div className={`text-xl md:text-2xl text-slate-200 font-medium leading-relaxed whitespace-pre-wrap ${question.type === 'READING' ? 'font-mono bg-black/30 p-6 rounded-xl border border-white/10 text-sm md:text-base' : ''}`}>
                                {question.content}
                            </div>
                        </div>

                        {/* Interaction Area */}
                        <div className="p-8 bg-slate-900">
                            {question.type === 'CHOICE' && question.options && (
                                <div className="space-y-4">
                                    {question.options.map((opt, idx) => {
                                        let btnClass = "border-slate-700 hover:bg-slate-800 text-slate-300";
                                        
                                        if (showAnswer) {
                                            const isCorrect = idx === ["A", "B", "C", "D"].indexOf(question.correctAnswer.trim().toUpperCase().charAt(0)) 
                                                            || opt.startsWith(question.correctAnswer); // Loose matching fallback
                                            
                                            if (isCorrect) {
                                                btnClass = "border-green-500 bg-green-900/20 text-green-300";
                                            } else if (selectedOption === idx) {
                                                btnClass = "border-red-500 bg-red-900/20 text-red-300";
                                            } else {
                                                btnClass = "border-slate-800 opacity-40";
                                            }
                                        } else if (selectedOption === idx) {
                                            btnClass = "border-purple-500 bg-purple-900/20 text-purple-300 ring-1 ring-purple-500";
                                        }

                                        return (
                                            <button
                                                key={idx}
                                                onClick={() => handleOptionClick(idx)}
                                                className={`w-full text-left p-5 rounded-xl border-2 transition-all flex items-center gap-4 group ${btnClass}`}
                                            >
                                                <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-bold shrink-0 transition-colors ${selectedOption === idx || (showAnswer && btnClass.includes('green')) ? 'border-current' : 'border-slate-600 text-slate-500 group-hover:border-slate-500 group-hover:text-slate-400'}`}>
                                                    {String.fromCharCode(65 + idx)}
                                                </div>
                                                <span className="text-lg">{opt}</span>
                                                {showAnswer && selectedOption === idx && (
                                                     (idx === ["A", "B", "C", "D"].indexOf(question.correctAnswer.trim().toUpperCase().charAt(0)) || opt.startsWith(question.correctAnswer)) 
                                                     ? <CheckCircle className="ml-auto text-green-500" size={24}/> 
                                                     : <XCircle className="ml-auto text-red-500" size={24}/>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}

                            {(question.type === 'SHORT_ANSWER' || question.type === 'CODING' || question.type === 'READING') && (
                                <div className="space-y-6">
                                    <div className="bg-slate-950/50 rounded-xl p-8 border border-slate-800 min-h-[120px] flex items-center justify-center text-slate-500 italic text-center">
                                        {question.type === 'CODING' 
                                          ? "请在纸上或编辑器中编写汇编代码，完成后查看参考答案。"
                                          : question.type === 'READING' 
                                            ? "请分析上方代码执行后的结果（如寄存器值、标志位），然后查看答案。"
                                            : "请在心中思考答案或在纸上作答，然后点击下方按钮查看参考答案。"
                                        }
                                    </div>
                                    <button
                                        onClick={() => setShowAnswer(true)}
                                        disabled={showAnswer}
                                        className="px-8 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-all flex items-center gap-2 font-medium border border-white/5 mx-auto"
                                    >
                                        <Eye size={18} /> {showAnswer ? "答案已显示" : "查看参考答案"}
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Answer & Explanation Section */}
                        {showAnswer && (
                            <div className="bg-slate-950/50 border-t border-slate-800 p-8 animate-in slide-in-from-bottom-5">
                                <div className="flex items-center gap-2 mb-4 text-green-400 font-bold uppercase tracking-wider text-sm">
                                    <BookOpen size={18} /> 答案解析
                                </div>
                                <div className="mb-6">
                                    <span className="text-slate-500 text-xs font-bold uppercase tracking-widest block mb-2">参考答案</span>
                                    <div className="text-white font-mono text-base bg-black/40 p-4 rounded-xl border border-white/10 whitespace-pre-wrap shadow-inner">
                                        {question.correctAnswer}
                                    </div>
                                </div>
                                <div className="bg-slate-900/80 p-6 rounded-xl border border-white/5 text-slate-300 leading-relaxed text-base">
                                    {question.explanation}
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex-1 bg-slate-900 rounded-2xl border border-slate-800 flex flex-col items-center justify-center text-slate-500 p-12 text-center border-dashed shrink-0 min-h-[500px]">
                        <div className="bg-slate-800/50 p-6 rounded-full mb-6">
                            <BrainCircuit size={64} className="text-slate-700" />
                        </div>
                        <h3 className="text-xl font-medium text-slate-300 mb-3">题库准备就绪</h3>
                        <p className="max-w-md text-base leading-relaxed">
                            选择左侧的知识点和难度，点击“生成题目”。<br/>AI 将基于微机原理考研大纲为你生成一道典型试题。
                        </p>
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};

export default ExamGenerator;