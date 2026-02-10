import React, { useState } from 'react';
import { SyllabusNode } from '../types';
import { chatWithTutor } from '../services/geminiService';
import { ChevronRight, ChevronDown, BookOpen, MessageCircle, Loader2 } from 'lucide-react';

const syllabusData: SyllabusNode[] = [
  {
    id: '1', title: '一、数制与数码', children: [
      { id: '1-1', title: '1. 二进制数（在计算机中表示方式）', queryPrompt: '请详细解释二进制数在计算机中的表示方式，包括其优势。' },
      { id: '1-2', title: '2. 十六进制、八进制', queryPrompt: '解释十六进制和八进制在微机原理中的应用及与二进制的转换。' },
      { id: '1-3', title: '3. 二进制运算', queryPrompt: '举例说明二进制的加减乘除运算规则。' },
      { id: '1-4', title: '4. 二进制编码', queryPrompt: '介绍 ASCII 码和 BCD 码的概念。' },
      { id: '1-5', title: '5. 带符号数表示：原码、反码与补码', queryPrompt: '详细解释原码、反码、补码的定义、转换方法及补码运算的优势。' },
    ]
  },
  {
    id: '2', title: '二、计算机基础', children: [
      { id: '2-1', title: '1. 8086 的寄存器结构', queryPrompt: '详细介绍 8086 的通用寄存器、段寄存器和控制寄存器及其功能。' },
      { id: '2-2', title: '2. 8086 的功能结构', queryPrompt: '解释 8086 的 BIU（总线接口单元）和 EU（执行单元）的工作原理及并行流水线机制。' },
      { id: '2-3', title: '3. 存储器组织(物理地址)', queryPrompt: '讲解 8086 的存储器分段机制，以及逻辑地址到物理地址的计算公式（CS:IP）。' },
      { id: '2-4', title: '4. 堆栈', queryPrompt: '解释堆栈的概念、SS:SP 寄存器的作用以及 PUSH/POP 指令的操作过程。' },
    ]
  },
  {
    id: '3', title: '三、程序设计', children: [
      { id: '3-1', title: '1. 寻址方式', queryPrompt: '列举并举例说明 8086 的 7 种基本寻址方式（立即、寄存器、直接、寄存器间接等）。' },
      { id: '3-2', title: '2. 指令用法', children: [
          { id: '3-2-1', title: '(1) 多字节相加，相减', queryPrompt: '解释 ADC 和 SBB 指令在多字节运算中的应用。' },
          { id: '3-2-2', title: '(2) BCD 调整 (加、减、乘、除)', queryPrompt: '解释 DAA, DAS, AAA, AAS 等指令的作用和使用场景。' },
          { id: '3-2-3', title: '(3) 移位、循环移位', queryPrompt: '比较 SHL/SAL, SHR, SAR, ROL, ROR, RCL, RCR 的区别。' },
          { id: '3-2-4', title: '(4) 串操作', queryPrompt: '讲解 MOVS, STOS, LODS, CMPS, SCAS 指令及 REP 前缀的使用。' },
          { id: '3-2-5', title: '(5) CALL, JMP (段内/段间)', queryPrompt: '区分 Near 和 Far 的跳转与调用，以及它们对 CS 和 IP 的影响。' },
          { id: '3-2-6', title: '(6) 组合条件的条件转移', queryPrompt: '解释 JG, JL, JA, JB 等基于标志位组合的转移指令。' },
      ]},
      { id: '3-3', title: '3. 伪指令', children: [
          { id: '3-3-1', title: '(1) 数据定义', queryPrompt: '解释 DB, DW, DD, DUP 等伪指令。' },
          { id: '3-3-2', title: '(2) 运算符符号', queryPrompt: '解释 OFFSET, SEG, PTR 等汇编运算符。' },
      ]},
    ]
  },
  {
    id: '4', title: '四、时序与中断', children: [
        { id: '4-1', title: '1. 地址/数据复用与 T 状态', queryPrompt: '解释 8086 的地址数据复用技术以及指令周期、总线周期和时钟周期的关系。' },
        { id: '4-2', title: '2. 中断及中断向量表', children: [
             { id: '4-2-1', title: '中断类型 (可屏蔽/不可屏蔽/内部)', queryPrompt: '区分 INTR, NMI 和内部异常中断。' },
             { id: '4-2-2', title: '中断向量表', queryPrompt: '解释中断向量表的结构、存放位置（00000H）以及如何根据中断号计算入口地址。' },
             { id: '4-2-3', title: '中断响应过程', queryPrompt: '描述 CPU 响应可屏蔽中断的完整步骤（关中断、压栈、取向量等）。' },
        ]}
    ]
  },
  {
    id: '5', title: '五、接口技术', children: [
        { id: '5-1', title: '1. 8255 (PPI)', queryPrompt: '总结 8255 的三种工作方式以及控制字格式。' },
        { id: '5-2', title: '2. 8253 (定时器)', queryPrompt: '总结 8253 的 6 种工作方式特点及控制字配置。' },
        { id: '5-3', title: '3. 8259 (中断控制器)', queryPrompt: '简述 8259 的级联方式及初始化命令字 (ICW) 的流程。' },
    ]
  }
];

