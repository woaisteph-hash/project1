import React, { useState, useRef, useEffect } from 'react';
import { RegisterState, SimulationResult } from '../types';
import { simulateAssembly } from '../services/geminiService';
import { Play, RotateCcw, Cpu, Save, Loader2, BookOpen, Database, Search, StepForward, Circle } from 'lucide-react';

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
  const [code, setCode] = useState<string>(examPresets[0].code);
  const [loading, setLoading] = useState(false);
  const [lastExplanation, setLastExplanation] = useState<string>("");
  const [error, setError] = useState<string | undefined>();
  const [isPresetMenuOpen, setIsPresetMenuOpen] = useState(false);
  
  // Memory State
  const [memory, setMemory] = useState<Record<string, string>>({});
  const [memoryStartAddr, setMemoryStartAddr] = useState<string>("0000");

  // Breakpoint & Execution State
  const [breakpoints, setBreakpoints] = useState<number[]>([]);
  const [executionLine, setExecutionLine] = useState<number>(0); // 0-indexed line number where IP is currently 'paused'
  
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);

  // Sync scrolling between textarea and line numbers
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
      // If code changes, reset execution progress but keep breakpoints if possible (though lines might shift)
      // For safety in this simple version, we reset execution pointer.
      setExecutionLine(0);
      setError(undefined);
  };

  const handleSmartRun = async () => {
    setLoading(true);
    setError(undefined);
    
    const lines = code.split('\n');
    const totalLines = lines.length;

    // Determine the range of code to execute
    // Start from current executionLine
    // Stop at the NEXT breakpoint that is strictly greater than executionLine
    // OR end of code
    let nextStopLine = totalLines;
    
    // Find next breakpoint
    const upcomingBreakpoints = breakpoints.filter(b => b > executionLine);
    if (upcomingBreakpoints.length > 0) {
        nextStopLine = upcomingBreakpoints[0];
    }

    // If we are already at the end, just return (or reset?)
    if (executionLine >= totalLines) {
        setLoading(false);
        return;
    }

    // Slice the code
    // We only send the code chunk. 
    // NOTE: For complex jumps (JMP BACK), sending partial code might lose label context if the label is above.
    // However, for step-debugging, we assume the AI simulates the 'next instructions' based on current register state.
    const codeChunk = lines.slice(executionLine, nextStopLine).join('\n');

    if (!codeChunk.trim()) {
        // Skip empty lines/comments if they result in no-op, just advance
        setExecutionLine(nextStopLine);
        setLoading(false);
        return;
    }

    try {
      const result = await simulateAssembly(codeChunk, registers);
      if (result.error) {
        setError(result.error);
      } else {
        setRegisters(result.registers);
        // Append explanation instead of overwriting if we are stepping
        if (executionLine > 0) {
            setLastExplanation(prev => prev + "\n\n--- 继续执行 ---\n" + result.explanation);
        } else {
            setLastExplanation(result.explanation);
        }
        
        // Update memory state
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

        // Advance instruction pointer
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
  };

  // Helper to render memory rows
  const renderMemoryRows = () => {
      const rows = [];
      const start = parseInt(memoryStartAddr, 16) || 0;
      
      for (let i = 0; i < 16; i++) {
          const currentAddrDec = start + i;
          const currentAddrHex = currentAddrDec.toString(16).toUpperCase().padStart(4, '0');
          const val = memory[currentAddrHex] || "00";
          
          rows.push(
              <div key={currentAddrHex} className="flex justify-between items-center py-1 border-b border-slate-700/50 last:border-0 hover:bg-slate-700/30 px-2 rounded">
                  <span className="font-mono text-slate-500 text-xs">{currentAddrHex}</span>
                  <span className={`font-mono font-bold ${memory[currentAddrHex] ? 'text-yellow-400' : 'text-slate-300'}`}>
                      {val}
                  </span>
              </div>
          );
      }
      return rows;
  };

  const lineCount = code.split('\n').length;
  const isFinished = executionLine >= lineCount && lineCount > 0;
  const isPaused = executionLine > 0 && !isFinished;

  return (
    <div className="flex flex-col h-full gap-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Cpu className="text-blue-400" /> 8086 汇编仿真器
        </h2>
        <div className="flex gap-3">
          <button 
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 transition-colors"
          >
            <RotateCcw size={18} /> 重置
          </button>
          <button 
            onClick={handleSmartRun}
            disabled={loading || isFinished}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                isPaused 
                ? 'bg-yellow-600 hover:bg-yellow-500 text-white shadow-yellow-900/50' 
                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-900/50'
            }`}
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : (isPaused ? <StepForward size={18}/> : <Play size={18} />)}
            {loading ? "仿真中..." : (isPaused ? "继续执行" : "运行")}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1 min-h-0">
        {/* Editor Section (1 Column) */}
        <div className="lg:col-span-1 flex flex-col gap-4">
            <div className="flex-1 bg-slate-800 rounded-xl border border-slate-700 flex flex-col shadow-inner overflow-hidden">
                <div className="flex justify-between items-center p-3 bg-slate-900/50 border-b border-slate-700">
                     <label className="text-sm font-semibold text-slate-400">汇编代码 (MASM)</label>
                     <div className="relative">
                        <button 
                            onClick={() => setIsPresetMenuOpen(!isPresetMenuOpen)}
                            className="text-xs flex items-center gap-1 text-blue-400 hover:text-blue-300 z-50 relative focus:outline-none"
                        >
                             <BookOpen size={14}/> 加载典型考题
                        </button>
                        
                        {isPresetMenuOpen && (
                            <>
                                <div className="fixed inset-0 z-40" onClick={() => setIsPresetMenuOpen(false)}></div>
                                <div className="absolute right-0 top-full mt-2 w-64 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-50 p-2">
                                     {examPresets.map((preset, idx) => (
                                         <button 
                                            key={idx}
                                            onClick={() => {
                                                handleCodeChange(preset.code);
                                                setIsPresetMenuOpen(false);
                                            }}
                                            className="block w-full text-left px-3 py-2 text-sm text-slate-300 hover:bg-slate-700 rounded hover:text-white transition-colors"
                                         >
                                            {preset.name}
                                         </button>
                                     ))}
                                </div>
                            </>
                        )}
                     </div>
                </div>
                
                {/* Editor Container with Gutter */}
                <div className="flex flex-1 relative min-h-0">
                    {/* Line Numbers Gutter */}
                    <div 
                        ref={lineNumbersRef}
                        className="w-12 bg-slate-900 border-r border-slate-700 text-right py-4 pr-2 select-none overflow-hidden text-sm font-mono leading-6"
                    >
                        {code.split('\n').map((_, i) => (
                            <div 
                                key={i} 
                                className="h-6 cursor-pointer flex justify-end items-center gap-1 hover:text-slate-300 transition-colors"
                                onClick={() => toggleBreakpoint(i)}
                            >
                                {breakpoints.includes(i) && <div className="w-2 h-2 rounded-full bg-red-500 mr-1 shadow-[0_0_5px_rgba(239,68,68,0.8)]"></div>}
                                <span className={`mr-1 ${executionLine === i ? 'text-green-400 font-bold' : 'text-slate-600'}`}>
                                    {i + 1}
                                </span>
                            </div>
                        ))}
                    </div>

                    {/* Code Textarea */}
                    <textarea 
                        ref={textAreaRef}
                        value={code}
                        onChange={(e) => handleCodeChange(e.target.value)}
                        onScroll={handleScroll}
                        className="flex-1 bg-slate-900 text-green-400 font-mono p-4 pl-2 focus:outline-none resize-none custom-scrollbar text-sm leading-6 whitespace-pre"
                        spellCheck={false}
                        wrap="off"
                    />
                    
                    {/* Execution Line Highlight Overlay (Pointer) */}
                    {executionLine < lineCount && (
                         <div 
                            className="absolute left-0 pointer-events-none w-full border-l-2 border-green-500 bg-green-500/10 transition-all duration-300"
                            style={{ 
                                top: `${16 + (executionLine * 24) - (textAreaRef.current?.scrollTop || 0)}px`, 
                                height: '24px' 
                            }}
                         />
                    )}
                </div>
                
                <div className="px-3 py-1 bg-slate-900 border-t border-slate-800 text-[10px] text-slate-500 flex justify-between">
                    <span>点击行号设置断点</span>
                    <span>{executionLine > 0 ? `Paused at Line ${executionLine + 1}` : 'Ready'}</span>
                </div>
            </div>
            
            {/* Feedback / Error Log */}
            <div className="bg-slate-800 rounded-xl p-4 border border-slate-700 min-h-[150px] flex flex-col">
                <label className="text-sm font-semibold text-slate-400 mb-2">仿真日志 / 考点解析</label>
                <div className="font-mono text-sm flex-1 overflow-y-auto custom-scrollbar max-h-[200px]">
                    {error ? (
                        <p className="text-red-400">错误: {error}</p>
                    ) : lastExplanation ? (
                        <div className="text-slate-300 leading-relaxed whitespace-pre-wrap">{lastExplanation}</div>
                    ) : (
                        <p className="text-slate-500 italic">
                            准备执行...<br/>
                            1. 点击代码左侧行号可设置<span className="text-red-400 font-bold mx-1">断点</span>。<br/>
                            2. 程序将在断点处暂停，允许查看寄存器和内存变化。
                        </p>
                    )}
                </div>
            </div>
        </div>

        {/* Registers Section (2 Columns) */}
        <div className="lg:col-span-2 bg-slate-800 rounded-xl p-6 border border-slate-700 overflow-y-auto custom-scrollbar shadow-xl">
            <h3 className="text-lg font-semibold text-white mb-6 border-b border-slate-700 pb-2">内部寄存器 (16位)</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* General Purpose */}
                <div className="space-y-4">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">通用寄存器</h4>
                    <RegisterRow label="AX" value={registers.AX} sub="累加器" />
                    <RegisterRow label="BX" value={registers.BX} sub="基址" />
                    <RegisterRow label="CX" value={registers.CX} sub="计数" />
                    <RegisterRow label="DX" value={registers.DX} sub="数据" />
                </div>

                {/* Pointers & Index */}
                <div className="space-y-4">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">指针与变址</h4>
                    <RegisterRow label="SP" value={registers.SP} sub="堆栈指针" color="text-purple-400" />
                    <RegisterRow label="BP" value={registers.BP} sub="基址指针" color="text-purple-400" />
                    <RegisterRow label="SI" value={registers.SI} sub="源变址" color="text-yellow-400" />
                    <RegisterRow label="DI" value={registers.DI} sub="目的变址" color="text-yellow-400" />
                </div>

                {/* Instruction & Flags */}
                <div className="space-y-4">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">控制寄存器</h4>
                    <RegisterRow label="IP" value={registers.IP} sub="指令指针" color="text-red-400" />
                    <RegisterRow label="FLAGS" value={registers.FLAGS} sub="状态标志" color="text-red-400" />
                </div>

                {/* Segments */}
                <div className="space-y-4">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">段寄存器</h4>
                    <RegisterRow label="CS" value={registers.CS} sub="代码段" color="text-teal-400" />
                    <RegisterRow label="DS" value={registers.DS} sub="数据段" color="text-teal-400" />
                    <RegisterRow label="SS" value={registers.SS} sub="堆栈段" color="text-teal-400" />
                    <RegisterRow label="ES" value={registers.ES} sub="附加段" color="text-teal-400" />
                </div>
            </div>
        </div>

        {/* Memory View (1 Column) */}
        <div className="lg:col-span-1 bg-slate-800 rounded-xl border border-slate-700 flex flex-col shadow-xl overflow-hidden">
             <div className="p-4 bg-slate-900 border-b border-slate-700">
                <div className="flex items-center gap-2 mb-3">
                    <Database size={18} className="text-purple-400" />
                    <h3 className="font-semibold text-white">内存监视 (DS段)</h3>
                </div>
                <div className="relative">
                    <input 
                        type="text" 
                        value={memoryStartAddr}
                        onChange={(e) => {
                            // Only allow hex chars
                            if (/^[0-9a-fA-F]*$/.test(e.target.value) && e.target.value.length <= 4) {
                                setMemoryStartAddr(e.target.value);
                            }
                        }}
                        className="w-full bg-slate-800 text-white pl-8 pr-3 py-2 rounded-lg border border-slate-600 focus:outline-none focus:border-blue-500 font-mono text-sm"
                        placeholder="Offset (0000)"
                    />
                    <Search className="absolute left-2.5 top-2.5 text-slate-500" size={14} />
                </div>
             </div>
             
             <div className="flex-1 overflow-y-auto custom-scrollbar p-2 bg-slate-900">
                 <div className="flex justify-between px-2 py-1 text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">
                     <span>Offset</span>
                     <span>Value</span>
                 </div>
                 <div className="space-y-0.5">
                     {renderMemoryRows()}
                 </div>
             </div>
             <div className="p-2 text-[10px] text-center text-slate-600 bg-slate-900 border-t border-slate-800">
                 默认显示 00, 黄色为已修改
             </div>
        </div>
      </div>
    </div>
  );
};

const RegisterRow: React.FC<{ label: string; value: string; sub: string; color?: string }> = ({ label, value, sub, color = "text-blue-400" }) => (
    <div className="flex items-center justify-between bg-slate-900/50 p-3 rounded-lg border border-slate-700/50 hover:border-slate-600 transition-colors">
        <div className="flex flex-col">
            <span className={`font-bold text-lg ${color}`}>{label}</span>
            <span className="text-[10px] text-slate-500 uppercase">{sub}</span>
        </div>
        <div className="font-mono text-xl tracking-widest text-white">
            {value}<span className="text-slate-600 text-sm ml-1">H</span>
        </div>
    </div>
);

export default CpuSimulator;