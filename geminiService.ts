
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const enhanceMarkdownContent = async (content: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Optimize the following Markdown for a professional PDF export. 
      Ensure tables are well-formatted, improve sentence structure, and maintain all Mermaid diagrams, LaTeX math, and links. 
      Do not remove any existing diagrams. Return ONLY the enhanced markdown text.
      
      Content:
      ${content}`,
      config: {
        temperature: 0.2,
      }
    });

    return response.text || content;
  } catch (error) {
    console.error("Gemini AI Enhancement Error:", error);
    return content;
  }
};

export const generateMermaidFromDescription = async (description: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Convert this description into a valid Mermaid diagram code block. 
      Use flowchart, sequence, or class diagram as appropriate. 
      Return ONLY the code block starting with \`\`\`mermaid.
      
      Description: ${description}`,
    });
    return response.text || "";
  } catch (error) {
    console.error("Gemini AI Mermaid Error:", error);
    return "";
  }
};
