import dynamic from 'next/dynamic';
import { Features } from './components/features';
import { Hero } from './components/hero';
import { HowItWorks } from './components/how-it-works';
import { Navbar } from './components/navbar';

const Footer = dynamic(() => import('./components/footer').then((mod) => mod.Footer), {
  ssr: false,
});

export default function Home() {
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
        </main>
        <Footer />
      </div>
    </>
  );
}
