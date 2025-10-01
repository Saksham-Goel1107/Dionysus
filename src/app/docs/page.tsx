'use client';

import {
  BookOpen,
  ChevronRight,
  Clock,
  Code,
  FileText,
  HelpCircle,
  MessageSquare,
  Search,
  Video,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Navbar } from '../components/navbar';

export default function DocsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSection, setActiveSection] = useState('getting-started');
  const [searchResults, setSearchResults] = useState<any[]>([]);

  const sections = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      description: 'Master the fundamentals and unlock Dionysus\'s full potential',
      icon: BookOpen,
      content: 'Onboarding Journey, Account Configuration, Team Setup, Integration Guide, Best Practices',
    },
    {
      id: 'meetings',
      title: 'Meetings',
      description: 'Transform your meetings with intelligent scheduling and management',
      icon: Video,
      content: 'Smart Scheduling, Virtual Rooms, Participant Management, Recording Controls, Post-Meeting Analytics',
    },
    {
      id: 'ai-features',
      title: 'AI Features',
      description: 'Harness cutting-edge AI to revolutionize your meeting experience',
      icon: MessageSquare,
      content: 'Neural Transcription, Contextual Summaries, Sentiment Intelligence, Action Extraction, Predictive Insights',
    },
    {
      id: 'faq',
      title: 'FAQ',
      description: 'Frequently asked questions and troubleshooting',
      icon: FileText,
      content: 'Common Issues, Billing, Support, Privacy, Security',
    },
  ];

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim() === '') {
      setSearchResults([]);
      return;
    }
    const filtered = sections.filter(
      (section) =>
        section.title.toLowerCase().includes(query.toLowerCase()) ||
        section.description.toLowerCase().includes(query.toLowerCase()) ||
        section.content.toLowerCase().includes(query.toLowerCase()),
    );
    setSearchResults(filtered);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 duration-1000 animate-in fade-in dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <Navbar />
      <div className="container max-w-7xl pb-12 pt-8 md:py-16">
        {/* Hero Section */}
        <div className="mb-12 text-center delay-200 duration-1000 animate-in slide-in-from-bottom-4">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 shadow-lg delay-300 duration-1000 animate-in zoom-in-50">
            <BookOpen className="h-8 w-8 text-white" />
          </div>
          <h1 className="delay-400 mb-4 bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-4xl font-bold text-transparent duration-1000 animate-in slide-in-from-bottom-4 dark:from-slate-100 dark:to-slate-400 md:text-5xl">
            Documentation
          </h1>
          <p className="mx-auto mb-8 max-w-2xl text-lg text-slate-600 delay-500 duration-1000 animate-in slide-in-from-bottom-4 dark:text-slate-400">
            Everything you need to know about using Dionysus - your AI-powered meeting assistant
          </p>

          {/* Search Bar */}
            <div className="delay-600 mx-auto mb-8 max-w-md duration-1000 animate-in slide-in-from-bottom-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
              type="search"
              placeholder="Search documentation..."
              className="pl-10 pr-10 transition-all duration-300 focus:border-transparent focus:ring-2 focus:ring-blue-500"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              aria-label="Search documentation"
              />
              {searchQuery && (
              <button
                onClick={() => handleSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
              )}
            </div>
            </div>

          {/* Quick Actions */}
          <div className="delay-700 mb-8 flex flex-wrap justify-center gap-4 duration-1000 animate-in slide-in-from-bottom-4">
            <Button asChild size="lg" className="transition-transform hover:scale-105">
              <Link href="/sign-up">
          <BookOpen className="mr-2 h-4 w-4" />
          Get Started
              </Link>
            </Button>
            <Button variant="outline" asChild size="lg" className="transition-transform hover:scale-105">
              <Link href="/support">
          <HelpCircle className="mr-2 h-4 w-4" />
          Get Help
              </Link>
            </Button>
          </div>

          {/* Quick Stats */}
          <div className="flex flex-wrap justify-center gap-6 text-sm text-slate-500 delay-800 duration-1000 animate-in slide-in-from-bottom-4 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>Last updated: 01-10-2025 (Wednesday) </span>
            </div>
            <div className="flex items-center gap-2">
              <HelpCircle className="h-4 w-4" />
              <span>
          Need help?{' '}
          <Link href="/support" className="text-blue-600 transition-colors hover:underline">
            Contact Support
          </Link>
              </span>
            </div>
          </div>
        </div>

        <Separator className="delay-800 mb-8 duration-1000 animate-in slide-in-from-bottom-4" />

        {/* Breadcrumb */}
        <nav className="delay-900 mb-6 flex items-center space-x-2 text-sm text-slate-600 duration-1000 animate-in slide-in-from-left-4 dark:text-slate-400">
          <Link
            href="/"
            className="transition-colors hover:text-slate-900 dark:hover:text-slate-100"
          >
            Home
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-slate-900 dark:text-slate-100">Documentation</span>
        </nav>
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
          {/* Table of Contents - Desktop Sidebar */}
          <div className="hidden lg:block">
            <div className="sticky top-24 space-y-4">
              <div className="rounded-lg border border-slate-200 bg-white/50 p-4 backdrop-blur-sm dark:border-slate-700 dark:bg-slate-800/50">
                <h3 className="mb-3 font-semibold text-slate-900 dark:text-slate-100">
                  Table of Contents
                </h3>
                <nav className="space-y-2">
                  {sections.map(({ id, title, icon: Icon }) => (
                    <button
                      key={id}
                      onClick={() => {
                        setActiveSection(id);
                        setSearchResults([]);
                        setSearchQuery('');
                      }}
                      className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-slate-100 dark:hover:bg-slate-700 ${
                        activeSection === id
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {title}
                    </button>
                  ))}
                </nav>
              </div>

              {/* Quick Actions */}
              <div className="rounded-lg border border-slate-200 bg-white/50 p-4 backdrop-blur-sm dark:border-slate-700 dark:bg-slate-800/50">
                <h3 className="mb-3 font-semibold text-slate-900 dark:text-slate-100">
                  Quick Actions
                </h3>
                <div className="space-y-2">
                  <Button variant="outline" size="sm" asChild className="w-full justify-start">
                    <Link href="/sign-up">
                      <BookOpen className="mr-2 h-4 w-4" />
                      Get Started
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" asChild className="w-full justify-start">
                    <Link href="/support">
                      <HelpCircle className="mr-2 h-4 w-4" />
                      Get Help
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" asChild className="w-full justify-start">
                    <a href="mailto:sakshamgoel1107@gmail.com">
                      <MessageSquare className="mr-2 h-4 w-4" />
                      Contact Support
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {searchResults.length > 0 ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                    Search Results for {searchQuery}
                  </h2>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchQuery('');
                      setSearchResults([]);
                    }}
                  >
                    Clear Search
                  </Button>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  {searchResults.map((section) => {
                    const Icon = section.icon;
                    return (
                      <Card
                        key={section.id}
                        className="group cursor-pointer border-0 bg-gradient-to-br from-blue-50 to-indigo-50 transition-all duration-300 hover:shadow-lg dark:from-blue-950/50 dark:to-indigo-950/50"
                        onClick={() => {
                          setActiveSection(section.id);
                          setSearchResults([]);
                          setSearchQuery('');
                        }}
                      >
                        <CardHeader>
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/50">
                              <Icon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                              <CardTitle className="text-lg">{section.title}</CardTitle>
                            </div>
                          </div>
                          <CardDescription>{section.description}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            {section.content}
                          </p>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            ) : (
              <Tabs
                defaultValue="getting-started"
                value={activeSection}
                onValueChange={setActiveSection}
                className="space-y-8"
              >
                <div className="sticky top-16 z-10 -mx-4 border-b border-slate-200 bg-white/80 px-4 py-4 backdrop-blur-md supports-[backdrop-filter]:bg-white/60 dark:border-slate-700 dark:bg-slate-900/80 dark:supports-[backdrop-filter]:bg-slate-900/60 lg:hidden">
                  <TabsList className="flex h-auto flex-wrap gap-2 rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
                    <TabsTrigger
                      value="getting-started"
                      className="flex items-center gap-2 px-4 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-slate-700"
                    >
                      <BookOpen className="h-4 w-4" />
                      <span className="hidden sm:inline">Getting Started</span>
                      <span className="sm:hidden">Start</span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="meetings"
                      className="flex items-center gap-2 px-4 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-slate-700"
                    >
                      <Video className="h-4 w-4" />
                      <span className="hidden sm:inline">Meetings</span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="ai-features"
                      className="flex items-center gap-2 px-4 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-slate-700"
                    >
                      <MessageSquare className="h-4 w-4" />
                      <span className="hidden sm:inline">AI Features</span>
                      <span className="sm:hidden">AI</span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="faq"
                      className="flex items-center gap-2 px-4 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-slate-700"
                    >
                      <FileText className="h-4 w-4" />
                      FAQ
                    </TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="getting-started" className="space-y-8">
                  {/* Overview Cards */}
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    <Card className="group border-0 bg-gradient-to-br from-blue-50 to-indigo-50 transition-all duration-300 hover:shadow-lg dark:from-blue-950/50 dark:to-indigo-950/50">
                      <CardHeader className="pb-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/50">
                            <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div>
                            <CardTitle className="text-lg">Quick Start Guide</CardTitle>
                          </div>
                        </div>
                        <CardDescription className="text-sm">
                          Set up your account and start using Dionysus in minutes
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <ol className="space-y-2 text-sm">
                          <li className="flex items-start gap-2">
                            <Badge
                              variant="secondary"
                              className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full p-0 text-xs"
                            >
                              1
                            </Badge>
                            <span>Sign up for a new account</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <Badge
                              variant="secondary"
                              className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full p-0 text-xs"
                            >
                              2
                            </Badge>
                            <span>Complete your profile setup</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <Badge
                              variant="secondary"
                              className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full p-0 text-xs"
                            >
                              3
                            </Badge>
                            <span>Create your first meeting</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <Badge
                              variant="secondary"
                              className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full p-0 text-xs"
                            >
                              4
                            </Badge>
                            <span>Enable microphone access</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <Badge
                              variant="secondary"
                              className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full p-0 text-xs"
                            >
                              5
                            </Badge>
                            <span>Start leveraging AI insights</span>
                          </li>
                        </ol>
                      </CardContent>
                      <CardFooter className="pt-4">
                        <Button
                          asChild
                          className="w-full transition-transform group-hover:scale-105"
                        >
                          <Link href="/sign-up">Create Account</Link>
                        </Button>
                      </CardFooter>
                    </Card>

                    <Card className="group border-0 bg-gradient-to-br from-green-50 to-emerald-50 transition-all duration-300 hover:shadow-lg dark:from-green-950/50 dark:to-emerald-950/50">
                      <CardHeader className="pb-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/50">
                            <Code className="h-5 w-5 text-green-600 dark:text-green-400" />
                          </div>
                          <div>
                            <CardTitle className="text-lg">System Requirements</CardTitle>
                          </div>
                        </div>
                        <CardDescription className="text-sm">
                          What you need to use Dionysus effectively
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3 pt-0">
                        <div className="flex items-start gap-3">
                          <div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-green-500"></div>
                          <div>
                            <p className="text-sm font-medium">Browsers</p>
                            <p className="text-xs text-slate-600 dark:text-slate-400">
                              Chrome 80+, Firefox 78+, Edge 80+, Safari 14+
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-green-500"></div>
                          <div>
                            <p className="text-sm font-medium">Internet</p>
                            <p className="text-xs text-slate-600 dark:text-slate-400">
                              5 Mbps upload/download minimum
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-green-500"></div>
                          <div>
                            <p className="text-sm font-medium">Hardware</p>
                            <p className="text-xs text-slate-600 dark:text-slate-400">
                              Microphone required for voice features
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-green-500"></div>
                          <div>
                            <p className="text-sm font-medium">Permissions</p>
                            <p className="text-xs text-slate-600 dark:text-slate-400">
                              Browser access to microphone
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="group border-0 bg-gradient-to-br from-purple-50 to-pink-50 transition-all duration-300 hover:shadow-lg dark:from-purple-950/50 dark:to-pink-950/50">
                      <CardHeader className="pb-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/50">
                            <FileText className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                          </div>
                          <div>
                            <CardTitle className="text-lg">Account Types</CardTitle>
                          </div>
                        </div>
                        <CardDescription className="text-sm">
                          Choose the right plan for your needs
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3 pt-0">
                        <div className="flex items-center justify-between rounded-lg bg-white/50 p-3 dark:bg-slate-800/50">
                          <div>
                            <p className="text-sm font-medium">Free</p>
                            <p className="text-xs text-slate-600 dark:text-slate-400">
                              Basic features, limited meetings
                            </p>
                          </div>
                          <Badge variant="outline">Free</Badge>
                        </div>
                        <div className="flex items-center justify-between rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 p-3 dark:from-blue-950/30 dark:to-indigo-950/30">
                          <div>
                            <p className="text-sm font-medium">Pro</p>
                            <p className="text-xs text-slate-600 dark:text-slate-400">
                              Unlimited meetings, extended recordings
                            </p>
                          </div>
                          <Badge className="bg-blue-600">Popular</Badge>
                        </div>
                        <div className="flex items-center justify-between rounded-lg bg-gradient-to-r from-purple-50 to-pink-50 p-3 dark:from-purple-950/30 dark:to-pink-950/30">
                          <div>
                            <p className="text-sm font-medium">Enterprise</p>
                            <p className="text-xs text-slate-600 dark:text-slate-400">
                              Custom solutions for teams
                            </p>
                          </div>
                          <Badge variant="secondary">Custom</Badge>
                        </div>
                      </CardContent>
                      <CardFooter className="pt-4">
                        <Button
                          variant="outline"
                          asChild
                          className="w-full transition-transform group-hover:scale-105"
                        >
                          <Link href="/pricing">View Pricing</Link>
                        </Button>
                      </CardFooter>
                    </Card>
                  </div>

                  <div className="prose dark:prose-invert max-w-none">
                    <h2>Welcome to Dionysus: Your AI Meeting Intelligence Platform</h2>
                    <p>
                      Dionysus represents the next evolution in meeting productivity, combining advanced artificial intelligence with intuitive design to transform how teams communicate, collaborate, and achieve their goals. Whether you&apos;re leading strategic initiatives, conducting client presentations, or facilitating team brainstorming sessions, Dionysus ensures no insight is lost and every voice is heard.
                    </p>

                    <h3>Your Onboarding Journey: From Setup to Mastery</h3>
                    <p>
                      Getting started with Dionysus is designed to be seamless and rewarding. Our intelligent onboarding system adapts to your role and experience level, providing personalized guidance that evolves as you become more proficient with the platform. From your first login to advanced feature utilization, we ensure you&apos;re equipped with the knowledge and tools to maximize meeting effectiveness.
                    </p>

                    <h3>Account Configuration: Tailoring Dionysus to Your Workflow</h3>
                    <p>
                      Beyond basic profile setup, Dionysus offers sophisticated configuration options that adapt the platform to your unique communication style and organizational needs. Set up custom notification preferences, define meeting templates for recurring sessions, configure integration endpoints, and establish team hierarchies that reflect your organizational structure. Our smart defaults get you started quickly, while granular controls allow for deep customization as your usage grows.
                    </p>

                    <h3>Team Setup and Collaboration Frameworks</h3>
                    <p>
                      Dionysus excels in team environments, providing robust tools for collaborative meeting management. Create dedicated team spaces with shared templates, establish approval workflows for meeting scheduling, set up cross-functional notification channels, and implement governance policies that ensure consistent meeting standards across your organization. Whether you&apos;re a small startup or a global enterprise, Dionysus scales to meet your collaboration requirements.
                    </p>

                    <h3>Integration Ecosystem: Connecting Your Digital Workspace</h3>
                    <p>
                      Dionysus seamlessly integrates with your existing productivity ecosystem, creating a unified workflow that eliminates tool switching and data silos. Connect with calendar systems for automatic meeting scheduling, link to project management platforms for context-aware meetings, integrate with communication tools for enhanced collaboration, and sync with CRM systems for customer-centric discussions. Our extensive API and webhook system ensures Dionysus becomes an invisible yet indispensable part of your daily workflow.
                    </p>

                    <h3>Best Practices and Optimization Strategies</h3>
                    <p>
                      Maximize the value you derive from Dionysus by following proven strategies developed through extensive user research and AI-driven insights. Learn to craft effective meeting agendas that leverage AI capabilities, master the art of facilitating AI-assisted discussions, develop skills in interpreting AI-generated insights, and establish feedback loops that continuously improve your meeting culture. Our platform learns from your usage patterns, providing increasingly relevant suggestions and optimizations over time.
                    </p>
                  </div>
                </TabsContent>

                <TabsContent value="meetings" className="space-y-6">
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    <Card>
                      <CardHeader>
                        <CardTitle>Smart Scheduling</CardTitle>
                        <CardDescription>AI-optimized meeting planning and coordination</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p>
                          Experience intelligent scheduling that considers participant preferences, optimal timing, and historical meeting success rates to maximize productivity.
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
                        <CardTitle>Virtual Rooms</CardTitle>
                        <CardDescription>
                          Immersive collaboration environments with spatial audio
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p>
                          Advanced virtual spaces that adapt to meeting needs, featuring intelligent layouts, breakout management, and enhanced engagement tools.
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
                        <CardTitle>Post-Meeting Analytics</CardTitle>
                        <CardDescription>
                          Deep insights and actionable intelligence from every meeting
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p>
                          Comprehensive analytics that transform meeting data into strategic insights, trend analysis, and predictive recommendations.
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
                    <h2>Intelligent Meeting Management: Beyond Traditional Conferencing</h2>
                    <p>
                      Dionysus redefines meeting management by infusing intelligence into every aspect of the meeting lifecycle. From initial scheduling through post-meeting analysis, our platform ensures that every meeting delivers maximum value while minimizing time waste. Experience meetings that are not just productive, but truly transformative for your team&apos;s collaboration and decision-making processes.
                    </p>

                    <h3>Smart Scheduling: AI-Powered Meeting Optimization</h3>
                    <p>
                      Our intelligent scheduling system goes beyond simple calendar management, analyzing participant availability, meeting history, optimal timing preferences, and even external factors like time zones and energy levels. The system suggests ideal meeting durations based on agenda complexity, recommends the best participants for specific topics, and automatically adjusts schedules when conflicts arise. With predictive analytics, Dionysus can forecast meeting outcomes and suggest agenda modifications for better results.
                    </p>

                    <h3>Virtual Rooms: Immersive Collaboration Environments</h3>
                    <p>
                      Dionysus virtual rooms are designed for maximum engagement and productivity. Advanced spatial audio ensures natural conversation flow, while AI-driven layout optimization adapts the interface based on meeting type and participant roles. Breakout room management becomes intelligent, with automatic participant grouping based on discussion topics and relationship analysis. Screen sharing is enhanced with AI-powered content recognition, automatically highlighting important elements and suggesting relevant discussion points.
                    </p>

                    <h3>Participant Management: Inclusive and Efficient</h3>
                    <p>
                      Managing meeting participants has never been more sophisticated. Dionysus automatically detects participant engagement levels, suggests interventions for disengaged attendees, and facilitates smooth handoff protocols. Guest management includes instant verification systems, while role-based permissions ensure appropriate access levels. Our AI monitors participation patterns, providing organizers with real-time insights about team dynamics and suggesting facilitation strategies to maximize contribution from all attendees.
                    </p>

                    <h3>Recording Controls: Comprehensive Documentation</h3>
                    <p>
                      Recording capabilities extend far beyond simple video capture. Multi-track recording captures audio, video, screen sharing, and participant reactions simultaneously. AI-powered editing suggests highlight reels, automatically identifies key moments, and creates shareable clips. Privacy controls allow participants to opt-out of recordings, while intelligent redaction protects sensitive information. Post-processing includes automatic chapter generation, searchable transcripts, and export options for various platforms and compliance requirements.
                    </p>

                    <h3>Post-Meeting Analytics: Turning Conversations into Action</h3>
                    <p>
                      The real power of Dionysus emerges after meetings conclude. Advanced analytics provide deep insights into meeting effectiveness, participant engagement, decision quality, and action item completion rates. Trend analysis across multiple meetings reveals patterns in team performance, while predictive modeling suggests improvements for future sessions. Integration with project management tools ensures action items are automatically tracked and followed up, creating a seamless workflow from discussion to execution.
                    </p>

                    <h3>Meeting Templates and Workflows</h3>
                    <p>
                      Streamline recurring meetings with intelligent templates that adapt based on historical performance. One-on-one check-ins, sprint planning sessions, client presentations, and strategic reviews each have optimized workflows. Templates include agenda frameworks, participant roles, timing guidelines, and success metrics. The system learns from each meeting type, continuously refining templates to maximize effectiveness and reduce preparation time.
                    </p>
                  </div>
                </TabsContent>

                <TabsContent value="ai-features" className="space-y-6">
                  <div className="prose dark:prose-invert max-w-none">
                    <h2>Neural Intelligence: Advanced AI Capabilities for Meeting Excellence</h2>
                    <p>
                      Dionysus harnesses the latest advances in artificial intelligence to transform meetings from simple conversations into strategic assets. Our multi-layered AI system combines natural language processing, machine learning, and predictive analytics to provide unprecedented insights, automation, and intelligence throughout the meeting lifecycle. Experience the future of collaborative intelligence with features that understand context, anticipate needs, and drive meaningful outcomes.
                    </p>

                    <h3>Neural Transcription: Perfect Capture with Contextual Understanding</h3>
                    <p>
                      Our advanced neural transcription engine goes beyond simple speech-to-text conversion, employing deep learning models trained on millions of hours of meeting data. The system not only achieves industry-leading accuracy rates but also understands meeting context, speaker relationships, and domain-specific terminology. Automatic speaker diarization works seamlessly across languages and accents, while real-time formatting creates professional transcripts with proper punctuation, capitalization, and structure.
                    </p>

                    <h3>Contextual Summaries: Intelligent Meeting Distillation</h3>
                    <p>
                      Dionysus generates summaries that capture not just what was said, but what matters most. Our AI analyzes conversation flow, identifies key themes and subtopics, recognizes decision points, and extracts critical information with human-like understanding. Multi-format summaries adapt to different audiences and purposes – executive overviews for leadership, detailed technical summaries for specialists, and action-oriented recaps for team members. The system continuously learns from user feedback to improve summary quality and relevance.
                    </p>

                    <h3>Sentiment Intelligence: Emotional Context and Engagement Analysis</h3>
                    <p>
                      Understanding the emotional dynamics of meetings is crucial for effective communication. Dionysus employs sophisticated sentiment analysis that goes beyond simple positive/negative classification, detecting nuanced emotions, engagement levels, and interpersonal dynamics. Real-time sentiment tracking helps facilitators gauge meeting energy, while post-meeting analysis reveals participation patterns and potential concerns. This emotional intelligence enables more empathetic leadership and better team cohesion.
                    </p>

                    <h3>Action Extraction: Automated Follow-up and Accountability</h3>
                    <p>
                      Never lose track of commitments again. Our AI automatically identifies action items, assigns ownership based on context and role analysis, and sets intelligent deadlines. The system understands implicit commitments, recognizes conditional actions, and creates comprehensive task lists with dependencies and priorities. Integration with project management tools ensures seamless workflow continuation, while smart reminders and progress tracking maintain accountability throughout execution.
                    </p>

                    <h3>Predictive Insights: Anticipating Meeting Needs and Outcomes</h3>
                    <p>
                      Dionysus doesn&apos;t just react to meetings – it anticipates them. Predictive analytics suggest agenda optimizations, identify potential discussion bottlenecks, and recommend facilitation strategies. The system learns from historical meeting data to predict outcomes, suggest optimal participant combinations, and identify topics that may require additional preparation. Risk assessment features flag potential conflicts or misunderstandings before they occur, enabling proactive meeting management.
                    </p>

                    <h3>Conversational AI Assistant: Your Intelligent Meeting Companion</h3>
                    <p>
                      Interact naturally with your meeting data through our advanced conversational AI. Ask complex questions about meeting content, request specific information extraction, or seek recommendations based on historical patterns. The assistant understands context, remembers previous interactions, and can cross-reference information across multiple meetings. Whether you need a quick fact check during a meeting or comprehensive analysis afterward, the AI assistant provides instant, accurate responses with full traceability to source material.
                    </p>

                    <h3>Continuous Learning and Personalization</h3>
                    <p>
                      Every interaction with Dionysus contributes to a personalized AI experience. The system learns your preferences, communication style, and decision-making patterns to provide increasingly relevant insights and suggestions. Team-wide learning creates organizational intelligence, while privacy-preserving techniques ensure individual data remains secure. As your usage grows, Dionysus becomes not just a tool, but an intelligent partner that understands your unique meeting dynamics and organizational culture.
                    </p>
                  </div>
                </TabsContent>

                <TabsContent value="faq" className="space-y-6">
                  <div className="max-w-4xl">
                    <div className="mb-8 text-center">
                      <h2 className="mb-4 text-3xl font-bold text-slate-900 dark:text-slate-100">
                        Frequently Asked Questions
                      </h2>
                      <p className="text-lg text-slate-600 dark:text-slate-400">
                        Find answers to common questions about Dionysus
                      </p>
                    </div>

                    <Accordion type="single" collapsible className="space-y-4">
                      <AccordionItem
                        value="general"
                        className="rounded-lg border border-slate-200 px-6 dark:border-slate-700"
                      >
                        <AccordionTrigger className="py-6 text-left hover:no-underline">
                          <div className="flex items-center gap-3">
                            <HelpCircle className="h-5 w-5 text-blue-600" />
                            <span className="text-lg font-semibold">General Questions</span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="pb-6">
                          <div className="space-y-6">
                            <div>
                              <h4 className="mb-2 font-semibold text-slate-900 dark:text-slate-100">
                                What is Dionysus?
                              </h4>
                              <p className="text-slate-600 dark:text-slate-400">
                                Dionysus is an AI-powered meeting assistant that helps you get more
                                value from your meetings through real-time transcription, automatic
                                summarization, action item tracking, and AI-generated insights.
                              </p>
                            </div>

                            <div>
                              <h4 className="mb-2 font-semibold text-slate-900 dark:text-slate-100">
                                How does pricing work?
                              </h4>
                              <p className="text-slate-600 dark:text-slate-400">
                                Dionysus offers three pricing tiers: Free, Pro, and Enterprise. The
                                Free tier includes basic features with limits on usage. Pro offers
                                unlimited meetings and advanced features for individuals and small
                                teams. Enterprise provides custom solutions for larger
                                organizations. Visit our{' '}
                                <Link href="/#pricing" className="text-blue-600 hover:underline">
                                  pricing page
                                </Link>{' '}
                                for details.
                              </p>
                            </div>

                            <div>
                              <h4 className="mb-2 font-semibold text-slate-900 dark:text-slate-100">
                                Is my data secure?
                              </h4>
                              <p className="text-slate-600 dark:text-slate-400">
                                Yes. Dionysus uses industry-standard encryption for all data in
                                transit and at rest. We follow strict security practices and do not
                                share your data with third parties. For more information, see our{' '}
                                <Link href="/privacy" className="text-blue-600 hover:underline">
                                  Privacy Policy
                                </Link>
                                .
                              </p>
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem
                        value="technical"
                        className="rounded-lg border border-slate-200 px-6 dark:border-slate-700"
                      >
                        <AccordionTrigger className="py-6 text-left hover:no-underline">
                          <div className="flex items-center gap-3">
                            <Code className="h-5 w-5 text-green-600" />
                            <span className="text-lg font-semibold">Technical Questions</span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="pb-6">
                          <div className="space-y-6">
                            <div>
                              <h4 className="mb-2 font-semibold text-slate-900 dark:text-slate-100">
                                Which browsers are supported?
                              </h4>
                              <p className="text-slate-600 dark:text-slate-400">
                                Dionysus works best on Chrome, Firefox, Edge, and Safari (latest
                                versions). We recommend using Chrome for the best experience.
                              </p>
                            </div>

                            <div>
                              <h4 className="mb-2 font-semibold text-slate-900 dark:text-slate-100">
                                Can I use Dionysus on mobile devices?
                              </h4>
                              <p className="text-slate-600 dark:text-slate-400">
                                Yes, Dionysus is responsive and works on modern mobile browsers. We
                                also offer mobile apps for iOS and Android for a better mobile
                                experience.
                              </p>
                            </div>

                            <div>
                              <h4 className="mb-2 font-semibold text-slate-900 dark:text-slate-100">
                                How accurate is the transcription?
                              </h4>
                              <p className="text-slate-600 dark:text-slate-400">
                                Our transcription accuracy typically ranges from 85-95% depending on
                                audio quality, speaker&apos;s accents, and background noise. The
                                system improves over time as it learns from corrections.
                              </p>
                            </div>

                            <div>
                              <h4 className="mb-2 font-semibold text-slate-900 dark:text-slate-100">
                                Can I export my meeting data?
                              </h4>
                              <p className="text-slate-600 dark:text-slate-400">
                                Yes, you can export meeting transcripts, summaries, and action items
                                in various formats including PDF, Word, Markdown, and JSON.
                              </p>
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem
                        value="account"
                        className="rounded-lg border border-slate-200 px-6 dark:border-slate-700"
                      >
                        <AccordionTrigger className="py-6 text-left hover:no-underline">
                          <div className="flex items-center gap-3">
                            <FileText className="h-5 w-5 text-purple-600" />
                            <span className="text-lg font-semibold">Account Management</span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="pb-6">
                          <div className="space-y-6">
                            <div>
                              <h4 className="mb-2 font-semibold text-slate-900 dark:text-slate-100">
                                How do I change my password?
                              </h4>
                              <p className="text-slate-600 dark:text-slate-400">
                                Go to your account settings and select &quot;Security&quot; to
                                change your password. If you&apos;ve forgotten your password, use
                                the &quot;Forgot Password&quot; link on the login page.
                              </p>
                            </div>

                            <div>
                              <h4 className="mb-2 font-semibold text-slate-900 dark:text-slate-100">
                                Can I transfer my subscription to another user?
                              </h4>
                              <p className="text-slate-600 dark:text-slate-400">
                                Individual subscriptions cannot be transferred. For team and
                                enterprise plans, contact our support team for assistance with user
                                management.
                              </p>
                            </div>

                            <div>
                              <h4 className="mb-2 font-semibold text-slate-900 dark:text-slate-100">
                                How do I cancel my subscription?
                              </h4>
                              <p className="text-slate-600 dark:text-slate-400">
                                You can cancel your subscription from your account settings under
                                &quot;Billing&quot;. When you cancel, your plan benefits will
                                continue until the end of the current billing period.
                              </p>
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>

                    <div className="mt-12 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 p-8 text-center dark:from-blue-950/30 dark:to-indigo-950/30">
                      <HelpCircle className="mx-auto mb-4 h-12 w-12 text-blue-600" />
                      <h3 className="mb-2 text-xl font-semibold text-slate-900 dark:text-slate-100">
                        Still have questions?
                      </h3>
                      <p className="mb-6 text-slate-600 dark:text-slate-400">
                        If you couldn&apos;t find an answer to your question, our support team is
                        here to help.
                      </p>
                      <div className="flex flex-col justify-center gap-4 sm:flex-row">
                        <Button asChild>
                          <a href="mailto:sakshamgoel1107@gmail.com">
                            <MessageSquare className="mr-2 h-4 w-4" />
                            Email Support
                          </a>
                        </Button>
                        <Button variant="outline" asChild>
                          <Link href="/support">
                            <HelpCircle className="mr-2 h-4 w-4" />
                            Visit Support Center
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
