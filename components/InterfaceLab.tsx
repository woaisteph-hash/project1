import React, { useState } from 'react';
import { explainControlWord } from '../services/geminiService';
import { Settings, Lightbulb, ArrowRight, Activity, Cpu, CircuitBoard, Clock, Zap } from 'lucide-react';

type ChipType = '8255' | '8253' | '8259';

const InterfaceLab: React.FC = () => {
  const [activeChip, setActiveChip] = useState<ChipType>('8255');
  const [controlWord, setControlWord] = useState<string>("80");
  
  // 8255 State
  const [portAVal, setPortAVal] = useState<number>(0);
  const [portBVal, setPortBVal] = useState<number>(0);

  const [explanation, setExplanation] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const handleExplain = async () => {
    setLoading(true);
    const text = await explainControlWord(activeChip, controlWord);
    setExplanation(text);
    setLoading(false);
  };

  const toggleSwitch = (bit: number) => {
    setPortBVal(prev => prev ^ (1 << bit));
  };

  const executeTransfer = () => {
     setPortAVal(portBVal);
  };

  const getChipName = (chip: ChipType) => {
      switch(chip) {
          case '8255': return "并行接口 8255 (PPI)";
          case '8253': return "定时/计数器 8253 (PIT)";
          case '8259': return "中断控制器 8259 (PIC)";
          default: return "";
      }
  };

  return (
    <div className="flex flex-col h-full gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <CircuitBoard className="text-chip-green" /> 接口技术实验台
        </h2>
        {/* Chip Selector */}
        <div className="flex bg-slate-800 p-1 rounded-lg border border-slate-700">
            <button 
                onClick={() => { setActiveChip('8255'); setExplanation(''); setControlWord('80'); }}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${activeChip === '8255' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
            >
                <Cpu size={14}/> 8255
            </button>
            <button 
                onClick={() => { setActiveChip('8253'); setExplanation(''); setControlWord('36'); }}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${activeChip === '8253' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
            >
                <Clock size={14}/> 8253
            </button>
            <button 
                onClick={() => { setActiveChip('8259'); setExplanation(''); setControlWord('13'); }}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${activeChip === '8259' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
            >
                <Zap size={14}/> 8259
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0">
        
        {/* Control Center */}
        <div className="lg:col-span-4 flex flex-col gap-6">
            <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-xl flex flex-col gap-4">
                <div className="flex items-center gap-2 border-b border-slate-700 pb-3">
                    <Settings size={20} className="text-blue-400" /> 
                    <h3 className="text-lg font-semibold text-white">控制字分析</h3>
                </div>
                
                <p className="text-sm text-slate-400">
                    {activeChip === '8255' && "设置方式选择 (Mode 0-2) 及端口 I/O 方向。"}
                    {activeChip === '8253' && "设置计数器选择、读写格式、工作方式 (Mode 0-5) 及数制。"}
                    {activeChip === '8259' && "设置初始化命令字 (ICW1-4) 或操作命令字 (OCW1-3)。"}
                </p>

                <div className="flex gap-2">
                    <input 
                        type="text" 
                        value={controlWord}
                        onChange={(e) => setControlWord(e.target.value.toUpperCase())}
                        maxLength={2}
                        className="bg-slate-900 border border-slate-700 text-white p-2 rounded w-24 text-center font-mono focus:ring-2 focus:ring-green-500 outline-none text-lg"
                    />
                    <button 
                        onClick={handleExplain}
                        disabled={loading}
                        className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-200 py-2 rounded transition-colors text-sm font-medium"
                    >
                        {loading ? "分析中..." : "解析配置"}
                    </button>
                </div>
                
                <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700/50 flex-1 min-h-[200px] text-sm text-slate-300 custom-scrollbar overflow-y-auto">
                        {explanation ? (
                            <div className="prose prose-invert prose-sm max-w-none whitespace-pre-wrap leading-relaxed">
                                {explanation}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-slate-500 italic text-center px-4">
                                <Lightbulb className="mb-2 opacity-50" />
                                输入十六进制控制字，点击解析查看详细配置含义。
                                <br/>
                                <span className="text-xs mt-2 text-slate-600">
                                    (例如 {activeChip === '8255' ? '80, 82, 90' : activeChip === '8253' ? '36, 74' : '11, 13'})
                                </span>
                            </div>
                        )}
                </div>
            </div>

            {/* 8255 Visual Control (Only shown when 8255 is active) */}
            {activeChip === '8255' && (
                <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-xl flex-1">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <Activity size={20} /> 8255 逻辑验证
                    </h3>
                    <button 
                        onClick={executeTransfer}
                        className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-lg shadow-lg shadow-green-900/50 transition-all flex justify-center items-center gap-2"
                    >
                        传送数据 (B -&gt; A) <ArrowRight size={18}/>
                    </button>
                    <div className="mt-4 text-center text-xs text-slate-500 font-mono">
                        假设 B 口为输入，A 口为输出<br/>
                        执行 MOV AL, PORT_B; MOV PORT_A, AL
                    </div>
                </div>
            )}
        </div>

        {/* Visual Board - Content changes based on Chip */}
        <div className="lg:col-span-8 bg-slate-900 rounded-xl border border-slate-700 p-8 relative overflow-hidden flex flex-col justify-center items-center">
             <div className="absolute inset-0 opacity-10 pointer-events-none" 
                 style={{backgroundImage: 'radial-gradient(#475569 1px, transparent 1px)', backgroundSize: '20px 20px'}}>
            </div>

            {activeChip === '8255' ? (
                /* 8255 Visuals */
                <>
                    <div className="relative z-10 bg-slate-800 border-2 border-slate-600 w-64 h-64 rounded-lg flex flex-col items-center justify-center shadow-2xl mb-12">
                        <span className="text-slate-500 text-xs absolute top-2 left-2">INTEL</span>
                        <span className="text-white font-bold text-3xl tracking-widest">8255A</span>
                        <span className="text-slate-500 text-xs absolute bottom-2 right-2">PPI</span>
                        
                        <div className="absolute -left-16 top-10 w-16 h-1 bg-blue-900/50"></div>
                        <div className="absolute -left-16 bottom-10 w-16 h-1 bg-blue-900/50"></div>
                        <div className="absolute -right-16 top-1/2 w-16 h-1 bg-green-900/50"></div>
                    </div>

                    <div className="flex flex-col md:flex-row gap-16 w-full justify-center z-10">
                        <div className="flex flex-col items-center gap-4 bg-slate-800/80 p-6 rounded-xl border border-blue-900/30 backdrop-blur-sm">
                            <h4 className="text-blue-400 font-bold mb-2">端口 B (输入)</h4>
                            <div className="flex gap-2">
                                {Array.from({length: 8}).map((_, i) => {
                                    const bit = 7 - i;
                                    const isOn = (portBVal >> bit) & 1;
                                    return (
                                        <div key={bit} className="flex flex-col items-center gap-1">
                                            <button
                                                onClick={() => toggleSwitch(bit)}
                                                className={`w-8 h-12 rounded border-2 transition-all shadow-md ${
                                                    isOn 
                                                    ? 'bg-blue-500 border-blue-300 translate-y-0 shadow-blue-500/50' 
                                                    : 'bg-slate-700 border-slate-600 translate-y-1'
                                                }`}
                                            ></button>
                                            <span className="text-[10px] text-slate-500 font-mono">D{bit}</span>
                                        </div>
                                    )
                                })}
                            </div>
                            <div className="font-mono text-blue-300 mt-2">Value: {portBVal.toString(16).toUpperCase().padStart(2, '0')}H</div>
                        </div>

                        <div className="flex flex-col items-center gap-4 bg-slate-800/80 p-6 rounded-xl border border-green-900/30 backdrop-blur-sm">
                            <h4 className="text-green-400 font-bold mb-2">端口 A (输出)</h4>
                            <div className="flex gap-2">
                                {Array.from({length: 8}).map((_, i) => {
                                    const bit = 7 - i;
                                    const isOn = (portAVal >> bit) & 1;
                                    return (
                                        <div key={bit} className="flex flex-col items-center gap-1">
                                            <div 
                                                className={`w-8 h-8 rounded-full border-2 transition-all duration-300 shadow-lg ${
                                                    isOn 
                                                    ? 'bg-red-500 border-red-400 shadow-red-500/80 scale-110' 
                                                    : 'bg-red-950 border-red-900 shadow-none scale-100'
                                                }`}
                                            ></div>
                                            <span className="text-[10px] text-slate-500 font-mono">D{bit}</span>
                                        </div>
                                    )
                                })}
                            </div>
                            <div className="font-mono text-green-300 mt-2">Value: {portAVal.toString(16).toUpperCase().padStart(2, '0')}H</div>
                        </div>
                    </div>
                </>
            ) : (
                /* Placeholder for other chips */
                <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-4">
                    {activeChip === '8253' ? <Clock size={64} className="text-slate-600" /> : <Zap size={64} className="text-slate-600" />}
                    <div className="text-xl font-bold">{getChipName(activeChip)}</div>
                    <p className="max-w-md text-center text-sm text-slate-500">
                        当前芯片主要通过“控制字分析”面板进行学习。
                        <br/>
                        复试重点：{activeChip === '8253' ? '工作方式 0-5 的波形区别与应用场景。' : 'ICW 初始化顺序 (ICW1 -> ICW2 -> ICW3 -> ICW4)。'}
                    </p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default InterfaceLab;