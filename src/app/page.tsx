import { GoogleOneTap } from '@clerk/nextjs'
import { Features } from "./components/features";
import { Footer } from "./components/footer";
import { Hero } from "./components/hero";
import { HowItWorks } from "./components/how-it-works";
import { Navbar } from "./components/navbar";

export default function Home() {
  return (
    <>
      <GoogleOneTap
        cancelOnTapOutside={true}
        itpSupport={true}
        fedCmSupport={true}
      />
      <div className="min-h-screen bg-background">
        <Navbar />
        <main>
          <Hero />
          <Features />
          <HowItWorks />
        </main>
        <Footer />
      </div>
    </>
  );
}
