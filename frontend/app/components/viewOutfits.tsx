"use client";
import { useMemo, useState } from "react";
import Image from "next/image";
import { useUser } from "@auth0/nextjs-auth0/client";
import OutfitOption from "./outfitOption";
import { ClothingItem, Outfit } from "../types/clothes";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

function ViewOutfits() {
  const { user } = useUser();
  const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";
  const [activeId, setActiveId] = useState<string | null>(null);

  const { data: outfits = [], isLoading: loading } = useQuery({
    queryKey: ["outfits", user?.sub],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/api/clothes/getOutfits`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ auth0Id: user?.sub }),
      });
      if (!response.ok) throw new Error("Failed to fetch outfits");
      const data = await response.json();
      console.log(data.outfits);
      const outfits = [...data.outfits].reverse();
      if (!Array.isArray(outfits)) {
        return [];
      }
      return outfits;
    },

    enabled: !!user,
  });

  function useDeleteOutfit() {
    const client = useQueryClient();

    return useMutation({
      mutationFn: async (id: string) => {
        const response = await fetch(
          `${API_BASE_URL}/api/clothes/deleteOutfit`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ auth0Id: user?.sub, uniqueId: id }),
          }
        );
        if (!response.ok) throw new Error("Failed to delete outfit");
        return response.json();
      },
      // OPTIMISTIC UPDATE

      onMutate: async (id: string) => {
        await client.cancelQueries({ queryKey: ["outfits", user?.sub] });

        const previousData = client.getQueryData(["outfits", user?.sub]);

        client.setQueryData(["outfits", user?.sub], (old: Outfit[]) => {
          return old?.filter((outfit: Outfit) => outfit.uniqueId !== id);
        });

        return { previousData };
      },

      // On error, rollback
      onError: (_err, _vars, context) => {
        if (context?.previousData) {
          client.setQueryData(["outfits", user?.sub], context.previousData);
        }
      },

      // After it's done, invalidate the query
      onSettled: () => {
        client.invalidateQueries({ queryKey: ["outfits", user?.sub] });
      },
    });
  }

  const deleteOutfit = useDeleteOutfit();

  const activeOutfit = useMemo(
    () => outfits.find((o: Outfit) => o.uniqueId === activeId) || null,
    [outfits, activeId]
  );

  return (
    <div className="p-4 w-full max-w-2xl mx-auto">
      <div className="bg-white/80 backdrop-blur border border-indigo-200 rounded-xl p-3 shadow-md">
        <h3 className="font-medium text-indigo-900 mb-3">Your Outfits</h3>
        {loading ? (
          <div className="flex justify-center items-center h-[260px]">
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-indigo-500"></div>
          </div>
        ) : outfits.length === 0 ? (
          <p className="text-indigo-900">No outfits yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              {outfits.map((o: Outfit) => (
                <OutfitOption
                  key={o.uniqueId}
                  outfit={o}
                  activeId={activeId}
                  setActiveId={setActiveId}
                  onDelete={() => deleteOutfit.mutate(o.uniqueId)}
                />
              ))}
            </div>

            <div className="md:col-span-2">
              {!activeOutfit ? (
                <div className="text-indigo-900">
                  Select an outfit to preview
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {activeOutfit.outfit_items.map((item: ClothingItem) => (
                    <div
                      key={item._id}
                      className="border border-indigo-200 rounded-lg p-2 flex items-center gap-3"
                    >
                      <Image
                        src={item.imageSrc}
                        alt={item.type}
                        width={80}
                        height={80}
                        className="rounded object-cover"
                      />
                      <div>
                        <div className="text-sm text-indigo-900 font-medium">
                          {item.type}
                        </div>
                        <div className="flex gap-1 mt-1">
                          {(item.colour || []).slice(0, 6).map((c, idx) => (
                            <span
                              key={`${item._id}-c-${idx}`}
                              className="h-3 w-3 rounded border border-indigo-200"
                              style={{ backgroundColor: c }}
                              title={c}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ViewOutfits;
