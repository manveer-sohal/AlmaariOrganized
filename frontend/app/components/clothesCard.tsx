import Image from "next/image";
import React, { useState } from "react";
import { useUser } from "@auth0/nextjs-auth0/client";

export type ClothingItemProps = {
  colour: string[];
  type: string;
  imageSrc: string;
  id: string; // Unique ID for the clothing item
  onDelete: () => void; // Function to refetch data after deletion
};

export default function ClothesCard({
  imageSrc,
  id,
  onDelete,
}: ClothingItemProps) {
  const [click, setClick] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const { user } = useUser(); // Auth0 user information
  const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";
  const removeClothingItem = async () => {
    setLoading(true);
    if (!user) {
      console.error("User is not authenticated. Cannot remove clothing item.");
      return;
    }

    const auth0Id = user.sub;

    try {
      const response = await fetch(`${API_BASE_URL}/api/clothes/remove`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ auth0Id, uniqueId: id }), // Pass the correct `id`
      });

      const data = await response.json();
      if (response.ok) {
        console.log("Clothing item removed successfully:", data);
        onDelete();
        setLoading(false);
      } else {
        console.error("Error removing clothing item:", data.error);
      }
    } catch (error) {
      console.error("Failed to remove clothing item:", error);
    }
  };

  return (
    <div className="border border-indigo-300 m-2 p-2 bg-slate-100 rounded-md w-[200px] h-[200px] shadow-lg relative overflow-hidden cursor-pointer transition-transform ease-in-out duration-300 hover:scale-105 hover:shadow-2xl">
      <div onClick={() => setClick(!click)} className="h-full w-full">
        {loading ? (
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-indigo-500 absolute inset-0 m-auto"></div>
        ) : (
          <Image
            src={imageSrc}
            alt="Clothing item"
            width={200}
            height={200}
            className="object-contain w-full h-full absolute inset-0"
          />
        )}
      </div>
      {click && (
        <button
          onClick={removeClothingItem}
          className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-4 py-2 rounded-full shadow-lg hover:bg-red-600 active:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-300 transition-all duration-300"
        >
          Delete me
        </button>
      )}
    </div>
  );
}
