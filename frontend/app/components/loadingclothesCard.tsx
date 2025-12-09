import { motion } from "framer-motion";
import { useClothesStore } from "../store/useClothesStore";

export default function LoadingClothesCard({ index }: { index: number }) {
  const { isMobile } = useClothesStore();
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className={`relative w-[${isMobile ? "80px" : "200px"}] h-[${
        isMobile ? "80px" : "200px"
      }] border rounded-md overflow-hidden shadow-md`}
    >
      <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200 animate-[shimmer_2s_infinite]" />
    </motion.div>
  );
}
