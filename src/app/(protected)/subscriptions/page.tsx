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
      <section className="mb-16 flex flex-col items-center justify-center rounded-xl border border-blue-200 bg-blue-50 p-8 text-center dark:border-blue-900 dark:bg-blue-950/60">
        <h2 className="mb-2 text-2xl font-bold text-blue-800 dark:text-blue-200">
          Organization Plan
        </h2>
        <p className="mb-6 max-w-xl text-base text-blue-900 dark:text-blue-100">
          Need a custom solution for your company, enterprise, or large team? <br />
          Contact us for tailored features, volume pricing, and dedicated support.
        </p>
        <Button asChild size="lg" className="gap-2 bg-blue-700 text-white hover:bg-blue-800">
          <Link href="mailto:sakshamgoel1107@gmail.com?subject=Organization%20Plan%20Inquiry">
            <Mail className="h-5 w-5" />
            Contact Us
          </Link>
        </Button>
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
