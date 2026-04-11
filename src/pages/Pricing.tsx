import { Link } from "react-router-dom";
import { Zap, Check, ArrowRight, Server, Cloud, Building2 } from "lucide-react";

const plans = [
  {
    name: "Self-hosted",
    icon: Server,
    price: "Free",
    sub: "forever",
    desc: "Run on your own server. Full control, no limits imposed by us.",
    color: "border-gray-700",
    badge: null,
    cta: "Deploy now",
    ctaLink: "https://github.com",
    ctaStyle: "bg-gray-800 hover:bg-gray-700 text-white",
    features: [
      "Unlimited messages",
      "Unlimited sessions",
      "All providers (Baileys, Meta, BSP)",
      "All features included",
      "Broadcast to 1000+ recipients",
      "Auto-reply & scheduled messages",
      "Webhook outbound",
      "Team management",
      "Analytics & export",
      "API key management",
      "IP whitelist",
      "Community support",
    ],
  },
  {
    name: "Cloud Starter",
    icon: Cloud,
    price: "Rp 99K",
    sub: "/ month",
    desc: "Hosted by us. No server needed. Perfect for small businesses.",
    color: "border-brand-600",
    badge: "Most Popular",
    cta: "Start free trial",
    ctaLink: "/register",
    ctaStyle: "bg-brand-600 hover:bg-brand-500 text-white",
    features: [
      "1,000 messages / month",
      "3 active sessions",
      "Baileys + Meta Cloud",
      "Broadcast (up to 500 recipients)",
      "Auto-reply & scheduled messages",
      "Webhook outbound",
      "2 team members",
      "Analytics dashboard",
      "API key management",
      "Email support",
      "99.9% uptime SLA",
    ],
  },
  {
    name: "Cloud Pro",
    icon: Building2,
    price: "Rp 299K",
    sub: "/ month",
    desc: "For growing businesses with high volume messaging needs.",
    color: "border-gray-700",
    badge: null,
    cta: "Get started",
    ctaLink: "/register",
    ctaStyle: "bg-gray-800 hover:bg-gray-700 text-white",
    features: [
      "10,000 messages / month",
      "10 active sessions",
      "All providers",
      "Broadcast (up to 1000 recipients)",
      "Auto-reply & scheduled messages",
      "Webhook outbound + retry logs",
      "Unlimited team members",
      "Advanced analytics & export",
      "Multiple API keys + IP whitelist",
      "Priority email support",
      "99.9% uptime SLA",
      "Custom rate limits",
    ],
  },
];

const faqs = [
  {
    q: "What is a 'session'?",
    a: "A session is an active WhatsApp connection. Each session links one WhatsApp number to your account. You can have multiple sessions for different numbers.",
  },
  {
    q: "Can I use Baileys (WhatsApp Web) for free?",
    a: "Yes. The self-hosted version is completely free and includes Baileys support. You just need to run it on your own server.",
  },
  {
    q: "Do I need a WhatsApp Business account?",
    a: "For Baileys, no — any regular WhatsApp number works. For Meta Cloud API, you need a WhatsApp Business account.",
  },
  {
    q: "What happens if I exceed my monthly message limit?",
    a: "On cloud plans, messages above the limit are queued and you'll receive a notification. You can upgrade or purchase additional message packs.",
  },
  {
    q: "Is there a free trial for cloud plans?",
    a: "Yes, Cloud Starter includes a 14-day free trial with no credit card required.",
  },
  {
    q: "Can I self-host and still get support?",
    a: "Community support is available via GitHub issues. For priority support, consider a cloud plan.",
  },
];

export default function Pricing() {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* Navbar */}
      <nav className="border-b border-gray-800 sticky top-0 z-50 bg-gray-950/90 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-brand-600 flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-sm font-bold text-white">WA Integration</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link
              to="/public-docs"
              className="text-xs text-gray-400 hover:text-white transition-colors"
            >
              Docs
            </Link>
            <Link
              to="/login"
              className="text-xs text-gray-400 hover:text-white transition-colors"
            >
              Login
            </Link>
            <Link
              to="/register"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-brand-600 hover:bg-brand-500 text-white text-xs font-medium rounded-lg transition-colors"
            >
              Get Started <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-20 space-y-20">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-white">
            Simple, transparent pricing
          </h1>
          <p className="text-gray-400 text-sm max-w-xl mx-auto">
            Start for free with self-hosting, or let us handle the
            infrastructure with our cloud plans.
          </p>
        </div>

        {/* Plans */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative bg-gray-900 border-2 ${plan.color} rounded-2xl p-6 space-y-6`}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="px-3 py-1 bg-brand-600 text-white text-[10px] font-bold rounded-full">
                    {plan.badge}
                  </span>
                </div>
              )}

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center">
                    <plan.icon className="w-4 h-4 text-brand-400" />
                  </div>
                  <p className="text-sm font-semibold text-white">
                    {plan.name}
                  </p>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-white">
                    {plan.price}
                  </span>
                  <span className="text-xs text-gray-500">{plan.sub}</span>
                </div>
                <p className="text-xs text-gray-400">{plan.desc}</p>
              </div>

              <a
                href={plan.ctaLink}
                className={`block text-center py-2.5 rounded-xl text-sm font-medium transition-colors ${plan.ctaStyle}`}
              >
                {plan.cta}
              </a>

              <div className="space-y-2.5">
                {plan.features.map((f) => (
                  <div key={f} className="flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 text-brand-400 shrink-0 mt-0.5" />
                    <span className="text-xs text-gray-300">{f}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
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
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-white text-center">
            Frequently asked questions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {faqs.map((faq) => (
              <div
                key={faq.q}
                className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-2"
              >
                <p className="text-sm font-semibold text-white">{faq.q}</p>
                <p className="text-xs text-gray-400 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-br from-brand-900/40 to-gray-900 border border-brand-800/30 rounded-2xl p-12 text-center space-y-5">
          <h2 className="text-2xl font-bold text-white">
            Start building today
          </h2>
          <p className="text-gray-400 text-sm max-w-md mx-auto">
            Self-host for free or try our cloud with a 14-day free trial. No
            credit card required.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 px-6 py-3 bg-brand-600 hover:bg-brand-500 text-white font-semibold rounded-xl transition-colors text-sm"
            >
              Create free account <ArrowRight className="w-4 h-4" />
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

      {/* Footer */}
      <footer className="border-t border-gray-800">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-brand-600 flex items-center justify-center">
              <Zap className="w-3 h-3 text-white" />
            </div>
            <span className="text-xs text-gray-500">WA Integration</span>
          </div>
          <div className="flex items-center gap-6">
            <Link
              to="/"
              className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
            >
              Home
            </Link>
            <Link
              to="/public-docs"
              className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
            >
              Docs
            </Link>
            <Link
              to="/login"
              className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
            >
              Login
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
