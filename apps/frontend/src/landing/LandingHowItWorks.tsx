const steps = [
  {
    n: "01",
    title: "Create a Provider Config",
    desc: "Choose Baileys, Meta Cloud, or BSP. For Baileys, scan a QR code to connect your number.",
  },
  {
    n: "02",
    title: "Create & Activate a Session",
    desc: "Link your provider config to a session. Activate it to establish the WhatsApp connection.",
  },
  {
    n: "03",
    title: "Generate an API Key",
    desc: "Create an API key from the dashboard. Copy it once — it's hashed and never shown again.",
  },
  {
    n: "04",
    title: "Send Messages",
    desc: "Call POST /v1/messages/send from your app with your API key and session ID.",
  },
];

export default function LandingHowItWorks() {
  return (
    <section
      id="how-it-works"
      className="border-y border-gray-800 bg-gray-900/30"
    >
      <div className="max-w-6xl mx-auto px-6 py-24">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold text-white mb-3">
            Get started in minutes
          </h2>
          <p className="text-gray-400 text-sm">
            No complex setup. Self-host and start sending in 4 steps.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((s, i) => (
            <div key={s.n} className="relative">
              {i < steps.length - 1 && (
                <div className="hidden lg:block absolute top-6 left-full w-full h-px bg-gray-800 -translate-x-3 z-0" />
              )}
              <div className="relative z-10 space-y-3">
                <div className="w-12 h-12 rounded-xl bg-brand-600/15 border border-brand-800/40 flex items-center justify-center">
                  <span className="text-brand-400 font-bold text-sm">
                    {s.n}
                  </span>
                </div>
                <p className="text-sm font-semibold text-white">{s.title}</p>
                <p className="text-xs text-gray-400 leading-relaxed">
                  {s.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
