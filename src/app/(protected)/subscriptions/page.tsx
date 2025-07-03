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
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header Section */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Choose Your Plan</h1>
        <p className="text-lg text-muted-foreground">
          Get started with the perfect plan for your needs
        </p>
      </div>

      {/* Pricing Table */}
      <div className="mb-16">
        <PricingTable />
      </div>

      {/* Features Section */}
      <section className="mb-16">
        <h2 className="text-3xl font-bold text-center mb-8">Why Choose Us?</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="p-6 rounded-lg border bg-card">
            <h3 className="text-xl font-semibold mb-3">Advanced AI Integration</h3>
            <p className="text-muted-foreground">
              Leverage cutting-edge AI technology for smarter code analysis and insights
            </p>
          </div>
          <div className="p-6 rounded-lg border bg-card">
            <h3 className="text-xl font-semibold mb-3">Real-time Collaboration</h3>
            <p className="text-muted-foreground">
              Work seamlessly with your team in real-time with built-in collaboration tools
            </p>
          </div>
          <div className="p-6 rounded-lg border bg-card">
            <h3 className="text-xl font-semibold mb-3">24/7 Support</h3>
            <p className="text-muted-foreground">
              Get help whenever you need it with our round-the-clock support team
            </p>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="mb-16">
        <h2 className="text-3xl font-bold text-center mb-8">Frequently Asked Questions</h2>
        <Accordion type="single" collapsible className="max-w-3xl mx-auto">
          {faqs.map((faq, index) => (
            <AccordionItem key={index} value={`item-${index}`}>
              <AccordionTrigger>{faq.question}</AccordionTrigger>
              <AccordionContent>{faq.answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      {/* Support Section */}
      <section className="text-center mb-16">
        <h2 className="text-3xl font-bold mb-8">Need Help?</h2>
        <div className="flex flex-col md:flex-row gap-6 justify-center items-center">
          <Button asChild variant="outline" size="lg" className="gap-2">
            <Link href="mailto:sakshamgoel1107@gmail.com">
              <Mail className="w-4 h-4" />
              Email Support
            </Link>
          </Button>
          <Button asChild size="lg" className="gap-2">
            <Link href="/docs">
              <MessageCircle className="w-4 h-4" />
              Documentation
            </Link>
          </Button>
        </div>
      </section>

      {/* Trust Signals */}
      <section className="text-center">
        <div className="flex flex-col items-center gap-4">
          <p className="text-sm text-muted-foreground">Trusted by developers worldwide</p>
          <div className="flex gap-4 items-center justify-center text-muted-foreground">
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
