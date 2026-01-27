import { motion } from "framer-motion";

export default function LoadingClothesCard({
  index,
  smaller = false,
}: {
  index: number;
  smaller?: boolean;
}) {
  //size is if it is being shown in outfit preview or not
  const classNames = smaller
    ? "w-[80px] h-[80px] md:w-[110px] md:h-[110px]"
    : "w-[80px] h-[80px] md:w-[200px] md:h-[200px]";
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className={`relative ${classNames} border rounded-md overflow-hidden shadow-md`}
    >
      <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200 animate-[shimmer_2s_infinite]" />
    </motion.div>
  );
}
