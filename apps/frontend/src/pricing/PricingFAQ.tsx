import { faqs } from "./pricing-data";

export default function PricingFAQ() {
  return (
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
  );
}
