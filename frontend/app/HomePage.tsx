import LandingNav from "./components/landing/LandingNav";
import LandingHero from "./components/landing/LandingHero";
import HowItWorks from "./components/landing/HowItWorks";
import FeatureBento from "./components/landing/FeatureBento";
import FeatureAlternating from "./components/landing/FeatureAlternating";
import StatsStrip from "./components/landing/StatsStrip";
import Testimonials from "./components/landing/Testimonials";
import FinalCta from "./components/landing/FinalCta";
import LandingFooter from "./components/landing/LandingFooter";

export default function HomePage() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-almaari-bg text-almaari-ink">
      <LandingNav />
      <main>
        <LandingHero />
        <HowItWorks />
        <FeatureBento />
        <FeatureAlternating />
        <StatsStrip />
        <Testimonials />
        <FinalCta />
      </main>
      <LandingFooter />
    </div>
  );
}
