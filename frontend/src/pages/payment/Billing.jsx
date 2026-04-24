import React, { useState } from "react";
import { Check, Zap, Crown, Sparkles, ExternalLink } from "lucide-react";
import { userAPI } from "../../api";
import useAuthStore from "../../store/authStore";
import Button from "../../components/common/Button";
import { formatCurrency, getPlanBadge } from "../../utils/helpers";
import toast from "react-hot-toast";

const PLANS = [
  {
    id: "lite",
    name: "Lite",
    price: 0,
    icon: Sparkles,
    color: "from-gray-400 to-gray-500",
    features: [
      "1 board",
      "View-only sharing",
      "InkBoard Library",
      "Basic tools",
    ],
    notIncluded: ["Share with edit access", "AI InkBoard tools"],
  },
  {
    id: "pro",
    name: "Pro",
    price: 500,
    icon: Zap,
    color: "from-blue-500 to-cyan-500",
    popular: true,
    features: [
      "10 boards",
      "Share with edit access",
      "Share view access",
      "InkBoard Library",
      "Real-time collaboration",
      "All drawing tools",
    ],
    notIncluded: ["AI InkBoard tools"],
  },
  {
    id: "premium",
    name: "Premium",
    price: 30000,
    icon: Crown,
    color: "from-purple-500 to-primary-500",
    features: [
      "Unlimited boards",
      "Share with edit access",
      "Share view access",
      "InkBoard Library",
      "Real-time collaboration",
      "AI Text to Diagram",
      "AI Mermaid to Board",
      "AI Wireframe to Code",
      "All drawing tools",
      "Priority support",
    ],
    notIncluded: [],
  },
];

export default function Billing() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(null);
  const [qrModal, setQrModal] = useState(null);

  const currentPlan = getPlanBadge(user?.plan);

  const handleUpgrade = async (planId) => {
    if (planId === "lite") return;
    if (planId === user?.plan) return toast("You're already on this plan");
    setLoading(planId);
    try {
      const { data } = await userAPI.createPayment({ plan: planId });
      setQrModal(data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || "Payment failed");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
          Choose Your Plan
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          Current plan:{" "}
          <span
            className={`font-semibold px-2 py-0.5 rounded-full text-sm ${currentPlan.color}`}
          >
            {currentPlan.label}
          </span>
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {PLANS.map((plan) => {
          const Icon = plan.icon;
          const isCurrent = user?.plan === plan.id;
          return (
            <div
              key={plan.id}
              className={`card p-6 relative flex flex-col transition-all duration-200
                          ${plan.popular ? "ring-2 ring-primary-500 shadow-lg scale-105" : "hover:shadow-md"}`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="gradient-brand text-white text-xs font-bold px-3 py-1 rounded-full shadow">
                    Most Popular
                  </span>
                </div>
              )}

              <div
                className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${plan.color} flex items-center justify-center mb-4`}
              >
                <Icon className="w-6 h-6 text-white" />
              </div>

              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                {plan.name}
              </h3>

              <div className="my-3">
                {plan.price === 0 ? (
                  <span className="text-3xl font-bold text-gray-900 dark:text-white">
                    Free
                  </span>
                ) : (
                  <div>
                    <span className="text-3xl font-bold text-gray-900 dark:text-white">
                      {formatCurrency(plan.price)}
                    </span>
                    <span className="text-gray-400 text-sm">/mo</span>
                  </div>
                )}
              </div>

              <div className="flex-1 space-y-2.5 mb-6">
                {plan.features.map((f) => (
                  <div key={f} className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-600 dark:text-gray-300">
                      {f}
                    </span>
                  </div>
                ))}
                {plan.notIncluded.map((f) => (
                  <div key={f} className="flex items-start gap-2 opacity-40">
                    <span className="w-4 h-4 flex-shrink-0 flex items-center justify-center text-gray-400 mt-0.5">
                      ✕
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400 line-through">
                      {f}
                    </span>
                  </div>
                ))}
              </div>

              <Button
                fullWidth
                variant={
                  isCurrent ? "secondary" : plan.popular ? "primary" : "outline"
                }
                loading={loading === plan.id}
                disabled={isCurrent || plan.id === "lite"}
                onClick={() => handleUpgrade(plan.id)}
              >
                {isCurrent
                  ? "Current Plan"
                  : plan.id === "lite"
                    ? "Free Plan"
                    : `Upgrade to ${plan.name}`}
              </Button>
            </div>
          );
        })}
      </div>

      {/* QR Payment Modal */}
      {qrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="card p-8 max-w-sm w-full text-center animate-scale-in">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Complete Payment
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">
              Scan the QR code below to pay via QRIS
            </p>
            <div className="bg-white rounded-2xl p-4 inline-block mb-4 shadow-inner">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrModal.qr_string)}`}
                alt="QR Code"
                className="w-44 h-44"
              />
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              {formatCurrency(qrModal.total_payment || qrModal.amount)}
            </p>
            <p className="text-xs text-gray-400 mb-6">
              Order: {qrModal.order_id}
            </p>
            <div className="space-y-2">
              <a
                href={qrModal.payment_url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary w-full justify-center"
              >
                <ExternalLink className="w-4 h-4" /> Open Payment Page
              </a>
              <Button
                fullWidth
                variant="secondary"
                onClick={() => setQrModal(null)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
