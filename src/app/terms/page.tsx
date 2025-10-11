'use client';

import {
  BookOpen,
  ChevronRight,
  Clock,
  FileText,
  HelpCircle,
  MessageSquare,
  Scale,
  Shield,
  Users,
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
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Navbar } from '../components/navbar';

export default function TermsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSection, setActiveSection] = useState('overview');
  const [searchResults, setSearchResults] = useState<any[]>([]);

  const sections = [
    {
      id: 'overview',
      title: 'Overview',
      description: 'Introduction to our terms and your rights',
      icon: BookOpen,
      content: 'Agreement scope, definitions, acceptance, modifications',
    },
    {
      id: 'services',
      title: 'Services',
      description: 'How you can use Dionysus and our responsibilities',
      icon: Users,
      content: 'Service description, availability, modifications, support',
    },
    {
      id: 'privacy',
      title: 'Privacy & Data',
      description: 'How we protect and handle your information',
      icon: Shield,
      content: 'Data collection, processing, security, retention, rights',
    },
    {
      id: 'legal',
      title: 'Legal',
      description: 'Legal obligations, limitations, and dispute resolution',
      icon: Scale,
      content: 'Liability, warranties, indemnification, governing law',
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
            <Scale className="h-8 w-8 text-white" />
          </div>
          <h1 className="delay-400 mb-4 bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-4xl font-bold text-transparent duration-1000 animate-in slide-in-from-bottom-4 dark:from-slate-100 dark:to-slate-400 md:text-5xl">
            Terms of Service
          </h1>
          <p className="mx-auto mb-8 max-w-2xl text-lg text-slate-600 delay-500 duration-1000 animate-in slide-in-from-bottom-4 dark:text-slate-400">
            Clear, fair terms that protect both you and Dionysus while enabling great collaboration
          </p>

          {/* Search Bar */}
          <div className="delay-600 mx-auto mb-8 max-w-md duration-1000 animate-in slide-in-from-bottom-4">
            <div className="relative">
              <FileText className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                type="search"
                placeholder="Search terms..."
                className="pl-10 pr-10 transition-all duration-300 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                aria-label="Search terms"
              />
              {searchQuery && (
                <button
                  onClick={() => handleSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-600"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mb-8 flex flex-wrap justify-center gap-4 delay-700 duration-1000 animate-in slide-in-from-bottom-4">
            <Button asChild size="lg" className="transition-transform hover:scale-105">
              <Link href="/privacy">
                <Shield className="mr-2 h-4 w-4" />
                Privacy Policy
              </Link>
            </Button>
            <Button
              variant="outline"
              asChild
              size="lg"
              className="transition-transform hover:scale-105"
            >
              <Link href="/support">
                <HelpCircle className="mr-2 h-4 w-4" />
                Get Help
              </Link>
            </Button>
          </div>

          {/* Quick Stats */}
          <div className="delay-800 flex flex-wrap justify-center gap-6 text-sm text-slate-500 duration-1000 animate-in slide-in-from-bottom-4 dark:text-slate-400">
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
          <span className="text-slate-900 dark:text-slate-100">Terms of Service</span>
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
                    <Link href="/privacy">
                      <Shield className="mr-2 h-4 w-4" />
                      Privacy Policy
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
                      <BookOpen className="h-4 w-4" />
                      <span className="hidden sm:inline">Overview</span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="services"
                      className="flex items-center gap-2 px-4 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-slate-700"
                    >
                      <Users className="h-4 w-4" />
                      <span className="hidden sm:inline">Services</span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="privacy"
                      className="flex items-center gap-2 px-4 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-slate-700"
                    >
                      <Shield className="h-4 w-4" />
                      <span className="hidden sm:inline">Privacy</span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="legal"
                      className="flex items-center gap-2 px-4 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-slate-700"
                    >
                      <Scale className="h-4 w-4" />
                      Legal
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
                            <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div>
                            <CardTitle className="text-lg">Agreement Scope</CardTitle>
                          </div>
                        </div>
                        <CardDescription className="text-sm">
                          What this agreement covers and how it applies to you
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          These terms govern your use of Dionysus, including all features, services,
                          and integrations. By using our platform, you agree to these terms.
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="group border-0 bg-gradient-to-br from-green-50 to-emerald-50 transition-all duration-300 hover:shadow-lg dark:from-green-950/50 dark:to-emerald-950/50">
                      <CardHeader className="pb-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/50">
                            <Users className="h-5 w-5 text-green-600 dark:text-green-400" />
                          </div>
                          <div>
                            <CardTitle className="text-lg">Your Rights</CardTitle>
                          </div>
                        </div>
                        <CardDescription className="text-sm">
                          What you can do with Dionysus and how we protect your interests
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          You have the right to use our services, export your data, and receive
                          support. We respect your privacy and intellectual property.
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="group border-0 bg-gradient-to-br from-purple-50 to-pink-50 transition-all duration-300 hover:shadow-lg dark:from-purple-950/50 dark:to-pink-950/50">
                      <CardHeader className="pb-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/50">
                            <Shield className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                          </div>
                          <div>
                            <CardTitle className="text-lg">Our Commitments</CardTitle>
                          </div>
                        </div>
                        <CardDescription className="text-sm">
                          What we promise to deliver and how we protect your data
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          We commit to providing reliable service, protecting your privacy, and
                          continuously improving our platform based on your feedback.
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="prose dark:prose-invert max-w-none">
                    <h2>Welcome to Dionysus Terms of Service</h2>
                    <p>
                      These Terms of Service (&quot;Terms&quot;) govern your access to and use of
                      Dionysus, our AI-powered meeting intelligence platform. By creating an account
                      or using our services, you agree to be bound by these Terms and our Privacy
                      Policy.
                    </p>

                    <h3>1. Agreement and Acceptance</h3>
                    <p>
                      By accessing or using Dionysus, you confirm that you are at least 18 years old
                      and have the legal capacity to enter into this agreement. If you are using
                      Dionysus on behalf of an organization, you represent that you have the
                      authority to bind that organization to these Terms.
                    </p>

                    <h3>2. Service Description</h3>
                    <p>
                      Dionysus provides AI-powered meeting intelligence services, including but not
                      limited to:
                    </p>
                    <ul>
                      <li>Real-time meeting transcription and recording</li>
                      <li>AI-generated meeting summaries and insights</li>
                      <li>Action item extraction and tracking</li>
                      <li>Team collaboration and project management tools</li>
                      <li>Integration with third-party platforms and services</li>
                    </ul>

                    <h3>3. Account Registration and Security</h3>
                    <p>
                      You are responsible for maintaining the confidentiality of your account
                      credentials and for all activities that occur under your account. You must
                      immediately notify us of any unauthorized use of your account or any other
                      breach of security.
                    </p>

                    <h3>4. Acceptable Use</h3>
                    <p>
                      You agree to use Dionysus only for lawful purposes and in accordance with
                      these Terms. You may not:
                    </p>
                    <ul>
                      <li>Use the service for any illegal or unauthorized purpose</li>
                      <li>Attempt to gain unauthorized access to our systems</li>
                      <li>Interfere with or disrupt the service or servers</li>
                      <li>Upload or transmit malicious code or harmful content</li>
                      <li>Violate any applicable laws or regulations</li>
                    </ul>

                    <h3>5. Modifications to Terms</h3>
                    <p>
                      We may update these Terms from time to time. We will notify you of any
                      material changes by posting the new Terms on our website and updating the
                      &quot;Last Updated&quot; date. Your continued use of Dionysus after such
                      changes constitutes acceptance of the new Terms.
                    </p>
                  </div>
                </TabsContent>

                <TabsContent value="services" className="space-y-6">
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    <Card className="border-0 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Users className="h-5 w-5 text-blue-600" />
                          Service Availability
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          We strive to maintain 99.9% uptime but may need to perform maintenance or
                          updates that temporarily affect service availability.
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="border-0 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/50 dark:to-emerald-950/50">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Shield className="h-5 w-5 text-green-600" />
                          Data Processing
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          Our AI processes your meeting data to provide transcription, summaries,
                          and insights while maintaining strict privacy and security standards.
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="border-0 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/50 dark:to-pink-950/50">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <MessageSquare className="h-5 w-5 text-purple-600" />
                          Support Services
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          We provide customer support through multiple channels and maintain
                          comprehensive documentation to help you succeed.
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="prose dark:prose-invert max-w-none">
                    <h2>Service Terms and Conditions</h2>
                    <p>
                      Dionysus provides a comprehensive suite of AI-powered meeting intelligence
                      services designed to enhance your team&apos;s productivity and collaboration.
                      Our services are delivered through a secure, cloud-based platform with
                      enterprise-grade reliability and performance.
                    </p>

                    <h3>Service Features and Functionality</h3>
                    <p>
                      Our platform includes advanced features such as real-time transcription with
                      speaker identification, AI-generated meeting summaries, automatic action item
                      extraction, sentiment analysis, and comprehensive analytics. We continuously
                      enhance our services with new features and improvements based on user feedback
                      and technological advances.
                    </p>

                    <h3>Service Availability and Performance</h3>
                    <p>
                      We maintain our services with industry-leading uptime targets and performance
                      standards. While we strive for continuous availability, we may occasionally
                      need to perform maintenance, updates, or emergency repairs that could
                      temporarily affect service access. We will provide advance notice of planned
                      maintenance whenever possible.
                    </p>

                    <h3>AI Processing and Accuracy</h3>
                    <p>
                      Our AI systems are designed to provide high-quality transcription and
                      analysis, but accuracy may vary based on factors such as audio quality,
                      speaker accents, background noise, and technical terminology. We continuously
                      improve our AI models but cannot guarantee 100% accuracy in all situations.
                    </p>

                    <h3>Integration and Third-Party Services</h3>
                    <p>
                      Dionysus integrates with various third-party services and platforms to enhance
                      functionality. While we maintain these integrations to the best of our
                      ability, we are not responsible for the availability, performance, or changes
                      to third-party services that may affect our integrations.
                    </p>

                    <h3>Service Modifications and Updates</h3>
                    <p>
                      We reserve the right to modify, update, or discontinue any aspect of our
                      services at any time. We will provide reasonable notice of significant changes
                      that may affect your use of the platform. In the event of service
                      discontinuation, we will provide data export options where technically
                      feasible.
                    </p>
                  </div>
                </TabsContent>

                <TabsContent value="privacy" className="space-y-6">
                  <div className="prose dark:prose-invert max-w-none">
                    <h2>Privacy and Data Protection</h2>
                    <p>
                      Your privacy is fundamental to how we operate Dionysus. We are committed to
                      protecting your personal information and meeting data through industry-leading
                      security practices and transparent data handling policies.
                    </p>

                    <h3>Data Collection and Use</h3>
                    <p>
                      We collect only the information necessary to provide and improve our services.
                      This includes:
                    </p>
                    <ul>
                      <li>Account information (name, email, organization details)</li>
                      <li>Meeting content (audio, transcripts, participant information)</li>
                      <li>Usage analytics (feature usage, performance metrics)</li>
                      <li>Technical data (device information, browser details, IP addresses)</li>
                    </ul>

                    <h3>Data Security and Protection</h3>
                    <p>We implement comprehensive security measures including:</p>
                    <ul>
                      <li>End-to-end encryption for data in transit and at rest</li>
                      <li>Multi-factor authentication and access controls</li>
                      <li>Regular security audits and penetration testing</li>
                      <li>SOC 2 Type II compliance and industry certifications</li>
                      <li>Incident response and breach notification procedures</li>
                    </ul>

                    <h3>Data Retention and Deletion</h3>
                    <p>
                      We retain your data only as long as necessary to provide services and comply
                      with legal obligations. You can request data deletion at any time, and we will
                      process such requests in accordance with applicable privacy laws and our data
                      retention policies.
                    </p>

                    <h3>Your Privacy Rights</h3>
                    <p>Depending on your location, you may have rights including:</p>
                    <ul>
                      <li>Access to your personal data and processing activities</li>
                      <li>Correction of inaccurate or incomplete information</li>
                      <li>Deletion of your personal data (&quot;right to be forgotten&quot;)</li>
                      <li>Data portability and export capabilities</li>
                      <li>Objection to certain types of data processing</li>
                    </ul>

                    <h3>International Data Transfers</h3>
                    <p>
                      We may transfer your data internationally to provide our services. All such
                      transfers are protected by appropriate safeguards, including standard
                      contractual clauses and adequacy decisions where applicable.
                    </p>

                    <h3>Third-Party Data Sharing</h3>
                    <p>
                      We do not sell your personal data. We may share data with trusted service
                      providers who help us deliver our services, but only under strict contractual
                      obligations that protect your privacy and limit data use to specified
                      purposes.
                    </p>
                  </div>
                </TabsContent>

                <TabsContent value="legal" className="space-y-6">
                  <div className="max-w-4xl">
                    <div className="mb-8">
                      <h2 className="mb-4 text-3xl font-bold text-slate-900 dark:text-slate-100">
                        Legal Terms and Conditions
                      </h2>
                      <p className="text-lg text-slate-600 dark:text-slate-400">
                        Important legal information about liability, warranties, and dispute
                        resolution
                      </p>
                    </div>

                    <Accordion type="single" collapsible className="space-y-4">
                      <AccordionItem
                        value="liability"
                        className="rounded-lg border border-slate-200 px-6 dark:border-slate-700"
                      >
                        <AccordionTrigger className="py-6 text-left hover:no-underline">
                          <div className="flex items-center gap-3">
                            <Scale className="h-5 w-5 text-blue-600" />
                            <span className="text-lg font-semibold">Limitation of Liability</span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="pb-6">
                          <div className="space-y-4">
                            <p className="text-slate-600 dark:text-slate-400">
                              To the maximum extent permitted by law, Dionysus shall not be liable
                              for any indirect, incidental, special, consequential, or punitive
                              damages, including but not limited to loss of profits, data, use,
                              goodwill, or other intangible losses.
                            </p>
                            <p className="text-slate-600 dark:text-slate-400">
                              Our total liability for any claims arising from or related to these
                              Terms or your use of our services shall not exceed the amount you paid
                              to us in the twelve months preceding the claim.
                            </p>
                          </div>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem
                        value="warranties"
                        className="rounded-lg border border-slate-200 px-6 dark:border-slate-700"
                      >
                        <AccordionTrigger className="py-6 text-left hover:no-underline">
                          <div className="flex items-center gap-3">
                            <Shield className="h-5 w-5 text-green-600" />
                            <span className="text-lg font-semibold">
                              Warranties and Disclaimers
                            </span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="pb-6">
                          <div className="space-y-4">
                            <p className="text-slate-600 dark:text-slate-400">
                              We provide our services &quot;as is&quot; and &quot;as available&quot;
                              without warranties of any kind, either express or implied. We disclaim
                              all warranties, including but not limited to merchantability, fitness
                              for a particular purpose, and non-infringement.
                            </p>
                            <p className="text-slate-600 dark:text-slate-400">
                              While we strive to provide accurate and reliable services, we do not
                              warrant that our services will be uninterrupted, error-free, or
                              completely secure.
                            </p>
                          </div>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem
                        value="indemnification"
                        className="rounded-lg border border-slate-200 px-6 dark:border-slate-700"
                      >
                        <AccordionTrigger className="py-6 text-left hover:no-underline">
                          <div className="flex items-center gap-3">
                            <Users className="h-5 w-5 text-purple-600" />
                            <span className="text-lg font-semibold">Indemnification</span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="pb-6">
                          <div className="space-y-4">
                            <p className="text-slate-600 dark:text-slate-400">
                              You agree to indemnify, defend, and hold harmless Dionysus and its
                              officers, directors, employees, and agents from any claims, damages,
                              losses, or expenses arising from your use of our services or violation
                              of these Terms.
                            </p>
                            <p className="text-slate-600 dark:text-slate-400">
                              This includes but is not limited to claims related to your content,
                              your violation of any rights of another party, or your breach of these
                              Terms.
                            </p>
                          </div>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem
                        value="disputes"
                        className="rounded-lg border border-slate-200 px-6 dark:border-slate-700"
                      >
                        <AccordionTrigger className="py-6 text-left hover:no-underline">
                          <div className="flex items-center gap-3">
                            <MessageSquare className="h-5 w-5 text-orange-600" />
                            <span className="text-lg font-semibold">Dispute Resolution</span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="pb-6">
                          <div className="space-y-4">
                            <p className="text-slate-600 dark:text-slate-400">
                              We encourage resolving disputes through direct communication. If a
                              dispute cannot be resolved informally, it will be resolved through
                              binding arbitration in accordance with the rules of the American
                              Arbitration Association.
                            </p>
                            <p className="text-slate-600 dark:text-slate-400">
                              These Terms are governed by the laws of the State of California,
                              without regard to conflict of law principles.
                            </p>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>

                    <div className="mt-12 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 p-8 text-center dark:from-blue-950/30 dark:to-indigo-950/30">
                      <Scale className="mx-auto mb-4 h-12 w-12 text-blue-600" />
                      <h3 className="mb-2 text-xl font-semibold text-slate-900 dark:text-slate-100">
                        Questions about these terms?
                      </h3>
                      <p className="mb-6 text-slate-600 dark:text-slate-400">
                        If you have any questions about these Terms of Service, please don&apos;t
                        hesitate to contact us.
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
