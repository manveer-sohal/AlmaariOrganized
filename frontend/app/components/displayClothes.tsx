import React, { useState, useEffect, useCallback } from "react";
import { useUser } from "@auth0/nextjs-auth0/client";
import ClothesCard from "./clothesCard";

type DisplayClothesProps = {
  query:
    | {
        colour: string[] | null | undefined;
        type: string[] | null | undefined;
      }
    | undefined;
};

function DisplayClothes({ query }: DisplayClothesProps) {
  const [filteredClothesCard, setFilteredClothesCard] = useState<
    { _id: string; colour: string[]; type: string; imageSrc: string }[]
  >([]);
  const [hasLoaded, setHasLoaded] = useState(false); // Track if data is loaded

  //change this
  const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001";

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

      const filteredList = clothesList.filter((item) => {
        const matchesColour =
          colourList.length === 0 ||
          item.colour.some((c) => colourList.includes(c));
        const matchesType =
          typeList.length === 0 || typeList.includes(item.type);
        return matchesColour && matchesType;
      });

      setFilteredClothesCard(filteredList);
    },
    [query]
  );

  const loadClothes = useCallback(async () => {
    if (!user) return;

    try {
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

      if (!query || (!query.colour?.length && !query.type?.length)) {
        setFilteredClothesCard(clothesList); // Show all if no filters
      } else {
        display(clothesList); // Filtered display
      }

      setHasLoaded(true);
    } catch (error) {
      console.error("Error fetching clothes:", error);
    }
  }, [user, API_BASE_URL, query, display]);

  useEffect(() => {
    if (!user || (hasLoaded && !query)) return;

    loadClothes();
  }, [user, hasLoaded, query, loadClothes]);

  if (isLoading) {
    return <p>Loading...</p>;
  }

  return (
    <div className="rounded-[15px] w-[83%] h-full grid grid-cols-[repeat(auto-fill,_200px)] justify-center p-2 text-center order-first">
      {!hasLoaded ? (
        <div className="flex justify-center items-center w-full h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-indigo-500"></div>
        </div>
      ) : filteredClothesCard.length === 0 ? (
        <p className="text-xl">No clothes match the selected filters.</p>
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
