
import React, { useState } from 'react';
import { generateImage } from '../services/geminiService';
import { LoadingSpinner } from './icons/Icons';

const aspectRatios = ["1:1", "16:9", "9:16", "4:3", "3:4"];

const ImageGeneratorView: React.FC = () => {
    const [prompt, setPrompt] = useState('');
    const [aspectRatio, setAspectRatio] = useState('1:1');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [imageUrl, setImageUrl] = useState<string | null>(null);

    const handleGenerate = async () => {
        if (!prompt.trim()) {
            setError('Please enter a prompt.');
            return;
        }
        setIsLoading(true);
        setError(null);
        setImageUrl(null);
        try {
            const url = await generateImage(prompt, aspectRatio);
            setImageUrl(url);
        } catch (err) {
            setError('Failed to generate image. Please try again.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-gray-900">
            <header className="p-4 border-b border-gray-700">
                <h2 className="text-xl font-semibold">Image Generator</h2>
            </header>
            <div className="flex-1 flex md:flex-row flex-col p-4 gap-4 overflow-y-auto">
                <div className="md:w-1/3 w-full flex flex-col space-y-4">
                    <h3 className="text-lg font-medium">Settings</h3>
                    <div>
                        <label htmlFor="prompt" className="block text-sm font-medium text-gray-300 mb-1">Prompt</label>
                        <textarea
                            id="prompt"
                            rows={5}
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="e.g., A futuristic cityscape at sunset, cinematic lighting"
                            className="w-full bg-gray-800 border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 text-white"
                        />
                    </div>
                    <div>
                        <label htmlFor="aspectRatio" className="block text-sm font-medium text-gray-300 mb-1">Aspect Ratio</label>
                        <select
                            id="aspectRatio"
                            value={aspectRatio}
                            onChange={(e) => setAspectRatio(e.target.value)}
                            className="w-full bg-gray-800 border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 text-white"
                        >
                            {aspectRatios.map(ar => <option key={ar} value={ar}>{ar}</option>)}
                        </select>
                    </div>
                    <button
                        onClick={handleGenerate}
                        disabled={isLoading}
                        className="w-full bg-blue-600 text-white py-2 rounded-md disabled:bg-gray-600 hover:bg-blue-700 transition-colors flex items-center justify-center"
                    >
                        {isLoading && <LoadingSpinner />}
                        {isLoading ? 'Generating...' : 'Generate Image'}
                    </button>
                    {error && <p className="text-red-400 text-sm">{error}</p>}
                </div>
                <div className="md:w-2/3 w-full bg-gray-800/50 rounded-lg flex items-center justify-center p-4 min-h-[300px]">
                    {isLoading && (
                        <div className="text-center">
                            <LoadingSpinner size="h-12 w-12" />
                            <p className="mt-4 text-gray-400">Generating your image...</p>
                        </div>
                    )}
                    {!isLoading && !imageUrl && (
                        <div className="text-center text-gray-500">
                            <p>Your generated image will appear here.</p>
                        </div>
                    )}
                    {imageUrl && (
                        <img src={imageUrl} alt={prompt} className="max-w-full max-h-full object-contain rounded-md" />
                    )}
                </div>
            </div>
        </div>
    );
};

export default ImageGeneratorView;
