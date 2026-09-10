import type { Variants } from "framer-motion";

/** Stagger-fade-up used for the initial page-load card reveal. */
export const staggerContainer: Variants = {
  hidden: { opacity: 1 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.07, delayChildren: 0.05 },
  },
};

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } },
};

/** Pressed-in feedback for any interactive card/button. */
export const tapFeedback = {
  whileTap: { scale: 0.97 },
  whileHover: { scale: 1.005 },
  transition: { type: "spring" as const, stiffness: 400, damping: 28 },
};
