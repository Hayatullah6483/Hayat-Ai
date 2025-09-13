import React, { useState, useEffect, useRef } from 'react';
import { generateVideo } from '../services/geminiService';
import { LoadingSpinner, UploadIcon, CloseIcon } from './icons/Icons';

const loadingMessages = [
    "Warming up the virtual cameras...",
    "Choreographing pixel actors...",
    "Rendering the first few frames...",
    "This can take a few minutes, hang tight!",
    "Finalizing the digital masterpiece...",
];

const videoAspectRatios = [
    { value: '16:9', label: 'Widescreen / YouTube (16:9)' },
    { value: '9:16', label: 'Vertical / TikTok / Reel (9:16)' },
    { value: '1:1', label: 'Square (1:1)' },
];

const VideoGeneratorView: React.FC = () => {
    const [prompt, setPrompt] = useState('');
    const [aspectRatio, setAspectRatio] = useState('16:9');
    const [image, setImage] = useState<{file: File, base64: string} | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [progress, setProgress] = useState(0);
    const [statusMessage, setStatusMessage] = useState('');
    const [currentLoadingMessage, setCurrentLoadingMessage] = useState(loadingMessages[0]);
    const fileInputRef = useRef<HTMLInputElement>(null);

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

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                setError('Please select a valid image file (e.g., PNG, JPEG, WEBP).');
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = (reader.result as string).split(',')[1];
                setImage({ file, base64: base64String });
                setError(null);
            };
            reader.onerror = () => {
                setError('Failed to read the image file.');
            };
            reader.readAsDataURL(file);
        }
    };

    const removeImage = () => {
        setImage(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleGenerate = async () => {
        if (!prompt.trim()) {
            setError('Please enter a prompt.');
            return;
        }
        setIsLoading(true);
        setError(null);
        setVideoUrl(null);
        setProgress(0);
        setStatusMessage('Starting video generation...');
        try {
            for await (const result of generateVideo(prompt, image, aspectRatio)) {
                setProgress(result.progress);
                setStatusMessage(result.status);
                if (result.status === 'COMPLETED' && result.url) {
                    setVideoUrl(result.url);
                }
            }
        } catch (err) {
            setError('Failed to generate video. Please try again.');
            console.error(err);
        } finally {
            setIsLoading(false);
            setProgress(0);
        }
    };

    return (
        <div className="flex flex-col h-full bg-gray-900">
            <header className="p-4 border-b border-gray-700">
                <h2 className="text-xl font-semibold">Video Generator</h2>
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
                            placeholder="e.g., A cinematic drone shot of a futuristic city with flying cars"
                            className="w-full bg-gray-800 border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 text-white"
                        />
                    </div>

                    <div>
                        <label htmlFor="aspectRatio" className="block text-sm font-medium text-gray-300 mb-1">Aspect Ratio</label>
                        <select
                            id="aspectRatio"
                            value={aspectRatio}
                            onChange={(e) => setAspectRatio(e.target.value)}
                            className="w-full bg-gray-800 border-gray-600 rounded-md focus:ring-purple-500 focus:border-purple-500 text-white"
                        >
                            {videoAspectRatios.map(ar => <option key={ar.value} value={ar.value}>{ar.label}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Image (Optional)</label>
                        {!image ? (
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="w-full flex items-center justify-center px-4 py-2 border-2 border-dashed border-gray-600 rounded-md text-sm font-medium text-gray-400 hover:bg-gray-700/50 hover:border-gray-500 transition-colors"
                            >
                                <UploadIcon />
                                Add Image
                            </button>
                        ) : (
                            <div className="relative group">
                                <img src={`data:${image.file.type};base64,${image.base64}`} alt="Preview" className="w-full h-auto rounded-md object-cover" />
                                <button
                                    onClick={removeImage}
                                    className="absolute top-2 right-2 bg-black/50 p-1 rounded-full text-white hover:bg-black/80 transition-colors opacity-0 group-hover:opacity-100"
                                    aria-label="Remove image"
                                >
                                    <CloseIcon />
                                </button>
                            </div>
                        )}
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleImageChange}
                            className="hidden"
                            accept="image/png, image/jpeg, image/webp"
                        />
                    </div>
                    
                    <button
                        onClick={handleGenerate}
                        disabled={isLoading}
                        className="w-full bg-purple-600 text-white py-2 rounded-md disabled:bg-gray-600 hover:bg-purple-700 transition-colors flex items-center justify-center"
                    >
                        {isLoading && <LoadingSpinner />}
                        {isLoading ? 'Generating...' : 'Generate Video'}
                    </button>
                    {error && <p className="text-red-400 text-sm">{error}</p>}
                </div>
                <div className="md:w-2/3 w-full bg-gray-800/50 rounded-lg flex items-center justify-center p-4 min-h-[300px]">
                    {isLoading && (
                        <div className="text-center w-full max-w-md">
                            <p className="text-lg font-semibold mb-2">{statusMessage}</p>
                            <div className="w-full bg-gray-700 rounded-full h-2.5">
                                <div className="bg-purple-600 h-2.5 rounded-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
                            </div>
                            <p className="mt-4 text-gray-400">{currentLoadingMessage}</p>
                        </div>
                    )}
                    {!isLoading && !videoUrl && (
                        <div className="text-center text-gray-500">
                            <p>Your generated video will appear here.</p>
                            <p className="text-sm">Note: Video generation can take several minutes.</p>
                        </div>
                    )}
                    {videoUrl && (
                        <video src={videoUrl} controls autoPlay loop className="max-w-full max-h-full object-contain rounded-md" />
                    )}
                </div>
            </div>
        </div>
    );
};

export default VideoGeneratorView;