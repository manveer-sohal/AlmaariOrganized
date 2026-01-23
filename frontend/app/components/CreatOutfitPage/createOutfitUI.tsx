import React, { useEffect, useMemo, useState } from "react";
import { useUser } from "@auth0/nextjs-auth0/client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ClothingItem, Slot } from "../../types/clothes";
import { useGenerateAiThoughts } from "../../hooks/useGenerateAiThoughts";
import UsersClothes from "./UsersClothes";
import OutfitPreview from "./OutfitPreview";
import AiStylist from "./AiStylist";
const DEFAULT_AI_MESSAGE =
  "Select items to start building your outfit. I’ll review color balance and pieces as you go.";
function CreateOutfitUI() {
  const { user } = useUser();
  const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";
  const queryClient = useQueryClient();
  const [selectedBySlot, setSelectedBySlot] = useState<
    Partial<Record<Slot, ClothingItem[] | null>>
  >({ head: null, body: null, legs: null, feet: null });
  const [name, setName] = useState<string>("");
  const [saving, setSaving] = useState<boolean>(false);
  const [aiMessages, setAiMessages] = useState<string[]>([DEFAULT_AI_MESSAGE]);
  // const [mascotState, setMascotState] = useState<string>("thinking");

  const selectedItems = useMemo(() => {
    return Object.values(selectedBySlot).filter(
      (v): v is ClothingItem[] => Array.isArray(v) && v.length > 0,
    );
  }, [selectedBySlot]);

  const { thoughts, isLoadingThoughts, errorThoughts } = useGenerateAiThoughts(
    selectedItems,
  );

  const mascotState = useMemo(() => {
    return isLoadingThoughts || errorThoughts ? "thinking" : "idle";
  }, [isLoadingThoughts, errorThoughts]);

  useEffect(() => {
    if (selectedItems.length === 0) {
      setAiMessages([DEFAULT_AI_MESSAGE]);
    } else if (thoughts) {
      const message = `${thoughts.insights}${
        thoughts.nextStep ? `Next Step: ${thoughts.nextStep}` : ""
      }`;
      setAiMessages([message]);
    }
  }, [thoughts, selectedItems]);

  const { data: clothes, isLoading: isLoadingClothes, error } = useQuery({
    queryKey: ["clothes", user?.sub],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/api/clothes/listClothes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ auth0Id: user?.sub }),
      });
      if (!response.ok) throw new Error("Failed to fetch clothes");
      const data = await response.json();
      return data.Clothes;
    },
    enabled: !!user,
  });

  const clothesById = useMemo(
    () => new Map(clothes?.map((c: ClothingItem) => [c._id, c])),
    [clothes],
  );

  const toggleSelect = (id: string) => {
    const item = clothesById.get(id) as ClothingItem;

    console.log(item);
    if (!item) return;
    setSelectedBySlot((prev) => {
      const current = prev[item.slot as Slot];
      if (current && current.length > 0 && current.some((c) => c._id === id)) {
        return { ...prev, [item.slot]: current.filter((c) => c._id !== id) };
      }
      return { ...prev, [item.slot]: [...(current || []), item] };
    });
  };

  const saveOutfit = async () => {
    if (!user || selectedItems.length === 0) return;
    setSaving(true);
    try {
      const payload = {
        auth0Id: user.sub,
        name,
        colour: JSON.stringify([]),
        season: JSON.stringify([]),
        waterproof: false,
        outfit_items: selectedItems.map((i) => ({
          _id: i.map((c) => c._id),
        })),
      };

      const response = await fetch(`${API_BASE_URL}/api/clothes/createOutfit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error("Failed to save outfit");
      setSelectedBySlot({ head: null, body: null, legs: null, feet: null });
      setName("");
      queryClient.invalidateQueries({ queryKey: ["onboarding"] });
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  // const generateAiThoughts = useCallback((): string => {
  //   setMascotState("thinking");
  //   if (selectedItems.length === 0) {
  //     return "Select items to start building your outfit. I’ll review color balance and pieces as you go.";
  //   }
  //   console.log("selectedItems", selectedItems);
  //   const parts = selectedItems.map((i) => i.map((c) => c.type.toLowerCase()));
  //   const colours = selectedItems.flatMap((i) => i.map((c) => c.colour) || []);
  //   const uniqueColours = Array.from(new Set(colours));
  //   const summary = `Current picks: ${parts.join(", ")}.`;
  //   const colourNote =
  //     uniqueColours.length > 0 ? ` Palette: ${uniqueColours.join(", ")}.` : "";
  //   const tips: string[] = [];
  //   if (uniqueColours.length >= 3)
  //     tips.push("Consider limiting to 2–3 core colours for cohesion.");
  //   if (
  //     parts.some((p) => p.includes("jacket")) &&
  //     parts.some((p) => p.includes("shorts"))
  //   )
  //     tips.push("Layering with shorts works best in mild weather.");
  //   if (
  //     uniqueColours.some((c) =>
  //       /black|white|beige|grey|navy/i.test((c as unknown) as string),
  //     )
  //   )
  //     tips.push(
  //       "Neutrals detected — easy to pair. Add one accent colour for pop.",
  //     );
  //   if (tips.length === 0)
  //     tips.push("Looks balanced. Try contrasting textures or an accent piece.");
  //   setMascotState("idle");
  //   return `${summary}${colourNote} ${tips.join(" ")}`;
  // }, [selectedItems]);

  // useEffect(() => {
  //   setAiMessages([generateAiThoughts()]);
  // }, [generateAiThoughts]);

  return (
    <div className="bg-indigo-200 rounded-xl w-full top-0 z-10 p-4 h-screen ">
      {/* Outfit name and save outfit button */}
      <div className="flex items-center justify-between mb-4 md:mr-40">
        <div className="flex justify-end w-full gap-2">
          <input
            id="create-outfit-form-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Outfit name (optional)"
            className=" w-full md:w-1/2 rounded-xl border border-indigo-300 bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />
          <button
            disabled={saving || selectedItems.length === 0}
            onClick={saveOutfit}
            className="inline-flex items-center justify-center gap-2 font-medium px-4 h-10 rounded-xl cursor-pointer bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save Outfit"}
          </button>
        </div>
      </div>
      {/* Your Clothes, Outfit Preview, AI Stylist */}
      <div className="grid lg:grid-cols-[0.5fr,0.3fr,0.4fr] gap-4 pl-2">
        {/* Users Clothes */}
        <UsersClothes
          isLoadingClothes={isLoadingClothes}
          error={error}
          clothes={clothes}
          selectedItems={selectedItems}
          toggleSelect={toggleSelect}
        />
        {/* Outfit Preview */}
        <OutfitPreview
          selectedBySlot={selectedBySlot}
          setSelectedBySlot={setSelectedBySlot}
        />
        {/* AI Stylist */}
        <AiStylist aiMessages={aiMessages} mascotState={mascotState} />
      </div>
    </div>
  );
}

export default CreateOutfitUI;
