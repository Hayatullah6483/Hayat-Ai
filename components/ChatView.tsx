
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChatMessage } from '../types';
import { startChat, sendMessageStream } from '../services/geminiService';
import { UserIcon, ModelIcon } from './icons/Icons';
import { Chat } from '@google/genai';

const MessageBox: React.FC<{ message: ChatMessage }> = ({ message }) => {
    const isUser = message.role === 'user';
    return (
        <div className={`flex items-start gap-4 p-4 my-2 ${isUser ? '' : 'bg-gray-800/50 rounded-lg'}`}>
            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${isUser ? 'bg-blue-600' : 'bg-purple-600'}`}>
                {isUser ? <UserIcon /> : <ModelIcon />}
            </div>
            <div className="prose prose-invert max-w-none text-gray-200">
                <p>{message.parts[0].text}</p>
            </div>
        </div>
    );
};

const ChatView: React.FC = () => {
    const [chat, setChat] = useState<Chat | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setChat(startChat());
        setMessages([
            { role: 'model', parts: [{ text: "Hello! I'm your creative AI assistant. How can I help you today?" }] }
        ]);
    }, []);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);
    
    const handleSend = useCallback(async () => {
        if (input.trim() === '' || isLoading || !chat) return;

        const userMessage: ChatMessage = { role: 'user', parts: [{ text: input }] };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        const modelMessage: ChatMessage = { role: 'model', parts: [{ text: '' }] };
        setMessages(prev => [...prev, modelMessage]);
        
        try {
            const stream = await sendMessageStream(chat, input);
            let text = '';
            for await (const chunk of stream) {
                text += chunk.text;
                setMessages(prev => {
                    const newMessages = [...prev];
                    newMessages[newMessages.length - 1] = { role: 'model', parts: [{ text: text }] };
                    return newMessages;
                });
            }
        } catch (error) {
            console.error(error);
            setMessages(prev => {
                const newMessages = [...prev];
                newMessages[newMessages.length - 1] = { role: 'model', parts: [{ text: 'Sorry, I encountered an error. Please try again.' }] };
                return newMessages;
            });
        } finally {
            setIsLoading(false);
        }
    }, [input, isLoading, chat]);

    return (
        <div className="flex flex-col h-full bg-gray-900">
            <header className="p-4 border-b border-gray-700">
                <h2 className="text-xl font-semibold">AI Chat</h2>
            </header>
            <div className="flex-1 overflow-y-auto p-4">
                {messages.map((msg, index) => <MessageBox key={index} message={msg} />)}
                <div ref={messagesEndRef} />
            </div>
            <div className="p-4 border-t border-gray-700">
                <div className="flex items-center bg-gray-800 rounded-lg p-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Type your message..."
                        className="flex-1 bg-transparent border-none focus:ring-0 text-white placeholder-gray-400"
                        disabled={isLoading}
                    />
                    <button
                        onClick={handleSend}
                        disabled={isLoading || input.trim() === ''}
                        className="bg-blue-600 text-white px-4 py-2 rounded-md disabled:bg-gray-600 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
                    >
                        {isLoading ? 'Sending...' : 'Send'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ChatView;
