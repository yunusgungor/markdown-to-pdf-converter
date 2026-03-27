
import { GoogleGenAI, Type } from "@google/genai";
import { GeminiServiceError } from "./types";

const KEEP_WITH_NEXT_TOKEN = '<<<KEEP_WITH_NEXT>>>';
const PAGE_BREAK_TOKEN = '<<<PAGE_BREAK>>>';

const readGeminiApiKey = (): string => {
  const env = (import.meta as any).env ?? {};
  const candidates = [
    env.VITE_GEMINI_API_KEY,
    env.GEMINI_API_KEY,
    env.API_KEY
  ];

  for (const candidate of candidates) {
    const value = typeof candidate === 'string' ? candidate.trim() : '';
    if (!value) continue;
    if (value === 'PLACEHOLDER_API_KEY') continue;
    return value;
  }

  return '';
};

const getGeminiClient = (): GoogleGenAI | null => {
  const apiKey = readGeminiApiKey();
  if (!apiKey) {
    throw new GeminiServiceError(
      'missing_api_key',
      'Gemini API anahtarı eksik. `.env` veya `.env.local` içinde geçerli bir anahtar tanımlayın.'
    );
  }

  return new GoogleGenAI({ apiKey });
};

const normalizeGeminiError = (error: unknown): GeminiServiceError => {
  const rawMessage = error instanceof Error ? error.message : String(error);

  if (rawMessage.includes('API key expired')) {
    return new GeminiServiceError(
      'expired_api_key',
      'Gemini API anahtarının süresi dolmuş. Yeni bir anahtar tanımlayın.'
    );
  }

  if (rawMessage.includes('API key not valid')) {
    return new GeminiServiceError(
      'invalid_api_key',
      'Gemini API anahtarı geçersiz. Geçerli bir anahtar ile güncelleyin.'
    );
  }

  if (error instanceof GeminiServiceError) {
    return error;
  }

  return new GeminiServiceError(
    'request_failed',
    'Gemini isteği başarısız oldu. API anahtarını ve ağ bağlantısını kontrol edin.'
  );
};

export const enhanceMarkdownContent = async (content: string): Promise<string> => {
  try {
    const ai = getGeminiClient();
    if (!ai) return content;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Optimize the following Markdown for a professional PDF export. 
      Ensure tables are well-formatted, improve sentence structure, and maintain all Mermaid diagrams, LaTeX math, and links.
      Preserve the original meaning and data exactly.
      When a section should start on a new PDF page to preserve semantic continuity, insert a standalone line containing exactly <<<PAGE_BREAK>>> before that section.
      Use page-break markers sparingly and only before major headings or large blocks that should not be split awkwardly.
      Never place <<<PAGE_BREAK>>> inside tables, lists, code fences, Mermaid blocks, or LaTeX blocks.
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
    throw normalizeGeminiError(error);
  }
};

export const prepareMarkdownForPdfLayout = async (content: string): Promise<string> => {
  try {
    const ai = getGeminiClient();
    if (!ai) return content;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are preparing Markdown for high-quality PDF pagination.
      Preserve the original wording, numbers, meaning, tables, Mermaid blocks, LaTeX, and links exactly.
      You may only add standalone control lines when helpful:
      - ${KEEP_WITH_NEXT_TOKEN}
      - ${PAGE_BREAK_TOKEN}

      Rules:
      - Use ${KEEP_WITH_NEXT_TOKEN} before headings or short intro paragraphs that should stay with the next meaningful block.
      - Use ${PAGE_BREAK_TOKEN} only before major sections when a clean new page is clearly better.
      - Never place control lines inside tables, lists, blockquotes, code fences, Mermaid blocks, or LaTeX blocks.
      - Do not rewrite the content unless absolutely necessary for preserving structure.
      - Return ONLY the final markdown.

      Content:
      ${content}`,
      config: {
        temperature: 0.1,
      }
    });

    return response.text || content;
  } catch (error) {
    console.error("Gemini PDF Layout Error:", error);
    throw normalizeGeminiError(error);
  }
};

export const generateMermaidFromDescription = async (description: string): Promise<string> => {
  try {
    const ai = getGeminiClient();
    if (!ai) return "";

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
    throw normalizeGeminiError(error);
  }
};
