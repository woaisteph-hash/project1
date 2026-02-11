import React, { useState, useRef, useEffect } from 'react';
import { RegisterState, SimulationResult } from '../types';
import { simulateAssembly } from '../services/geminiService';
import { Play, RotateCcw, Cpu, Save, Loader2, BookOpen, Database, Search, StepForward, Circle, HelpCircle, X, ChevronRight, Terminal, ArrowDown, Copy, Check } from 'lucide-react';

// Instruction Data for Help System
const instructionDocs = [
  { cmd: 'MOV', name: '数据传送', syntax: 'MOV DST, SRC', desc: '将源操作数复制到目的操作数。', flags: '无' },
  { cmd: 'PUSH', name: '入栈', syntax: 'PUSH SRC', desc: 'SP=SP-2, 将操作数压入堆栈。', flags: '无' },
  { cmd: 'POP', name: '出栈', syntax: 'POP DST', desc: '弹出栈顶数据至DST, SP=SP+2。', flags: '无' },
  { cmd: 'XCHG', name: '交换', syntax: 'XCHG OP1, OP2', desc: '交换两个操作数的内容。', flags: '无' },
  { cmd: 'LEA', name: '取有效地址', syntax: 'LEA REG, MEM', desc: '将内存偏移地址传送给寄存器。', flags: '无' },
  { cmd: 'ADD', name: '加法', syntax: 'ADD DST, SRC', desc: 'DST = DST + SRC。', flags: 'OF, SF, ZF, AF, PF, CF' },
  { cmd: 'ADC', name: '带进位加', syntax: 'ADC DST, SRC', desc: 'DST = DST + SRC + CF。', flags: 'OF, SF, ZF, AF, PF, CF' },
  { cmd: 'SUB', name: '减法', syntax: 'SUB DST, SRC', desc: 'DST = DST - SRC。', flags: 'OF, SF, ZF, AF, PF, CF' },
  { cmd: 'SBB', name: '带借位减', syntax: 'SBB DST, SRC', desc: 'DST = DST - SRC - CF。', flags: 'OF, SF, ZF, AF, PF, CF' },
  { cmd: 'INC', name: '加1', syntax: 'INC DST', desc: 'DST = DST + 1。注意：不影响CF标志。', flags: 'OF, SF, ZF, AF, PF' },
  { cmd: 'DEC', name: '减1', syntax: 'DEC DST', desc: 'DST = DST - 1。注意：不影响CF标志。', flags: 'OF, SF, ZF, AF, PF' },
  { cmd: 'CMP', name: '比较', syntax: 'CMP DST, SRC', desc: '执行减法(DST-SRC)但不保存结果，只更新标志位。', flags: 'OF, SF, ZF, AF, PF, CF' },
  { cmd: 'AND', name: '逻辑与', syntax: 'AND DST, SRC', desc: '按位与。CF=0, OF=0。', flags: 'SF, ZF, PF' },
  { cmd: 'OR', name: '逻辑或', syntax: 'OR DST, SRC', desc: '按位或。CF=0, OF=0。', flags: 'SF, ZF, PF' },
  { cmd: 'XOR', name: '逻辑异或', syntax: 'XOR DST, SRC', desc: '按位异或。CF=0, OF=0。', flags: 'SF, ZF, PF' },
  { cmd: 'TEST', name: '测试', syntax: 'TEST DST, SRC', desc: '按位与但不保存结果，只更新标志。', flags: 'SF, ZF, PF' },
  { cmd: 'JMP', name: '无条件转移', syntax: 'JMP LABEL', desc: '跳转到指定标号。', flags: '无' },
  { cmd: 'JZ/JE', name: '零/相等跳转', syntax: 'JZ LABEL', desc: '若 ZF=1 则跳转。', flags: '无' },
  { cmd: 'JNZ/JNE', name: '非零/不等跳转', syntax: 'JNZ LABEL', desc: '若 ZF=0 则跳转。', flags: '无' },
  { cmd: 'JC', name: '进位跳转', syntax: 'JC LABEL', desc: '若 CF=1 则跳转。', flags: '无' },
  { cmd: 'LOOP', name: '循环', syntax: 'LOOP LABEL', desc: 'CX=CX-1, 若CX!=0则跳转。', flags: '无' },
  { cmd: 'CALL', name: '过程调用', syntax: 'CALL PROC', desc: '压入IP (及CS)，跳转。', flags: '无' },
  { cmd: 'RET', name: '过程返回', syntax: 'RET', desc: '弹出IP (及CS)。', flags: '无' },
  { cmd: 'CLD', name: '清方向', syntax: 'CLD', desc: 'DF=0, 串操作地址递增。', flags: 'DF' },
  { cmd: 'STD', name: '置方向', syntax: 'STD', desc: 'DF=1, 串操作地址递减。', flags: 'DF' },
  { cmd: 'MOVSB', name: '串传送', syntax: 'REP MOVSB', desc: 'DS:[SI] -> ES:[DI], 更新SI, DI。', flags: '无' },
];

