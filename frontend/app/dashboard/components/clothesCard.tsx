import Image from "next/image";
import React, { useState } from "react";
import { motion } from "framer-motion";
import { ClothingItem } from "../../types/clothes";
import { Trash } from "lucide-react";
import { useDeleteClothing } from "../../hooks/useDeleteClothing";
import { humanizeClothingSubtype } from "../../utils/clothingSubtype";

type ClothesCardProps = ClothingItem & {
  onSelect?: (item: ClothingItem) => void;
};

export default function ClothesCard({
  imageSrc,
  _id,
  type,
  colour,
  slot,
  material,
  fit,
  pattern,
  stylingMetadata,
  onSelect,
}: ClothesCardProps) {
  const [loaded, setLoaded] = useState(false);
  const deleteClothes = useDeleteClothing(_id);

  const item: ClothingItem = {
    _id,
    type,
    colour,
    slot,
    material,
    fit,
    pattern,
    imageSrc,
    stylingMetadata,
  };

  const subtypeLabel = humanizeClothingSubtype(item);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.2, rotate: -10 }}
      transition={{ duration: 0.1 }}
      className="border border-indigo-300 p-1 bg-slate-100 rounded-sm w-[120px] h-[120px] sm:w-[120px] sm:h-[120px] md:w-[150px] md:h-[150px] lg:w-[200px] lg:h-[200px] shadow-lg relative overflow-hidden cursor-pointer transition-transform ease-in-out duration-300 hover:scale-105 hover:shadow-2xl group"
    >
      {/* Delete on desktop only — mobile delete lives in ClothingDetailsView */}
      <button
        type="button"
        aria-label="Delete clothing item"
        onClick={(e) => {
          e.stopPropagation();
          deleteClothes.mutate();
        }}
        className="hidden md:block absolute top-2 right-2 z-10 rounded-full bg-red-500 text-white p-1.5 shadow-lg hover:bg-red-600 active:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-300 transition-all duration-200 opacity-0 group-hover:opacity-100"
      >
        <Trash className="w-4 h-4" />
      </button>

      <div
        onClick={() => onSelect?.(item)}
        className="h-full w-full"
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onSelect?.(item);
          }
        }}
      >
        <Image
          src={imageSrc || ""}
          alt={subtypeLabel}
          width={200}
          height={200}
          className={`object-cover w-full h-full transition-all duration-100 ease-in-out ${
            loaded ? "blur-0 scale-100" : "blur-sm scale-105"
          }`}
          onLoad={() => setLoaded(true)}
          loading="lazy"
          fetchPriority="high"
        />
        <span className="absolute bottom-1.5 left-1.5 z-[1] max-w-[calc(100%-40px)] truncate rounded-md bg-white/90 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-800 shadow-sm">
          {subtypeLabel}
        </span>
      </div>
    </motion.div>
  );
}
