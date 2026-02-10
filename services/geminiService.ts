import { GoogleGenAI, Type, Schema } from "@google/genai";
import { RegisterState, SimulationResult, ExamQuestion } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

// Schema for structured 8086 simulation output
const simulationSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    registers: {
      type: Type.OBJECT,
      properties: {
        AX: { type: Type.STRING },
        BX: { type: Type.STRING },
        CX: { type: Type.STRING },
        DX: { type: Type.STRING },
        SI: { type: Type.STRING },
        DI: { type: Type.STRING },
        SP: { type: Type.STRING },
        BP: { type: Type.STRING },
        IP: { type: Type.STRING },
        FLAGS: { type: Type.STRING },
        CS: { type: Type.STRING },
        DS: { type: Type.STRING },
        SS: { type: Type.STRING },
        ES: { type: Type.STRING },
      },
      required: ['AX', 'BX', 'CX', 'DX', 'SI', 'DI', 'SP', 'BP', 'IP', 'FLAGS'],
    },
    memoryChanges: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          address: { type: Type.STRING },
          value: { type: Type.STRING },
        }
      }
    },
    explanation: { type: Type.STRING },
    error: { type: Type.STRING }
  }
};

const questionSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    type: { type: Type.STRING, enum: ['CHOICE', 'SHORT_ANSWER', 'CODING', 'READING'] },
    content: { type: Type.STRING },
    options: { type: Type.ARRAY, items: { type: Type.STRING } },
    correctAnswer: { type: Type.STRING },
    explanation: { type: Type.STRING }
  },
  required: ['type', 'content', 'correctAnswer', 'explanation']
};

export const simulateAssembly = async (code: string, currentRegisters: RegisterState): Promise<SimulationResult> => {
  try {
    const prompt = `
      You are an 8086 microprocessor simulator used for Graduate Entrance Exam preparation.
      Analyze the following assembly code. 
      The current state of registers is provided.
      Execute the instructions step-by-step mentally.
      Return the FINAL state of the registers in 4-digit HEX format (e.g., "0000").
      Also list any specific memory address changes if they occur.
      Provide a brief explanation of what the code did in Simplified Chinese (简体中文).
      Focus on exam key points like Flag updates (CF, ZF, OF), Addressing modes used, and Stack operations.
      If there is a syntax error, populate the 'error' field and keep registers unchanged.

      Current Registers:
      ${JSON.stringify(currentRegisters)}

      Code to Execute:
      ${code}
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: simulationSchema,
        systemInstruction: "You are a strict, accurate 8086 emulator. Always output 16-bit hex values (e.g. 1A2B) for registers. Explain logic in Chinese.",
      },
    });

    const result = JSON.parse(response.text || '{}') as SimulationResult;
    return result;
  } catch (error) {
    console.error("Simulation error:", error);
    return {
      registers: currentRegisters,
      memoryChanges: [],
      explanation: "连接仿真引擎失败。",
      error: error instanceof Error ? error.message : "未知错误",
    };
  }
};

export const chatWithTutor = async (history: { role: string; parts: { text: string }[] }[], newMessage: string) => {
  try {
    const chat = ai.chats.create({
      model: 'gemini-3-flash-preview',
      history: history,
      config: {
        systemInstruction: `你是一位专门辅导计算机考研复试的教授，课程是《微机原理与接口技术》。
        你非常熟悉学生提供的《复习大纲》，重点涵盖：
        1. 数制与编码（原码、补码、反码、BCD）。
        2. 8086 架构（寄存器、物理地址计算、堆栈）。
        3. 指令系统（特别是多字节加减、BCD调整、移位、串操作、JMP/CALL、条件转移）。
        4. 汇编程序设计（分支、循环、DOS调用）。
        5. 时序与总线（最大/最小模式、T状态、总线周期）。
        6. 中断系统（中断向量表、8259初始化、中断响应过程）。
        7. 接口技术（8255, 8253, 8259 的控制字与编程）。
        
        请用简体中文清晰地解释概念，多使用类比，针对考研面试/笔试的特点，回答要精准、有条理。`,
      }
    });

    const result = await chat.sendMessage({ message: newMessage });
    return result.text;
  } catch (error) {
    console.error("Chat error:", error);
    return "抱歉，我现在无法连接到知识库。";
  }
};

export const explainControlWord = async (chipType: '8255' | '8253' | '8259', controlWordHex: string) => {
    try {
        let chipContext = "";
        switch (chipType) {
            case '8255':
                chipContext = "Intel 8255 PPI (Mode 0/1/2, Port Direction)";
                break;
            case '8253':
                chipContext = "Intel 8253/8254 Timer (Counter selection, Read/Load format, Mode 0-5, BCD/Binary)";
                break;
            case '8259':
                chipContext = "Intel 8259 PIC (ICW1-4 Initialization Command Words or OCW1-3 Operation Command Words)";
                break;
        }

        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Analyze this Control Word: ${controlWordHex}H for the ${chipContext}.
            Explain specifically what this configuration does based on the bit definitions.
            This is for a student reviewing for their graduate entrance exam, so be precise about modes and functions.
            Please respond in Simplified Chinese.`,
        });
        return response.text;
    } catch (error) {
        return "分析控制字时出错。";
    }
}

export const generateQuestion = async (
    topic: string, 
    difficulty: 'Easy' | 'Medium' | 'Hard',
    typePreference?: 'CHOICE' | 'SHORT_ANSWER' | 'CODING' | 'READING'
): Promise<ExamQuestion | null> => {
    try {
        let typeInstruction = `
            - If valid for the topic, prefer 'CHOICE' (Multiple Choice) with 4 options.
            - If it requires calculation or design, use 'SHORT_ANSWER'.
            - If it involves writing assembly, use 'CODING'.`;

        if (typePreference) {
             typeInstruction = `
             - You MUST generate a '${typePreference}' type question.
             ${typePreference === 'CODING' ? '- The user wants to write assembly code. Provide a prompt asking them to write a specific program snippet or complete a code segment.' : ''}
             ${typePreference === 'CHOICE' ? '- Provide 4 distinct options.' : ''}
             ${typePreference === 'READING' ? '- Provide a specific assembly code snippet (5-15 lines). Ask the user to determine the final value of a register (e.g., AX, BX) or a flag (ZF, CF) after execution. Put the code inside the content.' : ''}
             `;
        }

        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Create a single practice question for "Microcomputer Principles and Interface Technology" (8086/Interfaces).
            Topic: ${topic}
            Difficulty: ${difficulty}
            
            Format requirements:
            ${typeInstruction}
            - Provide the content, options (if choice), correct answer, and a detailed explanation in Simplified Chinese.
            - For 'READING' or 'CODING' questions, ensure any code in 'content' is clearly formatted.
            `,
            config: {
                responseMimeType: "application/json",
                responseSchema: questionSchema,
            }
        });

        return JSON.parse(response.text || '{}') as ExamQuestion;
    } catch (error) {
        console.error("Generate question error", error);
        return null;
    }
}