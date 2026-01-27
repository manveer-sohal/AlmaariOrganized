import React, { useEffect, useMemo } from "react";
import ClothesCard from "./clothesCard";
import { useClothesStore } from "../../store/useClothesStore";
import LoadingClothesCard from "./loadingclothesCard";
import { AnimatePresence } from "framer-motion";
import { ClothingItem } from "../../types/clothes";
import { useClothesData } from "../../hooks/useClothesData";
import { useInView } from "react-intersection-observer";
function DisplayClothes() {
  const { filters } = useClothesStore();
  const { colour, type, search } = filters;
  const numberOfClothes = 30; // TODO: make this dynamic
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

      const matchesSearch =
        search.length === 0 ||
        item.type.toLowerCase().includes(search) ||
        item.colour.some((c) => c.toLowerCase().includes(search));

      return matchesColour && matchesType && matchesSearch;
    });
  }, [clothes, colour, type, search]);

  return (
    <div className="justify-self-center w-full grid justify-center  p-2 text-center order-first grid-cols-[repeat(auto-fill,90px)] sm:grid-cols-[repeat(auto-fill,120px)] md:grid-cols-[repeat(auto-fill,150px)] lg:grid-cols-[repeat(auto-fill,200px)]">
      {isLoadingClothes ? (
        Array.from({ length: 20 }, (_, index) => (
          <LoadingClothesCard key={index} index={index} />
        ))
      ) : error ? (
        <p className="text-xl">Error loading clothes</p>
      ) : clothes.length === 0 ? (
        <p className="text-xl">Add Some Clothes!</p>
      ) : (
        <AnimatePresence mode="popLayout">
          {filteredClothes.map((item: ClothingItem) => (
            <ClothesCard
              key={item._id}
              colour={item.colour}
              type={item.type}
              imageSrc={item.imageSrc}
              _id={item._id}
              slot={item.slot}
            />
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
