import React from 'react';
import { Loader2, User, SparkleIcon } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';

type Message = {
  id: number;
  role: 'user' | 'assistant';
  content: Array<{
    type: 'text' | 'image_url';
    text?: string;
    image_url?: { url: string };
  }>;
};

interface MessageListProps {
  messages: Message[];
  streaming: boolean;
}

export default function MessageList({ messages, streaming }: MessageListProps) {
  return (
    <>
      {messages.map((msg) => {
        const isUser = msg.role === 'user';
        const isStreamingMessage =
          !isUser &&
          streaming &&
          msg.content.length > 0 &&
          (!msg.content[0].text || msg.content[0].text.length === 0);
        const bubbleClasses = `p-2 sm:p-3 rounded-lg sm:rounded-xl lg:rounded-3xl max-w-[85vw] sm:max-w-[75vw] md:max-w-[65vw] lg:max-w-[50vw] ${
          isUser
            ? 'bg-sky-50 dark:bg-sky-900/20'
            : 'bg-gray-50 dark:bg-gray-800/50'
        }`;
        const iconClasses =
          'flex-shrink-0 rounded-full p-1 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300';

        return (
          <div
            key={msg.id}
            className={`mb-2 sm:mb-3 ${isUser ? 'flex justify-end items-start' : 'flex items-start'}`}
          >
            {!isUser ? (
              <>
                <div className="mr-2 sm:mr-4">
                  <div className={iconClasses}>
                    <SparkleIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                </div>
                <div className={bubbleClasses}>
                  {isStreamingMessage ? (
                    <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                      <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                      <span>Thinking...</span>
                    </div>
                  ) : (
                    msg.content.map((part, index) => (
                      <React.Fragment key={index}>
                        {part.type === 'text' && part.text ? (
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            rehypePlugins={[rehypeRaw]}
                            components={{
                              h1: ({ children }) => (
                                <h1 className="text-base sm:text-lg md:text-xl font-bold mb-1 sm:mb-2 dark:text-gray-100">
                                  {children}
                                </h1>
                              ),
                              h2: ({ children }) => (
                                <h2 className="text-sm sm:text-base md:text-lg font-semibold mb-1 sm:mb-2 dark:text-gray-100">
                                  {children}
                                </h2>
                              ),
                              h3: ({ children }) => (
                                <h3 className="text-xs sm:text-sm md:text-base font-semibold mb-1 sm:mb-2 dark:text-gray-100">
                                  {children}
                                </h3>
                              ),
                              blockquote: ({ children }) => (
                                <blockquote className="border-l-2 sm:border-l-4 border-gray-300 dark:border-gray-600 pl-2 sm:pl-4 italic bg-gray-50 dark:bg-gray-700/50 p-1 sm:p-2 rounded text-xs sm:text-sm">
                                  {children}
                                </blockquote>
                              ),
                              strong: ({ children }) => (
                                <strong className="font-bold text-gray-900 dark:text-gray-100">
                                  {children}
                                </strong>
                              ),
                              em: ({ children }) => (
                                <em className="italic text-gray-900 dark:text-gray-100">
                                  {children}
                                </em>
                              ),
                              code: ({ children }) => (
                                <code className="bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded text-xs sm:text-sm text-gray-900 dark:text-gray-100">
                                  {children}
                                </code>
                              ),
                              p: ({ children }) => (
                                <p className="mb-1 sm:mb-2 text-xs sm:text-sm md:text-base text-gray-900 dark:text-gray-100 leading-relaxed">
                                  {children}
                                </p>
                              ),
                              ul: ({ children }) => (
                                <ul className="list-disc list-inside mb-1 sm:mb-2 ml-2 sm:ml-4 text-xs sm:text-sm text-gray-900 dark:text-gray-100">
                                  {children}
                                </ul>
                              ),
                              ol: ({ children }) => (
                                <ol className="list-decimal list-inside mb-1 sm:mb-2 ml-2 sm:ml-4 text-xs sm:text-sm text-gray-900 dark:text-gray-100">
                                  {children}
                                </ol>
                              ),
                              li: ({ children }) => (
                                <li className="mb-0.5 sm:mb-1 text-xs sm:text-sm text-gray-900 dark:text-gray-100">
                                  {children}
                                </li>
                              ),
                              span: ({ children, ...props }) => (
                                <span
                                  {...props}
                                  className={`${props.className || ''} inline text-xs sm:text-sm`}
                                >
                                  {children}
                                </span>
                              ),
                            }}
                          >
                            {part.text}
                          </ReactMarkdown>
                        ) : null}
                        {part.type === 'image_url' && part.image_url?.url && (
                          <img
                            src={part.image_url.url}
                            alt="Uploaded image"
                            className="max-w-[250px] sm:max-w-[300px] md:max-w-[400px] h-auto rounded-lg mb-1 sm:mb-2 border border-gray-200 dark:border-gray-600"
                          />
                        )}
                      </React.Fragment>
                    ))
                  )}
                </div>
              </>
            ) : (
              <>
                <div className={bubbleClasses}>
                  {msg.content.map((part, index) => (
                    <React.Fragment key={index}>
                      {part.type === 'text' && part.text ? (
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          rehypePlugins={[rehypeRaw]}
                          components={{
                            h1: ({ children }) => (
                              <h1 className="text-base sm:text-lg md:text-xl font-bold mb-1 sm:mb-2 dark:text-gray-100">
                                {children}
                              </h1>
                            ),
                            h2: ({ children }) => (
                              <h2 className="text-sm sm:text-base md:text-lg font-semibold mb-1 sm:mb-2 dark:text-gray-100">
                                {children}
                              </h2>
                            ),
                            h3: ({ children }) => (
                              <h3 className="text-xs sm:text-sm md:text-base font-semibold mb-1 sm:mb-2 dark:text-gray-100">
                                {children}
                              </h3>
                            ),
                            blockquote: ({ children }) => (
                              <blockquote className="border-l-2 sm:border-l-4 border-gray-300 dark:border-gray-600 pl-2 sm:pl-4 italic bg-gray-50 dark:bg-gray-700/50 p-1 sm:p-2 rounded text-xs sm:text-sm">
                                {children}
                              </blockquote>
                            ),
                            strong: ({ children }) => (
                              <strong className="font-bold text-gray-900 dark:text-gray-100">
                                {children}
                              </strong>
                            ),
                            em: ({ children }) => (
                              <em className="italic text-gray-900 dark:text-gray-100">
                                {children}
                              </em>
                            ),
                            code: ({ children }) => (
                              <code className="bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded text-xs sm:text-sm text-gray-900 dark:text-gray-100">
                                {children}
                              </code>
                            ),
                            p: ({ children }) => (
                              <p className="mb-1 sm:mb-2 text-xs sm:text-sm md:text-base text-gray-900 dark:text-gray-100 leading-relaxed">
                                {children}
                              </p>
                            ),
                            ul: ({ children }) => (
                              <ul className="list-disc list-inside mb-1 sm:mb-2 ml-2 sm:ml-4 text-xs sm:text-sm text-gray-900 dark:text-gray-100">
                                {children}
                              </ul>
                            ),
                            ol: ({ children }) => (
                              <ol className="list-decimal list-inside mb-1 sm:mb-2 ml-2 sm:ml-4 text-xs sm:text-sm text-gray-900 dark:text-gray-100">
                                {children}
                              </ol>
                            ),
                            li: ({ children }) => (
                              <li className="mb-0.5 sm:mb-1 text-xs sm:text-sm text-gray-900 dark:text-gray-100">
                                {children}
                              </li>
                            ),
                            span: ({ children, ...props }) => (
                              <span
                                {...props}
                                className={`${props.className || ''} inline text-xs sm:text-sm`}
                              >
                                {children}
                              </span>
                            ),
                          }}
                        >
                          {part.text}
                        </ReactMarkdown>
                      ) : null}
                      {part.type === 'image_url' && part.image_url?.url && (
                        <img
                          src={part.image_url.url}
                          alt="Uploaded image"
                          className="max-w-[250px] sm:max-w-[300px] md:max-w-[400px] h-auto rounded-lg mb-1 sm:mb-2 border border-gray-200 dark:border-gray-600"
                        />
                      )}
                    </React.Fragment>
                  ))}
                </div>
                <div className="ml-2 sm:ml-3">
                  <div
                    className={`${iconClasses} bg-sky-200 dark:bg-sky-800 text-sky-600 dark:text-sky-300`}
                  >
                    <User className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                </div>
              </>
            )}
          </div>
        );
      })}
    </>
  );
}
