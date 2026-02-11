import React, { useState, useRef, useEffect } from 'react';
import { chatWithTutor } from '../services/geminiService';
import { Send, Bot, User, Trash2 } from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
}

const AiTutor: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { 
        id: '1', 
        role: 'model', 
        text: "你好！我是你的微机原理课程助教。关于 8086 CPU、寻址方式、中断 (8259) 或接口芯片 (8255/8253) 的任何问题都可以问我。" 
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    // Format history for Gemini
    const history = messages.map(m => ({
      role: m.role,
      parts: [{ text: m.text }]
    }));

    const responseText = await chatWithTutor(history, userMsg.text);

    const botMsg: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: 'model',
      text: responseText
    };

    setMessages(prev => [...prev, botMsg]);
    setLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-[85vh] bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden max-w-5xl mx-auto">
      {/* Chat Header */}
      <div className="p-5 bg-slate-950/50 border-b border-white/5 flex justify-between items-center backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <div className="p-2.5 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-900/20">
            <Bot className="text-white" size={24} />
          </div>
          <div>
            <h3 className="text-white font-bold text-lg">AI 助教</h3>
            <p className="text-slate-400 text-xs font-medium">x86 架构与接口技术专家</p>
          </div>
        </div>
        <button 
          onClick={() => setMessages([messages[0]])}
          className="text-slate-400 hover:text-red-400 transition-colors p-2 hover:bg-white/5 rounded-lg"
          title="清空对话"
        >
          <Trash2 size={20} />
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar bg-slate-900">
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
          >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg ${
              msg.role === 'user' ? 'bg-blue-600' : 'bg-indigo-600'
            }`}>
              {msg.role === 'user' ? <User size={20} /> : <Bot size={20} />}
            </div>
            
            <div className={`max-w-[85%] rounded-2xl p-5 text-sm md:text-base leading-relaxed whitespace-pre-wrap shadow-md ${
              msg.role === 'user' 
                ? 'bg-blue-600 text-white rounded-tr-none' 
                : 'bg-slate-800 text-slate-200 rounded-tl-none border border-slate-700'
            }`}>
              {msg.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-4">
             <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0 shadow-lg">
                <Bot size={20} />
             </div>
             <div className="bg-slate-800 rounded-2xl p-5 rounded-tl-none border border-slate-700 flex items-center gap-2">
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-75"></div>
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-150"></div>
             </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-5 bg-slate-950/50 border-t border-white/5 backdrop-blur-md">
        <div className="relative">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="询问关于 MOV 指令、中断向量表或控制字的问题..."
            className="w-full bg-slate-800 text-white pl-5 pr-14 py-4 rounded-xl border border-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none h-16 custom-scrollbar text-sm md:text-base shadow-inner transition-all hover:border-slate-600"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="absolute right-3 top-3 p-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AiTutor;