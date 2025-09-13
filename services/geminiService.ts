import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

let chatInstance: Chat | null = null;

export const startChat = (): Chat => {
    if (!chatInstance) {
        chatInstance = ai.chats.create({
            model: 'gemini-2.5-flash',
            config: {
                systemInstruction: 'You are a helpful and creative AI assistant named Hayat Ai. Your creator is Hayat Khan. When asked who you are or who made you, mention you are powered by Hayat Khan.',
            },
        });
    }
    return chatInstance;
};

export const sendMessageStream = async (chat: Chat, message: string) => {
    return chat.sendMessageStream({ message });
};

const addWatermarkToImage = (base64Image: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                return reject(new Error('Could not get canvas context'));
            }

            ctx.drawImage(img, 0, 0);

            const fontSize = Math.max(12, Math.floor(img.width / 90));
            ctx.font = `bold ${fontSize}px Arial`;
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'bottom';
            const margin = fontSize;
            ctx.fillText('Hayat Ai', margin, canvas.height - margin);

            resolve(canvas.toDataURL('image/jpeg'));
        };
        img.onerror = (err) => {
            reject(err);
        };
        img.src = base64Image;
    });
};

export const generateImage = async (prompt: string, aspectRatio: string): Promise<string> => {
    const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: prompt,
        config: {
            numberOfImages: 1,
            outputMimeType: 'image/jpeg',
            aspectRatio: aspectRatio as "1:1" | "3:4" | "4:3" | "9:16" | "16:9",
        },
    });

    const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
    const originalImageUrl = `data:image/jpeg;base64,${base64ImageBytes}`;
    
    return await addWatermarkToImage(originalImageUrl);
};

interface ImageInput {
    file: File;
    base64: string;
}

export async function* generateVideo(prompt: string, image: ImageInput | null, aspectRatio: string) {
    let modifiedPrompt = prompt;
    const aspectRatioInstruction = {
        '16:9': 'Generate a video in a cinematic, widescreen 16:9 aspect ratio.',
        '9:16': 'Generate a video in a vertical 9:16 aspect ratio, suitable for mobile platforms like TikTok or Reels.',
        '1:1': 'Generate a video in a square 1:1 aspect ratio.'
    }[aspectRatio];

    if (aspectRatioInstruction) {
        if (/[.!?]$/.test(modifiedPrompt.trim())) {
            modifiedPrompt = `${modifiedPrompt.trim()} ${aspectRatioInstruction}`;
        } else {
            modifiedPrompt = `${modifiedPrompt.trim()}. ${aspectRatioInstruction}`;
        }
    }
    
    const watermarkInstruction = "A small, subtle watermark text 'Hayat Ai' must be present in the lower-left corner of the video.";
    if (/[.!?]$/.test(modifiedPrompt.trim())) {
        modifiedPrompt = `${modifiedPrompt.trim()} ${watermarkInstruction}`;
    } else {
        modifiedPrompt = `${modifiedPrompt.trim()}. ${watermarkInstruction}`;
    }

    const payload: {
        model: string;
        prompt: string;
        config: { numberOfVideos: number };
        image?: { imageBytes: string; mimeType: string };
    } = {
        model: 'veo-2.0-generate-001',
        prompt: modifiedPrompt,
        config: {
            numberOfVideos: 1,
        }
    };

    if (image) {
        payload.image = {
            imageBytes: image.base64,
            mimeType: image.file.type,
        };
    }

    let operation = await ai.models.generateVideos(payload);

    yield { status: 'GENERATING', progress: 25 };

    while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 10000));
        yield { status: 'POLLING', progress: 50 };
        operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    yield { status: 'FETCHING', progress: 75 };
    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) {
        throw new Error("Video generation failed or returned no link.");
    }
    
    const videoResponse = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
    const videoBlob = await videoResponse.blob();
    const videoUrl = URL.createObjectURL(videoBlob);
    
    yield { status: 'COMPLETED', progress: 100, url: videoUrl };
}

export const generateWebApp = async (prompt: string): Promise<string> => {
    const fullPrompt = `Generate a complete, single-file HTML web application based on the following description: "${prompt}".
    
The HTML file must be self-contained. All CSS must be inside a <style> tag in the <head>, and all JavaScript must be inside a <script> tag at the end of the <body>.
The application should be functional, responsive, and visually appealing using modern design principles.
Do not include any explanations, comments, or markdown fences like \`\`\`html. Just return the raw HTML code starting with <!DOCTYPE html>.`;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: fullPrompt,
    });

    let htmlContent = response.text.trim();
    if (htmlContent.startsWith('```html')) {
        htmlContent = htmlContent.substring(7, htmlContent.length - 3).trim();
    } else if (htmlContent.startsWith('```')) {
        htmlContent = htmlContent.substring(3, htmlContent.length - 3).trim();
    }
    
    return htmlContent;
};