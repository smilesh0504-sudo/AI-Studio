
import { GoogleGenAI, Modality, Type } from "@google/genai";
import type { Transaction, Category } from '../types';

const MODEL_TEXT = 'gemini-2.5-flash';
const MODEL_IMAGE_GEN = 'gemini-2.5-flash-image';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

interface AnalyzedImageResponse {
  isFinancial: boolean;
  transactions: {
    item: string;
    amount: number;
    category: Category;
  }[];
}

export const analyzeTransactionImage = async (base64Image: string, mimeType: string): Promise<AnalyzedImageResponse> => {
  try {
    const response = await ai.models.generateContent({
      model: MODEL_TEXT,
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Image,
              mimeType: mimeType,
            },
          },
          { text: "Analyze this image. First, determine if it is a financial document like a bank statement, receipt, or transaction history screenshot. If it's not a financial document (e.g., a photo of a cat, a landscape), set isFinancial to false and return an empty transactions array. If it IS a financial document, identify only the EXPENSE transactions (ignore deposits or transfers). For each expense, extract the vendor/item name, the amount, and categorize it into one of the following: '식비', '쇼핑', '주거', '교통비', '문화/여가', '생활비'. If the category is ambiguous or the vendor is unknown (e.g., 'PG_결제'), categorize it as '알 수 없음'. Recognize Korean company names (e.g., '스타벅스', '카카오택시', 'CU', '올리브영') for categorization. Return the result in the specified JSON format." },
        ],
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isFinancial: { type: Type.BOOLEAN },
            transactions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  item: { type: Type.STRING },
                  amount: { type: Type.NUMBER },
                  category: { type: Type.STRING },
                },
                required: ['item', 'amount', 'category'],
              },
            },
          },
          required: ['isFinancial', 'transactions'],
        },
      },
    });

    const jsonResponse = JSON.parse(response.text);
    return jsonResponse as AnalyzedImageResponse;

  } catch (error) {
    console.error("Error analyzing image with Gemini:", error);
    return { isFinancial: false, transactions: [] };
  }
};

export const generateIcon = async (prompt: string, color: string): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: MODEL_IMAGE_GEN,
            contents: {
                parts: [
                    { text: `Generate a cute and friendly 3D icon representing "${prompt}". The icon should have a soft, rounded, clay-like appearance (claymorphism). It should feature a simple, easily recognizable graphic on a solid-colored squircle background. The background color for the squircle must be exactly this hex code: ${color}. The main graphic should be white or a very light pastel color to contrast with the background. Ensure the lighting is soft and there are subtle shadows to give it a 3D feel. The overall style should be playful and modern. High quality.` },
                ],
            },
            config: {
                responseModalities: [Modality.IMAGE],
            },
        });
        
        const firstPart = response.candidates?.[0]?.content?.parts?.[0];
        if (firstPart && firstPart.inlineData) {
            const base64Image = firstPart.inlineData.data;
            const mimeType = firstPart.inlineData.mimeType;
            return `data:${mimeType};base64,${base64Image}`;
        }

        if (firstPart && 'text' in firstPart) {
             console.error("Gemini image generation failed with text response:", (firstPart as {text: string}).text);
        }

        throw new Error("No image data found in response");

    } catch (error) {
        console.error("Error generating icon with Gemini:", error);
        return "https://picsum.photos/100"; 
    }
};
    