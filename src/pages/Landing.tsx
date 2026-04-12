import PublicNav from "../components/PublicNav";
import LandingHero from "../landing/LandingHero";
import LandingProviders from "../landing/LandingProviders";
import LandingFeatures from "../landing/LandingFeatures";
import LandingHowItWorks from "../landing/LandingHowItWorks";
import LandingAPI from "../landing/LandingAPI";
import LandingDashboard from "../landing/LandingDashboard";
import LandingCTA from "../landing/LandingCTA";
import LandingFooter from "../landing/LandingFooter";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <PublicNav />
      <LandingHero />
      <LandingProviders />
      <LandingFeatures />
      <LandingHowItWorks />
      <LandingAPI />
      <LandingDashboard />
      <LandingCTA />
      <LandingFooter />
    </div>
  );
}
