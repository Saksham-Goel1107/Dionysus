'use client';

import {
  BookOpen,
  ChevronRight,
  Clock,
  Database,
  HelpCircle,
  MessageSquare,
  Shield,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Navbar } from '../components/navbar';

export default function PrivacyPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSection, setActiveSection] = useState('overview');
  const [searchResults, setSearchResults] = useState<any[]>([]);

  const sections = [
    {
      id: 'overview',
      title: 'Overview',
      description: 'How we protect your privacy and data',
      icon: Shield,
      content: 'Privacy principles, data collection, processing, security',
    },
    {
      id: 'data',
      title: 'Data Collection',
      description: 'What information we collect and why',
      icon: Database,
      content: 'Personal data, meeting content, usage analytics, technical information',
    },
    {
      id: 'rights',
      title: 'Your Rights',
      description: 'Control over your personal information',
      icon: Users,
      content: 'Access, correction, deletion, portability, objection rights',
    },
    {
      id: 'security',
      title: 'Security',
      description: 'How we protect your information',
      icon: BookOpen,
      content: 'Encryption, access controls, monitoring, compliance',
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
            <Shield className="h-8 w-8 text-white" />
          </div>
          <h1 className="delay-400 mb-4 bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-4xl font-bold text-transparent duration-1000 animate-in slide-in-from-bottom-4 dark:from-slate-100 dark:to-slate-400 md:text-5xl">
            Privacy Policy
          </h1>
          <p className="mx-auto mb-8 max-w-2xl text-lg text-slate-600 delay-500 duration-1000 animate-in slide-in-from-bottom-4 dark:text-slate-400">
            Your privacy is our priority. Learn how we protect and handle your information with transparency and care.
          </p>

          {/* Search Bar */}
          <div className="delay-600 mx-auto mb-8 max-w-md duration-1000 animate-in slide-in-from-bottom-4">
            <div className="relative">
              <Shield className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                type="search"
                placeholder="Search privacy topics..."
                className="pl-10 pr-10 transition-all duration-300 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                aria-label="Search privacy policy"
              />
              {searchQuery && (
                <button
                  onClick={() => handleSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  aria-label="Clear search"
                >
                </button>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="delay-700 mb-8 flex flex-wrap justify-center gap-4 duration-1000 animate-in slide-in-from-bottom-4">
            <Button asChild size="lg" className="transition-transform hover:scale-105">
              <Link href="/terms">
                <BookOpen className="mr-2 h-4 w-4" />
                Terms of Service
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
              <span>Last updated: January 1, 2025</span>
            </div>
            <div className="flex items-center gap-2">
              <HelpCircle className="h-4 w-4" />
              <span>
                Questions?{' '}
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
          <span className="text-slate-900 dark:text-slate-100">Privacy Policy</span>
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
                  Related Links
                </h3>
                <div className="space-y-2">
                  <Button variant="outline" size="sm" asChild className="w-full justify-start">
                    <Link href="/terms">
                      <BookOpen className="mr-2 h-4 w-4" />
                      Terms of Service
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
                    Search Results for &quot;{searchQuery}&quot;
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
                defaultValue="overview"
                value={activeSection}
                onValueChange={setActiveSection}
                className="space-y-8"
              >
                <div className="sticky top-16 z-10 -mx-4 border-b border-slate-200 bg-white/80 px-4 py-4 backdrop-blur-md supports-[backdrop-filter]:bg-white/60 dark:border-slate-700 dark:bg-slate-900/80 dark:supports-[backdrop-filter]:bg-slate-900/60 lg:hidden">
                  <TabsList className="flex h-auto flex-wrap gap-2 rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
                    <TabsTrigger
                      value="overview"
                      className="flex items-center gap-2 px-4 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-slate-700"
                    >
                      <Shield className="h-4 w-4" />
                      <span className="hidden sm:inline">Overview</span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="data"
                      className="flex items-center gap-2 px-4 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-slate-700"
                    >
                      <Database className="h-4 w-4" />
                      <span className="hidden sm:inline">Data</span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="rights"
                      className="flex items-center gap-2 px-4 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-slate-700"
                    >
                      <Users className="h-4 w-4" />
                      <span className="hidden sm:inline">Rights</span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="security"
                      className="flex items-center gap-2 px-4 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-slate-700"
                    >
                      <BookOpen className="h-4 w-4" />
                      Security
                    </TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="overview" className="space-y-8">
                  {/* Overview Cards */}
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    <Card className="group border-0 bg-gradient-to-br from-blue-50 to-indigo-50 transition-all duration-300 hover:shadow-lg dark:from-blue-950/50 dark:to-indigo-950/50">
                      <CardHeader className="pb-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/50">
                            <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div>
                            <CardTitle className="text-lg">Privacy First</CardTitle>
                          </div>
                        </div>
                        <CardDescription className="text-sm">
                          Your privacy is fundamental to everything we do
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          We collect only what&apos;s necessary, protect it with industry-leading security, and give you full control over your data.
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="group border-0 bg-gradient-to-br from-green-50 to-emerald-50 transition-all duration-300 hover:shadow-lg dark:from-green-950/50 dark:to-emerald-950/50">
                      <CardHeader className="pb-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/50">
                            <Database className="h-5 w-5 text-green-600 dark:text-green-400" />
                          </div>
                          <div>
                            <CardTitle className="text-lg">Transparent Data Use</CardTitle>
                          </div>
                        </div>
                        <CardDescription className="text-sm">
                          Clear information about what we collect and why
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          We&apos;re transparent about our data practices and never use your information for purposes you haven&apos;t agreed to.
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="group border-0 bg-gradient-to-br from-purple-50 to-pink-50 transition-all duration-300 hover:shadow-lg dark:from-purple-950/50 dark:to-pink-950/50">
                      <CardHeader className="pb-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/50">
                            <Users className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                          </div>
                          <div>
                            <CardTitle className="text-lg">Your Control</CardTitle>
                          </div>
                        </div>
                        <CardDescription className="text-sm">
                          Full control over your personal information and privacy settings
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          Access, correct, delete, or export your data anytime. Your privacy rights are always respected.
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="prose dark:prose-invert max-w-none">
                    <h2>Our Privacy Commitment</h2>
                    <p>
                      At Dionysus, privacy isn&apos;t an afterthought—it&apos;s built into everything we do. We believe you should have complete transparency and control over your personal information and meeting data.
                    </p>

                    <h3>What This Policy Covers</h3>
                    <p>
                      This Privacy Policy explains how Dionysus collects, uses, shares, and protects your information when you use our AI-powered meeting intelligence platform. It applies to all our services, including our web application, mobile apps, and any integrations.
                    </p>

                    <h3>Our Privacy Principles</h3>
                    <ul>
                      <li><strong>Minimal Collection:</strong> We only collect data that&apos;s necessary to provide and improve our services</li>
                      <li><strong>Purpose Limitation:</strong> We use your data only for the purposes you&apos;ve agreed to</li>
                      <li><strong>Transparency:</strong> We&apos;re clear about what we collect, how we use it, and who we share it with</li>
                      <li><strong>Security:</strong> We protect your data with industry-leading security measures</li>
                      <li><strong>Control:</strong> You have full control over your data and privacy settings</li>
                      <li><strong>Accountability:</strong> We&apos;re responsible for protecting your privacy and will be held accountable</li>
                    </ul>

                    <h3>Key Information</h3>
                    <p>
                      <strong>Data Controller:</strong> Dionysus is the data controller for the personal information we collect and process.
                    </p>
                    <p>
                      <strong>Legal Basis:</strong> We process your data based on your consent, our legitimate interests, and to fulfill our contractual obligations.
                    </p>
                    <p>
                      <strong>International Transfers:</strong> We may transfer your data internationally, always with appropriate safeguards in place.
                    </p>

                    <h3>Updates to This Policy</h3>
                    <p>
                      We may update this Privacy Policy from time to time to reflect changes in our practices or applicable laws. We&apos;ll notify you of any material changes and give you the opportunity to review the updated policy before it takes effect.
                    </p>
                  </div>
                </TabsContent>

                <TabsContent value="data" className="space-y-6">
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    <Card className="border-0 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Users className="h-5 w-5 text-blue-600" />
                          Account Information
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          Basic information like name, email, and organization details needed to create and manage your account.
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="border-0 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/50 dark:to-emerald-950/50">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <MessageSquare className="h-5 w-5 text-green-600" />
                          Meeting Content
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          Audio recordings, transcripts, and meeting metadata processed to provide AI-powered insights and summaries.
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="border-0 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/50 dark:to-pink-950/50">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Database className="h-5 w-5 text-purple-600" />
                          Usage Analytics
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          Anonymized usage patterns and performance metrics to improve our services and user experience.
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="prose dark:prose-invert max-w-none">
                    <h2>Information We Collect</h2>
                    <p>
                      We collect different types of information to provide you with the best possible experience while respecting your privacy. Here&apos;s what we collect and why:
                    </p>

                    <h3>Personal Information</h3>
                    <p>When you create an account or use our services, we collect:</p>
                    <ul>
                      <li><strong>Identity Information:</strong> Name, email address, profile picture</li>
                      <li><strong>Contact Information:</strong> Email address, phone number (optional)</li>
                      <li><strong>Organization Details:</strong> Company name, job title, team information</li>
                      <li><strong>Account Preferences:</strong> Language, timezone, notification settings</li>
                      <li><strong>Billing Information:</strong> Payment details, billing address (processed securely by our payment providers)</li>
                    </ul>

                    <h3>Meeting Data</h3>
                    <p>To provide our core AI-powered features, we process:</p>
                    <ul>
                      <li><strong>Audio Content:</strong> Meeting recordings (only when you choose to record)</li>
                      <li><strong>Transcripts:</strong> Real-time and processed transcriptions of your meetings</li>
                      <li><strong>Meeting Metadata:</strong> Date, time, duration, participant list, meeting titles</li>
                      <li><strong>Generated Content:</strong> AI summaries, action items, insights, and notes</li>
                      <li><strong>Participant Information:</strong> Names and roles of meeting attendees</li>
                    </ul>

                    <h3>Technical Information</h3>
                    <p>We automatically collect certain technical information to ensure service quality:</p>
                    <ul>
                      <li><strong>Device Information:</strong> Browser type, operating system, device model</li>
                      <li><strong>Usage Data:</strong> Features used, session duration, interaction patterns</li>
                      <li><strong>Performance Data:</strong> Load times, error rates, system performance metrics</li>
                      <li><strong>Network Information:</strong> IP address, connection quality, geographic location (country/region level)</li>
                    </ul>

                    <h3>How We Use Your Information</h3>
                    <p>We use the information we collect to:</p>
                    <ul>
                      <li>Provide and improve our AI-powered meeting intelligence services</li>
                      <li>Process and analyze meeting content to generate insights and summaries</li>
                      <li>Personalize your experience and provide relevant recommendations</li>
                      <li>Communicate with you about your account and our services</li>
                      <li>Ensure the security and integrity of our platform</li>
                      <li>Comply with legal obligations and resolve disputes</li>
                      <li>Develop new features and improve existing functionality</li>
                    </ul>

                    <h3>Data Retention</h3>
                    <p>We retain your information only as long as necessary:</p>
                    <ul>
                      <li><strong>Account Information:</strong> Until you delete your account</li>
                      <li><strong>Meeting Content:</strong> Based on your subscription plan (7-365 days)</li>
                      <li><strong>Usage Analytics:</strong> Up to 2 years in anonymized form</li>
                      <li><strong>Legal Requirements:</strong> As required by applicable laws</li>
                    </ul>
                  </div>
                </TabsContent>

                <TabsContent value="rights" className="space-y-6">
                  <div className="prose dark:prose-invert max-w-none">
                    <h2>Your Privacy Rights</h2>
                    <p>
                      You have comprehensive rights over your personal information. We&apos;re committed to making these rights easy to exercise and will respond to your requests promptly.
                    </p>

                    <h3>Right to Access</h3>
                    <p>
                      You can request a copy of all personal information we hold about you. This includes:
                    </p>
                    <ul>
                      <li>Account information and profile data</li>
                      <li>Meeting transcripts and generated content</li>
                      <li>Usage history and preferences</li>
                      <li>Information about how your data has been processed</li>
                    </ul>

                    <h3>Right to Correction</h3>
                    <p>
                      If any of your personal information is inaccurate or incomplete, you can:
                    </p>
                    <ul>
                      <li>Update your profile information directly in your account settings</li>
                      <li>Request corrections to meeting transcripts or generated content</li>
                      <li>Contact us to correct information you cannot change yourself</li>
                    </ul>

                    <h3>Right to Deletion</h3>
                    <p>
                      You can request deletion of your personal information when:
                    </p>
                    <ul>
                      <li>The information is no longer necessary for the original purpose</li>
                      <li>You withdraw consent and there&apos;s no other legal basis for processing</li>
                      <li>Your information has been unlawfully processed</li>
                      <li>You want to delete your account entirely</li>
                    </ul>

                    <h3>Right to Data Portability</h3>
                    <p>
                      You can export your data in a structured, commonly used format:
                    </p>
                    <ul>
                      <li>Meeting transcripts and summaries</li>
                      <li>Account information and preferences</li>
                      <li>Generated insights and action items</li>
                      <li>Usage history and analytics (where applicable)</li>
                    </ul>

                    <h3>Right to Object</h3>
                    <p>
                      You can object to certain types of data processing:
                    </p>
                    <ul>
                      <li>Marketing communications (opt-out anytime)</li>
                      <li>Analytics and performance monitoring (with service limitations)</li>
                      <li>Automated decision-making processes</li>
                    </ul>

                    <h3>Right to Restrict Processing</h3>
                    <p>
                      You can request that we limit how we process your information when:
                    </p>
                    <ul>
                      <li>You&apos;re disputing the accuracy of your personal information</li>
                      <li>Processing is unlawful but you don&apos;t want deletion</li>
                      <li>We no longer need the information but you need it for legal claims</li>
                    </ul>

                    <h3>How to Exercise Your Rights</h3>
                    <p>
                      To exercise any of these rights:
                    </p>
                    <ul>
                      <li>Use the privacy controls in your account settings</li>
                      <li>Contact our support team at sakshamgoel1107@gmail.com</li>
                      <li>Submit a request through our privacy portal</li>
                    </ul>
                    <p>
                      We&apos;ll respond to your request within 30 days and may ask for additional information to verify your identity.
                    </p>
                  </div>
                </TabsContent>

                <TabsContent value="security" className="space-y-6">
                  <div className="max-w-4xl">
                    <div className="mb-8">
                      <h2 className="mb-4 text-3xl font-bold text-slate-900 dark:text-slate-100">
                        Security & Protection
                      </h2>
                      <p className="text-lg text-slate-600 dark:text-slate-400">
                        How we protect your information with industry-leading security measures
                      </p>
                    </div>

                    <Accordion type="single" collapsible className="space-y-4">
                      <AccordionItem
                        value="encryption"
                        className="rounded-lg border border-slate-200 px-6 dark:border-slate-700"
                      >
                        <AccordionTrigger className="py-6 text-left hover:no-underline">
                          <div className="flex items-center gap-3">
                            <Shield className="h-5 w-5 text-blue-600" />
                            <span className="text-lg font-semibold">Encryption & Data Protection</span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="pb-6">
                          <div className="space-y-4">
                            <p className="text-slate-600 dark:text-slate-400">
                              All data is encrypted both in transit and at rest using industry-standard AES-256 encryption. We use TLS 1.3 for all communications and implement perfect forward secrecy to protect your information.
                            </p>
                            <ul className="list-disc pl-6 text-slate-600 dark:text-slate-400">
                              <li>End-to-end encryption for sensitive meeting content</li>
                              <li>Encrypted database storage with regular key rotation</li>
                              <li>Secure API communications with certificate pinning</li>
                              <li>Zero-knowledge architecture for maximum privacy</li>
                            </ul>
                          </div>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem
                        value="access"
                        className="rounded-lg border border-slate-200 px-6 dark:border-slate-700"
                      >
                        <AccordionTrigger className="py-6 text-left hover:no-underline">
                          <div className="flex items-center gap-3">
                            <Users className="h-5 w-5 text-green-600" />
                            <span className="text-lg font-semibold">Access Controls & Authentication</span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="pb-6">
                          <div className="space-y-4">
                            <p className="text-slate-600 dark:text-slate-400">
                              We implement strict access controls and multi-factor authentication to ensure only authorized users can access your data.
                            </p>
                            <ul className="list-disc pl-6 text-slate-600 dark:text-slate-400">
                              <li>Multi-factor authentication (MFA) for all accounts</li>
                              <li>Role-based access control (RBAC) for team permissions</li>
                              <li>Regular access reviews and automated deprovisioning</li>
                              <li>Single sign-on (SSO) integration for enterprise security</li>
                            </ul>
                          </div>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem
                        value="monitoring"
                        className="rounded-lg border border-slate-200 px-6 dark:border-slate-700"
                      >
                        <AccordionTrigger className="py-6 text-left hover:no-underline">
                          <div className="flex items-center gap-3">
                            <Database className="h-5 w-5 text-purple-600" />
                            <span className="text-lg font-semibold">Monitoring & Incident Response</span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="pb-6">
                          <div className="space-y-4">
                            <p className="text-slate-600 dark:text-slate-400">
                              We continuously monitor our systems for security threats and have comprehensive incident response procedures in place.
                            </p>
                            <ul className="list-disc pl-6 text-slate-600 dark:text-slate-400">
                              <li>24/7 security monitoring and threat detection</li>
                              <li>Automated anomaly detection and alerting</li>
                              <li>Rapid incident response and containment procedures</li>
                              <li>Regular security audits and penetration testing</li>
                            </ul>
                          </div>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem
                        value="compliance"
                        className="rounded-lg border border-slate-200 px-6 dark:border-slate-700"
                      >
                        <AccordionTrigger className="py-6 text-left hover:no-underline">
                          <div className="flex items-center gap-3">
                            <BookOpen className="h-5 w-5 text-orange-600" />
                            <span className="text-lg font-semibold">Compliance & Certifications</span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="pb-6">
                          <div className="space-y-4">
                            <p className="text-slate-600 dark:text-slate-400">
                              We maintain compliance with major security and privacy frameworks to ensure the highest standards of data protection.
                            </p>
                            <ul className="list-disc pl-6 text-slate-600 dark:text-slate-400">
                              <li>SOC 2 Type II compliance for security controls</li>
                              <li>GDPR compliance for European data protection</li>
                              <li>CCPA compliance for California privacy rights</li>
                              <li>ISO 27001 security management standards</li>
                            </ul>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>

                    <div className="mt-12 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 p-8 text-center dark:from-blue-950/30 dark:to-indigo-950/30">
                      <Shield className="mx-auto mb-4 h-12 w-12 text-blue-600" />
                      <h3 className="mb-2 text-xl font-semibold text-slate-900 dark:text-slate-100">
                        Questions about privacy or security?
                      </h3>
                      <p className="mb-6 text-slate-600 dark:text-slate-400">
                        Our privacy and security teams are here to help with any questions or concerns.
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