const Syllabus: React.FC = () => {
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null);
  const [explanation, setExplanation] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [activeTitle, setActiveTitle] = useState("");

  const handleNodeClick = async (node: SyllabusNode) => {
    // If it has children, toggle expand (handled by state if we implemented full accordion, 
    // but here we just select it to show info if it has a prompt)
    if (node.queryPrompt) {
        setLoading(true);
        setActiveTitle(node.title);
        setExplanation(""); // Clear previous
        
        // Use a lightweight chat history context for specific explanation
        const history = [{
            role: 'model', 
            parts: [{ text: "我是你的考研复习助教。请点击大纲条目，我会为你解析重点。" }]
        }];
        const text = await chatWithTutor(history, `${node.queryPrompt} (请结合考研复习大纲的要求进行简练总结)`);
        setExplanation(text);
        setLoading(false);
    }
    // Simple expand/collapse logic could go here
  };

  const renderTree = (nodes: SyllabusNode[], level = 0) => {
    return (
        <div className={`flex flex-col gap-1 ${level > 0 ? 'ml-6 border-l border-slate-700 pl-4' : ''}`}>
            {nodes.map(node => (
                <div key={node.id}>
                    <button 
                        onClick={() => handleNodeClick(node)}
                        className={`text-left w-full py-2 px-3 rounded hover:bg-slate-800 transition-colors flex items-center justify-between group ${level === 0 ? 'font-bold text-slate-200' : 'text-sm text-slate-400'}`}
                    >
                        <span className="group-hover:text-blue-400 transition-colors">{node.title}</span>
                        {node.queryPrompt && <MessageCircle size={14} className="opacity-0 group-hover:opacity-100 text-blue-500" />}
                    </button>
                    {node.children && renderTree(node.children, level + 1)}
                </div>
            ))}
        </div>
    );
  };

  return (
    <div className="flex flex-col h-full gap-6 overflow-y-auto lg:overflow-hidden">
        <div className="flex items-center justify-between shrink-0">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <BookOpen className="text-blue-400" /> 复习大纲
            </h2>
            <div className="text-xs text-slate-500 bg-slate-800 px-3 py-1 rounded-full">
                点击考点获取 AI 解析
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:flex-1 lg:min-h-0 pb-4">
            {/* Tree View */}
            {/* Mobile: fixed height (h-96) to allow scrolling. Desktop: auto height to fill grid. */}
            <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 overflow-y-auto custom-scrollbar h-96 lg:h-auto">
                {renderTree(syllabusData)}
            </div>

            {/* Content View */}
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 flex flex-col shadow-xl min-h-[500px] lg:min-h-0">
                {activeTitle ? (
                    <>
                        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2 border-b border-slate-700 pb-2">
                             {activeTitle}
                        </h3>
                        <div className="flex-1 overflow-y-auto custom-scrollbar">
                            {loading ? (
                                <div className="flex items-center justify-center h-full text-slate-400 gap-2">
                                    <Loader2 className="animate-spin" />
                                    正在生成考点解析...
                                </div>
                            ) : (
                                <div className="prose prose-invert prose-sm max-w-none whitespace-pre-wrap leading-relaxed">
                                    {explanation}
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-slate-500">
                        <BookOpen size={48} className="mb-4 opacity-20" />
                        <p>请在左侧选择一个考点</p>
                        <p className="text-xs mt-2">AI 助教将为你生成详细的复习笔记</p>
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};

export default Syllabus;