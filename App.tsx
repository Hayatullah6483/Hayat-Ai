import React, { useState } from 'react';
import { View } from './types';
import Sidebar from './components/Sidebar';
import ChatView from './components/ChatView';
import ImageGeneratorView from './components/ImageGeneratorView';
import VideoGeneratorView from './components/VideoGeneratorView';
import AppBuilderView from './components/AppIdeatorView';
import AboutView from './components/AboutView';

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<View>(View.CHAT);

  const renderView = () => {
    switch (activeView) {
      case View.CHAT:
        return <ChatView />;
      case View.IMAGE:
        return <ImageGeneratorView />;
      case View.VIDEO:
        return <VideoGeneratorView />;
      case View.APP_BUILDER:
        return <AppBuilderView />;
      case View.ABOUT:
        return <AboutView />;
      default:
        return <ChatView />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-900 text-gray-100 font-sans">
      <Sidebar activeView={activeView} setActiveView={setActiveView} />
      <main className="flex-1 flex flex-col h-screen">
        {renderView()}
      </main>
    </div>
  );
};

export default App;