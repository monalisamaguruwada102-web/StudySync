/**
 * AI Service for StudySync
 * Integrated with Google Gemini AI for real-time summarization, quiz generation, and flashcard creation.
 */
import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;

// Helper to get the model
const getModel = () => {
    if (!genAI) {
        throw new Error("Gemini API key is not configured. Please add VITE_GEMINI_API_KEY to your .env file.");
    }
    return genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
};

export const aiService = {
    /**
     * Summarizes a given text into a concise study note.
     */
    summarize: async (text) => {
        try {
            const model = getModel();
            const prompt = `Summarize the following study note into a concise, well-formatted summary using Markdown. 
            Highlight key concepts with bold text and use bullet points for takeaways.
            
            Content:
            ${text}`;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            return response.text();
        } catch (error) {
            console.error("Gemini Summarization error:", error);
            throw error;
        }
    },

    /**
     * Generates a set of flashcards from a given text.
     */
    generateFlashcards: async (moduleName, text) => {
        try {
            const model = getModel();
            const prompt = `Generate a set of 5-8 flashcards from the following text related to the module "${moduleName}".
            Return the result ONLY as a JSON array of objects with the following structure:
            [{"question": "string", "answer": "string", "level": number}]
            Level should be 1 for basic concepts and 2-3 for more complex ones.
            
            Text:
            ${text}`;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            let responseText = response.text();

            // Extract JSON if AI wrapped it in markdown code blocks
            if (responseText.includes('```json')) {
                responseText = responseText.split('```json')[1].split('```')[0].trim();
            } else if (responseText.includes('```')) {
                responseText = responseText.split('```')[1].split('```')[0].trim();
            }

            return JSON.parse(responseText);
        } catch (error) {
            console.error("Gemini Flashcard generation error:", error);
            throw error;
        }
    },

    /**
     * Generates a 5-question quiz from the given note content.
     */
    generateQuiz: async (content) => {
        try {
            const model = getModel();
            const prompt = `Generate a 5-question multiple choice quiz from the following study note content.
            Return the result ONLY as a JSON array of objects with the following structure:
            [{"id": number, "question": "string", "options": ["string", "string", "string", "string"], "correctIndex": number}]
            Ensure questions are challenging but fair.
            
            Content:
            ${content}`;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            let responseText = response.text();

            // Extract JSON if AI wrapped it in markdown code blocks
            if (responseText.includes('```json')) {
                responseText = responseText.split('```json')[1].split('```')[0].trim();
            } else if (responseText.includes('```')) {
                responseText = responseText.split('```')[1].split('```')[0].trim();
            }

            return JSON.parse(responseText);
        } catch (error) {
            console.error("Gemini Quiz generation error:", error);
            throw error;
        }
    }
};

export default aiService;
