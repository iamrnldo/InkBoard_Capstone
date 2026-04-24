// src/pages/payment/Payment.jsx
import React, { useEffect, useState } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { CheckCircle, XCircle, Clock, ArrowRight } from "lucide-react";
import { userAPI } from "../../api";
import useAuthStore from "../../store/authStore";
import Button from "../../components/common/Button";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import { formatCurrency, getPlanBadge } from "../../utils/helpers";

export default function Payment() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { fetchMe, user } = useAuthStore();
  const [status, setStatus] = useState("loading");
  const [paymentData, setPaymentData] = useState(null);

  const orderId = params.get("order_id");

  useEffect(() => {
    const checkPayment = async () => {
      try {
        // Re-fetch user to get updated plan
        await fetchMe();

        if (orderId) {
          // Get payment history to find this order
          const { data } = await userAPI.getPaymentHistory();
          const payment = data.data.find((p) => p.order_id === orderId);
          if (payment) {
            setPaymentData(payment);
            setStatus(payment.status === "paid" ? "success" : payment.status);
          } else {
            setStatus("pending");
          }
        } else {
          setStatus("success");
        }
      } catch (_) {
        setStatus("error");
      }
    };

    checkPayment();
  }, [orderId, fetchMe]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <LoadingSpinner size="lg" className="mx-auto" />
          <p className="text-gray-500">Checking payment status…</p>
        </div>
      </div>
    );
  }

  const planBadge = getPlanBadge(paymentData?.plan || user?.plan);

  const configs = {
    success: {
      icon: CheckCircle,
      iconColor: "text-green-500",
      title: "Payment Successful! 🎉",
      subtitle: `Your ${planBadge.label} plan is now active.`,
      bgColor:
        "from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950",
    },
    pending: {
      icon: Clock,
      iconColor: "text-yellow-500",
      title: "Payment Pending",
      subtitle: "We're waiting for your payment confirmation.",
      bgColor:
        "from-yellow-50 to-amber-50 dark:from-yellow-950 dark:to-amber-950",
    },
    failed: {
      icon: XCircle,
      iconColor: "text-red-500",
      title: "Payment Failed",
      subtitle: "Your payment could not be processed.",
      bgColor: "from-red-50 to-rose-50 dark:from-red-950 dark:to-rose-950",
    },
    expired: {
      icon: XCircle,
      iconColor: "text-gray-400",
      title: "Payment Expired",
      subtitle: "The payment session has expired.",
      bgColor: "from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950",
    },
    error: {
      icon: XCircle,
      iconColor: "text-red-500",
      title: "Something went wrong",
      subtitle: "We couldn't verify your payment status.",
      bgColor: "from-red-50 to-rose-50 dark:from-red-950 dark:to-rose-950",
    },
  };

  const config = configs[status] || configs.pending;
  const Icon = config.icon;

  return (
    <div
      className={`min-h-screen bg-gradient-to-br ${config.bgColor} flex items-center justify-center p-4`}
    >
      <div className="card p-10 max-w-md w-full text-center shadow-xl animate-scale-in">
        <Icon className={`w-20 h-20 mx-auto mb-5 ${config.iconColor}`} />

        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          {config.title}
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mb-6">
          {config.subtitle}
        </p>

        {/* Payment details */}
        {paymentData && (
          <div className="bg-gray-50 dark:bg-gray-750 rounded-xl p-4 mb-6 text-left space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Order ID</span>
              <span className="font-mono text-xs text-gray-700 dark:text-gray-300">
                {paymentData.order_id}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Plan</span>
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded-full ${planBadge.color}`}
              >
                {planBadge.label}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Amount</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {formatCurrency(
                  paymentData.total_payment || paymentData.amount,
                )}
              </span>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-3">
          {status === "success" ? (
            <Button
              fullWidth
              size="lg"
              onClick={() => navigate("/dashboard")}
              icon={ArrowRight}
            >
              Go to Dashboard
            </Button>
          ) : status === "pending" ? (
            <>
              <Button fullWidth onClick={() => window.location.reload()}>
                Check Status Again
              </Button>
              <Button
                fullWidth
                variant="secondary"
                onClick={() => navigate("/billing")}
              >
                Back to Billing
              </Button>
            </>
          ) : (
            <>
              <Button fullWidth onClick={() => navigate("/billing")}>
                Try Again
              </Button>
              <Button
                fullWidth
                variant="ghost"
                onClick={() => navigate("/dashboard")}
              >
                Go to Dashboard
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
