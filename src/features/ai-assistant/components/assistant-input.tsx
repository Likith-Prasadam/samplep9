import React from 'react';
import { Paperclip, Settings2, Send, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface InputBarProps {
  input: string;
  setInput: (value: string) => void;
  imageUrl: string | null;
  setImageUrl: (url: string | null) => void;
  streaming: boolean;
  handleSend: () => void;
  handleKeyDown: (e: React.KeyboardEvent) => void;
  handleAttachmentClick: () => void;
  handleOpenDialog: () => void;
  handlePlusClick: () => void;
  textInputRef: React.RefObject<HTMLInputElement | null>;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  handleImageChange: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  variant?: 'welcome' | 'chat';
}

export default function InputBar({
  input,
  setInput,
  imageUrl,
  setImageUrl,
  streaming,
  handleSend,
  handleKeyDown,
  handleAttachmentClick,
  handleOpenDialog,
  handlePlusClick,
  textInputRef,
  fileInputRef,
  handleImageChange,
  variant = 'chat',
}: InputBarProps) {
  const isWelcome = variant === 'welcome';

  return (
    <div className={`${isWelcome ? 'w-full max-w-2xl mx-auto' : 'w-full'}`}>
      {/* Hidden File Input */}
      <Input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        onChange={handleImageChange}
        className="hidden dark:bg-black-100"
      />

      {/* Image Preview - Responsive sizing */}
      {imageUrl && (
        <div className="mb-2 sm:mb-3 flex items-start">
          <div className="relative">
            <img
              src={imageUrl}
              alt="Preview"
              className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-md border shadow-sm"
            />
            <button
              onClick={() => setImageUrl(null)}
              className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 w-5 h-5 sm:w-6 sm:h-6 bg-destructive hover:bg-destructive/90 rounded-full flex items-center justify-center text-destructive-foreground shadow transition-colors"
            >
              <X className="h-3 w-3 sm:h-4 sm:w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Input Container - Responsive padding and radius */}
      <div
        className="flex items-center gap-1 sm:gap-2 bg-background rounded-xl sm:rounded-2xl p-2 sm:p-2 border-0"
        style={{ border: 'none', outline: 'none', boxShadow: 'none' }}
      >
        {/* New Chat Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handlePlusClick}
          disabled={streaming}
          className="h-8 sm:h-9 w-8 sm:w-9 p-0"
          title="New Chat"
        >
          <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
        </Button>

        {/* Text Input - Improved styling for better look */}
        <Input
          ref={textInputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            isWelcome ? 'Ask me anything...' : 'Type your message...'
          }
          className="flex-1 bg-background px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm disabled:opacity-50 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 resize-none min-h-[32px] sm:min-h-[40px]"
          style={{ border: 'none', outline: 'none', boxShadow: 'none' }}
          disabled={streaming}
          autoFocus={!streaming}
        />

        {/* Attachment Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleAttachmentClick}
          disabled={streaming || !!imageUrl}
          className="h-8 sm:h-9 w-8 sm:w-9 p-0"
          title="Attach Image"
        >
          <Paperclip className="h-3 w-3 sm:h-4 sm:w-4" />
        </Button>

        {/* Settings Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleOpenDialog}
          disabled={streaming}
          className="h-8 sm:h-9 w-8 sm:w-9 p-0"
          title="System Prompt Settings"
        >
          <Settings2 className="h-3 w-3 sm:h-4 sm:w-4" />
        </Button>

        {/* Send Button */}
        <Button
          size="sm"
          onClick={handleSend}
          disabled={(!input.trim() && !imageUrl) || streaming}
          className="h-8 sm:h-9 w-8 sm:w-9"
          title="Send Message"
        >
          <Send className="h-3 w-3 sm:h-4 sm:w-4" />
        </Button>
      </div>
    </div>
  );
}
