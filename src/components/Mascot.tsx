import { motion } from "framer-motion";

type Props = {
  size?: number;
  mood?: "default" | "happy" | "tired" | "celebrating";
  className?: string;
};

const SRC: Record<NonNullable<Props["mood"]>, string> = {
  default: "/mascot.png",
  happy: "/mascot-celebrating.png",
  tired: "/mascot-tired.png",
  celebrating: "/mascot-celebrating.png",
};

export function Mascot({ size = 96, mood = "default", className }: Props) {
  const src = SRC[mood];
  return (
    <motion.img
      src={src}
      alt=""
      aria-hidden="true"
      draggable={false}
      width={size}
      height={size}
      className={className}
      style={{ width: size, height: size, objectFit: "contain", userSelect: "none" }}
      initial={{ scale: 0.9, opacity: 0 }}
      animate={
        mood === "celebrating"
          ? { scale: [1, 1.12, 0.98, 1.06, 1], rotate: [0, -6, 6, -3, 0], opacity: 1 }
          : { scale: 1, opacity: 1 }
      }
      transition={
        mood === "celebrating"
          ? { duration: 0.8, ease: "easeOut" }
          : { duration: 0.35 }
      }
    />
  );
}
