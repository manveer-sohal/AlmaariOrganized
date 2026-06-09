import Image from "next/image";
import React, { useState } from "react";
import { useUser } from "@auth0/nextjs-auth0/client";
import {
  InfiniteData,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ClothingItem } from "../../types/clothes";
import { Trash } from "lucide-react";

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
  onSelect,
}: ClothesCardProps) {
  const { user } = useUser();
  const [loaded, setLoaded] = useState(false);

  function useDeleteClothes() {
    const client = useQueryClient();

    return useMutation({
      mutationFn: async () => {
        const res = await fetch("/api/clothes/remove", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            auth0Id: user?.sub,
            uniqueId: _id,
          }),
        });

        if (!res.ok) throw new Error("Failed to delete clothing");
      },
      onMutate: async () => {
        await client.cancelQueries({ queryKey: ["clothesData"] });

        const previousQueries = client.getQueriesData({
          queryKey: ["clothesData"],
        });

        client.setQueriesData(
          { queryKey: ["clothesData"] },
          (old: InfiniteData<ClothingItem[]>) => {
            if (!old?.pages) return old;

            return {
              ...old,
              pages: old.pages.map((page: ClothingItem[]) =>
                page.filter((item) => item._id !== _id),
              ),
            };
          },
        );

        return { previousQueries };
      },
      onError: (_err, _vars, context) => {
        context?.previousQueries?.forEach(([key, data]) => {
          client.setQueryData(key, data);
        });
      },
    });
  }

  const deleteClothes = useDeleteClothes();

  const item: ClothingItem = {
    _id,
    type,
    colour,
    slot,
    material,
    fit,
    pattern,
    imageSrc,
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.2, rotate: -10 }}
      transition={{ duration: 0.1 }}
      className="border border-indigo-300 p-1 bg-slate-100 rounded-sm w-[90px] h-[90px] sm:w-[120px] sm:h-[120px] md:w-[150px] md:h-[150px] lg:w-[200px] lg:h-[200px] shadow-lg relative overflow-hidden cursor-pointer transition-transform ease-in-out duration-300 hover:scale-105 hover:shadow-2xl group"
    >
      <button
        type="button"
        aria-label="Delete clothing item"
        onClick={(e) => {
          e.stopPropagation();
          deleteClothes.mutate();
        }}
        className={`absolute top-2 right-2 z-10 rounded-full bg-red-500 text-white p-1.5 shadow-lg hover:bg-red-600 active:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-300 transition-all duration-200 opacity-80 md:opacity-0 md:group-hover:opacity-100`}
      >
        <Trash className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
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
          alt={type || "Clothing item"}
          width={200}
          height={200}
          className={`object-cover w-full h-full transition-all duration-100 ease-in-out ${
            loaded ? "blur-0 scale-100" : "blur-sm scale-105"
          }`}
          onLoad={() => setLoaded(true)}
          loading="lazy"
          fetchPriority="high"
        />
      </div>
    </motion.div>
  );
}
