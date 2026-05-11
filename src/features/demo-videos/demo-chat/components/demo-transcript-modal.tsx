import { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Copy, Loader2, X } from 'lucide-react';
import type {
  TranscriptSegment,
  TranscriptEvent,
  TranscriptData,
} from '@/features/demo-videos/types';

interface DemoTranscriptModalProps {
  isOpen: boolean;
  transcript: string;
  onClose: () => void;
}

export function DemoTranscriptModal({
  isOpen,
  transcript,
  onClose,
}: DemoTranscriptModalProps) {
  const [formattedTranscript, setFormattedTranscript] = useState<
    TranscriptSegment[]
  >([]);
  const [, setEvents] = useState<TranscriptEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Parse and clean content with XML-like tags
  const parseTaggedContent = useCallback((text: string): string => {
    if (!text || typeof text !== 'string') return text;

    // Extract content from tags and organize them
    let cleanText = text;

    // Match tags like <thinking>...</thinking>, <anomaly>...</anomaly>, etc.
    const tagPattern = /<(\w+)>([\s\S]*?)<\/\1>/gi;
    let match;
    const tagMap = new Map<string, string[]>();

    // Extract all tags and their content
    while ((match = tagPattern.exec(text)) !== null) {
      const tagName = match[1].toLowerCase();
      const tagContent = match[2].trim();

      if (!tagMap.has(tagName)) {
        tagMap.set(tagName, []);
      }
      tagMap.get(tagName)!.push(tagContent);

      // Remove the tag from cleanText
      cleanText = cleanText.replace(match[0], '');
    }

    // Build formatted content
    const parts: string[] = [];

    // Add thinking section if present
    if (tagMap.has('thinking')) {
      const thinkingContent = tagMap.get('thinking')!.join('\n\n');
      if (thinkingContent) {
        parts.push(`Thinking:\n${thinkingContent}`);
      }
    }

    // Add main content (without tags)
    const mainContent = cleanText
      .replace(/<\/?[^>]+>/g, '') // Remove any remaining tags
      .trim()
      .replace(/\n\s*\n\s*\n/g, '\n\n') // Normalize multiple newlines
      .trim();

    if (mainContent) {
      parts.push(mainContent);
    }

    // Add anomaly section if present
    if (tagMap.has('anomaly')) {
      const anomalyContent = tagMap.get('anomaly')!.join('\n\n');
      if (anomalyContent) {
        parts.push(`\n\nAnomaly:\n${anomalyContent}`);
      }
    }

    // Add reflection section if present
    if (tagMap.has('reflection')) {
      const reflectionContent = tagMap.get('reflection')!.join('\n\n');
      if (reflectionContent) {
        parts.push(`\n\nReflection:\n${reflectionContent}`);
      }
    }

    // Add output section if present
    if (tagMap.has('output')) {
      const outputContent = tagMap.get('output')!.join('\n\n');
      if (outputContent) {
        parts.push(`\n\nOutput:\n${outputContent}`);
      }
    }

    // Add incident section if present
    if (tagMap.has('incident')) {
      const incidentContent = tagMap.get('incident')!.join('\n\n');
      if (incidentContent) {
        parts.push(`\n\nIncident: ${incidentContent}`);
      }
    }

    return parts.join('').trim() || text.replace(/<\/?[^>]+>/g, '').trim();
  }, []);

  const formatRawTranscript = useCallback(
    (text: string): TranscriptSegment[] => {
      const segments: TranscriptSegment[] = [];
      const lines = text.split('\n');

      lines.forEach((line) => {
        if (line.trim()) {
          const cleanedContent = parseTaggedContent(line.trim());
          segments.push({
            timestamp: '',
            content: cleanedContent,
            isIncident:
              line.toLowerCase().includes('incident') ||
              line.toLowerCase().includes('<incident>yes</incident>'),
          });
        }
      });

      return segments;
    },
    [parseTaggedContent]
  );

  const parseTranscript = useCallback(
    (raw: string | TranscriptData) => {
      try {
        let parsedData: TranscriptData;

        if (typeof raw === 'string') {
          parsedData = JSON.parse(raw);
        } else {
          parsedData = raw;
        }

        if (parsedData.videoTranscript?.events) {
          setEvents(parsedData.videoTranscript.events);
        } else {
          setEvents([]);
        }

        if (parsedData.videoTranscript?.results) {
          const resultsString = parsedData.videoTranscript.results;
          let resultsData: Record<string, string>[];

          if (typeof resultsString === 'string') {
            resultsData = JSON.parse(resultsString);
          } else {
            resultsData = resultsString as Record<string, string>[];
          }

          const incidentTimeRanges: { start: number; end: number }[] = [];
          if (parsedData.videoTranscript?.events) {
            parsedData.videoTranscript.events.forEach((event) => {
              if (event.type === 'incident') {
                incidentTimeRanges.push({
                  start: Number(event.start_time),
                  end: Number(event.end_time),
                });
              }
            });
          }

          const segments: TranscriptSegment[] = [];
          resultsData.forEach((segment) => {
            const key = Object.keys(segment)[0];
            const rawContent = segment[key] ?? '';
            const content = parseTaggedContent(rawContent);
            const timeRangeMatch = key.match(
              /(\d+)\s*seconds\s*to\s*(\d+)\s*seconds/i
            );

            let startTime = 0;
            let endTime = 0;
            if (timeRangeMatch) {
              startTime = parseInt(timeRangeMatch[1], 10);
              endTime = parseInt(timeRangeMatch[2], 10);
            }

            const isIncident =
              incidentTimeRanges.some(
                (range) =>
                  (startTime >= range.start && startTime <= range.end) ||
                  (endTime >= range.start && endTime <= range.end) ||
                  (startTime <= range.start && endTime >= range.end)
              ) ||
              rawContent.toLowerCase().includes('<incident>yes</incident>');

            segments.push({
              timestamp: `${startTime}s - ${endTime}s`,
              content,
              isIncident,
            });
          });

          setFormattedTranscript(segments);
        } else {
          setFormattedTranscript(
            formatRawTranscript(
              typeof raw === 'string' ? raw : JSON.stringify(raw)
            )
          );
        }

        setError(null);
      } catch (err) {
        console.error('Error parsing transcript:', err);
        setError('Error parsing transcript data. The format may be invalid.');
        if (typeof raw === 'string') {
          setFormattedTranscript(formatRawTranscript(raw));
        } else {
          setFormattedTranscript([]);
        }
      }
    },
    [parseTaggedContent, formatRawTranscript]
  );

  useEffect(() => {
    if (!transcript) {
      setFormattedTranscript([]);
      setEvents([]);
      setError(null);
      return;
    }
    parseTranscript(transcript);
  }, [transcript, parseTranscript]);

  const copyAll = () => {
    const text = formattedTranscript
      .map((seg) => `[${seg.timestamp}]\n${seg.content}`)
      .join('\n\n');
    navigator.clipboard.writeText(text || 'No content');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="max-w-5xl max-h-[90vh] flex flex-col"
        showCloseButton={false}
      >
        <DialogHeader>
          <div className="flex justify-between items-center">
            <DialogTitle>Video Transcript</DialogTitle>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={copyAll}>
                <Copy className="w-4 h-4 mr-2" />
                {copied ? 'Copied!' : 'Copy All'}
              </Button>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Body */}
        <div className="flex-1 overflow-y-auto pt-2">
          {error ? (
            <div className="rounded-md px-4 py-3 bg-red-900/30 border border-red-800 text-sm text-red-200">
              {error}
            </div>
          ) : formattedTranscript.length > 0 ? (
            <div className="space-y-8">
              {formattedTranscript.map((segment, i) => (
                <div
                  key={i}
                  className="relative border rounded-xl p-6 pt-8 hover:border-primary/70 transition-all overflow-visible"
                >
                  {segment.timestamp && (
                    <Badge
                      variant="secondary"
                      className="absolute -top-3 left-6 font-semibold text-sm px-4 py-2 whitespace-nowrap"
                    >
                      {segment.timestamp}
                    </Badge>
                  )}
                  <div className="text-base leading-relaxed">
                    {segment.content.split('\n').map((line, lineIdx) => {
                      // Match section headers (with optional content on same line)
                      const headerMatch = line.match(
                        /^((Thinking|Anomaly|Reflection|Output|Incident):\s*)(.*)$/i
                      );
                      if (headerMatch) {
                        const [, headerText, , content] = headerMatch;
                        return (
                          <div
                            key={lineIdx}
                            className={lineIdx > 0 ? 'mt-2' : ''}
                          >
                            <span className="font-bold">{headerText}</span>
                            {content && <span>{content}</span>}
                          </div>
                        );
                      }
                      // Regular content line
                      return (
                        <div
                          key={lineIdx}
                          className={lineIdx > 0 ? 'mt-1' : ''}
                        >
                          {line || '\u00A0'}
                        </div>
                      );
                    })}
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
