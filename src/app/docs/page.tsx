import { Metadata } from 'next';
import Link from 'next/link';
import { BookOpen, Code, FileText, MessageSquare, Video } from 'lucide-react';

import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Navbar } from '../components/navbar';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export const metadata: Metadata = {
  title: 'Documentation | Dionysus',
  description: 'Complete documentation for using Dionysus - your AI-powered meeting assistant',
};

export default function DocsPage() {
  return (
    <div className="overflow-x-hidden">
      <Navbar />
      <div className="container max-w-7xl pb-12 md:py-16">
        <PageHeader
          icon={<BookOpen className="h-6 w-6" />}
          title="Documentation"
          description="Everything you need to know about using Dionysus"
        />
        <Separator className="my-6" />
        <Tabs defaultValue="getting-started" className="space-y-8">
          <div className="sticky top-0 z-10 -mx-4 bg-background/95 px-4 py-2 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <TabsList className="flex flex-wrap gap-2">
              <TabsTrigger value="getting-started" className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Getting Started
              </TabsTrigger>
              <TabsTrigger value="meetings" className="flex items-center gap-2">
                <Video className="h-4 w-4" />
                Meetings
              </TabsTrigger>
              <TabsTrigger value="ai-features" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                AI Features
              </TabsTrigger>
              <TabsTrigger value="api" className="flex items-center gap-2">
                <Code className="h-4 w-4" />
                API
              </TabsTrigger>
              <TabsTrigger value="faq" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                FAQ
              </TabsTrigger>
            </TabsList>

            <TabsContent value="getting-started" className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                  <CardHeader>
                    <CardTitle>Quick Start Guide</CardTitle>
                    <CardDescription>
                      Set up your account and start using Dionysus in minutes
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ol className="list-decimal space-y-2 pl-4">
                      <li>Sign up for a new account</li>
                      <li>Complete your profile setup</li>
                      <li>Create your first meeting or join an existing one</li>
                      <li>Enable your microphone when prompted</li>
                      <li>Start leveraging AI insights during your meetings</li>
                    </ol>
                  </CardContent>
                  <CardFooter>
                    <Button asChild>
                      <Link href="/sign-up">Create Account</Link>
                    </Button>
                  </CardFooter>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>System Requirements</CardTitle>
                    <CardDescription>What you need to use Dionysus effectively</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p>
                      <strong>Browsers:</strong> Chrome 80+, Firefox 78+, Edge 80+, Safari 14+
                    </p>
                    <p>
                      <strong>Internet:</strong> 5 Mbps upload/download minimum
                    </p>
                    <p>
                      <strong>Hardware:</strong> Microphone required for voice features
                    </p>
                    <p>
                      <strong>Permission:</strong> Browser access to microphone
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Account Types</CardTitle>
                    <CardDescription>Choose the right plan for your needs</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p>
                      <strong>Free:</strong> Basic features, limited meetings per month
                    </p>
                    <p>
                      <strong>Pro:</strong> Unlimited meetings, extended recordings
                    </p>
                    <p>
                      <strong>Enterprise:</strong> Custom solutions for teams
                    </p>
                  </CardContent>
                  <CardFooter>
                    <Button variant="outline" asChild>
                      <Link href="/#pricing">View Pricing</Link>
                    </Button>
                  </CardFooter>
                </Card>
              </div>

              <div className="prose dark:prose-invert max-w-none">
                <h2>Getting Started with Dionysus</h2>
                <p>
                  Dionysus is an AI-powered meeting assistant designed to help you get the most out
                  of your meetings. With features like real-time transcription, automatic
                  summarization, and AI-powered insights, Dionysus helps you focus on the
                  conversation while capturing all the important details.
                </p>
                <h3>Creating Your Account</h3>
                <p>
                  To start using Dionysus, you'll need to create an account. Click the "Sign Up"
                  button in the top right corner of our homepage and follow the instructions. You
                  can sign up using your email, Google account, or GitHub account.
                </p>
                <h3>Your First Meeting</h3>
                <p>
                  Once you've created your account, you can start your first meeting right away.
                  Navigate to the dashboard and click "Create Meeting". Give your meeting a name,
                  set a time, and invite participants if desired. When it's time for your meeting,
                  click "Join" and allow microphone access when prompted.
                </p>
                <p>
                  Alternatively, you can join a meeting you've been invited to by clicking the link
                  in the invitation email or entering the meeting code on the dashboard.
                </p>
              </div>
            </TabsContent>

            <TabsContent value="meetings" className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                  <CardHeader>
                    <CardTitle>Creating Meetings</CardTitle>
                    <CardDescription>Set up and configure your meetings</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p>
                      Learn how to schedule, customize settings, and invite participants to your
                      meetings.
                    </p>
                  </CardContent>
                  <CardFooter>
                    <Button variant="outline" size="sm">
                      Learn More
                    </Button>
                  </CardFooter>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>During Meetings</CardTitle>
                    <CardDescription>
                      Features available while your meeting is in progress
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p>
                      Discover real-time transcription, live notes, and AI suggestions during your
                      meetings.
                    </p>
                  </CardContent>
                  <CardFooter>
                    <Button variant="outline" size="sm">
                      Learn More
                    </Button>
                  </CardFooter>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>After Meetings</CardTitle>
                    <CardDescription>Access summaries, insights, and recordings</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p>
                      Find out how to review AI-generated meeting summaries, action items, and key
                      insights.
                    </p>
                  </CardContent>
                  <CardFooter>
                    <Button variant="outline" size="sm">
                      Learn More
                    </Button>
                  </CardFooter>
                </Card>
              </div>

              <div className="prose dark:prose-invert max-w-none">
                <h2>Managing Your Meetings</h2>
                <p>
                  Dionysus makes it easy to create, join, and manage your meetings. Here's
                  everything you need to know about working with meetings in the platform.
                </p>

                <h3>Creating a New Meeting</h3>
                <p>
                  To create a new meeting, navigate to the "Meetings" tab in your dashboard and
                  click the "Create Meeting" button. You'll need to provide:
                </p>
                <ul>
                  <li>
                    <strong>Meeting Name</strong>: A descriptive title for your meeting
                  </li>
                  <li>
                    <strong>Date & Time</strong>: When the meeting will take place
                  </li>
                  <li>
                    <strong>Participants</strong>: Email addresses of people you want to invite
                    (optional)
                  </li>
                  <li>
                    <strong>Agenda</strong>: Key topics to discuss (optional, but recommended)
                  </li>
                </ul>

                <h3>During the Meeting</h3>
                <p>
                  When you join a meeting, Dionysus will automatically start recording and
                  transcribing the conversation (with your permission). The AI will:
                </p>
                <ul>
                  <li>Transcribe everything said in real-time</li>
                  <li>Identify speakers automatically</li>
                  <li>Highlight key points as they're mentioned</li>
                  <li>Suggest follow-up questions or clarifications</li>
                  <li>Track action items as they arise</li>
                </ul>

                <h3>After the Meeting</h3>
                <p>Once your meeting ends, Dionysus will generate:</p>
                <ul>
                  <li>A complete transcript</li>
                  <li>An AI-generated summary</li>
                  <li>A list of action items with assigned owners (if identified)</li>
                  <li>Key decisions that were made</li>
                  <li>Follow-up suggestions</li>
                </ul>
                <p>
                  All this information will be available in your dashboard under "Past Meetings".
                  You can share these summaries with participants or export them to your preferred
                  format.
                </p>
              </div>
            </TabsContent>

            <TabsContent value="ai-features" className="space-y-6">
              <div className="prose dark:prose-invert max-w-none">
                <h2>AI-Powered Features</h2>
                <p>
                  Dionysus leverages advanced AI to make your meetings more productive. Here's how
                  our AI features work:
                </p>

                <h3>Real-time Transcription</h3>
                <p>
                  Our AI transcribes your meetings in real-time with high accuracy. The system
                  automatically identifies different speakers and formats the transcript for easy
                  reading. Transcripts are searchable and can be edited after the meeting if needed.
                </p>

                <h3>Meeting Summarization</h3>
                <p>
                  After your meeting concludes, our AI generates a concise summary that captures:
                </p>
                <ul>
                  <li>Main topics discussed</li>
                  <li>Key decisions made</li>
                  <li>Action items and their owners</li>
                  <li>Follow-up questions</li>
                  <li>Important dates or deadlines mentioned</li>
                </ul>
                <p>You can customize the summary format and length based on your preferences.</p>

                <h3>AI Chat Assistant</h3>
                <p>
                  During and after meetings, you can ask our AI assistant questions about the
                  meeting content. For example:
                </p>
                <ul>
                  <li>"What did Alice say about the Q3 projections?"</li>
                  <li>"Summarize the discussion about the new product launch"</li>
                  <li>"What action items were assigned to me?"</li>
                  <li>"List all the decisions we made today"</li>
                </ul>

                <h3>Smart Notifications</h3>
                <p>
                  Our AI can identify when you've been mentioned in a meeting or when an action item
                  has been assigned to you, even if you weren't present. The system will send you
                  smart notifications with the relevant context so you stay informed.
                </p>

                <h3>Data Privacy & AI Training</h3>
                <p>
                  We take data privacy seriously. Your meeting content is used solely to provide the
                  services you request. We do not use customer data to train our AI models without
                  explicit consent. For more information, please see our{' '}
                  <Link href="/privacy" className="text-primary underline">
                    Privacy Policy
                  </Link>
                  .
                </p>
              </div>
            </TabsContent>

            <TabsContent value="api" className="space-y-6">
              <div className="prose dark:prose-invert max-w-none">
                <h2>API Documentation</h2>
                <p>
                  Dionysus offers a comprehensive API that allows developers to integrate our
                  services into their applications. This section provides an overview of our API
                  capabilities and how to get started.
                </p>

                <h3>API Keys</h3>
                <p>
                  To use the Dionysus API, you'll need an API key. API keys can be generated from
                  your account dashboard under "Developer Settings". Each API key has specific
                  permissions that you can configure.
                </p>
                <p>
                  Keep your API keys secure and do not expose them in client-side code. We recommend
                  using environment variables to store your API keys.
                </p>

                <h3>Authentication</h3>
                <p>
                  All API requests require authentication. Include your API key in the request
                  header:
                </p>
                <pre>
                  <code>{`Authorization: Bearer YOUR_API_KEY`}</code>
                </pre>

                <h3>Rate Limits</h3>
                <p>API requests are subject to rate limiting based on your plan:</p>
                <ul>
                  <li>Free: 100 requests per day</li>
                  <li>Pro: 1,000 requests per day</li>
                  <li>Enterprise: Custom limits</li>
                </ul>

                <h3>Available Endpoints</h3>
                <p>Our API includes endpoints for:</p>
                <ul>
                  <li>Managing meetings (create, update, delete)</li>
                  <li>Retrieving transcripts and summaries</li>
                  <li>Working with action items</li>
                  <li>Searching meeting content</li>
                  <li>User management</li>
                </ul>

                <h3>Webhooks</h3>
                <p>Dionysus supports webhooks for real-time notifications about events such as:</p>
                <ul>
                  <li>Meeting started</li>
                  <li>Meeting ended</li>
                  <li>Transcript available</li>
                  <li>Summary generated</li>
                  <li>Action item created or completed</li>
                </ul>

                <h3>SDK & Code Examples</h3>
                <p>We provide SDKs for popular programming languages:</p>
                <ul>
                  <li>JavaScript/TypeScript</li>
                  <li>Python</li>
                  <li>Ruby</li>
                  <li>Java</li>
                  <li>Go</li>
                </ul>
                <p>
                  For detailed API documentation, code examples, and SDK downloads, please visit our
                  <Link
                    href="https://github.com/Saksham-Goel1107/Dionysus/wiki/api"
                    className="text-primary underline"
                  >
                    GitHub Wiki
                  </Link>
                  .
                </p>
              </div>
            </TabsContent>

            <TabsContent value="faq" className="space-y-6">
              <div className="prose dark:prose-invert max-w-none">
                <h2>Frequently Asked Questions</h2>

                <h3>General Questions</h3>

                <h4>What is Dionysus?</h4>
                <p>
                  Dionysus is an AI-powered meeting assistant that helps you get more value from
                  your meetings through real-time transcription, automatic summarization, action
                  item tracking, and AI-generated insights.
                </p>

                <h4>How does pricing work?</h4>
                <p>
                  Dionysus offers three pricing tiers: Free, Pro, and Enterprise. The Free tier
                  includes basic features with limits on usage. Pro offers unlimited meetings and
                  advanced features for individuals and small teams. Enterprise provides custom
                  solutions for larger organizations. Visit our{' '}
                  <Link href="/#pricing">pricing page</Link> for details.
                </p>

                <h4>Is my data secure?</h4>
                <p>
                  Yes. Dionysus uses industry-standard encryption for all data in transit and at
                  rest. We follow strict security practices and do not share your data with third
                  parties. For more information, see our <Link href="/privacy">Privacy Policy</Link>
                  .
                </p>

                <h3>Technical Questions</h3>

                <h4>Which browsers are supported?</h4>
                <p>
                  Dionysus works best on Chrome, Firefox, Edge, and Safari (latest versions). We
                  recommend using Chrome for the best experience.
                </p>

                <h4>Can I use Dionysus on mobile devices?</h4>
                <p>
                  Yes, Dionysus is responsive and works on modern mobile browsers. We also offer
                  mobile apps for iOS and Android for a better mobile experience.
                </p>

                <h4>How accurate is the transcription?</h4>
                <p>
                  Our transcription accuracy typically ranges from 85-95% depending on audio
                  quality, speakers' accents, and background noise. The system improves over time as
                  it learns from corrections.
                </p>

                <h4>Can I export my meeting data?</h4>
                <p>
                  Yes, you can export meeting transcripts, summaries, and action items in various
                  formats including PDF, Word, Markdown, and JSON.
                </p>

                <h3>Account Management</h3>

                <h4>How do I change my password?</h4>
                <p>
                  Go to your account settings and select "Security" to change your password. If
                  you've forgotten your password, use the "Forgot Password" link on the login page.
                </p>

                <h4>Can I transfer my subscription to another user?</h4>
                <p>
                  Individual subscriptions cannot be transferred. For team and enterprise plans,
                  contact our support team for assistance with user management.
                </p>

                <h4>How do I cancel my subscription?</h4>
                <p>
                  You can cancel your subscription from your account settings under "Billing". When
                  you cancel, your plan benefits will continue until the end of the current billing
                  period.
                </p>

                <h4>Still have questions?</h4>
                <p>
                  If you couldn't find an answer to your question, please contact our support team
                  at
                  <a href="mailto:sakshamgoel1107@gmail.com" className="text-primary underline">
                    sakshamgoel1107@gmail.com
                  </a>{' '}
                  or use the chat button in the bottom right corner of any page.
                </p>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}
