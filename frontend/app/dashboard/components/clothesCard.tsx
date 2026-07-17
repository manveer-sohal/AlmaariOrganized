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
  isSample,
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
    isSample,
    stylingMetadata,
  };

  const subtypeLabel = humanizeClothingSubtype(item);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.92 }}
      transition={{
        layout: { type: "spring", stiffness: 320, damping: 34, mass: 0.8 },
        opacity: { duration: 0.2 },
        scale: { duration: 0.2 },
      }}
      className="group relative aspect-square w-full max-w-[200px] cursor-pointer overflow-hidden rounded-sm border border-indigo-300 bg-slate-100 p-1 shadow-lg transition-[transform,box-shadow] duration-300 ease-out hover:z-[1] hover:scale-[1.03] hover:shadow-2xl"
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

      {isSample ? (
        <span className="absolute top-1.5 left-1.5 z-[1] rounded-md bg-indigo-600/90 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white shadow-sm">
          Sample
        </span>
      ) : null}

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
          className={`h-full w-full object-cover transition-[filter,transform] duration-300 ease-out ${
            loaded ? "scale-100 blur-0" : "scale-105 blur-sm"
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
