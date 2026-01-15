import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

interface SearchRequest {
    query: string;
    id: number;
}

// Define the interface for the context
interface VoiceContextType {
    isListening: boolean;
    transcript: string;
    startListening: () => void;
    stopListening: () => void;
    feedback: string | null;
    isSupported: boolean;
    searchRequest: SearchRequest | null;
    clearSearchRequest: () => void;
}

const VoiceContext = createContext<VoiceContextType | undefined>(undefined);

// Helper for type safety with the Web Speech API
declare global {
    interface Window {
        SpeechRecognition: any;
        webkitSpeechRecognition: any;
    }
}

export const VoiceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [feedback, setFeedback] = useState<string | null>(null);
    const [recognition, setRecognition] = useState<any>(null);
    const [isSupported, setIsSupported] = useState(false);
    const [searchRequest, setSearchRequest] = useState<SearchRequest | null>(null);

    const navigate = useNavigate();

    const clearSearchRequest = useCallback(() => {
        setSearchRequest(null);
    }, []);

    const queueSearch = useCallback((query: string) => {
        setSearchRequest({ query, id: Date.now() });
    }, []);

    useEffect(() => {
        // Check browser support
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

        if (SpeechRecognition) {
            setIsSupported(true);
            const recognitionInstance = new SpeechRecognition();
            recognitionInstance.continuous = false; // Stop after one command for simplicity
            recognitionInstance.interimResults = true;
            recognitionInstance.lang = 'en-US';

            recognitionInstance.onstart = () => {
                setIsListening(true);
                setFeedback("Listening...");
            };

            recognitionInstance.onend = () => {
                setIsListening(false);
                // Don't clear feedback immediately so user can see what happened
                setTimeout(() => setFeedback(null), 3000);
            };

            recognitionInstance.onresult = (event: any) => {
                const current = event.resultIndex;
                const transcriptText = event.results[current][0].transcript;
                setTranscript(transcriptText);

                if (event.results[current].isFinal) {
                    processCommand(transcriptText);
                }
            };

            recognitionInstance.onerror = (event: any) => {
                console.error("Speech recognition error", event.error);
                setFeedback("Error listening. Try again.");
                setIsListening(false);
            };

            setRecognition(recognitionInstance);
        }
    }, []);

    const sanitizeQuery = (value: string) => {
        const cleaned = value
            .replace(/[?.!,]+$/g, '')
            .replace(/\b(?:look for|look up|show me)\b/gi, '')
            .replace(/\b(?:please|find|search|locate|show|get|need)\b/gi, '')
            .replace(/\bparking lots?\b/gi, '')
            .replace(/\b(?:parking|lot|lots|spot|spots|space|spaces)\b/gi, '')
            .replace(/\b(?:near|at|in|around|by|for)\b/gi, ' ')
            .replace(/\s+/g, ' ')
            .trim();

        const lower = cleaned.toLowerCase();
        if (!cleaned || lower === 'me' || lower === 'here' || lower === 'my location' || lower === 'nearby') {
            return '';
        }

        return cleaned;
    };

    const extractSearchQuery = (command: string) => {
        const trimmed = command.trim();
        if (!trimmed) return '';

        const patterns = [
            /(?:find|search|look for|look up|locate|show me|show|get|need)\s+(?:parking\s*)?(?:near|at|in|around|by|for)?\s*(.+)/i,
            /(?:parking|parking lot|parking lots|lot|lots|spot|spots|space|spaces)\s*(?:near|at|in|around|by|for)\s+(.+)/i
        ];

        for (const pattern of patterns) {
            const match = trimmed.match(pattern);
            if (match?.[1]) {
                const cleaned = sanitizeQuery(match[1]);
                if (cleaned) return cleaned;
            }
        }

        return sanitizeQuery(trimmed);
    };

    const processCommand = (command: string) => {
        const lowerCmd = command.toLowerCase();

        // Command Mapping Logic
        if (lowerCmd.includes('home') || lowerCmd.includes('dashboard')) {
            setFeedback("Navigating Home...");
            navigate('/');
        } else if (lowerCmd.includes('login') || lowerCmd.includes('sign in')) {
            setFeedback("Opening Login...");
            navigate('/login');
        } else if (lowerCmd.includes('register') || lowerCmd.includes('sign up')) {
            setFeedback("Opening Signup...");
            navigate('/signup');
        } else if (lowerCmd.includes('booking') || lowerCmd.includes('reservation')) {
            setFeedback("Opening My Bookings...");
            navigate('/my-bookings');
        } else if (lowerCmd.includes('wallet') || lowerCmd.includes('payment')) {
            setFeedback("Opening Wallet...");
            navigate('/wallet');
        } else if (lowerCmd.includes('search') || lowerCmd.includes('find') || lowerCmd.includes('parking')) {
            const query = extractSearchQuery(command);
            if (query) {
                setFeedback(`Searching for "${query}"...`);
                queueSearch(query);
            } else {
                setFeedback("What location should I search?");
            }
            navigate('/');
        } else if (lowerCmd.includes('map')) {
            setFeedback("Opening Map...");
            navigate('/');
        } else if (lowerCmd.includes('host') || lowerCmd.includes('admin')) {
            setFeedback("Going to Host Dashboard...");
            navigate('/host/dashboard');
        } else {
            setFeedback("Command not recognized.");
        }
    };

    const startListening = () => {
        if (recognition && !isListening) {
            try {
                setTranscript('');
                recognition.start();
            } catch (e) {
                console.error("Start error", e);
            }
        }
    };

    const stopListening = () => {
        if (recognition && isListening) {
            recognition.stop();
        }
    };

    return (
        <VoiceContext.Provider value={{ isListening, transcript, startListening, stopListening, feedback, isSupported, searchRequest, clearSearchRequest }}>
            {children}
        </VoiceContext.Provider>
    );
};

export const useVoice = () => {
    const context = useContext(VoiceContext);
    if (context === undefined) {
        throw new Error('useVoice must be used within a VoiceProvider');
    }
    return context;
};
