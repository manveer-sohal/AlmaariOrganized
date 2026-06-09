"use client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useUser } from "@auth0/nextjs-auth0/client";
import OutfitBrowser from "./OutfitBrowser";
import { Outfit } from "../../types/clothes";
import { useOutfits } from "../../hooks/useOutfits";

function ViewOutfits() {
  const { user } = useUser();
  const { data: outfits = [], isLoading: loading } = useOutfits();

  function useDeleteOutfit() {
    const client = useQueryClient();

    return useMutation({
      mutationFn: async (id: string) => {
        const response = await fetch(`/api/clothes/deleteOutfit`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ auth0Id: user?.sub, uniqueId: id }),
        });
        if (!response.ok) throw new Error("Failed to delete outfit");
        return response.json();
      },
      onMutate: async (id: string) => {
        await client.cancelQueries({ queryKey: ["outfits", user?.sub] });

        const previousData = client.getQueryData(["outfits", user?.sub]);

        client.setQueryData(["outfits", user?.sub], (old: Outfit[]) => {
          return old?.filter((outfit: Outfit) => outfit.uniqueId !== id);
        });

        return { previousData };
      },
      onError: (_err, _vars, context) => {
        if (context?.previousData) {
          client.setQueryData(["outfits", user?.sub], context.previousData);
        }
      },
      onSettled: () => {
        client.invalidateQueries({ queryKey: ["outfits", user?.sub] });
      },
    });
  }

  const deleteOutfit = useDeleteOutfit();

  return (
    <div className="bg-indigo-200 p-4 w-full lg:max-w-6xl max-w-5xl mx-auto">
      <div className="bg-white/80 backdrop-blur border border-indigo-200 rounded-xl p-3 shadow-md overflow-hidden">
        <OutfitBrowser
          outfits={outfits}
          loading={loading}
          onDeleteOutfit={(id) => deleteOutfit.mutate(id)}
        />
      </div>
    </div>
  );
}

export default ViewOutfits;
