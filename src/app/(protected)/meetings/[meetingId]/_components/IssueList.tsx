'use client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { api, RouterOutputs } from '@/trpc/react';
import { VideoIcon } from 'lucide-react';
import React from 'react';
import DOMPurify from 'dompurify';
import { cn } from '@/lib/utils';

function IssueCard({
  issue,
}: {
  issue: NonNullable<RouterOutputs['project']['getMeetingById']>['issues'][number];
}) {
  const [open, setOpen] = React.useState(false);
  const [message, setMessage] = React.useState('');
  const [chatHistory, setChatHistory] = React.useState<
    Array<{ role: 'user' | 'assistant'; content: string; isExpanded?: boolean }>
  >([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSummaryExpanded, setIsSummaryExpanded] = React.useState(true);

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    const userMessage = message;
    setMessage('');

    setChatHistory((prev) => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: `Context about this issue:
Issue Title: ${issue.gist}
Headline: ${issue.headline}
Time Period: ${issue.start} - ${issue.end}
Summary: ${issue.summary}

User Question: ${userMessage}`,
          sessionId: issue.id,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      const data = await response.json();
      setChatHistory((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data.response,
        },
      ]);
    } catch (error) {
      console.error('Error:', error);
      setChatHistory((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'I apologize, but I encountered an error. Please try again.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMessageExpand = (index: number) => {
    setChatHistory((prev) =>
      prev.map((msg, i) => (i === index ? { ...msg, isExpanded: !msg.isExpanded } : msg)),
    );
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
          <div className="flex-none">
            <DialogTitle className="text-xl font-semibold">{issue.gist}</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {issue.createdAt.toLocaleDateString()}
            </DialogDescription>
            <p className="text-foreground/80">{issue.headline}</p>
            <div className="mt-2 rounded-lg border-l-4 border-primary/30 bg-muted/50">
              <div className="flex items-center justify-between p-2 pr-4">
                <span className="text-sm text-muted-foreground">
                  {issue.start} - {issue.end}
                </span>
                <button
                  onClick={() => setIsSummaryExpanded(!isSummaryExpanded)}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  {isSummaryExpanded ? 'Show Less' : 'Show More'}
                </button>
              </div>
              {isSummaryExpanded && (
                <p className="font-medium italic leading-relaxed text-foreground p-4 pt-0">
                  {issue.summary}
                </p>
              )}
            </div>
          </div>

          <div className="mt-6 border-t border-border pt-4 flex-1 min-h-0 flex flex-col">
            <div className="flex-1 overflow-y-auto pr-2">
              <div className="flex flex-col gap-4">
                {chatHistory.map((msg, i) => (
                  <div
                    key={i}
                    className={cn(
                      'flex w-full gap-2 rounded-lg p-4',
                      msg.role === 'assistant' ? 'bg-muted/50' : 'bg-primary/5',
                    )}
                  >
                    <div className="flex w-full flex-col gap-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          {msg.role === 'assistant' ? (
                            <div className="flex h-6 w-6 items-center justify-center rounded-full border bg-background">
                              <div className="h-3 w-3 rounded-full bg-primary" />
                            </div>
                          ) : (
                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary">
                              <div className="h-3 w-3 rounded-full bg-primary-foreground" />
                            </div>
                          )}
                          <p className="text-sm font-medium">
                            {msg.role === 'assistant' ? 'AI' : 'You'}
                          </p>
                        </div>
                        {msg.role === 'assistant' && (
                          <button
                            onClick={() => toggleMessageExpand(i)}
                            className="text-xs text-muted-foreground hover:text-foreground"
                          >
                            {msg.isExpanded === false ? 'Show More' : 'Show Less'}
                          </button>
                        )}
                      </div>
                      <div
                        className={cn(
                          'text-sm leading-relaxed prose prose-sm dark:prose-invert max-w-none',
                          msg.isExpanded === false && 'line-clamp-2',
                        )}
                      >
                        {msg.role === 'assistant' ? (
                          <div
                            dangerouslySetInnerHTML={{
                              __html: DOMPurify.sanitize(
                                msg.content
                                  .replace(
                                    /^### (.*?)$/gm,
                                    '<h3 class="text-lg font-bold mt-4 mb-2">$1</h3>',
                                  )
                                  .replace(
                                    /^## (.*?)$/gm,
                                    '<h2 class="text-xl font-bold mt-5 mb-2">$1</h2>',
                                  )
                                  .replace(
                                    /^# (.*?)$/gm,
                                    '<h1 class="text-2xl font-bold mt-6 mb-3">$1</h1>',
                                  )
                                  .replace(/^•\s+/gm, '• ')
                                  .replace(/\n\n/g, '</p><p>')
                                  .replace(/^([^•].+?)$/gm, '$1')
                                  .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                                  .replace(/\*([^\*]+)\*/g, '<em>$1</em>')
                                  .replace(
                                    /```(.*?)\n([\s\S]*?)```/gm,
                                    '<pre class="bg-muted p-2 rounded-md my-2 overflow-auto"><code>$2</code></pre>',
                                  )
                                  .replace(
                                    /`([^`]+)`/g,
                                    '<code class="bg-muted px-1 py-0.5 rounded text-sm">$1</code>',
                                  )
                                  .split('\n')
                                  .map((line) => {
                                    if (line.startsWith('•')) {
                                      return `<div class="flex gap-2 items-start my-1"><span class="text-primary">•</span><span>${line.substring(2)}</span></div>`;
                                    }
                                    return line;
                                  })
                                  .join(''),
                              ),
                            }}
                          />
                        ) : (
                          <p className="text-foreground/80">{msg.content}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="h-2 w-2 animate-pulse rounded-full bg-primary" />
                    <p>AI is thinking...</p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex-none mt-4 flex gap-2">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Ask me anything about this issue..."
                className="flex-1 border:gray-300 rounded-md border border-border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              <button
                onClick={handleSendMessage}
                disabled={!message.trim() || isLoading}
                className={cn(
                  'inline-flex items-center justify-center rounded-md p-2',
                  'bg-primary text-primary-foreground hover:bg-primary/90',
                  'disabled:pointer-events-none disabled:opacity-50',
                )}
                aria-label="Send"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 12l14-7-7 14-2-5-5-2z" />
                </svg>
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <Card className="relative hover:shadow-md transition-shadow flex flex-col">
        <CardHeader className="flex-1">
          <CardTitle className="text-lg font-semibold text-foreground">{issue.gist}</CardTitle>
          <div className="border-b border-border my-2"></div>
          <CardDescription className="line-clamp-2">{issue.headline}</CardDescription>
        </CardHeader>
        <CardContent className="mt-auto pt-0">
          <Button
            onClick={() => setOpen(true)}
            variant="outline"
            className="w-full border border-border bg-background text-foreground hover:bg-muted"
          >
            View Details
          </Button>
        </CardContent>
      </Card>
    </>
  );
}

type Props = {
  meetingId: string;
};

const IssueList = ({ meetingId }: Props) => {
  const [meetingAIOpen, setMeetingAIOpen] = React.useState(false);
  const [meetingMessage, setMeetingMessage] = React.useState('');
  const [meetingChatHistory, setMeetingChatHistory] = React.useState<
    Array<{ role: 'user' | 'assistant'; content: string; isExpanded?: boolean }>
  >([]);
  const [meetingAILoading, setMeetingAILoading] = React.useState(false);

  const clearMeetingChat = () => {
    setMeetingChatHistory([]);
  };

  const { data: meeting, isLoading } = api.project.getMeetingById.useQuery(
    { meetingId },
    {
      refetchInterval: 4000,
    },
  );

  const handleSendMeetingMessage = async () => {
    if (!meetingMessage.trim() || !meeting) return;

    const userMessage = meetingMessage;
    setMeetingMessage('');

    setMeetingChatHistory((prev) => [...prev, { role: 'user', content: userMessage }]);
    setMeetingAILoading(true);

    try {
      const response = await fetch('/api/meeting-ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          meetingId: meetingId,
          meetingName: meeting.name,
          meetingDate: meeting.createdAt.toISOString(),
          issueCount: meeting.issues.length,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      const data = await response.json();
      setMeetingChatHistory((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data.response,
        },
      ]);
    } catch (error) {
      console.error('Error:', error);
      setMeetingChatHistory((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'I apologize, but I encountered an error. Please try again.',
        },
      ]);
    } finally {
      setMeetingAILoading(false);
    }
  };

  const toggleMeetingMessageExpand = (index: number) => {
    setMeetingChatHistory((prev) =>
      prev.map((msg, i) => (i === index ? { ...msg, isExpanded: !msg.isExpanded } : msg)),
    );
  };

  if (isLoading || !meeting)
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent" />
      </div>
    );
  return (
    <div className="p-4 sm:p-8">
      <div className="mx-auto flex max-w-2xl flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-x-8 border-b border-border pb-6 lg:mx-0 lg:max-w-none">
        <div className="flex items-center gap-x-4 sm:gap-x-6">
          <div className="rounded-full border border-border bg-card p-3">
            <VideoIcon className="h-6 w-6 text-foreground/80" />
          </div>
          <div>
            <div className="text-sm text-muted-foreground">
              Meeting on {meeting.createdAt.toLocaleDateString()}
            </div>
            <h1 className="mt-1 text-xl font-semibold text-foreground">{meeting.name}</h1>
          </div>
        </div>
        <Button
          variant="outline"
          className="flex items-center gap-2 w-full sm:w-auto mt-4 sm:mt-0"
          onClick={() => setMeetingAIOpen(true)}
        >
          <span className="flex h-5 w-5 items-center justify-center rounded-full border bg-background">
            <span className="h-2.5 w-2.5 rounded-full bg-primary" />
          </span>
          Ask Meeting AI
        </Button>
      </div>
      <div className="h-4 sm:h-6"></div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {meeting.issues.map((issue) => (
          <IssueCard key={issue.id} issue={issue} />
        ))}
      </div>

      {/* Meeting AI Dialog */}
      <Dialog open={meetingAIOpen} onOpenChange={setMeetingAIOpen}>
        <DialogContent className="max-w-full sm:max-w-2xl w-full sm:w-auto max-h-[90vh] flex flex-col px-2 sm:px-6 py-2 sm:py-8">
          <div className="flex-none">
            <DialogTitle className="text-xl font-semibold">Meeting AI</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Ask questions about the meeting, or get summaries and action items.
            </DialogDescription>
            <div className="mt-3 p-2 sm:p-3 bg-muted/30 rounded-md border border-border">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <h2 className="font-bold text-base mb-2 sm:mb-0">Meeting Summary</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearMeetingChat}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Clear Chat
                </Button>
              </div>
              <span className="text-sm text-muted-foreground">
                Meeting: <strong>{meeting.name}</strong>
              </span>
              <div className="mt-2 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <span>
                  Total Issues: <strong>{meeting.issues.length}</strong>
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 border-t border-border pt-4 flex-1 min-h-0 flex flex-col">
            <div className="flex-1 overflow-y-auto pr-0 sm:pr-2">
              <div className="flex flex-col gap-4">
                {meetingChatHistory.map((msg, i) => (
                  <div
                    key={i}
                    className={cn(
                      'flex w-full gap-2 rounded-lg p-4',
                      msg.role === 'assistant' ? 'bg-muted/50' : 'bg-primary/5',
                    )}
                  >
                    <div className="flex w-full flex-col gap-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          {msg.role === 'assistant' ? (
                            <div className="flex h-6 w-6 items-center justify-center rounded-full border bg-background">
                              <div className="h-3 w-3 rounded-full bg-primary" />
                            </div>
                          ) : (
                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary">
                              <div className="h-3 w-3 rounded-full bg-primary-foreground" />
                            </div>
                          )}
                          <p className="text-sm font-medium">
                            {msg.role === 'assistant' ? 'AI' : 'You'}
                          </p>
                        </div>
                        {msg.role === 'assistant' && (
                          <button
                            onClick={() => toggleMeetingMessageExpand(i)}
                            className="text-xs text-muted-foreground hover:text-foreground"
                          >
                            {msg.isExpanded === false ? 'Show More' : 'Show Less'}
                          </button>
                        )}
                      </div>
                      <div
                        className={cn(
                          'text-sm leading-relaxed prose prose-sm dark:prose-invert max-w-none',
                          msg.isExpanded === false && 'line-clamp-2',
                        )}
                      >
                        {msg.role === 'assistant' ? (
                          <div
                            dangerouslySetInnerHTML={{
                              __html: DOMPurify.sanitize(
                                msg.content
                                  .replace(
                                    /^### (.*?)$/gm,
                                    '<h3 class="text-lg font-bold mt-4 mb-2">$1</h3>',
                                  )
                                  .replace(
                                    /^## (.*?)$/gm,
                                    '<h2 class="text-xl font-bold mt-5 mb-2">$1</h2>',
                                  )
                                  .replace(
                                    /^# (.*?)$/gm,
                                    '<h1 class="text-2xl font-bold mt-6 mb-3">$1</h1>',
                                  )
                                  .replace(/^•\s+/gm, '• ')
                                  .replace(/\n\n/g, '</p><p>')
                                  .replace(/^([^•].+?)$/gm, '$1')
                                  .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                                  .replace(/\*([^\*]+)\*/g, '<em>$1</em>')
                                  .replace(
                                    /```(.*?)\n([\s\S]*?)```/gm,
                                    '<pre class="bg-muted p-2 rounded-md my-2 overflow-auto"><code>$2</code></pre>',
                                  )
                                  .replace(
                                    /`([^`]+)`/g,
                                    '<code class="bg-muted px-1 py-0.5 rounded text-sm">$1</code>',
                                  )
                                  .split('\n')
                                  .map((line) => {
                                    if (line.startsWith('•')) {
                                      return `<div class="flex gap-2 items-start my-1"><span class="text-primary">•</span><span>${line.substring(2)}</span></div>`;
                                    }
                                    return line;
                                  })
                                  .join(''),
                              ),
                            }}
                          />
                        ) : (
                          <p className="text-foreground/80">{msg.content}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {meetingAILoading && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="h-2 w-2 animate-pulse rounded-full bg-primary" />
                    <p>AI is thinking...</p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex-none mt-4 flex flex-col sm:flex-row gap-2 w-full">
              <input
                type="text"
                value={meetingMessage}
                onChange={(e) => setMeetingMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMeetingMessage();
                  }
                }}
                placeholder="Ask me anything about the meeting..."
                className="flex-1 rounded-md border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              <button
                onClick={handleSendMeetingMessage}
                disabled={!meetingMessage.trim() || meetingAILoading}
                className={cn(
                  'inline-flex items-center justify-center rounded-md p-2 w-full sm:w-auto',
                  'bg-primary text-primary-foreground hover:bg-primary/90',
                  'disabled:pointer-events-none disabled:opacity-50',
                )}
                aria-label="Send"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 12l14-7-7 14-2-5-5-2z" />
                </svg>
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default IssueList;
