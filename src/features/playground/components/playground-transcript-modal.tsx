/* eslint-disable @typescript-eslint/no-explicit-any */
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Copy, Loader2 } from 'lucide-react';
import { useState, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';

type TranscriptModalProps = {
  isOpen: boolean;
  transcript: any;
  onClose: () => void;
};

// Common tags to extract
const commonTags = [
  'general',
  'traffic anomaly',
  'accident',
  'traffic',
  'anomaly',
  'incident',
  'emergency',
  'collision',
  'congestion',
];

// Extract tags from text
const extractTags = (text: string): string[] => {
  if (typeof text !== 'string') return [];
  const tags: string[] = [];
  const lowerText = text.toLowerCase();

  commonTags.forEach((tag) => {
    const regex = new RegExp(`\\b${tag}\\b`, 'gi');
    if (regex.test(lowerText)) {
      tags.push(tag);
    }
  });

  return [...new Set(tags)]; // Remove duplicates
};

// Clean text function and remove tags
const cleanText = (text: string, removeTags: boolean = false): string => {
  if (typeof text !== 'string') return '';

  let cleaned = text
    .replace(/<\/?[^>]+>/g, '')

    .trim();

  if (removeTags) {
    commonTags.forEach((tag) => {
      const regex = new RegExp(`\\b${tag}\\b`, 'gi');
      cleaned = cleaned.replace(regex, '').trim();
    });
  }

  return cleaned;
};

export default function TranscriptModal({
  isOpen,
  transcript,
  onClose,
}: TranscriptModalProps) {
  const [copied, setCopied] = useState(false);

  // Safely handle transcript data
  const data = useMemo(() => {
    if (typeof transcript === 'string') {
      try {
        return JSON.parse(transcript);
      } catch {
        return transcript;
      }
    }
    return transcript;
  }, [transcript]);

  // Format time range to capitalize Start Time and End Time
  const formatTimeRange = (timeRange: string): string => {
    return timeRange
      .replace(/\bstart time\b/gi, 'Start Time')
      .replace(/\bend time\b/gi, 'End Time');
  };

  // Extract segments with tags
  const { segments } = useMemo(() => {
    const segs: {
      timeRange: string;
      content: React.ReactNode;
      textForCopy: string;
      tags: string[];
      type: 'text' | 'event';
    }[] = [];
    const allTags = new Set<string>();

    // Handle new API format (Array of transcripts)
    if (data?.transcripts && Array.isArray(data.transcripts)) {
      data.transcripts
        .filter((t: any) => t.orgProcessName === 'vlm_inference')
        .sort((a: any, b: any) => a.startTime - b.startTime)
        .forEach((t: any) => {
          const raw = t.content || '';
          const processName = t.orgProcessName;
          const start =
            typeof t.startTime === 'number'
              ? t.startTime.toFixed(2)
              : t.startTime;
          const end =
            typeof t.endTime === 'number' ? t.endTime.toFixed(2) : t.endTime;
          const timeRange = `${start} - ${end}`;

          if (processName === 'event_detection') {
            try {
              const json = JSON.parse(raw);
              const hasEvents = json.events_detected > 0;
              const eventList = json.detected_events || [];

              const content = (
                <div className="text-sm">
                  <div className="font-semibold text-muted-foreground mb-1 flex items-center gap-2">
                    Event Analysis
                    {!hasEvents && (
                      <Badge
                        variant="outline"
                        className="text-[10px] h-5 font-normal"
                      >
                        No events
                      </Badge>
                    )}
                  </div>
                  {hasEvents && (
                    <ul className="space-y-3 mt-2">
                      {eventList.map((ev: any, idx: number) => {
                        if (typeof ev === 'object' && ev !== null) {
                          return (
                            <li
                              key={idx}
                              className="text-foreground border-l-2 border-primary/30 pl-3 py-0.5"
                            >
                              <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-semibold text-sm">
                                    {ev.event_title || 'Untitled Event'}
                                  </span>
                                  {ev.event_type && (
                                    <Badge
                                      variant="secondary"
                                      className="text-[10px] h-5 px-2 capitalize font-normal"
                                    >
                                      {ev.event_type}
                                    </Badge>
                                  )}
                                </div>
                                {ev.event_description && (
                                  <p className="text-muted-foreground text-xs leading-relaxed">
                                    {ev.event_description}
                                  </p>
                                )}
                              </div>
                            </li>
                          );
                        }
                        return (
                          <li
                            key={idx}
                            className="text-foreground list-disc ml-4"
                          >
                            {String(ev)}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              );

              segs.push({
                timeRange,
                content,
                textForCopy: hasEvents
                  ? `Events detected:\n${eventList
                      .map((ev: any) => {
                        if (typeof ev === 'object' && ev !== null) {
                          return `- ${ev.event_title || 'Event'} (${ev.event_type || 'Unknown'}): ${ev.event_description || ''}`;
                        }
                        return `- ${ev}`;
                      })
                      .join('\n')}`
                  : 'No events detected',
                tags: [],
                type: 'event',
              });
              return;
            } catch {
              // Fallback to text processing if JSON parse fails
            }
          }

          const tags = extractTags(raw);
          tags.forEach((tag) => allTags.add(tag));
          const clean = cleanText(raw, true);
          if (clean) {
            segs.push({
              timeRange,
              content: clean,
              textForCopy: clean,
              tags,
              type: 'text',
            });
          }
        });
    }

    if (data && typeof data === 'object' && !Array.isArray(data)) {
      Object.values(data).forEach((section: any) => {
        if (section && typeof section === 'object') {
          Object.entries(section).forEach(
            ([timeRange, content]: [string, any]) => {
              const raw = content?.vllm || content?.text || '';
              const tags = extractTags(raw);
              tags.forEach((tag) => allTags.add(tag));
              const clean = cleanText(raw, true);
              if (clean) {
                const formattedTimeRange = formatTimeRange(timeRange);
                segs.push({
                  timeRange: formattedTimeRange,
                  content: clean,
                  textForCopy: clean,
                  tags,
                  type: 'text',
                });
              }
            }
          );
        }
      });
    }

    return {
      segments: segs,
    };
  }, [data]);

  const copyAll = () => {
    const text = segments
      .map((s) => `[${s.timeRange}]\n${s.textForCopy}`)
      .join('\n\n');
    navigator.clipboard.writeText(text || 'No content');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col min-h-0">
        <DialogHeader className="pr-10">
          <div className="flex justify-between items-center">
            <DialogTitle>Video Transcript</DialogTitle>
            <Button variant="outline" size="sm" onClick={copyAll}>
              <Copy className="w-4 h-4 mr-2" />
              {copied ? 'Copied!' : 'Copy All'}
            </Button>
          </div>
        </DialogHeader>

        {/* Body */}
        <div className="flex-1 overflow-y-auto pt-2 min-w-0 min-h-0">
          {typeof data === 'string' ? (
            <pre className="font-mono text-sm whitespace-pre-wrap break-words">
              {cleanText(data, true)}
            </pre>
          ) : segments.length > 0 ? (
            <div className="space-y-8">
              {segments.map((seg, i) => (
                <div
                  key={i}
                  className="relative border rounded-xl p-6 pt-8 hover:border-primary/70 transition-all overflow-visible"
                >
                  <Badge
                    variant="secondary"
                    className="absolute -top-3 left-6 font-semibold text-sm px-4 py-2 whitespace-nowrap"
                  >
                    {seg.timeRange}
                  </Badge>
                  <div className="text-base leading-relaxed mt-1">
                    {seg.type === 'text' ? (
                      <div className="text-[15px] text-foreground break-words leading-7">
                        <ReactMarkdown
                          components={{
                            h1: ({ children }) => (
                              <h1 className="font-extrabold text-lg mt-4 mb-3 text-foreground">
                                {children}
                              </h1>
                            ),
                            h2: ({ children }) => (
                              <h2 className="font-extrabold text-base mt-4 mb-3 text-foreground">
                                {children}
                              </h2>
                            ),
                            h3: ({ children }) => (
                              <h3 className="font-bold text-sm mt-3 mb-2 text-foreground">
                                {children}
                              </h3>
                            ),
                            h4: ({ children }) => (
                              <h4 className="font-bold mt-2 mb-2 text-foreground">
                                {children}
                              </h4>
                            ),
                            h5: ({ children }) => (
                              <h5 className="font-bold mt-2 mb-2 text-foreground">
                                {children}
                              </h5>
                            ),
                            h6: ({ children }) => (
                              <h6 className="font-bold mt-2 mb-2 text-foreground">
                                {children}
                              </h6>
                            ),
                            strong: ({ children }) => (
                              <strong className="font-bold text-foreground">
                                {children}
                              </strong>
                            ),
                            ul: ({ children }) => (
                              <ul className="list-disc pl-5 space-y-2 my-2">
                                {children}
                              </ul>
                            ),
                            li: ({ children }) => {
                              if (
                                !children ||
                                (Array.isArray(children) &&
                                  children.length === 0)
                              ) {
                                return null;
                              }
                              return (
                                <li className="leading-7 marker:text-black">
                                  {children}
                                </li>
                              );
                            },
                            p: ({ children }) => (
                              <p className="leading-7 my-2">{children}</p>
                            ),
                          }}
                        >
                          {(typeof seg.content === 'string'
                            ? seg.content
                            : ''
                          ).trim()}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      seg.content
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <Loader2 className="w-12 h-12 animate-spin mb-4" />
              <p>Loading transcript...</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
