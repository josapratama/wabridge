import { Link } from "react-router-dom";
import { Check, Clock } from "lucide-react";
import { plans } from "./pricing-data";

export default function PricingPlans() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
      {plans.map((plan) => (
        <div
          key={plan.name}
          className={`relative bg-gray-900 border-2 ${plan.color} rounded-2xl p-6 space-y-6 ${!plan.available ? "opacity-75" : ""}`}
        >
          {/* Badge */}
          {plan.badge && (
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span
                className={`px-3 py-1 text-[10px] font-bold rounded-full ${
                  plan.badge === "Coming Soon"
                    ? "bg-gray-700 text-gray-400 border border-gray-600"
                    : "bg-brand-600 text-white"
                }`}
              >
                {plan.badge}
              </span>
            </div>
          )}

          {/* Header */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center ${plan.available ? "bg-gray-800" : "bg-gray-800/50"}`}
              >
                <plan.icon
                  className={`w-4 h-4 ${plan.available ? "text-brand-400" : "text-gray-600"}`}
                />
              </div>
              <p className="text-sm font-semibold text-white">{plan.name}</p>
            </div>
            <div className="flex items-baseline gap-1">
              <span
                className={`text-3xl font-bold ${plan.available ? "text-white" : "text-gray-500"}`}
              >
                {plan.price}
              </span>
              <span className="text-xs text-gray-500">{plan.sub}</span>
            </div>
            <p className="text-xs text-gray-400">{plan.desc}</p>
          </div>

          {/* CTA */}
          {plan.available ? (
            <Link
              to={plan.ctaLink}
              className={`block text-center py-2.5 rounded-xl text-sm font-medium transition-colors ${plan.ctaStyle}`}
            >
              {plan.cta}
            </Link>
          ) : (
            <div className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium bg-gray-800/50 border border-gray-700 text-gray-500">
              <Clock className="w-4 h-4" />
              Not yet available
            </div>
          )}

          {/* Features */}
          <div className="space-y-2.5">
            {plan.features.map((f) => (
              <div key={f} className="flex items-start gap-2">
                <Check
                  className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${plan.available ? "text-brand-400" : "text-gray-600"}`}
                />
                <span
                  className={`text-xs ${plan.available ? "text-gray-300" : "text-gray-500"}`}
                >
                  {f}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
