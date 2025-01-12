import React, { useState, useEffect, useCallback } from "react";
import { useUser } from "@auth0/nextjs-auth0/client";
import ClothesCard from "./clothesCard";
// //const [query, setQuery] = useState<
//     | { colour: string[] | null | undefined; type: string[] | null | undefined }
//     | undefined
//   >();
type DisplayClothes = {
  query:
    | {
        colour: string[] | null | undefined;
        type: string[] | null | undefined;
      }
    | undefined;
};

//change filterclothescard and clothes card to same thing
function DisplayClothes({ query }: DisplayClothes) {
  // const [typeFilter, setTypeFilter] = useState<string[] | null>([]);
  // const [colourFilter, setColourFilter] = useState<string[] | null>([]);
  // const [clothesCard, setClothesCard] = useState<
  //   { colour: string[]; type: string; imageSrc: string }[] | null
  // >([]);

  const [filteredClothesCard, setFilteredClothesCard] = useState<
    { colour: string[]; type: string; imageSrc: string }[]
  >([]);
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

  const { user, isLoading } = useUser();
  const [hasLoaded, setHasLoaded] = useState(false); // State to track if data is loaded

  const display = useCallback(
    (clothesList: { colour: string[]; type: string; imageSrc: string }[]) => {
      setFilteredClothesCard([]);
      const colourList = query?.colour;
      const typeList = query?.type;

      const checkColour = (item: {
        colour: string[];
        type: string;
        imageSrc: string;
      }) => {
        if (
          typeof colourList == "undefined" ||
          colourList == null ||
          colourList.length == 0
        ) {
          return true;
        } else {
          for (const item2 of item.colour) {
            if (colourList?.includes(item2) == true) {
              return true;
            }
          }
        }
      };

      const checkType = (item: {
        colour: string[];
        type: string;
        imageSrc: string;
      }) => {
        if (
          typeof typeList == "undefined" ||
          typeList == null ||
          typeList.length == 0
        ) {
          return true;
        } else {
          return typeList?.includes(item.type);
        }
      };

      clothesList.map(
        (item: { colour: string[]; type: string; imageSrc: string }) => {
          if (checkType(item) && checkColour(item)) {
            setFilteredClothesCard((filteredClothesCard) => [
              ...filteredClothesCard,
              item,
            ]);
          }
        }
      );
    },
    [query?.colour, query?.type]
  );

  useEffect(() => {
    //console.log(query.filter);
    if (!user || (hasLoaded && typeof query == "undefined")) return;
    const load = async () => {
      try {
        const auth0Id = user.sub;
        const response = await fetch(
          `${API_BASE_URL}/api/clothes/listClothes`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ auth0Id }),
          }
        );
        const data = await response.json();
        const clothesList = data.Clothes.reverse();
        console.log(query);
        if (
          typeof query == "undefined" ||
          (query.colour == null && query.type == null) ||
          (query.colour?.length == 0 && query.type?.length == 0)
        ) {
          setFilteredClothesCard(clothesList);
        } else {
          display(clothesList);
        }
        setHasLoaded(true);
      } catch (error) {
        console.error("Error fetching clothes:", error);
      }
    };
    load();
  }, [user, hasLoaded, query, API_BASE_URL, display]);

  if (isLoading) {
    return <p>Loading...</p>;
  }

  return (
    <div className="rounded-[15px] w-[83%] h-full grid grid-cols-[repeat(auto-fill,_200px)] justify-center p-2 text-center order-first">
      {!hasLoaded && (
        <h1
          style={{
            fontSize: 120,
            textAlign: "center",
          }}
        >
          pictures are loading...
        </h1>
      )}
      {filteredClothesCard.map((item, index) => (
        <ClothesCard
          key={index}
          colour={item.colour}
          type={item.type}
          imageSrc={item.imageSrc}
        />
      ))}
    </div>
  );
}

export default DisplayClothes;
