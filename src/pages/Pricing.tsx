import { Link } from "react-router-dom";
import { ArrowRight, Bell } from "lucide-react";
import PublicNav from "../components/PublicNav";
import PublicFooter from "../components/PublicFooter";
import PricingPlans from "../pricing/PricingPlans";
import PricingFAQ from "../pricing/PricingFAQ";

export default function Pricing() {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <PublicNav />

      <div className="max-w-6xl mx-auto px-6 py-20 space-y-20">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-white">
            Simple, transparent pricing
          </h1>
          <p className="text-gray-400 text-sm max-w-xl mx-auto">
            Start for free with self-hosting. Cloud plans are coming soon.
          </p>
        </div>

        {/* Plans */}
        <PricingPlans />

        {/* Coming soon notice */}
        <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6 flex flex-col sm:flex-row items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-brand-600/15 border border-brand-800/40 flex items-center justify-center shrink-0">
            <Bell className="w-5 h-5 text-brand-400" />
          </div>
          <div className="flex-1 text-center sm:text-left">
            <p className="text-sm font-semibold text-white">
              Cloud plans coming soon
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              We're working on managed cloud hosting. In the meantime,
              self-hosting is completely free with all features included.
            </p>
          </div>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white text-xs font-medium rounded-lg transition-colors shrink-0"
          >
            Self-host now <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Compare note */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 text-center space-y-2">
          <p className="text-sm font-semibold text-white">
            All plans include the same features
          </p>
          <p className="text-xs text-gray-400 max-w-lg mx-auto">
            The difference between plans is only hosting (self vs cloud),
            message volume, and support level. No feature is locked behind a
            paywall.
          </p>
        </div>

        {/* FAQ */}
        <PricingFAQ />

        {/* CTA */}
        <div className="relative bg-gradient-to-br from-brand-900/50 via-gray-900 to-gray-900 border border-brand-800/30 rounded-2xl p-12 text-center overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-brand-600/5 to-transparent pointer-events-none" />
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-brand-600/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative space-y-5">
            <h2 className="text-2xl font-bold text-white">
              Start building today
            </h2>
            <p className="text-gray-400 text-sm max-w-md mx-auto">
              Self-host for free with all features included. No credit card, no
              limits.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 px-6 py-3 bg-brand-600 hover:bg-brand-500 text-white font-semibold rounded-xl transition-colors text-sm"
              >
                Get started free <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/public-docs"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gray-800 hover:bg-gray-700 text-gray-200 font-medium rounded-xl transition-colors text-sm"
              >
                Read the docs
              </Link>
            </div>
          </div>
        </div>
      </div>

      <PublicFooter />
    </div>
  );
}
