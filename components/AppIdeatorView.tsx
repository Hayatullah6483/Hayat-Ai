import React, { useState, useEffect } from 'react';
import { generateWebApp } from '../services/geminiService';
import { LoadingSpinner, AppIcon, DownloadIcon } from './icons/Icons';

const loadingMessages = [
    "Drafting architectural blueprints...",
    "Compiling quantum bits...",
    "Negotiating with the JavaScript runtime...",
    "Teaching the CSS to center a div...",
    "Your app is being born...",
    "Final touches... adding a sprinkle of magic.",
];

const AppBuilderView: React.FC = () => {
    const [prompt, setPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [generatedHtml, setGeneratedHtml] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview');
    const [currentLoadingMessage, setCurrentLoadingMessage] = useState(loadingMessages[0]);

    useEffect(() => {
        let interval: ReturnType<typeof setTimeout>;
        if (isLoading) {
            interval = setInterval(() => {
                setCurrentLoadingMessage(prev => {
                    const currentIndex = loadingMessages.indexOf(prev);
                    return loadingMessages[(currentIndex + 1) % loadingMessages.length];
                });
            }, 3000);
        }
        return () => clearInterval(interval);
    }, [isLoading]);

    const handleGenerate = async () => {
        if (!prompt.trim()) {
            setError('Please describe the app you want to build.');
            return;
        }
        setIsLoading(true);
        setError(null);
        setGeneratedHtml(null);
        try {
            const html = await generateWebApp(prompt);
            setGeneratedHtml(html);
            setActiveTab('preview');
        } catch (err) {
            setError('Failed to generate the app. Please try again.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const generateFilename = (promptStr: string): string => {
        if (!promptStr) return 'ai-generated-app.html';
        const sanitized = promptStr
            .toLowerCase()
            .replace(/[^\w\s]/g, '') // remove punctuation
            .trim()
            .split(/\s+/) // split into words
            .slice(0, 5) // take the first 5 words
            .join('-'); // join with hyphens
        return `${sanitized || 'ai-generated-app'}.html`;
    };

    const handleDownload = () => {
        if (!generatedHtml) return;
        const blob = new Blob([generatedHtml], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = generateFilename(prompt);
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const TabButton: React.FC<{ label: string; name: 'preview' | 'code' }> = ({ label, name }) => (
        <button
            onClick={() => setActiveTab(name)}
            className={`px-4 py-2 text-sm font-medium rounded-md ${
                activeTab === name
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-gray-700'
            }`}
        >
            {label}
        </button>
    );

    return (
        <div className="flex flex-col h-full bg-gray-900">
            <header className="p-4 border-b border-gray-700 flex justify-between items-center">
                <h2 className="text-xl font-semibold">App Builder</h2>
                {generatedHtml && (
                     <button
                        onClick={handleDownload}
                        className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors flex items-center justify-center text-sm"
                    >
                        <DownloadIcon />
                        Download App
                    </button>
                )}
            </header>
            <div className="flex-1 flex md:flex-row flex-col p-4 gap-4 overflow-y-auto">
                <div className="md:w-1/3 w-full flex flex-col space-y-4">
                    <h3 className="text-lg font-medium">Describe Your App</h3>
                    <textarea
                        rows={10}
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="e.g., A simple pomodoro timer with start, stop, and reset buttons. It should have a clean, minimalist design."
                        className="w-full bg-gray-800 border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 text-white flex-1"
                    />
                    <button
                        onClick={handleGenerate}
                        disabled={isLoading}
                        className="w-full bg-blue-600 text-white py-2 rounded-md disabled:bg-gray-600 hover:bg-blue-700 transition-colors flex items-center justify-center"
                    >
                        {isLoading && <LoadingSpinner />}
                        {isLoading ? 'Building...' : 'Build App'}
                    </button>
                    {error && <p className="text-red-400 text-sm">{error}</p>}
                </div>

                <div className="md:w-2/3 w-full bg-gray-800/50 rounded-lg flex flex-col min-h-[300px]">
                    {isLoading ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
                            <LoadingSpinner size="h-12 w-12" />
                            <p className="mt-4 text-lg text-gray-300">Generating your application...</p>
                            <p className="mt-2 text-gray-400">{currentLoadingMessage}</p>
                        </div>
                    ) : !generatedHtml ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-center text-gray-500 p-8">
                            <AppIcon className="mx-auto h-16 w-16 text-gray-600" />
                            <p className="mt-4 text-lg">Your generated app will appear here.</p>
                            <p className="mt-2 text-sm">Describe your idea, and the AI will build a live preview for you.</p>
                        </div>
                    ) : (
                        <>
                            <div className="p-2 border-b border-gray-700 flex items-center space-x-2">
                               <TabButton label="Preview" name="preview" />
                               <TabButton label="Source Code" name="code" />
                            </div>
                            <div className="flex-1 overflow-auto bg-white">
                                {activeTab === 'preview' ? (
                                    <iframe
                                        srcDoc={generatedHtml}
                                        title="App Preview"
                                        className="w-full h-full border-0"
                                        sandbox="allow-scripts allow-same-origin"
                                    />
                                ) : (
                                    <pre className="p-4 text-sm whitespace-pre-wrap break-words h-full overflow-auto bg-gray-900 text-white">
                                        <code>{generatedHtml}</code>
                                    </pre>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AppBuilderView;