import React from 'react';
import { View } from '../types';
import { ChatIcon, ImageIcon, VideoIcon, AppIcon, BrandIcon, AboutIcon } from './icons/Icons';

interface SidebarProps {
  activeView: View;
  setActiveView: (view: View) => void;
}

const SidebarButton: React.FC<{
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
}> = ({ icon, label, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center w-full px-4 py-3 transition-colors duration-200 rounded-lg ${
      isActive
        ? 'bg-blue-600 text-white'
        : 'text-gray-400 hover:bg-gray-700 hover:text-white'
    }`}
  >
    {icon}
    <span className="ml-4 font-medium">{label}</span>
  </button>
);

const Sidebar: React.FC<SidebarProps> = ({ activeView, setActiveView }) => {
  return (
    <aside className="w-64 bg-gray-800 p-4 flex flex-col border-r border-gray-700">
      <div>
        <div className="flex items-center mb-8 px-2">
          <BrandIcon />
          <h1 className="text-xl font-bold ml-2">Hayat Ai</h1>
        </div>
        <nav className="flex flex-col space-y-2">
          <SidebarButton
            icon={<ChatIcon />}
            label="AI Chat"
            isActive={activeView === View.CHAT}
            onClick={() => setActiveView(View.CHAT)}
          />
          <SidebarButton
            icon={<ImageIcon />}
            label="Image Generator"
            isActive={activeView === View.IMAGE}
            onClick={() => setActiveView(View.IMAGE)}
          />
          <SidebarButton
            icon={<VideoIcon />}
            label="Video Generator"
            isActive={activeView === View.VIDEO}
            onClick={() => setActiveView(View.VIDEO)}
          />
          <SidebarButton
            icon={<AppIcon />}
            label="App Builder"
            isActive={activeView === View.APP_BUILDER}
            onClick={() => setActiveView(View.APP_BUILDER)}
          />
        </nav>
      </div>

      <div className="mt-auto">
        <nav className="flex flex-col space-y-2 mb-4 pt-4 border-t border-gray-700">
          <SidebarButton
            icon={<AboutIcon />}
            label="About Us"
            isActive={activeView === View.ABOUT}
            onClick={() => setActiveView(View.ABOUT)}
          />
        </nav>
        <div className="text-center text-xs text-gray-500">
          <p>Powered by Hayat Khan</p>
          <p>&copy; 2024</p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;