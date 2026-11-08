const providers = [
  {
    name: "Baileys",
    badge: "Free",
    badgeColor: "bg-brand-900/40 text-brand-400 border-brand-800/40",
    desc: "WhatsApp Web — connect any number via QR or pairing code. No business account needed.",
    detail: "Best for personal use, testing, and small-scale deployments.",
  },
  {
    name: "Meta Cloud API",
    badge: "Official",
    badgeColor: "bg-blue-900/40 text-blue-400 border-blue-800/40",
    desc: "Official WhatsApp Business API via Meta. Best for high-volume production use.",
    detail: "Requires a WhatsApp Business account approved by Meta.",
  },
  {
    name: "BSP / Partner",
    badge: "Custom",
    badgeColor: "bg-purple-900/40 text-purple-400 border-purple-800/40",
    desc: "Connect via any Business Solution Provider with a custom base URL.",
    detail: "Works with Twilio, MessageBird, and other BSP partners.",
  },
];

export default function LandingProviders() {
  return (
    <section className="border-y border-gray-800 bg-gray-900/30">
      <div className="max-w-6xl mx-auto px-6 py-14">
        <p className="text-center text-xs text-gray-500 uppercase tracking-widest mb-8">
          Supported Providers
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {providers.map((p) => (
            <div
              key={p.name}
              className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-3 hover:border-gray-700 transition-colors"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-white">{p.name}</p>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${p.badgeColor}`}
                >
                  {p.badge}
                </span>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">{p.desc}</p>
              <p className="text-[11px] text-gray-600">{p.detail}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
