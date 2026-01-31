/**
 * AI Service for StudySync
 * Communicates with the backend proxy to perform AI operations.
 * This keeps the API key secure on the server.
 */
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Helper to get auth headers
const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };
};

export const aiService = {
    /**
     * Summarizes a given text into a concise study note.
     */
    summarize: async (text) => {
        try {
            const response = await axios.post(`${API_URL}/ai/process`, {
                action: 'summarize',
                payload: { text }
            }, { headers: getAuthHeaders() });

            return response.data.text;
        } catch (error) {
            console.error("AI Summarization error:", error);
            throw error;
        }
    },

    /**
     * Generates a set of flashcards from a given text.
     */
    generateFlashcards: async (moduleName, text) => {
        try {
            const response = await axios.post(`${API_URL}/ai/process`, {
                action: 'generateFlashcards',
                payload: { moduleName, text }
            }, { headers: getAuthHeaders() });

            return response.data;
        } catch (error) {
            console.error("AI Flashcard generation error:", error);
            throw error;
        }
    },

    /**
     * Generates a 5-question quiz from the given note content.
     */
    generateQuiz: async (content) => {
        try {
            const response = await axios.post(`${API_URL}/ai/process`, {
                action: 'generateQuiz',
                payload: { content }
            }, { headers: getAuthHeaders() });

            return response.data;
        } catch (error) {
            console.error("AI Quiz generation error:", error);
            throw error;
        }
    },

    /**
     * Generates a personalized study plan based on tasks, exams, and flashcards.
     */
    generateStudyPlan: async (tasks, modules, cards) => {
        try {
            const response = await axios.post(`${API_URL}/ai/process`, {
                action: 'generateStudyPlan',
                payload: {
                    tasks: tasks.filter(t => t.status !== 'Completed').map(t => ({ title: t.title, dueDate: t.dueDate })),
                    modules: modules.map(m => m.name),
                    cardCount: cards.length
                }
            }, { headers: getAuthHeaders() });

            return response.data;
        } catch (error) {
            console.error("AI Study Plan error:", error);
            throw error;
        }
    }
};

export default aiService;
