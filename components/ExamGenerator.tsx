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
    <div className="flex flex-col h-full gap-6 lg:overflow-hidden overflow-y-auto custom-scrollbar">
        <div className="flex items-center justify-between shrink-0">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <BrainCircuit className="text-purple-400" /> 智能题库
            </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:flex-1 lg:min-h-0">
            {/* Configuration Panel */}
            <div className="lg:col-span-4 bg-slate-800 rounded-xl p-6 border border-slate-700 h-fit lg:overflow-y-auto custom-scrollbar max-h-full">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <FileQuestion size={20} /> 出题设置
                </h3>
                
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm text-slate-400 mb-2">知识点范围</label>
                        <select 
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 text-white p-3 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                        >
                            {topics.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm text-slate-400 mb-2">题目类型</label>
                        <select 
                            value={questionType}
                            onChange={(e) => setQuestionType(e.target.value as any)}
                            className="w-full bg-slate-900 border border-slate-700 text-white p-3 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                        >
                            <option value="AUTO">智能随机 (Auto)</option>
                            <option value="CHOICE">单项选择题 (Choice)</option>
                            <option value="READING">程序阅读题 (Reading)</option>
                            <option value="SHORT_ANSWER">简答/计算题 (Short Answer)</option>
                            <option value="CODING">汇编编程题 (Coding)</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm text-slate-400 mb-2">难度等级</label>
                        <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-700">
                            {(['Easy', 'Medium', 'Hard'] as const).map((d) => (
                                <button
                                    key={d}
                                    onClick={() => setDifficulty(d)}
                                    className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${
                                        difficulty === d 
                                        ? 'bg-purple-600 text-white shadow' 
                                        : 'text-slate-400 hover:text-white'
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
                        className="w-full mt-4 bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 rounded-lg shadow-lg shadow-purple-900/50 transition-all flex justify-center items-center gap-2 disabled:opacity-50"
                    >
                        {loading ? <RefreshCw className="animate-spin" /> : <BrainCircuit size={18} />}
                        {loading ? "AI 生成中..." : "生成题目"}
                    </button>
                </div>
            </div>

            {/* Question Display Panel */}
            <div className="lg:col-span-8 flex flex-col gap-6 lg:overflow-y-auto custom-scrollbar pb-2">
                {question ? (
                    <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden shadow-xl flex flex-col shrink-0 animate-in fade-in zoom-in duration-300">
                        {/* Question Header */}
                        <div className="bg-slate-900/50 p-6 border-b border-slate-700">
                            <div className="flex justify-between items-start mb-4">
                                <span className={`text-xs font-bold px-2 py-1 rounded border flex items-center gap-1 ${
                                    question.type === 'CHOICE' ? 'border-blue-500 text-blue-400 bg-blue-500/10' :
                                    question.type === 'CODING' ? 'border-green-500 text-green-400 bg-green-500/10' :
                                    question.type === 'READING' ? 'border-purple-500 text-purple-400 bg-purple-500/10' :
                                    'border-yellow-500 text-yellow-400 bg-yellow-500/10'
                                }`}>
                                    {question.type === 'READING' && <Code size={12}/>}
                                    {question.type === 'CHOICE' ? '单项选择题' : 
                                     question.type === 'CODING' ? '编程题' : 
                                     question.type === 'READING' ? '程序阅读题' : '简答题'}
                                </span>
                                <span className="text-slate-500 text-xs font-mono">AI-GEN-ID: {Date.now().toString().slice(-6)}</span>
                            </div>
                            <div className={`text-xl text-white font-medium leading-relaxed whitespace-pre-wrap ${question.type === 'READING' ? 'font-mono bg-slate-950 p-4 rounded-lg border border-slate-800' : ''}`}>
                                {question.content}
                            </div>
                        </div>

                        {/* Interaction Area */}
                        <div className="p-6 bg-slate-800">
                            {question.type === 'CHOICE' && question.options && (
                                <div className="space-y-3">
                                    {question.options.map((opt, idx) => {
                                        let btnClass = "border-slate-600 hover:bg-slate-700 text-slate-300";
                                        
                                        if (showAnswer) {
                                            const isCorrect = idx === ["A", "B", "C", "D"].indexOf(question.correctAnswer.trim().toUpperCase().charAt(0)) 
                                                            || opt.startsWith(question.correctAnswer); // Loose matching fallback
                                            
                                            if (isCorrect) {
                                                btnClass = "border-green-500 bg-green-900/20 text-green-300";
                                            } else if (selectedOption === idx) {
                                                btnClass = "border-red-500 bg-red-900/20 text-red-300";
                                            } else {
                                                btnClass = "border-slate-700 opacity-50";
                                            }
                                        } else if (selectedOption === idx) {
                                            btnClass = "border-purple-500 bg-purple-900/20 text-purple-300";
                                        }

                                        return (
                                            <button
                                                key={idx}
                                                onClick={() => handleOptionClick(idx)}
                                                className={`w-full text-left p-4 rounded-lg border-2 transition-all flex items-center gap-3 ${btnClass}`}
                                            >
                                                <div className="w-6 h-6 rounded-full border border-current flex items-center justify-center text-xs font-bold shrink-0">
                                                    {String.fromCharCode(65 + idx)}
                                                </div>
                                                <span>{opt}</span>
                                                {showAnswer && selectedOption === idx && (
                                                     (idx === ["A", "B", "C", "D"].indexOf(question.correctAnswer.trim().toUpperCase().charAt(0)) || opt.startsWith(question.correctAnswer)) 
                                                     ? <CheckCircle className="ml-auto text-green-500" size={20}/> 
                                                     : <XCircle className="ml-auto text-red-500" size={20}/>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}

                            {(question.type === 'SHORT_ANSWER' || question.type === 'CODING' || question.type === 'READING') && (
                                <div className="space-y-4">
                                    <div className="bg-slate-900 rounded-lg p-4 border border-slate-700 min-h-[100px] flex items-center justify-center text-slate-500 italic">
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
                                        className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors flex items-center gap-2"
                                    >
                                        <Eye size={18} /> {showAnswer ? "答案已显示" : "查看参考答案"}
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Answer & Explanation Section */}
                        {showAnswer && (
                            <div className="bg-slate-900/80 border-t border-slate-700 p-6 animate-in slide-in-from-bottom-5">
                                <div className="flex items-center gap-2 mb-3 text-green-400 font-bold">
                                    <BookOpen size={18} /> 答案解析
                                </div>
                                <div className="mb-4">
                                    <span className="text-slate-400 text-sm block mb-1">参考答案：</span>
                                    <div className="text-white font-mono text-sm bg-slate-950 p-3 rounded border border-slate-800 whitespace-pre-wrap">
                                        {question.correctAnswer}
                                    </div>
                                </div>
                                <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 text-slate-300 leading-relaxed text-sm">
                                    {question.explanation}
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex-1 bg-slate-800 rounded-xl border border-slate-700 flex flex-col items-center justify-center text-slate-500 p-8 text-center border-dashed shrink-0 min-h-[400px]">
                        <div className="bg-slate-700/50 p-4 rounded-full mb-4">
                            <BrainCircuit size={48} className="text-slate-600" />
                        </div>
                        <h3 className="text-lg font-medium text-slate-400 mb-2">准备就绪</h3>
                        <p className="max-w-md text-sm">
                            选择左侧的知识点和难度，点击“生成题目”。AI 将基于微机原理考研大纲为你生成一道典型试题。
                        </p>
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};

export default ExamGenerator;