const initialRegisters: RegisterState = {
  AX: "0000", BX: "0000", CX: "0000", DX: "0000",
  SI: "0000", DI: "0000", SP: "FFFE", BP: "0000",
  IP: "0100", FLAGS: "0000",
  CS: "0700", DS: "0700", SS: "0700", ES: "0700"
};

const examPresets = [
  {
    name: "典型考题：多字节加法 (ADC)",
    code: `; 计算 12345678H + 87654321H
MOV AX, 5678H ; 低16位
ADD AX, 4321H ; 低16位相加
MOV BX, 1234H ; 高16位
ADC BX, 8765H ; 高16位相加 (带进位)`
  },
  {
    name: "典型考题：BCD 码调整 (DAA)",
    code: `; 计算 BCD 码 28 + 35
MOV AL, 28H   ; AL = 28 (BCD)
ADD AL, 35H   ; AL = 5D (Hex)
DAA           ; 调整后 AL = 63 (BCD)`
  },
  {
    name: "典型考题：串操作 (REP MOVSB)",
    code: `; 数据块移动
MOV SI, 0000H ; 源地址偏移
MOV DI, 0010H ; 目的地址偏移
MOV CX, 0005H ; 移动5个字节
CLD           ; 清方向标志 (正向)
REP MOVSB     ; 重复移动`
  },
  {
    name: "典型考题：条件转移 (JNZ)",
    code: `; 1到10累加求和
MOV CX, 0AH   ; 计数 10
MOV AX, 0000H ; 累加器清零
MOV BX, 0001H ; 当前数
NEXT:
ADD AX, BX
INC BX
DEC CX
JNZ NEXT      ; 若 CX != 0 跳转`
  },
  {
    name: "考点：堆栈操作 (PUSH/POP)",
    code: `; 交换 AX 和 BX 的值
MOV AX, 1111H
MOV BX, 2222H
PUSH AX
PUSH BX
POP AX        ; 此时 AX = 2222H
POP BX        ; 此时 BX = 1111H`
  }
];

