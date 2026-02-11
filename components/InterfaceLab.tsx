import React, { useState } from 'react';
import { explainControlWord } from '../services/geminiService';
import { Settings, Lightbulb, ArrowRight, Activity, Cpu, CircuitBoard, Clock, Zap, Play, RotateCcw } from 'lucide-react';

type ChipType = '8255' | '8253' | '8259';

const InterfaceLab: React.FC = () => {
  const [activeChip, setActiveChip] = useState<ChipType>('8255');
  const [controlWord, setControlWord] = useState<string>("80");
  
  // 8255 State
  const [portAVal, setPortAVal] = useState<number>(0);
  const [portBVal, setPortBVal] = useState<number>(0);

  // 8253 State
  const [count8253, setCount8253] = useState<number>(5);
  const [reload8253, setReload8253] = useState<number>(5);
  const [gate8253, setGate8253] = useState<boolean>(true);
  const [out8253, setOut8253] = useState<boolean>(true); // Mode 3 starts high usually

  // 8259 State
  const [irr, setIrr] = useState<number>(0); // Interrupt Request Register
  const [isr, setIsr] = useState<number>(0); // In-Service Register
  const [imr, setImr] = useState<number>(0); // Interrupt Mask Register

  const [explanation, setExplanation] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const handleExplain = async () => {
    setLoading(true);
    const text = await explainControlWord(activeChip, controlWord);
    setExplanation(text);
    setLoading(false);
  };

  // 8255 Logic
  const toggleSwitch8255 = (bit: number) => {
    setPortBVal(prev => prev ^ (1 << bit));
  };

  const executeTransfer8255 = () => {
     setPortAVal(portBVal);
  };

  // 8253 Logic
  const stepClock8253 = () => {
      if (!gate8253) return; // Gate controls counting
      setCount8253(prev => {
          const next = prev - 1;
          if (next <= 0) {
              setOut8253(o => !o); // Toggle output (Simulating Square Wave)
              return reload8253; // Reload
          }
          return next;
      });
  };

  const reset8253 = () => {
      setCount8253(reload8253);
      setOut8253(true);
  };

  // 8259 Logic
  const toggleIrq = (irq: number) => {
      // Toggle request (simulating external hardware raising/dropping line)
      setIrr(prev => prev ^ (1 << irq));
  };

  const toggleImr = (irq: number) => {
      // Toggle mask bit
      setImr(prev => prev ^ (1 << irq));
  };

  const cpuIntA = () => {
      // Priority Resolver: Find lowest index (highest priority) in IRR that is NOT masked
      for (let i = 0; i < 8; i++) {
          if (((irr >> i) & 1) && !((imr >> i) & 1)) {
              // Found highest priority interrupt
              // 1. Set ISR bit
              setIsr(prev => prev | (1 << i));
              // 2. Clear IRR bit (assuming edge triggered acknowledged or level processed)
              setIrr(prev => prev & ~(1 << i));
              return; // Only acknowledge one at a time
          }
      }
  };

  const cpuEoi = () => {
      // Non-Specific EOI: Clear highest priority ISR bit
      for (let i = 0; i < 8; i++) {
          if ((isr >> i) & 1) {
              setIsr(prev => prev & ~(1 << i));
              return;
          }
      }
  };

  return (
    <div className="flex flex-col gap-8 w-full max-w-[1800px] mx-auto">
      
      {/* Header & Chip Selection - Sticky */}
      <div className="sticky top-0 z-30 flex flex-col md:flex-row items-start md:items-center justify-between shrink-0 gap-6 bg-slate-900/80 p-5 rounded-b-2xl md:rounded-2xl border-b md:border border-white/10 backdrop-blur-xl shadow-2xl transition-all">
        <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-3">
            <div className="p-2 bg-green-500/10 rounded-lg">
                <CircuitBoard className="text-green-400" size={24} />
            </div>
            接口技术实验台
            </h2>
            <p className="text-slate-400 text-xs ml-12 mt-1 hidden sm:block">可视化芯片逻辑与控制字编程</p>
        </div>
        
        {/* Chip Selector */}
        <div className="flex bg-slate-800/80 p-1.5 rounded-xl border border-white/5 shadow-inner w-full md:w-auto overflow-x-auto">
            <button 
                onClick={() => { setActiveChip('8255'); setExplanation(''); setControlWord('80'); }}
                className={`flex-1 md:flex-none px-6 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 whitespace-nowrap ${activeChip === '8255' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
            >
                <Cpu size={16}/> 8255
            </button>
            <button 
                onClick={() => { setActiveChip('8253'); setExplanation(''); setControlWord('36'); }}
                className={`flex-1 md:flex-none px-6 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 whitespace-nowrap ${activeChip === '8253' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
            >
                <Clock size={16}/> 8253
            </button>
            <button 
                onClick={() => { setActiveChip('8259'); setExplanation(''); setControlWord('13'); }}
                className={`flex-1 md:flex-none px-6 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 whitespace-nowrap ${activeChip === '8259' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
            >
                <Zap size={16}/> 8259
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        
        {/* Control Center Panel */}
        <div className="xl:col-span-4 flex flex-col gap-6 order-2 xl:order-1">
            
            {/* Control Word Section */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col gap-6">
                <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                    <div className="p-1.5 bg-blue-500/10 rounded-md">
                        <Settings size={18} className="text-blue-400" />
                    </div>
                    <h3 className="text-lg font-bold text-white">控制字配置</h3>
                </div>
                
                <div className="bg-slate-950/50 p-4 rounded-xl border border-white/5">
                    <p className="text-sm text-slate-400 mb-4 leading-relaxed">
                        {activeChip === '8255' && "8255 控制字用于设置端口 A、B、C 的输入/输出方向及工作方式 (Mode 0/1/2)。"}
                        {activeChip === '8253' && "8253 控制字用于选择计数器 (0-2)、读写格式 (LSB/MSB) 及工作方式 (Mode 0-5)。"}
                        {activeChip === '8259' && "8259 初始化命令字 (ICW1-4) 用于设置级联、触发方式及向量号；OCW 用于操作屏蔽。"}
                    </p>

                    <div className="flex gap-3">
                        <input 
                            type="text" 
                            value={controlWord}
                            onChange={(e) => setControlWord(e.target.value.toUpperCase())}
                            maxLength={2}
                            className="bg-black/40 border border-slate-700 text-white p-3 rounded-lg w-28 text-center font-mono focus:ring-2 focus:ring-blue-500/50 outline-none text-xl font-bold tracking-widest"
                            placeholder="Hex"
                        />
                        <button 
                            onClick={handleExplain}
                            disabled={loading}
                            className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-lg transition-all text-sm font-bold shadow-lg shadow-blue-900/30 active:scale-95 disabled:opacity-50"
                        >
                            {loading ? "AI 分析中..." : "解析含义"}
                        </button>
                    </div>
                </div>
                
                <div className="flex-1 min-h-[150px] bg-black/20 p-4 rounded-xl border border-white/5 text-sm text-slate-300 shadow-inner">
                        {explanation ? (
                            <div className="prose prose-invert prose-sm max-w-none whitespace-pre-wrap leading-relaxed animate-in fade-in">
                                {explanation}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-3 py-4">
                                <Lightbulb size={24} className="opacity-20" />
                                <p className="text-center italic text-xs">
                                    输入十六进制值并点击解析<br/>AI 将为你解释每一位的含义
                                </p>
                            </div>
                        )}
                </div>
            </div>

            {/* Manual Controls Section */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex-1 flex flex-col">
                <div className="flex items-center gap-3 border-b border-white/5 pb-4 mb-4">
                    <div className="p-1.5 bg-green-500/10 rounded-md">
                        <Activity size={18} className="text-green-400" />
                    </div>
                    <h3 className="text-lg font-bold text-white">信号激励</h3>
                </div>
                
                <div className="flex-1 flex flex-col justify-center">
                    {activeChip === '8255' && (
                        <>
                            <button 
                                onClick={executeTransfer8255}
                                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-green-900/40 transition-all flex justify-center items-center gap-3 active:scale-95 group"
                            >
                                <span className="group-hover:translate-x-1 transition-transform">执行数据传送</span>
                                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform"/>
                            </button>
                            <div className="mt-4 text-center">
                                <span className="text-xs font-mono text-slate-500 bg-black/20 px-3 py-1 rounded-full border border-white/5">
                                    MOV AL, PORT_B  →  MOV PORT_A, AL
                                </span>
                            </div>
                        </>
                    )}

                    {activeChip === '8253' && (
                        <div className="space-y-6">
                            <div className="flex gap-4">
                                <button 
                                    onClick={stepClock8253}
                                    className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-900/40 transition-all flex justify-center items-center gap-2 active:scale-95"
                                >
                                    <Play size={20} fill="currentColor"/> 
                                    <span>发送脉冲 (CLK)</span>
                                </button>
                                <button 
                                    onClick={reset8253}
                                    className="px-5 bg-slate-700 hover:bg-slate-600 text-white rounded-xl transition-colors border border-white/5"
                                    title="重置计数"
                                >
                                    <RotateCcw size={20}/>
                                </button>
                            </div>
                            
                            <div className="bg-slate-800/50 p-4 rounded-xl border border-white/5 flex items-center justify-between">
                                <span className="text-slate-400 text-sm font-medium">重装载值 (Reload)</span>
                                <div className="flex items-center gap-3 bg-black/20 p-1 rounded-lg border border-white/5">
                                    <button onClick={() => setReload8253(Math.max(1, reload8253 - 1))} className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded text-white">-</button>
                                    <span className="font-mono text-white w-8 text-center font-bold">{reload8253}</span>
                                    <button onClick={() => setReload8253(reload8253 + 1)} className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded text-white">+</button>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeChip === '8259' && (
                        <div className="space-y-4">
                            <button 
                                onClick={cpuIntA}
                                className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-red-900/40 transition-all flex justify-center items-center gap-3 active:scale-95"
                            >
                                <Cpu size={20}/> 
                                <span>CPU 响应中断 (INTA)</span>
                            </button>
                            <button 
                                onClick={cpuEoi}
                                className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-xl border border-white/10 transition-all flex justify-center items-center gap-2"
                            >
                                <RotateCcw size={16}/> 
                                <span>发送中断结束 (EOI)</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>

        {/* Visual Board Area */}
        <div className="xl:col-span-8 order-1 xl:order-2">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 relative overflow-hidden flex flex-col justify-center items-center min-h-[500px] shadow-2xl">
                 {/* Board Grid Background */}
                 <div className="absolute inset-0 opacity-20 pointer-events-none" 
                     style={{
                         backgroundImage: 'linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px)', 
                         backgroundSize: '40px 40px'
                     }}>
                </div>
                
                <div className="absolute top-4 left-4 flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500/30 border border-red-500/50"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500/30 border border-yellow-500/50"></div>
                </div>

                {activeChip === '8255' && (
                    <>
                        <div className="relative z-10 bg-gradient-to-br from-slate-700 to-slate-800 border-2 border-slate-600 w-72 h-72 rounded-lg flex flex-col items-center justify-center shadow-2xl mb-16 transform transition-transform hover:scale-105 duration-500">
                            <span className="text-slate-400 text-xs font-bold tracking-widest absolute top-4 left-4">INTEL &reg;</span>
                            <span className="text-white font-bold text-5xl tracking-widest font-mono text-shadow-lg">8255A</span>
                            <span className="text-slate-400 text-sm absolute bottom-4 right-4 font-mono">PPI Interface</span>
                            
                            {/* Wires */}
                            <div className="absolute -left-20 top-12 w-20 h-1 bg-gradient-to-r from-transparent to-blue-500/50"></div>
                            <div className="absolute -left-20 bottom-12 w-20 h-1 bg-gradient-to-r from-transparent to-blue-500/50"></div>
                            <div className="absolute -right-20 top-1/2 w-20 h-1 bg-gradient-to-l from-transparent to-green-500/50"></div>
                            
                            {/* Pins decoration */}
                            <div className="absolute -left-1 top-8 bottom-8 w-2 flex flex-col justify-between py-2">
                                {Array.from({length: 8}).map((_,i) => <div key={i} className="w-3 h-1 bg-slate-400 -ml-1.5 rounded-full"></div>)}
                            </div>
                            <div className="absolute -right-1 top-8 bottom-8 w-2 flex flex-col justify-between py-2">
                                {Array.from({length: 8}).map((_,i) => <div key={i} className="w-3 h-1 bg-slate-400 -mr-1.5 rounded-full"></div>)}
                            </div>
                        </div>

                        <div className="flex flex-col md:flex-row gap-8 w-full justify-center z-10">
                            <div className="flex flex-col items-center gap-5 bg-slate-800/90 p-6 rounded-2xl border border-blue-500/30 shadow-lg shadow-blue-900/20 backdrop-blur-md">
                                <h4 className="text-blue-400 font-bold mb-1 uppercase tracking-wider text-sm">Port B (Input)</h4>
                                <div className="flex gap-2">
                                    {Array.from({length: 8}).map((_, i) => {
                                        const bit = 7 - i;
                                        const isOn = (portBVal >> bit) & 1;
                                        return (
                                            <div key={bit} className="flex flex-col items-center gap-2 group">
                                                <button
                                                    onClick={() => toggleSwitch8255(bit)}
                                                    className={`w-8 h-12 rounded border-2 transition-all shadow-md relative overflow-hidden ${
                                                        isOn 
                                                        ? 'bg-blue-500 border-blue-400 translate-y-0 shadow-blue-500/50' 
                                                        : 'bg-slate-700 border-slate-600 translate-y-1 hover:bg-slate-600'
                                                    }`}
                                                >
                                                    {isOn && <div className="absolute inset-0 bg-white/20"></div>}
                                                </button>
                                                <span className="text-[10px] text-slate-500 font-mono group-hover:text-blue-400 transition-colors">D{bit}</span>
                                            </div>
                                        )
                                    })}
                                </div>
                                <div className="font-mono text-blue-300 mt-1 bg-black/30 px-3 py-1 rounded text-sm">Value: {portBVal.toString(16).toUpperCase().padStart(2, '0')}H</div>
                            </div>

                            <div className="flex flex-col items-center gap-5 bg-slate-800/90 p-6 rounded-2xl border border-green-500/30 shadow-lg shadow-green-900/20 backdrop-blur-md">
                                <h4 className="text-green-400 font-bold mb-1 uppercase tracking-wider text-sm">Port A (Output)</h4>
                                <div className="flex gap-2">
                                    {Array.from({length: 8}).map((_, i) => {
                                        const bit = 7 - i;
                                        const isOn = (portAVal >> bit) & 1;
                                        return (
                                            <div key={bit} className="flex flex-col items-center gap-2">
                                                <div 
                                                    className={`w-8 h-8 rounded-full border-2 transition-all duration-300 shadow-lg relative ${
                                                        isOn 
                                                        ? 'bg-red-500 border-red-400 shadow-red-500/80 scale-110' 
                                                        : 'bg-red-950 border-red-900 shadow-none scale-100 opacity-50'
                                                    }`}
                                                >
                                                    {isOn && <div className="absolute inset-0 rounded-full bg-white/30 animate-pulse"></div>}
                                                </div>
                                                <span className="text-[10px] text-slate-500 font-mono">D{bit}</span>
                                            </div>
                                        )
                                    })}
                                </div>
                                <div className="font-mono text-green-300 mt-1 bg-black/30 px-3 py-1 rounded text-sm">Value: {portAVal.toString(16).toUpperCase().padStart(2, '0')}H</div>
                            </div>
                        </div>
                    </>
                )}

                {activeChip === '8253' && (
                    <div className="flex flex-col md:flex-row items-center gap-12 z-10 w-full max-w-4xl justify-center">
                        {/* Inputs */}
                        <div className="flex flex-col gap-10 items-end bg-slate-800/50 p-6 rounded-2xl border border-white/5">
                             <div className="flex items-center gap-4">
                                 <span className="text-blue-400 font-mono text-sm font-bold tracking-wider">GATE</span>
                                 <button 
                                    onClick={() => setGate8253(!gate8253)}
                                    className={`w-14 h-7 rounded-full p-1 transition-all duration-300 shadow-inner ${gate8253 ? 'bg-green-500' : 'bg-slate-700'}`}
                                 >
                                    <div className={`w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-300 ${gate8253 ? 'translate-x-7' : 'translate-x-0'}`}></div>
                                 </button>
                             </div>
                             <div className="flex items-center gap-4">
                                 <span className="text-blue-400 font-mono text-sm font-bold tracking-wider">CLK</span>
                                 <div className="w-16 h-1 bg-slate-700 relative overflow-hidden rounded-full">
                                     <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-blue-500 rounded-full shadow-[0_0_10px_#3b82f6] animate-[pulse_1s_ease-in-out_infinite]"></div>
                                 </div>
                             </div>
                        </div>

                        {/* Chip Body */}
                        <div className="bg-gradient-to-b from-slate-800 to-slate-900 border-2 border-slate-600 w-72 h-72 rounded-xl flex flex-col items-center justify-between py-8 shadow-2xl relative transform hover:scale-105 transition-transform duration-500">
                            <div className="w-full flex justify-between px-4">
                                <span className="text-slate-500 text-xs font-bold">INTEL</span>
                                <span className="text-slate-600 text-xs font-mono">D8253C-2</span>
                            </div>
                            
                            <div className="flex flex-col items-center gap-2">
                                 <span className="text-white font-bold text-3xl tracking-widest font-mono">COUNTER 0</span>
                            </div>
                            
                            <div className="bg-black border border-slate-700 p-6 rounded-lg w-5/6 text-center shadow-[inset_0_2px_8px_rgba(0,0,0,0.6)] relative overflow-hidden">
                                <div className="absolute inset-0 bg-red-500/5 pointer-events-none"></div>
                                <span className="text-red-500 font-mono text-6xl font-bold tabular-nums text-shadow-glow tracking-tighter relative z-10">
                                    {count8253}
                                </span>
                            </div>

                            <span className="text-slate-500 text-xs absolute bottom-3 right-4 font-bold tracking-wider">PIT</span>
                        </div>

                        {/* Output */}
                        <div className="flex items-center gap-4 bg-slate-800/50 p-6 rounded-2xl border border-white/5">
                             <div className={`h-1 w-16 transition-colors duration-200 ${out8253 ? 'bg-green-500 shadow-[0_0_15px_#22c55e]' : 'bg-slate-700'}`}></div>
                             <div className="flex flex-col items-center gap-2">
                                 <div className={`w-10 h-10 rounded-full border-2 transition-all duration-300 flex items-center justify-center ${out8253 ? 'bg-green-500 border-green-400 shadow-[0_0_20px_#22c55e]' : 'bg-green-950/30 border-green-900/50'}`}>
                                     <Zap size={18} className={`text-white transition-opacity ${out8253 ? 'opacity-100' : 'opacity-20'}`} />
                                 </div>
                                 <span className="text-green-400 font-mono text-sm font-bold tracking-wider">OUT</span>
                             </div>
                        </div>
                    </div>
                )}

                {activeChip === '8259' && (
                    <div className="w-full max-w-5xl z-10 flex flex-col items-center overflow-x-auto">
                        <div className="grid grid-cols-12 w-full gap-8 min-w-[600px]">
                            {/* Interrupt Request Lines (Left) */}
                            <div className="col-span-2 flex flex-col justify-center gap-3">
                                {Array.from({length: 8}).map((_, i) => (
                                    <div key={i} className="flex items-center justify-end gap-3 group">
                                        <span className="text-xs text-slate-500 font-mono group-hover:text-blue-400 transition-colors font-bold">IR{i}</span>
                                        <button 
                                            onClick={() => toggleIrq(i)}
                                            className={`w-10 h-8 border-l-4 rounded-r flex items-center justify-center transition-all duration-200 ${
                                                (irr >> i) & 1 
                                                ? 'border-yellow-500 bg-gradient-to-r from-yellow-500/20 to-transparent shadow-[0_0_10px_rgba(234,179,8,0.2)]' 
                                                : 'border-slate-700 hover:border-slate-500 bg-slate-800/50'
                                            }`}
                                        >
                                            {(irr >> i) & 1 && <Zap size={14} className="text-yellow-500 animate-pulse"/>}
                                        </button>
                                    </div>
                                ))}
                            </div>

                            {/* Internal Registers (Center) */}
                            <div className="col-span-8 bg-gradient-to-b from-slate-800 to-slate-900 border-2 border-slate-600 rounded-2xl p-8 flex flex-col gap-8 relative shadow-2xl">
                                 <div className="flex justify-between items-start w-full border-b border-white/5 pb-4 mb-2">
                                    <span className="text-slate-400 text-sm font-bold tracking-widest">INTEL 8259A PIC</span>
                                    <div className="flex gap-1">
                                        <div className="w-2 h-2 rounded-full bg-slate-600"></div>
                                        <div className="w-2 h-2 rounded-full bg-slate-600"></div>
                                        <div className="w-2 h-2 rounded-full bg-slate-600"></div>
                                    </div>
                                 </div>
                                 
                                 <div className="grid grid-cols-3 gap-8 text-center relative z-10">
                                     {/* IRR */}
                                     <div className="flex flex-col gap-3 group">
                                         <span className="text-xs font-bold text-yellow-500 uppercase tracking-widest bg-yellow-900/20 py-1 rounded">IRR Request</span>
                                         <div className="flex flex-col gap-1.5 bg-black/40 p-3 rounded-lg border border-white/5 shadow-inner">
                                             {Array.from({length: 8}).map((_, i) => (
                                                 <div key={i} className={`h-6 w-full rounded text-xs flex items-center justify-center transition-all font-mono ${
                                                     (irr >> i) & 1 ? 'bg-yellow-600 text-white font-bold shadow-[0_0_8px_rgba(202,138,4,0.6)]' : 'bg-slate-800/50 text-slate-700'
                                                 }`}>
                                                     {(irr >> i) & 1 ? '1' : '0'}
                                                 </div>
                                             ))}
                                         </div>
                                     </div>

                                     {/* ISR */}
                                     <div className="flex flex-col gap-3 group">
                                         <span className="text-xs font-bold text-red-500 uppercase tracking-widest bg-red-900/20 py-1 rounded">ISR Service</span>
                                         <div className="flex flex-col gap-1.5 bg-black/40 p-3 rounded-lg border border-white/5 shadow-inner">
                                             {Array.from({length: 8}).map((_, i) => (
                                                 <div key={i} className={`h-6 w-full rounded text-xs flex items-center justify-center transition-all font-mono ${
                                                     (isr >> i) & 1 ? 'bg-red-600 text-white font-bold shadow-[0_0_8px_rgba(220,38,38,0.6)]' : 'bg-slate-800/50 text-slate-700'
                                                 }`}>
                                                     {(isr >> i) & 1 ? '1' : '0'}
                                                 </div>
                                             ))}
                                         </div>
                                     </div>

                                     {/* IMR */}
                                     <div className="flex flex-col gap-3 group">
                                         <span className="text-xs font-bold text-blue-500 uppercase tracking-widest bg-blue-900/20 py-1 rounded">IMR Mask</span>
                                         <div className="flex flex-col gap-1.5 bg-black/40 p-3 rounded-lg border border-white/5 shadow-inner">
                                             {Array.from({length: 8}).map((_, i) => (
                                                 <button 
                                                    key={i} 
                                                    onClick={() => toggleImr(i)}
                                                    className={`h-6 w-full rounded text-xs flex items-center justify-center transition-all hover:ring-1 ring-blue-500/50 font-mono ${
                                                     (imr >> i) & 1 ? 'bg-blue-600 text-white font-bold shadow-[0_0_8px_rgba(37,99,235,0.6)]' : 'bg-slate-800/50 text-slate-700 hover:bg-slate-700'
                                                 }`}>
                                                     {(imr >> i) & 1 ? '1' : '0'}
                                                 </button>
                                             ))}
                                         </div>
                                     </div>
                                 </div>
                            </div>

                            {/* CPU INT (Right) */}
                            <div className="col-span-2 flex flex-col justify-center items-start pl-6">
                                 <div className="flex items-center gap-4 bg-slate-800/50 p-4 rounded-xl border border-white/5">
                                     <div className={`w-12 h-1 transition-all duration-300 ${isr > 0 ? 'bg-red-500 shadow-[0_0_10px_#ef4444]' : 'bg-slate-700'}`}></div>
                                     <div className="flex flex-col gap-1">
                                         <span className={`text-sm font-bold ${isr > 0 ? 'text-red-500' : 'text-slate-500'}`}>INT</span>
                                         <div className="text-[10px] text-slate-500 font-mono bg-black/20 px-1 py-0.5 rounded">to CPU</div>
                                     </div>
                                 </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default InterfaceLab;