import { useEffect } from "react";
import confetti from "canvas-confetti";
import { AnimatePresence, motion } from "framer-motion";
import { Mascot } from "./Mascot";

type Props = {
  open: boolean;
  quote: string;
  onClose: () => void;
};

export function CelebrationOverlay({ open, quote, onClose }: Props) {
  useEffect(() => {
    if (!open) return;
    const fire = (particleRatio: number, opts: confetti.Options) => {
      confetti({
        origin: { y: 0.7 },
        particleCount: Math.floor(200 * particleRatio),
        ...opts,
      });
    };
    fire(0.25, { spread: 26, startVelocity: 55 });
    fire(0.2, { spread: 60 });
    fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
    fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
    fire(0.1, { spread: 120, startVelocity: 45 });

    const t = setTimeout(onClose, 2400);
    return () => clearTimeout(t);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
        >
          <motion.div
            initial={{ scale: 0.8, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", stiffness: 240, damping: 18 }}
            className="card max-w-xs mx-4 text-center shadow-xl pointer-events-auto"
          >
            <div className="flex justify-center">
              <Mascot size={110} mood="celebrating" />
            </div>
            <p className="mt-2 font-display text-lg leading-snug">{quote}</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