const CpuSimulator: React.FC = () => {
  const [registers, setRegisters] = useState<RegisterState>(initialRegisters);
  const [changedRegs, setChangedRegs] = useState<string[]>([]);
  
  const [code, setCode] = useState<string>(examPresets[0].code);
  const [loading, setLoading] = useState(false);
  const [lastExplanation, setLastExplanation] = useState<string>("");
  const [error, setError] = useState<string | undefined>();
  const [isPresetMenuOpen, setIsPresetMenuOpen] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [helpSearch, setHelpSearch] = useState("");
  const [copied, setCopied] = useState(false);
  
  const [memory, setMemory] = useState<Record<string, string>>({});
  const [memoryStartAddr, setMemoryStartAddr] = useState<string>("0000");

  const [breakpoints, setBreakpoints] = useState<number[]>([]);
  const [executionLine, setExecutionLine] = useState<number>(0); 
  
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);

  const handleScroll = () => {
      if (textAreaRef.current && lineNumbersRef.current) {
          lineNumbersRef.current.scrollTop = textAreaRef.current.scrollTop;
      }
  };

  const toggleBreakpoint = (lineIndex: number) => {
      setBreakpoints(prev => {
          if (prev.includes(lineIndex)) {
              return prev.filter(i => i !== lineIndex);
          } else {
              return [...prev, lineIndex].sort((a, b) => a - b);
          }
      });
  };

  const handleCodeChange = (val: string) => {
      setCode(val);
      setExecutionLine(0);
      setError(undefined);
      setChangedRegs([]);
  };

  const handleSmartRun = async () => {
    setLoading(true);
    setError(undefined);
    setChangedRegs([]);
    
    const lines = code.split('\n');
    const totalLines = lines.length;
    let nextStopLine = totalLines;
    
    const upcomingBreakpoints = breakpoints.filter(b => b > executionLine);
    if (upcomingBreakpoints.length > 0) {
        nextStopLine = upcomingBreakpoints[0];
    }

    if (executionLine >= totalLines) {
        setLoading(false);
        return;
    }

    const codeChunk = lines.slice(executionLine, nextStopLine).join('\n');

    if (!codeChunk.trim()) {
        setExecutionLine(nextStopLine);
        setLoading(false);
        return;
    }

    try {
      const result = await simulateAssembly(codeChunk, registers);
      if (result.error) {
        setError(result.error);
      } else {
        const newChanged: string[] = [];
        Object.keys(result.registers).forEach((key) => {
            const k = key as keyof RegisterState;
            if (result.registers[k] !== registers[k]) {
                newChanged.push(k);
            }
        });
        setChangedRegs(newChanged);
        
        setRegisters(result.registers);
        
        if (executionLine > 0) {
            setLastExplanation(prev => prev + "\n\n--- 继续执行 ---\n" + result.explanation);
        } else {
            setLastExplanation(result.explanation);
        }
        
        if (result.memoryChanges && result.memoryChanges.length > 0) {
            const newMem = { ...memory };
            result.memoryChanges.forEach(change => {
                let addr = change.address.replace(/h|H|0x/g, '').toUpperCase();
                if (addr.includes(':')) addr = addr.split(':')[1];
                addr = addr.padStart(4, '0');
                newMem[addr] = change.value;
            });
            setMemory(newMem);
        }

        setExecutionLine(nextStopLine);
      }
    } catch (e) {
      setError("Failed to run simulation.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setRegisters(initialRegisters);
    setMemory({});
    setLastExplanation("");
    setError(undefined);
    setExecutionLine(0);
    setChangedRegs([]);
  };

  const copyCode = () => {
      navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
  };

  const renderMemoryRows = () => {
      const rows = [];
      const start = parseInt(memoryStartAddr, 16) || 0;
      
      // Increased to 16 rows to make scrolling more useful and visible
      for (let i = 0; i < 16; i++) { 
          const currentAddrDec = start + i;
          const currentAddrHex = currentAddrDec.toString(16).toUpperCase().padStart(4, '0');
          const val = memory[currentAddrHex] || "00";
          
          rows.push(
              <div key={currentAddrHex} className="flex justify-between items-center py-2 px-3 border-b border-slate-700/30 last:border-0 hover:bg-white/5 rounded transition-colors group">
                  <span className="font-mono text-slate-500 text-xs group-hover:text-blue-400">{currentAddrHex}</span>
                  <span className={`font-mono font-bold tracking-wider ${memory[currentAddrHex] ? 'text-yellow-400' : 'text-slate-300'}`}>
                      {val}
                  </span>
              </div>
          );
      }
      return rows;
  };

  const filteredDocs = instructionDocs.filter(doc => 
    doc.cmd.includes(helpSearch.toUpperCase()) || 
    doc.name.includes(helpSearch) ||
    doc.desc.includes(helpSearch)
  );

  const lineCount = code.split('\n').length;
  const isFinished = executionLine >= lineCount && lineCount > 0;
  const isPaused = executionLine > 0 && !isFinished;

  return (
    <div className="flex flex-col gap-8 w-full max-w-[1800px] mx-auto pb-24">
      
      {/* 1. Header Control Bar - Sticky */}
      <div className="sticky top-0 z-30 flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-900/80 p-5 rounded-b-2xl md:rounded-2xl border-b md:border border-white/10 backdrop-blur-xl shadow-2xl transition-all">
        <div className="flex items-center gap-4 w-full sm:w-auto">
            <div className="p-2.5 bg-blue-600/20 rounded-xl border border-blue-500/20 shadow-[0_0_15px_rgba(37,99,235,0.2)]">
                <Terminal className="text-blue-400" size={24}/>
            </div>
            <div className="flex flex-col">
                <h2 className="text-xl font-bold text-white tracking-tight">
                    8086 汇编仿真器
                </h2>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span className="flex items-center gap-1"><Circle size={6} className="text-green-500 fill-current"/> 系统就绪</span>
                    <span className="w-1 h-1 bg-slate-600 rounded-full"></span>
                    <span>双击行号设置断点</span>
                </div>
            </div>
        </div>
        
        <div className="flex gap-3 w-full sm:w-auto">
          <button 
            onClick={handleReset}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-white/5 transition-all hover:border-slate-600 shadow-sm font-medium"
          >
            <RotateCcw size={18} /> <span className="hidden sm:inline">重置状态</span>
          </button>
          <button 
            onClick={handleSmartRun}
            disabled={loading || isFinished}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-bold shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed text-white ${
                isPaused 
                ? 'bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-500 hover:to-orange-500 shadow-orange-900/40' 
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-blue-900/40'
            }`}
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : (isPaused ? <StepForward size={20}/> : <Play size={20} />)}
            {loading ? "仿真中..." : (isPaused ? "单步执行 (Step)" : "运行代码 (Run)")}
          </button>
        </div>
      </div>

      {/* 2. Main Layout: Input (Left) vs State (Right) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        
        {/* === LEFT COLUMN: Editor & Log (Width: 8/12) === */}
        <div className="xl:col-span-8 flex flex-col gap-6">
            
            {/* A. Code Editor Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl flex flex-col overflow-hidden group">
                {/* Editor Toolbar */}
                <div className="flex justify-between items-center p-3 bg-slate-950/50 border-b border-white/5">
                     <div className="flex items-center gap-3 pl-2">
                         <div className="flex gap-1.5 opacity-60">
                             <div className="w-3 h-3 rounded-full bg-red-500"></div>
                             <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                             <div className="w-3 h-3 rounded-full bg-green-500"></div>
                         </div>
                         <span className="text-xs font-mono font-semibold text-slate-500 ml-2">source.asm</span>
                     </div>
                     <div className="flex items-center gap-2">
                        <button onClick={copyCode} className="p-2 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white transition-colors" title="复制代码">
                            {copied ? <Check size={16} className="text-green-500"/> : <Copy size={16}/>}
                        </button>
                        <div className="h-4 w-[1px] bg-white/10 mx-1"></div>
                        <button 
                            onClick={() => setIsPresetMenuOpen(!isPresetMenuOpen)}
                            className="px-3 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 hover:text-indigo-300 rounded-lg text-xs font-medium flex items-center gap-2 transition-colors border border-indigo-500/20 relative"
                        >
                             <BookOpen size={14}/> 加载题库
                        </button>
                        <button 
                            onClick={() => setShowHelp(!showHelp)}
                            className={`px-3 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-2 transition-colors ${showHelp ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'border-white/5 bg-white/5 text-slate-400 hover:bg-white/10'}`}
                        >
                             <HelpCircle size={14}/> 指令表
                        </button>
                        
                        {/* Preset Menu Dropdown */}
                        {isPresetMenuOpen && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setIsPresetMenuOpen(false)}></div>
                                <div className="absolute right-4 top-12 w-80 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-50 p-2 animate-in fade-in zoom-in-95 duration-200">
                                     <div className="text-[10px] font-bold text-slate-500 px-3 py-2 uppercase tracking-wider">选择预设代码</div>
                                     {examPresets.map((preset, idx) => (
                                         <button 
                                            key={idx}
                                            onClick={() => {
                                                handleCodeChange(preset.code);
                                                setIsPresetMenuOpen(false);
                                            }}
                                            className="block w-full text-left px-3 py-3 text-sm text-slate-300 hover:bg-slate-700/50 rounded-lg hover:text-white transition-colors border-b border-transparent hover:border-slate-700 last:border-0"
                                         >
                                            <div className="font-medium text-slate-200">{preset.name}</div>
                                         </button>
                                     ))}
                                </div>
                            </>
                        )}
                     </div>
                </div>
                
                {/* Editor Content */}
                <div className="flex relative min-h-[500px] bg-[#0b0e14]">
                    {/* Line Numbers */}
                    <div 
                        ref={lineNumbersRef}
                        className="w-16 bg-slate-900/30 border-r border-white/5 text-right py-6 pr-4 select-none overflow-hidden text-sm font-mono leading-8 text-slate-600"
                    >
                        {code.split('\n').map((_, i) => (
                            <div 
                                key={i} 
                                className="h-8 cursor-pointer flex justify-end items-center gap-3 hover:text-slate-400 transition-colors group/line relative"
                                onClick={() => toggleBreakpoint(i)}
                            >
                                <div className={`w-2 h-2 rounded-full transition-all ${breakpoints.includes(i) ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)] opacity-100 scale-100' : 'opacity-0 scale-0 group-hover/line:opacity-40 group-hover/line:scale-100 bg-red-400'}`}></div>
                                <span className={`${executionLine === i ? 'text-green-400 font-bold' : ''}`}>
                                    {i + 1}
                                </span>
                            </div>
                        ))}
                    </div>

                    {/* Text Area */}
                    <textarea 
                        ref={textAreaRef}
                        value={code}
                        onChange={(e) => handleCodeChange(e.target.value)}
                        onScroll={handleScroll}
                        className="flex-1 bg-transparent text-slate-300 font-mono p-6 pl-4 focus:outline-none resize-none custom-scrollbar text-sm leading-8 whitespace-pre selection:bg-blue-500/30 z-10 relative"
                        spellCheck={false}
                        wrap="off"
                    />
                    
                    {/* Active Line Highlight */}
                    {executionLine < lineCount && (
                         <div 
                            className="absolute left-0 pointer-events-none w-full border-l-[4px] border-green-500 bg-green-500/10 transition-all duration-300 z-0"
                            style={{ 
                                top: `${24 + (executionLine * 32) - (textAreaRef.current?.scrollTop || 0)}px`, 
                                height: '32px' 
                            }}
                         />
                    )}

                    {/* Help Slide-in Panel */}
                    {showHelp && (
                        <div className="absolute top-0 bottom-0 right-0 w-full md:w-80 bg-slate-900/95 backdrop-blur-xl border-l border-white/10 shadow-2xl z-20 flex flex-col animate-in slide-in-from-right-10 duration-200">
                             <div className="flex items-center p-4 border-b border-white/10 gap-2 bg-slate-900">
                                <Search size={16} className="text-slate-500" />
                                <input 
                                    type="text" 
                                    placeholder="搜索指令 (如 MOV)..." 
                                    value={helpSearch}
                                    onChange={(e) => setHelpSearch(e.target.value)}
                                    className="bg-transparent border-none focus:ring-0 text-white text-sm w-full placeholder-slate-500 h-8"
                                    autoFocus
                                />
                                <button onClick={() => setShowHelp(false)} className="text-slate-400 hover:text-white p-1 hover:bg-white/10 rounded">
                                    <X size={18} />
                                </button>
                             </div>
                             <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4 bg-slate-900/50">
                                {filteredDocs.length > 0 ? (
                                    filteredDocs.map((doc, idx) => (
                                        <div key={idx} className="bg-slate-800/50 border border-white/5 rounded-xl p-4 text-xs group hover:border-blue-500/30 transition-all hover:bg-slate-800 shadow-sm">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="font-bold text-green-400 font-mono text-sm px-2 py-0.5 bg-green-900/20 rounded border border-green-500/20">{doc.cmd}</span>
                                                <span className="text-slate-400 font-medium">{doc.name}</span>
                                            </div>
                                            <div className="font-mono text-slate-300 bg-black/30 px-3 py-2 rounded-lg mb-2 border border-white/5 block w-full">{doc.syntax}</div>
                                            <p className="text-slate-400 leading-relaxed">{doc.desc}</p>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center text-slate-500 py-12 text-sm">未找到匹配指令</div>
                                )}
                             </div>
                        </div>
                    )}
                </div>
            </div>
            
            {/* B. Console / Log Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-0 shadow-xl overflow-hidden flex flex-col h-[350px]">
                <div className="px-5 py-3 bg-slate-950/50 border-b border-white/5 flex items-center justify-between shrink-0">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <Terminal size={14} className="text-blue-400"/> 仿真控制台输出
                    </label>
                    {error && <span className="text-xs text-red-400 bg-red-900/20 px-2 py-0.5 rounded border border-red-500/20 font-bold">Error</span>}
                </div>
                <div className="flex-1 p-5 bg-[#0b0e14] overflow-y-auto custom-scrollbar">
                     {error ? (
                        <div className="flex items-start gap-3 text-red-400 bg-red-950/20 p-4 rounded-xl border border-red-900/30">
                             <Circle size={8} className="mt-1.5 fill-current shrink-0"/>
                             <p className="font-mono text-sm">{error}</p>
                        </div>
                    ) : lastExplanation ? (
                        <div className="text-slate-300 leading-relaxed font-mono text-sm whitespace-pre-wrap">
                            <span className="text-green-400 mr-2">➜</span>
                            {lastExplanation}
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-600 gap-3 py-6 opacity-50">
                            <Terminal size={32} />
                            <p className="text-center text-sm">暂无输出日志，请运行代码...</p>
                        </div>
                    )}
                </div>
            </div>
        </div>

        {/* === RIGHT COLUMN: State Dashboard (Width: 4/12) - Sticky === */}
        {/* Added xl:max-h-[calc(100vh-8rem)] and xl:overflow-y-auto to allow scrolling of the sticky sidebar itself if content is too tall */}
        <div className="xl:col-span-4 flex flex-col gap-6 xl:sticky xl:top-24 xl:max-h-[calc(100vh-8rem)] xl:overflow-y-auto custom-scrollbar pr-1">
            
            {/* C. Registers Dashboard */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden shrink-0">
                <div className="p-4 border-b border-white/5 bg-slate-950/30 flex items-center justify-between">
                     <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <Cpu size={18} className="text-purple-400"/> CPU 寄存器状态
                     </h3>
                     <span className="text-[10px] bg-slate-800 px-2 py-1 rounded text-slate-500 font-mono">16-BIT HEX</span>
                </div>
                
                <div className="p-5 flex flex-col gap-6">
                    {/* Group 1: General Purpose */}
                    <div>
                        <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 pl-1 flex items-center gap-2">
                            <div className="w-1 h-1 bg-blue-500 rounded-full"></div> 通用寄存器
                        </h4>
                        <div className="grid grid-cols-2 gap-3">
                            <RegisterBox label="AX" value={registers.AX} changed={changedRegs.includes('AX')} sub="Accumulator" />
                            <RegisterBox label="BX" value={registers.BX} changed={changedRegs.includes('BX')} sub="Base" />
                            <RegisterBox label="CX" value={registers.CX} changed={changedRegs.includes('CX')} sub="Count" />
                            <RegisterBox label="DX" value={registers.DX} changed={changedRegs.includes('DX')} sub="Data" />
                        </div>
                    </div>

                    {/* Group 2: Pointers & Index */}
                    <div>
                        <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 pl-1 flex items-center gap-2">
                            <div className="w-1 h-1 bg-yellow-500 rounded-full"></div> 变址与指针
                        </h4>
                        <div className="grid grid-cols-2 gap-3">
                            <RegisterBox label="SI" value={registers.SI} changed={changedRegs.includes('SI')} color="text-yellow-400" sub="Source Idx"/>
                            <RegisterBox label="DI" value={registers.DI} changed={changedRegs.includes('DI')} color="text-yellow-400" sub="Dest Idx"/>
                            <RegisterBox label="SP" value={registers.SP} changed={changedRegs.includes('SP')} color="text-pink-400" sub="Stack Ptr"/>
                            <RegisterBox label="BP" value={registers.BP} changed={changedRegs.includes('BP')} color="text-pink-400" sub="Base Ptr"/>
                        </div>
                    </div>

                    {/* Group 3: Segments & Control */}
                    <div>
                        <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 pl-1 flex items-center gap-2">
                            <div className="w-1 h-1 bg-teal-500 rounded-full"></div> 段寄存器与控制
                        </h4>
                        <div className="grid grid-cols-4 gap-2 mb-3">
                             <RegisterMini label="CS" value={registers.CS} changed={changedRegs.includes('CS')} />
                             <RegisterMini label="DS" value={registers.DS} changed={changedRegs.includes('DS')} />
                             <RegisterMini label="SS" value={registers.SS} changed={changedRegs.includes('SS')} />
                             <RegisterMini label="ES" value={registers.ES} changed={changedRegs.includes('ES')} />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                             <RegisterBox label="IP" value={registers.IP} changed={changedRegs.includes('IP')} color="text-red-400" sub="Inst Ptr"/>
                             <RegisterBox label="FL" value={registers.FLAGS} changed={changedRegs.includes('FLAGS')} color="text-red-400" sub="Flags"/>
                        </div>
                    </div>
                </div>
            </div>

            {/* D. Memory Monitor */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden flex flex-col shrink-0">
                 <div className="p-4 bg-slate-950/30 border-b border-white/5 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2">
                        <Database size={16} className="text-green-400" />
                        <h3 className="font-bold text-white text-sm">内存监视</h3>
                    </div>
                    <div className="relative group w-28">
                        <input 
                            type="text" 
                            value={memoryStartAddr}
                            onChange={(e) => {
                                if (/^[0-9a-fA-F]*$/.test(e.target.value) && e.target.value.length <= 4) {
                                    setMemoryStartAddr(e.target.value);
                                }
                            }}
                            className="w-full bg-slate-800 text-white pl-8 pr-3 py-1.5 rounded-lg border border-slate-700 focus:outline-none focus:border-blue-500/50 focus:bg-slate-700 font-mono text-xs transition-all text-right"
                            placeholder="0000"
                        />
                        <Search className="absolute left-2.5 top-2 text-slate-500 pointer-events-none" size={12} />
                    </div>
                 </div>
                 
                 <div className="p-0 bg-[#0b0e14]">
                     <div className="flex justify-between px-4 py-2 bg-slate-800/50 border-b border-white/5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                         <span>Offset</span>
                         <span>Hex Value</span>
                     </div>
                     <div className="divide-y divide-white/5 h-[350px] overflow-y-auto custom-scrollbar">
                         {renderMemoryRows()}
                     </div>
                 </div>
            </div>
        </div>
      </div>
    </div>
  );
};

// Component: Large Register Box
const RegisterBox: React.FC<{ label: string; value: string; changed: boolean; sub?: string; color?: string }> = ({ label, value, changed, sub, color = "text-blue-400" }) => (
    <div className={`flex flex-col p-3 rounded-xl border transition-all duration-300 relative overflow-hidden group ${
        changed 
        ? 'bg-yellow-500/10 border-yellow-500/40 shadow-[0_0_15px_rgba(234,179,8,0.1)]' 
        : 'bg-slate-800/50 border-slate-700/50 hover:border-slate-600 hover:bg-slate-800'
    }`}>
        {changed && <div className="absolute top-0 right-0 w-2 h-2 bg-yellow-400 rounded-bl-lg shadow-[0_0_5px_rgba(234,179,8,0.8)] animate-pulse"></div>}
        <div className="flex justify-between items-end mb-1">
            <span className={`font-bold text-sm ${color} font-mono tracking-tight`}>{label}</span>
            {sub && <span className="text-[9px] text-slate-600 uppercase tracking-wider font-semibold opacity-0 group-hover:opacity-100 transition-opacity">{sub}</span>}
        </div>
        <div className={`font-mono text-xl tracking-wider text-slate-200 transition-transform ${changed ? 'text-yellow-200 font-bold scale-105 origin-left' : ''}`}>
            {value}
        </div>
    </div>
);

// Component: Mini Segment Register
const RegisterMini: React.FC<{ label: string; value: string; changed: boolean }> = ({ label, value, changed }) => (
    <div className={`flex flex-col items-center justify-center p-2 rounded-lg border transition-all duration-300 ${
        changed 
        ? 'bg-teal-500/20 border-teal-500/40' 
        : 'bg-slate-800/30 border-slate-700/50 hover:bg-slate-800'
    }`}>
        <span className="text-[10px] text-teal-500 font-bold mb-0.5">{label}</span>
        <span className={`font-mono text-xs text-slate-300 ${changed ? 'text-teal-200 font-bold' : ''}`}>{value}</span>
    </div>
);

export default CpuSimulator;