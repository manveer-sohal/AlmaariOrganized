import Image from "next/image";
import React, { useState } from "react";
import { useUser } from "@auth0/nextjs-auth0/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ClothingItem } from "../types/clothes";

export default function ClothesCard({ imageSrc, _id }: ClothingItem) {
  const [click, setClick] = useState<boolean>(false);
  // const [loading, setLoading] = useState<boolean>(false);
  const { user } = useUser(); // Auth0 user information
  const [loaded, setLoaded] = useState(false);

  const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";

  function useDeleteClothes() {
    const client = useQueryClient();

    return useMutation({
      mutationFn: () =>
        fetch(`${API_BASE_URL}/api/clothes/remove`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ auth0Id: user?.sub, uniqueId: _id }),
        }),

      // OPTIMISTIC UPDATE
      onMutate: async () => {
        await client.cancelQueries({ queryKey: ["clothes", user?.sub] });

        const previousData = client.getQueryData(["clothes", user?.sub]);

        client.setQueryData(["clothes", user?.sub], (old: ClothingItem[]) => {
          return old?.filter((item: ClothingItem) => item._id !== _id);
        });

        return { previousData };
      },

      // On error, rollback
      onError: (_err, _vars, context) => {
        if (context?.previousData) {
          client.setQueryData(["clothes", user?.sub], context.previousData);
        }
      },

      // After it's done, invalidate the query
      onSettled: () => {
        client.invalidateQueries({ queryKey: ["clothes", user?.sub] });
      },
    });
  }

  const deleteClothes = useDeleteClothes();

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.2, rotate: -10 }}
      transition={{ duration: 0.1 }}
      className="border border-indigo-300 m-2 p-2 bg-slate-100 rounded-md w-[200px] h-[200px] shadow-lg relative overflow-hidden cursor-pointer transition-transform ease-in-out duration-300 hover:scale-105 hover:shadow-2xl"
    >
      {" "}
      <div onClick={() => setClick(!click)} className="h-full w-full">
        {/* {loading ? (
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-indigo-500 absolute inset-0 m-auto"></div>
        ) : ( */}
        <Image
          src={imageSrc || ""}
          alt="Clothing item"
          width={200}
          height={200}
          className={`object-cover w-full h-full transition-all duration-100 ease-in-out ${
            loaded ? "blur-0 scale-100" : "blur-sm scale-105"
          }`}
          onLoad={() => setLoaded(true)}
          loading="lazy"
          fetchPriority="high"
        />
        {/* )}*/}
      </div>
      {click && (
        <button
          onClick={() => deleteClothes.mutate()}
          className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-4 py-2 rounded-full shadow-lg hover:bg-red-600 active:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-300 transition-all duration-300"
        >
          Delete me
        </button>
      )}
    </motion.div>
  );
}
