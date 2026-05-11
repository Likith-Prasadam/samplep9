import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog } from '@/components/ui/dialog';
import SystemPromptDialogContent from './components/assistant-prompt-dialog';
import { systemPrompt } from './components/prompt';
import MessageList from './components/assistant-message-list';
import InputBar from './components/assistant-input';
import { Sparkles } from 'lucide-react';
import { Header } from '@/components/layouts/header';
import { SearchField } from '@/components/search';
import { ThemeSwitch } from '@/components/theme-switch';
import { TimezoneDropdown } from '@/components/layouts/timezone-dropdown';
import { ConfigDrawer } from '@/components/config-drawer';
import { ProfileDropdown } from '@/components/profile-dropdown';
import { Main } from '@/components/layouts/main';

type Message = {
  id: number;
  role: 'user' | 'assistant';
  content: Array<{
    type: 'text' | 'image_url';
    text?: string;
    image_url?: { url: string };
  }>;
};

export default function AiAssistant() {
  const navigate = useNavigate();
  const [streaming, setStreaming] = useState(false);
  const [chatStarted, setChatStarted] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [systemPromptState, setSystemPrompt] = useState(systemPrompt);
  const [openDialog, setOpenDialog] = useState(false);
  const [editPrompt, setEditPrompt] = useState('');
  const [promptCharCount, setPromptCharCount] = useState(systemPrompt.length);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (openDialog) {
      setEditPrompt(systemPromptState);
    }
  }, [openDialog, systemPromptState]);

  useEffect(() => {
    if (openDialog) {
      setPromptCharCount(editPrompt.length);
    }
  }, [editPrompt, openDialog]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages, streaming]);

  const getAuthToken = useCallback(() => {
    const token =
      localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!token) {
      console.error('No authentication token found');
    }
    return token;
  }, []);

  const clearAuthToken = useCallback(() => {
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
  }, []);

  const handleUploadClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleAttachmentClick = handleUploadClick;

  const convertImageToBase64 = useCallback((file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }, []);

  const sendMessageToBackend = useCallback(
    async (messagesToSend: Message[]) => {
      setStreaming(true);
      let streamingContent = '';

      const token = getAuthToken();
      if (!token) {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now(),
            role: 'assistant',
            content: [
              {
                type: 'text',
                text: 'Authentication error: No token found. Please log in again.',
              },
            ],
          },
        ]);
        setStreaming(false);
        return;
      }

      const tempMessageId = Date.now() + Math.random();

      try {
        const payloadMessages = [
          ...(systemPromptState.trim()
            ? [{ role: 'system', content: systemPromptState.trim() }]
            : []),
          ...messagesToSend.map((msg) => ({
            role: msg.role,
            content: msg.content,
          })),
        ];

        const response = await fetch(import.meta.env.VITE_IMAGE_CHAT_API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            messages: payloadMessages,
            model_hash: 'de2634f4-a15d-4b88-097b-069d8a3887a1', // Hardcoded chat model hash
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          const error = new Error(
            `Server error (${response.status}): ${errorText}`
          );
          if (response.status === 401) {
            clearAuthToken();
            setMessages((prev) => [
              ...prev,
              {
                id: Date.now(),
                role: 'assistant',
                content: [
                  {
                    type: 'text',
                    text: 'Session expired. Please log in again.',
                  },
                ],
              },
            ]);
            setTimeout(() => navigate('/login'), 2000);
            setStreaming(false);
            return;
          }
          throw error;
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) {
          throw new Error('No response body');
        }

        setMessages((prev) => [
          ...prev,
          {
            id: tempMessageId,
            role: 'assistant',
            content: [{ type: 'text', text: '' }],
          },
        ]);

        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            break;
          }

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.content) {
                  streamingContent += data.content;
                  setMessages((prev) => {
                    const newMessages = [...prev];
                    const messageIndex = newMessages.findIndex(
                      (msg) => msg.id === tempMessageId
                    );
                    if (messageIndex !== -1) {
                      newMessages[messageIndex] = {
                        ...newMessages[messageIndex],
                        content: [{ type: 'text', text: streamingContent }],
                      };
                    }
                    return newMessages;
                  });
                }
              } catch (e) {
                console.error('Error parsing stream data:', e);
              }
            }
          }
        }
      } catch (error) {
        console.error('Error streaming response:', error);

        let errorMessage = 'Sorry, there was an error processing your request.';

        if (error instanceof TypeError && error.message === 'Failed to fetch') {
          errorMessage =
            'Backend Connection Error: Cannot reach the server Please ensure:\n\n1. Backend server is running\n2. Server is listening on port 8080\n3. CORS is properly configured';
        } else if (error instanceof Error) {
          errorMessage = `Error: ${error.message}`;
        }

        setMessages((prev) => [
          ...prev,
          {
            id: Date.now(),
            role: 'assistant',
            content: [{ type: 'text', text: errorMessage }],
          },
        ]);
      } finally {
        setStreaming(false);
      }
    },
    [getAuthToken, systemPromptState, clearAuthToken, navigate]
  );

  const handleImageChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!e.target.files?.[0]) return;
      const file = e.target.files[0];

      if (file.size > 25 * 1024 * 1024) {
        alert('File size exceeds 25MB limit.');
        return;
      }

      try {
        const base64Image = await convertImageToBase64(file);
        setImageUrl(base64Image);
      } catch (error) {
        console.error('Error processing image:', error);
        alert('Failed to process image. Please try again.');
      }
    },
    [convertImageToBase64]
  );

  const handleSend = useCallback(async () => {
    if ((!input.trim() && !imageUrl) || streaming) {
      return;
    }

    const content: Array<{
      type: 'text' | 'image_url';
      text?: string;
      image_url?: { url: string };
    }> = [];

    if (input.trim()) {
      content.push({ type: 'text', text: input.trim() });
    }

    if (imageUrl) {
      content.push({ type: 'image_url', image_url: { url: imageUrl } });
    }

    const userMessage: Message = {
      id: Date.now() + Math.random(),
      role: 'user',
      content: content,
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);

    setInput('');
    setImageUrl(null);
    setChatStarted(true);

    await new Promise((resolve) => setTimeout(resolve, 50));
    await sendMessageToBackend(updatedMessages);
  }, [input, imageUrl, messages, streaming, sendMessageToBackend]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  const handlePlusClick = useCallback(() => {
    setMessages([]);
    setImageUrl(null);
    setChatStarted(false);
    setInput('');
  }, []);

  const handleOpenDialog = useCallback(() => {
    setOpenDialog(true);
  }, []);

  const handleSavePrompt = useCallback(() => {
    setSystemPrompt(editPrompt);
    setOpenDialog(false);
  }, [editPrompt]);

  const handlePromptChange = useCallback((value: string) => {
    setEditPrompt(value);
  }, []);

  const inputBarProps = {
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
  };

  return (
    <div className="flex flex-col h-screen">
      {/* ===== Top Heading ===== */}
      <Header fixed>
        <SearchField />
        <div className="ms-auto flex items-center gap-4">
          <ThemeSwitch />
          <TimezoneDropdown />
          <ConfigDrawer />
          <ProfileDropdown />
        </div>
      </Header>

      {/* Main Content - Fixed height with flex */}
      <Main fixed className="flex-1 flex flex-col overflow-hidden">
        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
          <SystemPromptDialogContent
            prompt={editPrompt}
            onPromptChange={handlePromptChange}
            onSave={handleSavePrompt}
            charCount={promptCharCount}
          />
        </Dialog>

        {!chatStarted ? (
          /* Welcome Screen */
          <div className="flex-1 flex items-center justify-center px-4 overflow-y-auto">
            <div className="text-center max-w-3xl w-full py-8">
              <div className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-4 rounded-full bg-primary flex items-center justify-center">
                <Sparkles className="h-6 w-6 md:h-8 md:w-8 text-primary-foreground" />
              </div>
              <h2 className="text-xl md:text-2xl lg:text-3xl font-bold mb-3">
                Hi, How can I help you today?
              </h2>
              <p className="text-sm md:text-base lg:text-lg mb-6 md:mb-8">
                Explore Deeper Insights and Unlock New Possibilities with
                SPECTRA
              </p>
              <InputBar variant="welcome" {...inputBarProps} />
            </div>
          </div>
        ) : (
          /* Chat Screen with fixed layout */
          <div className="flex-1 flex flex-col min-h-0">
            {/* Messages Area - Scrollable with flex-1 */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto px-2 sm:px-4 py-3 sm:py-6"
              style={{ border: 'none' }}
            >
              <div className="max-w-4xl mx-auto pb-4">
                <MessageList messages={messages} streaming={streaming} />
              </div>
            </div>

            {/* Input Bar - Fixed at bottom, no flex-grow */}
            <div
              className="flex-shrink-0 border-0 border-t-0"
              style={{ border: 'none', borderTop: 'none' }}
            >
              <div
                className="max-w-4xl mx-auto px-2 sm:px-4 py-2 sm:py-4 border-0 border-t-0"
                style={{ border: 'none', borderTop: 'none' }}
              >
                <InputBar {...inputBarProps} />
              </div>
            </div>
          </div>
        )}
      </Main>
    </div>
  );
}
