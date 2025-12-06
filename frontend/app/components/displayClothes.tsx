import React, { useMemo, useState } from "react";
import { useUser } from "@auth0/nextjs-auth0/client";
import ClothesCard from "./clothesCard";
import { useClothesStore } from "../store/useClothesStore";
import { useQuery } from "@tanstack/react-query";
import LoadingClothesCard from "./loadingclothesCard";
import { AnimatePresence } from "framer-motion";
import { ClothingItem } from "../types/clothes";
function DisplayClothes() {
  // const { clothes, setClothes } = useClothesStore();
  console.log("DisplayClothes");
  const { filters } = useClothesStore();
  const { colour, type, search } = filters;
  const [isMobile] = useState(true);
  const { user, isLoading: isLoadingUser } = useUser();
  //change this
  const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";

  const { data: clothes, isLoading: isLoadingClothes, error } = useQuery({
    queryKey: ["clothes", user?.sub],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/api/clothes/listClothes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          auth0Id: user?.sub,
        }),
      });
      if (!response.ok) throw new Error("Failed to fetch clothes");
      const data = await response.json();
      console.log(data);
      return data.Clothes;
    },
    enabled: !!user,
  });

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

  if (isLoadingUser) {
    return <p>Loading...</p>;
  }

  return (
    <div
      className={`justify-self-center rounded-[15px] ${
        isMobile ? "w-full" : "w-[83%]"
      } h-full grid justify-center p-2 text-center order-first`}
      style={{
        gridTemplateColumns: `repeat(auto-fill, ${
          isMobile ? "80px" : "200px"
        })`,
      }}
    >
      {isLoadingClothes ? (
        // <div className="flex justify-center items-center w-full h-[60vh]">
        //   <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-indigo-500"></div>
        // </div>
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
        </AnimatePresence>
      )}
    </div>
  );
}

export default DisplayClothes;
