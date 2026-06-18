import toast from "react-hot-toast";

const baseOptions = {
  duration: 2600,
  style: {
    background: "#FFFFFF",
    border: "1px solid #E5E7EB",
    borderRadius: "16px",
    boxShadow: "0 18px 50px rgba(17, 24, 39, 0.12)",
    color: "#111827",
    fontSize: "14px",
    fontWeight: 600,
    padding: "12px 14px",
  },
};

export const notify = {
  success: (message) =>
    toast.success(message, {
      ...baseOptions,
      iconTheme: {
        primary: "#10B981",
        secondary: "#FFFFFF",
      },
    }),
  error: (message) =>
    toast.error(message, {
      ...baseOptions,
      iconTheme: {
        primary: "#EF4444",
        secondary: "#FFFFFF",
      },
    }),
  info: (message) =>
    toast(message, {
      ...baseOptions,
      icon: "•",
    }),
};
