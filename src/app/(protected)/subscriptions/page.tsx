import { PricingTable } from '@clerk/nextjs';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Mail, MessageCircle } from 'lucide-react';
import Link from 'next/link';

export default function Page() {
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
      <div className="mb-12 text-center">
        <h1 className="mb-4 text-4xl font-bold">Choose Your Plan</h1>
        <p className="text-lg text-muted-foreground">
          Get started with the perfect plan for your needs
        </p>
      </div>

      {/* Pricing Table */}
      <div className="mb-10">
        <PricingTable />
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
      <section className="mb-16">
        <h2 className="mb-8 text-center text-3xl font-bold">Why Choose Us?</h2>
        <div className="grid gap-8 md:grid-cols-3">
          <div className="rounded-lg border bg-card p-6">
            <h3 className="mb-3 text-xl font-semibold">Advanced AI Integration</h3>
            <p className="text-muted-foreground">
              Leverage cutting-edge AI technology for smarter code analysis and insights
            </p>
          </div>
          <div className="rounded-lg border bg-card p-6">
            <h3 className="mb-3 text-xl font-semibold">Real-time Collaboration</h3>
            <p className="text-muted-foreground">
              Work seamlessly with your team in real-time with built-in collaboration tools
            </p>
          </div>
          <div className="rounded-lg border bg-card p-6">
            <h3 className="mb-3 text-xl font-semibold">24/7 Support</h3>
            <p className="text-muted-foreground">
              Get help whenever you need it with our round-the-clock support team
            </p>
          </div>
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
      <section className="mb-16 text-center">
        <h2 className="mb-8 text-3xl font-bold">Need Help?</h2>
        <div className="flex flex-col items-center justify-center gap-6 md:flex-row">
          <Button asChild variant="outline" size="lg" className="gap-2">
            <Link href="mailto:sakshamgoel1107@gmail.com">
              <Mail className="h-4 w-4" />
              Email Support
            </Link>
          </Button>
          <Button asChild size="lg" className="gap-2">
            <Link href="/docs">
              <MessageCircle className="h-4 w-4" />
              Documentation
            </Link>
          </Button>
        </div>
      </section>

      {/* Trust Signals */}
      <section className="text-center">
        <div className="flex flex-col items-center gap-4">
          <p className="text-sm text-muted-foreground">Trusted by developers worldwide</p>
          <div className="flex items-center justify-center gap-4 text-muted-foreground">
            <span>🔒 Secure payments</span>
            <span>•</span>
            <span>🛡️ Data protection</span>
            <span>•</span>
            <span>⚡ 99.9% uptime</span>
          </div>
        </div>
      </section>
    </div>
  );
}
