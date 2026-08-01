"use client";

import { ReactNode } from "react";
import { AnimatePresence } from "framer-motion";
import { ClothingItem } from "../../types/clothes";
import ClothingCard from "./ClothingCard";

type ClothingGridProps = {
  items: ClothingItem[];
  onSelectItem?: (item: ClothingItem) => void;
  onStyleItem?: (item: ClothingItem) => void;
  header?: ReactNode;
  empty?: ReactNode;
  loading?: boolean;
  loadingCount?: number;
  sentinel?: ReactNode;
};

function SkeletonCard({ index }: { index: number }) {
  return (
    <div
      className="aspect-[4/5] animate-pulse rounded-almaari bg-almaari-chrome/40"
      style={{ animationDelay: `${index * 40}ms` }}
      aria-hidden
    />
  );
}

export default function ClothingGrid({
  items,
  onSelectItem,
  onStyleItem,
  header,
  empty,
  loading,
  loadingCount = 8,
  sentinel,
}: ClothingGridProps) {
  return (
    <div className="w-full">
      {header}
      {loading ? (
        <div className="grid grid-cols-2 gap-3 px-3 pb-4 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: loadingCount }, (_, i) => (
            <SkeletonCard key={i} index={i} />
          ))}
        </div>
      ) : items.length === 0 && empty ? (
        empty
      ) : (
        <div className="grid grid-cols-2 gap-3 px-3 pb-4 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          <AnimatePresence mode="popLayout">
            {items.map((item) => (
              <ClothingCard
                key={item._id}
                item={item}
                onSelect={onSelectItem}
                onStyle={onStyleItem}
              />
            ))}
          </AnimatePresence>
          {sentinel}
        </div>
      )}
    </div>
  );
}
