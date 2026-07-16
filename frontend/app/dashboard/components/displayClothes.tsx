import React, { useEffect, useMemo } from "react";
import Image from "next/image";
import ClothesCard from "./clothesCard";
import { useClothesStore } from "../../store/useClothesStore";
import LoadingClothesCard from "./loadingclothesCard";
import { AnimatePresence, motion } from "framer-motion";
import { ClothingItem } from "../../types/clothes";
import { useClothesData } from "../../hooks/useClothesData";
import { useInView } from "react-intersection-observer";

type DisplayClothesProps = {
  onSelectItem?: (item: ClothingItem) => void;
};

function EmptyWardrobeState() {
  return (
    <motion.div
      className="col-span-full flex min-h-[min(70vh,32rem)] flex-col items-center justify-center px-4 py-10"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
    >
      <div className="relative flex flex-col items-center">
        <div
          role="status"
          className="relative z-10 mb-3 max-w-[15rem] rounded-2xl border-[3px] border-[#273157]  px-4 py-3 text-center text-base font-semibold leading-snug text-[#273157] shadow-sm sm:text-lg"
        >
          Add some clothes!
          <span
            aria-hidden
            className="absolute left-1/2 top-full -mt-px -translate-x-1/2 border-x-[11px] border-t-[14px] border-x-transparent border-t-[#273157]"
          />
          <span
            aria-hidden
            className="absolute left-1/2 top-full -translate-x-1/2 translate-y-[-2px] border-x-[8px] border-t-[11px] border-x-transparent border-t-[#F9F7F1]"
          />
        </div>

        <Image
          src="/almaari-mascot-chilling.png"
          alt="Almaari mascot waving"
          width={280}
          height={280}
          priority
          className="h-auto w-[min(72vw,260px)] select-none"
        />
      </div>
    </motion.div>
  );
}

function DisplayClothes({ onSelectItem }: DisplayClothesProps) {
  const { filters } = useClothesStore();
  const { colour, type, material, fit, pattern, search } = filters;
  const numberOfClothes = 20; // TODO: make this dynamic
  const {
    clothes,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoadingClothes,
    error,
  } = useClothesData(numberOfClothes);
  const { ref, inView } = useInView();
  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const filteredClothes = useMemo(() => {
    if (!clothes) return [];

    return clothes.filter((item: ClothingItem) => {
      const matchesColour =
        colour.length === 0 || item.colour.some((c) => colour.includes(c));

      const matchesType = type.length === 0 || type.includes(item.type);

      const matchesMaterial =
        material.length === 0 ||
        (item.material != null && material.includes(item.material));

      const matchesFit =
        fit.length === 0 || (item.fit != null && fit.includes(item.fit));

      const matchesPattern =
        pattern.length === 0 ||
        (item.pattern != null && pattern.includes(item.pattern));

      const matchesSearch =
        search.length === 0 ||
        item.type.toLowerCase().includes(search) ||
        item.colour.some((c) => c.toLowerCase().includes(search)) ||
        (item.material?.toLowerCase().includes(search) ?? false) ||
        (item.fit?.toLowerCase().includes(search) ?? false) ||
        (item.pattern?.toLowerCase().includes(search) ?? false);

      return (
        matchesColour &&
        matchesType &&
        matchesMaterial &&
        matchesFit &&
        matchesPattern &&
        matchesSearch
      );
    });
  }, [clothes, colour, type, material, fit, pattern, search]);

  return (
    <div className="justify-self-center w-full grid justify-center  p-2 text-center order-first grid-cols-[repeat(auto-fill,120px)] sm:grid-cols-[repeat(auto-fill,120px)] md:grid-cols-[repeat(auto-fill,150px)] lg:grid-cols-[repeat(auto-fill,200px)]">
      {isLoadingClothes ? (
        Array.from({ length: 20 }, (_, index) => (
          <LoadingClothesCard key={index} index={index} />
        ))
      ) : error && clothes.length === 0 ? (
        <p className="col-span-full text-xl">Error loading clothes</p>
      ) : clothes.length === 0 ? (
        <EmptyWardrobeState />
      ) : (
        <AnimatePresence mode="popLayout">
          {filteredClothes.map((item: ClothingItem) => (
            <ClothesCard key={item._id} {...item} onSelect={onSelectItem} />
          ))}
          {isFetchingNextPage &&
            Array.from({ length: 20 }, (_, index) => (
              <LoadingClothesCard key={index} index={index} />
            ))}
        </AnimatePresence>
      )}
      {hasNextPage && <div ref={ref} className="h-10 w-full"></div>}
    </div>
  );
}

export default DisplayClothes;
