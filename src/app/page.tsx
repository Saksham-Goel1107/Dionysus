'use client';

import { Features } from './components/features';
import { Hero } from './components/hero';
import { HowItWorks } from './components/how-it-works';
import { Navbar } from './components/navbar';
import { Footer } from './components/footer';
import { useUser } from '@clerk/nextjs';
import ContactForm from '@/components/ContactForm';

export default function Home() {
  const { user } = useUser();
  return (
    <>
      <div className="min-h-screen bg-background">
        <Navbar />
        <main>
          <div className="bg-hero bg-cover bg-center">
            <Hero />
          </div>
          <Features />
          <HowItWorks />
          {user && (
            <section id="ContactForm" className="w-full bg-muted/50 p-12 md:py-24 lg:py-32">
              <ContactForm />
            </section>
          )}
        </main>
        <Footer />
      </div>
    </>
  );
}
