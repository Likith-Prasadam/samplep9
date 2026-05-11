import React from 'react';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';

interface ChatHeaderProps {
  onTranscriptOpen: () => void;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({ onTranscriptOpen }) => {
  return (
    <div className="flex justify-between items-center px-10 pb-6">
      <h2 className="text-2xl font-bold text-gray-100 tracking-tight">
        Chat with{' '}
        <span className="bg-gradient-to-br from-teal-500 to-cyan-800 text-transparent bg-clip-text">
          Spectra
        </span>
      </h2>
      <Button
        variant="outline"
        className="flex items-center gap-2 border-gray-700 bg-gray-800 hover:bg-gray-700 text-teal-600 rounded-full px-4 py-1 mt-2 transition-colors duration-200"
        onClick={onTranscriptOpen}
      >
        <Menu className="w-4 h-4" /> Transcript
      </Button>
    </div>
  );
};

export default ChatHeader;
