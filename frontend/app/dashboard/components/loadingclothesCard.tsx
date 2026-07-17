import { motion } from "framer-motion";

export default function LoadingClothesCard({
  index,
  smaller = false,
}: {
  index: number;
  smaller?: boolean;
}) {
  // Match ClothesCard sizes on the main dashboard; smaller is for outfit preview slots.
  const classNames = smaller
    ? "w-[80px] h-[80px] md:w-[110px] md:h-[110px]"
    : "w-[120px] h-[120px] sm:w-[120px] sm:h-[120px] md:w-[150px] md:h-[150px] lg:w-[200px] lg:h-[200px]";
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className={`relative ${classNames} border border-indigo-300 rounded-sm overflow-hidden shadow-lg bg-slate-100`}
    >
      <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200 animate-[shimmer_2s_infinite]" />
    </motion.div>
  );
}
