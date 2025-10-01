import { PricingTable } from '@clerk/nextjs';
import { currentUser } from '@clerk/nextjs/server';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Mail, MessageCircle, Lock, Sparkles, Zap, Crown, Star, Shield, Rocket, Users, CheckCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default async function PricingPage() {
  const user = await currentUser();
  const isAuthenticated = !!user;

  const faqs = [
    {
      question: 'What payment methods do you accept?',
      answer:
        'We accept all major credit cards (Visa, MasterCard, American Express) and PayPal. All payments are processed securely through Clerk.',
    },
    {
      question: 'Can I cancel my subscription anytime?',
      answer:
        "Yes, you can cancel your subscription at any time. Your access will continue until the end of your current billing period. We don't offer refunds for partial months.",
    },
    {
      question: 'What happens to my data if I cancel?',
      answer: 'Your data will be retained after cancellation.',
    },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* Header Section */}
      <div className="mb-16 text-center relative">
        {/* Background decoration */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/4 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
          <div className="absolute top-0 right-1/4 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse" style={{animationDelay: '2s'}}></div>
        </div>
        
        <Badge className="mb-6 bg-gradient-to-r from-purple-500 to-blue-500 text-white px-4 py-2 text-sm font-medium animate-bounce">
          <Sparkles className="w-4 h-4 mr-2" />
          Limited Time Offers Available
        </Badge>
        
        <h1 className="mb-6 text-5xl md:text-6xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent leading-tight">
          Choose Your Plan
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Transform your development workflow with enterprise-grade GitHub analytics and AI-powered insights
        </p>
        
        {/* Stats */}
        <div className="flex justify-center items-center gap-8 mt-8 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-green-500" />
            <span>10,000+ developers</span>
          </div>
          <div className="flex items-center gap-2">
            <Star className="w-4 h-4 text-yellow-500" />
            <span>4.9/5 rating</span>
          </div>
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-blue-500" />
            <span>Enterprise secure</span>
          </div>
        </div>
      </div>

      {/* Pricing Table */}
      <div className="mb-10 relative">
        <PricingTable />
        
        {!isAuthenticated && (
          <div className="mt-8 text-center">
            <Card className="inline-block p-6 shadow-xl border-2 border-purple-200 bg-gradient-to-br from-white via-purple-50/50 to-blue-50/50 dark:from-gray-900 dark:via-purple-950/20 dark:to-blue-950/20">
              <CardContent className="space-y-4">
                <div className="flex items-center justify-center gap-3">
                  <div className="bg-gradient-to-r from-purple-500 to-blue-500 rounded-full p-2">
                    <Rocket className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-lg font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                    Ready to get started?
                  </h3>
                </div>
                
                <p className="text-sm text-muted-foreground">
                  Sign up now to access these plans and start your free trial
                </p>
                
                <div className="flex gap-3 justify-center">
                  <Button asChild size="sm" className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                    <Link href="/sign-up">
                      Start Free Trial
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="sm">
                    <Link href="/sign-in">
                      Sign In
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Organization Plan */}
      <section className="border-gradient-to-r mb-16 overflow-hidden rounded-2xl border-2 bg-gradient-to-br from-blue-50 via-white to-purple-50 p-8 shadow-xl dark:border-gray-700 dark:from-gray-800 dark:to-gray-900">
        <div className="text-center">
          <div className="mb-4 inline-flex items-center rounded-full bg-gradient-to-r from-blue-100 to-purple-100 px-4 py-2 text-sm font-medium text-blue-800 dark:from-blue-900/50 dark:to-purple-900/50 dark:text-blue-200">
            ✨ Enterprise Solution
          </div>
          <h2 className="mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-3xl font-bold text-transparent">
            Organization Plan
          </h2>
          <p className="mx-auto mb-8 max-w-2xl text-lg text-gray-700 dark:text-gray-300">
            Unlock enterprise-grade features with custom solutions tailored for your organization.
            Get volume pricing, dedicated support, and advanced security features.
          </p>

          <div className="mb-8 grid gap-6 md:grid-cols-3">
            <div className="flex flex-col items-center rounded-xl bg-white/60 p-4 backdrop-blur-sm dark:bg-gray-800/60">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/50">
                <span className="text-2xl">🏢</span>
              </div>
              <h3 className="mb-2 font-semibold text-gray-900 dark:text-white">Custom Features</h3>
              <p className="text-center text-sm text-gray-600 dark:text-gray-400">
                Tailored functionality for your specific needs
              </p>
            </div>
            <div className="flex flex-col items-center rounded-xl bg-white/60 p-4 backdrop-blur-sm dark:bg-gray-800/60">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900/50">
                <span className="text-2xl">💰</span>
              </div>
              <h3 className="mb-2 font-semibold text-gray-900 dark:text-white">Volume Pricing</h3>
              <p className="text-center text-sm text-gray-600 dark:text-gray-400">
                Cost-effective solutions for large teams
              </p>
            </div>
            <div className="flex flex-col items-center rounded-xl bg-white/60 p-4 backdrop-blur-sm dark:bg-gray-800/60">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/50">
                <span className="text-2xl">🛡️</span>
              </div>
              <h3 className="mb-2 font-semibold text-gray-900 dark:text-white">Priority Support</h3>
              <p className="text-center text-sm text-gray-600 dark:text-gray-400">
                Dedicated support team and SLA
              </p>
            </div>
          </div>

          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Button
              asChild
              size="lg"
              className="transform gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg transition-all duration-300 hover:scale-105 hover:from-blue-700 hover:to-purple-700 hover:shadow-xl"
            >
              <Link href="/#ContactForm">
                <MessageCircle className="h-5 w-5" />
                Schedule a Call
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="gap-2 border-2 border-blue-200 bg-white/80 text-blue-700 hover:border-blue-300 hover:bg-blue-50"
            >
              <Link href="mailto:sakshamgoel1107@gmail.com?subject=Organization%20Plan%20Inquiry">
                <Mail className="h-5 w-5" />
                Email Us
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="mb-20">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent dark:from-white dark:to-gray-300">
            Why Developers Choose Dionysus
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Join the revolution in GitHub analytics and team collaboration
          </p>
        </div>
        
        <div className="grid gap-8 md:grid-cols-3">
          <Card className="group relative overflow-hidden border-2 border-purple-100 hover:border-purple-300 transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/20 hover:-translate-y-2">
            <CardContent className="p-8">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-purple-400/20 to-transparent rounded-bl-3xl"></div>
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Zap className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-4 group-hover:text-purple-600 transition-colors">
                  AI-Powered Analytics
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  Leverage Gemini Pro AI for deep code insights, automated documentation, and intelligent repository analysis
                </p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="group relative overflow-hidden border-2 border-blue-100 hover:border-blue-300 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/20 hover:-translate-y-2">
            <CardContent className="p-8">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-400/20 to-transparent rounded-bl-3xl"></div>
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-4 group-hover:text-blue-600 transition-colors">
                  Team Collaboration
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  Real-time collaboration tools, meeting transcription, and seamless project management for distributed teams
                </p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="group relative overflow-hidden border-2 border-green-100 hover:border-green-300 transition-all duration-300 hover:shadow-2xl hover:shadow-green-500/20 hover:-translate-y-2">
            <CardContent className="p-8">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-green-400/20 to-transparent rounded-bl-3xl"></div>
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-4 group-hover:text-green-600 transition-colors">
                  Enterprise Security
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  Bank-grade security, compliance tools, audit logging, and 24/7 dedicated support for mission-critical projects
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="mb-16">
        <h2 className="mb-8 text-center text-3xl font-bold">Frequently Asked Questions</h2>
        <Accordion type="single" collapsible className="mx-auto max-w-3xl">
          {faqs.map((faq, index) => (
            <AccordionItem key={index} value={`item-${index}`}>
              <AccordionTrigger>{faq.question}</AccordionTrigger>
              <AccordionContent>{faq.answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      {/* Support Section */}
      <section className="mb-20">
        <Card className="bg-gradient-to-r from-gray-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-blue-950/20 dark:to-purple-950/20 border-2 border-gray-200 dark:border-gray-700">
          <CardContent className="p-12 text-center">
            <Crown className="w-16 h-16 mx-auto mb-6 text-purple-500" />
            <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              World-Class Support
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Get expert help from our team of developers and DevOps engineers
            </p>
            
            <div className="flex flex-col items-center justify-center gap-4 md:flex-row">
              <Button asChild variant="outline" size="lg" className="gap-2 border-2 border-purple-200 hover:bg-purple-50 hover:border-purple-300">
                <Link href="mailto:sakshamgoel1107@gmail.com">
                  <Mail className="h-5 w-5" />
                  Email Support
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
              <Button asChild size="lg" className="gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                <Link href="/docs">
                  <MessageCircle className="h-5 w-5" />
                  Documentation
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
            </div>
            
            <div className="flex justify-center items-center gap-8 mt-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Average 2h response time</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>99.9% uptime SLA</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Trust Signals */}
      <section className="text-center">
        <div className="bg-gradient-to-r from-transparent via-gray-100 to-transparent dark:via-gray-800 py-8 rounded-2xl">
          <p className="text-lg font-semibold mb-6 text-gray-700 dark:text-gray-300">
            Trusted by 10,000+ developers worldwide
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 text-sm">
            <div className="flex items-center gap-2 bg-white dark:bg-gray-800 px-4 py-2 rounded-full shadow-md">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <Shield className="w-4 h-4 text-green-600" />
              <span className="font-medium">Bank-grade security</span>
            </div>
            <div className="flex items-center gap-2 bg-white dark:bg-gray-800 px-4 py-2 rounded-full shadow-md">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <Lock className="w-4 h-4 text-blue-600" />
              <span className="font-medium">SOC 2 compliant</span>
            </div>
            <div className="flex items-center gap-2 bg-white dark:bg-gray-800 px-4 py-2 rounded-full shadow-md">
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
              <Zap className="w-4 h-4 text-purple-600" />
              <span className="font-medium">99.9% uptime</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}