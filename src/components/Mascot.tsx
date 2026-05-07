import { motion } from "framer-motion";

type Props = {
  size?: number;
  mood?: "default" | "happy" | "tired" | "celebrating";
  className?: string;
};

/** Dodger the tired-but-supportive raccoon. */
export function Mascot({ size = 96, mood = "default", className }: Props) {
  const isHappy = mood === "happy" || mood === "celebrating";
  const isTired = mood === "tired";
  const eyeScale = isHappy ? 1.15 : isTired ? 0.7 : 1;
  const mouthPath = isHappy
    ? "M26 46 Q32 52 38 46"
    : isTired
    ? "M28 48 Q32 46 36 48"
    : "M28 48 Q32 50 36 48";

  return (
    <motion.svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={className}
      initial={{ scale: 0.9, opacity: 0 }}
      animate={
        mood === "celebrating"
          ? { scale: [1, 1.1, 1], rotate: [0, -5, 5, 0], opacity: 1 }
          : { scale: 1, opacity: 1 }
      }
      transition={{ duration: 0.6 }}
    >
      {/* body shadow */}
      <ellipse cx="32" cy="56" rx="18" ry="3" fill="rgba(0,0,0,0.15)" />
      {/* head */}
      <ellipse cx="32" cy="36" rx="22" ry="20" fill="#94a3b8" />
      {/* ears outer */}
      <circle cx="14" cy="20" r="7" fill="#94a3b8" />
      <circle cx="50" cy="20" r="7" fill="#94a3b8" />
      {/* ears inner */}
      <circle cx="14" cy="21" r="3.5" fill="#475569" />
      <circle cx="50" cy="21" r="3.5" fill="#475569" />
      {/* face cream */}
      <ellipse cx="32" cy="40" rx="15" ry="13" fill="#e2e8f0" />
      {/* mask */}
      <ellipse cx="23" cy="34" rx="8" ry="6.5" fill="#1e293b" />
      <ellipse cx="41" cy="34" rx="8" ry="6.5" fill="#1e293b" />
      {/* eyes */}
      <motion.g animate={{ scale: eyeScale }} style={{ originX: 0.5, originY: 0.5 }}>
        <circle cx="23" cy="34" r="2.4" fill="#fde68a" />
        <circle cx="41" cy="34" r="2.4" fill="#fde68a" />
        <circle cx="23.6" cy="33.4" r="0.8" fill="#fff" />
        <circle cx="41.6" cy="33.4" r="0.8" fill="#fff" />
      </motion.g>
      {/* nose */}
      <ellipse cx="32" cy="42" rx="2.6" ry="1.9" fill="#0f172a" />
      {/* mouth */}
      <path d={mouthPath} stroke="#0f172a" strokeWidth="1.6" fill="none" strokeLinecap="round" />
      {/* whiskers */}
      <path d="M18 44 L10 43" stroke="#475569" strokeWidth="1" strokeLinecap="round" />
      <path d="M18 46 L10 47" stroke="#475569" strokeWidth="1" strokeLinecap="round" />
      <path d="M46 44 L54 43" stroke="#475569" strokeWidth="1" strokeLinecap="round" />
      <path d="M46 46 L54 47" stroke="#475569" strokeWidth="1" strokeLinecap="round" />
      {/* sparkle when celebrating */}
      {mood === "celebrating" && (
        <>
          <text x="6" y="14" fontSize="10">✨</text>
          <text x="50" y="12" fontSize="10">✨</text>
        </>
      )}
    </motion.svg>
  );
}
