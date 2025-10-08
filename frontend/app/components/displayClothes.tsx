import React, { useState, useEffect, useCallback } from "react";
import { useUser } from "@auth0/nextjs-auth0/client";
import ClothesCard from "./clothesCard";
import { useClothesStore } from "../store/useClothesStore";

type DisplayClothesProps = {
  query:
    | {
        colour: string[] | null | undefined;
        type: string[] | null | undefined;
      }
    | undefined;
  searchTerm?: string;
};

function DisplayClothes({ query, searchTerm = "" }: DisplayClothesProps) {
  const { clothes, setClothes } = useClothesStore();

  const [filteredClothesCard, setFilteredClothesCard] = useState<
    { _id: string; colour: string[]; type: string; imageSrc: string }[]
  >([]);

  const [hasLoaded, setHasLoaded] = useState(false); // Track if data is loaded

  //change this
  const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";

  const { user, isLoading } = useUser();

  const display = useCallback(
    (
      clothesList: {
        _id: string;
        colour: string[];
        type: string;
        imageSrc: string;
      }[]
    ) => {
      const colourList = query?.colour ?? [];
      const typeList = query?.type ?? [];
      const term = searchTerm.trim().toLowerCase();

      const filteredList = clothesList.filter((item) => {
        const matchesColour =
          colourList.length === 0 ||
          item.colour.some((c) => colourList.includes(c));
        const matchesType =
          typeList.length === 0 || typeList.includes(item.type);
        const matchesSearch =
          term.length === 0 ||
          item.type.toLowerCase().includes(term) ||
          item.colour.some((c) => c.toLowerCase().includes(term));
        return matchesColour && matchesType && matchesSearch;
      });

      setFilteredClothesCard(filteredList);
    },
    [query, searchTerm]
  );

  const loadClothes = useCallback(async () => {
    if (!user) return;

    try {
      console.log("attempting to list clothes");
      const auth0Id = user.sub;
      const response = await fetch(`${API_BASE_URL}/api/clothes/listClothes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ auth0Id }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch clothes data.");
      }

      const data = await response.json();
      const clothesList = data.Clothes.reverse(); // Latest clothes first
      setClothes(clothesList);
      console.log(clothesList);
      setHasLoaded(true);
    } catch (error) {
      console.error("Error fetching clothes:", error);
    }
  }, [user, API_BASE_URL, setClothes]);

  useEffect(() => {
    if (!user || (hasLoaded && !query)) return;

    loadClothes();
  }, [user, hasLoaded, query, loadClothes]);

  useEffect(() => {
    if (!hasLoaded) return;
    display(clothes);
  }, [clothes, display, hasLoaded]);

  if (isLoading) {
    return <p>Loading...</p>;
  }

  return (
    <div className="rounded-[15px] w-[83%] h-full grid grid-cols-[repeat(auto-fill,_200px)] justify-center p-2 text-center order-first">
      {!hasLoaded ? (
        <div className="flex justify-center items-center w-full h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-indigo-500"></div>
        </div>
      ) : clothes.length === 0 ? (
        <p className="text-xl">Add Some Clothes!</p>
      ) : filteredClothesCard.length === 0 ? (
        <p className="text-xl">No clothes found for this query</p>
      ) : (
        filteredClothesCard.map((item) => (
          <ClothesCard
            key={item._id}
            colour={item.colour}
            type={item.type}
            imageSrc={item.imageSrc}
            id={item._id}
            onDelete={loadClothes} // Pass the reload function
          />
        ))
      )}
    </div>
  );
}

export default DisplayClothes;
