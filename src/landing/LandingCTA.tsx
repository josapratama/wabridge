import { Link } from "react-router-dom";
import { Zap, ArrowRight } from "lucide-react";

export default function LandingCTA() {
  return (
    <section className="max-w-6xl mx-auto px-6 py-24 text-center">
      <div className="relative bg-gradient-to-br from-brand-900/50 via-gray-900 to-gray-900 border border-brand-800/30 rounded-2xl p-12 overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 bg-gradient-to-br from-brand-600/5 to-transparent pointer-events-none" />
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-brand-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative space-y-6">
          <div className="w-14 h-14 rounded-2xl bg-brand-600 flex items-center justify-center mx-auto shadow-lg shadow-brand-900/50">
            <Zap className="w-7 h-7 text-white" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-white mb-3">
              Ready to get started?
            </h2>
            <p className="text-gray-400 text-sm max-w-md mx-auto">
              Self-host in minutes. Connect your WhatsApp number and start
              sending messages from your application today.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-6 py-3 bg-brand-600 hover:bg-brand-500 text-white font-semibold rounded-xl transition-colors text-sm shadow-lg shadow-brand-900/40"
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
          <p className="text-xs text-gray-600">
            No credit card required · Self-hosted · Full control
          </p>
        </div>
      </div>
    </section>
  );
}
