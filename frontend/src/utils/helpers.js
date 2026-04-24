import { formatDistanceToNow, format } from "date-fns";

export const timeAgo = (date) =>
  formatDistanceToNow(new Date(date), { addSuffix: true });
export const formatDate = (date, fmt = "MMM d, yyyy") =>
  format(new Date(date), fmt);
export const formatCurrency = (amount, currency = "IDR") =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency }).format(
    amount,
  );

export const getPlanColor = (plan) =>
  ({ lite: "gray", pro: "blue", premium: "purple" })[plan] ?? "gray";

export const getPlanBadge = (plan) =>
  ({
    lite: {
      label: "Lite",
      color: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300",
    },
    pro: {
      label: "Pro",
      color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    },
    premium: {
      label: "Premium",
      color:
        "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
    },
  })[plan] ?? { label: plan, color: "bg-gray-100 text-gray-600" };

export const truncate = (str, n = 30) =>
  str?.length > n ? str.slice(0, n) + "…" : str;

export const generateAvatarUrl = (name) =>
  `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=6366f1&textColor=ffffff`;

export const PLAN_LIMITS = {
  lite: { boards: 1, share_access: false, share_view: true, ai: false },
  pro: { boards: 10, share_access: true, share_view: true, ai: false },
  premium: { boards: -1, share_access: true, share_view: true, ai: true },
};

export const canUseAI = (plan) => PLAN_LIMITS[plan]?.ai ?? false;
export const canShareEdit = (plan) => PLAN_LIMITS[plan]?.share_access ?? false;
export const getBoardLimit = (plan) => PLAN_LIMITS[plan]?.boards ?? 1;
