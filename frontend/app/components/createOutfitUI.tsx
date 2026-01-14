import React, { useEffect, useMemo, useState, useCallback } from "react";
import Image from "next/image";
import { useUser } from "@auth0/nextjs-auth0/client";
import almaariMascot from "../almaari-mascot.png";
import almaariMascotThinking from "../almaari-mascot-thinking.png";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ClothingItem, Slot } from "../types/clothes";

function CreateOutfitUI() {
  const { user } = useUser();
  const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";
  const queryClient = useQueryClient();
  const [mascotState, setMascotState] = useState<string>("thinking");
  const [selectedBySlot, setSelectedBySlot] = useState<
    Partial<Record<Slot, ClothingItem[] | null>>
  >({ head: null, body: null, legs: null, feet: null });
  const [name, setName] = useState<string>("");
  const [saving, setSaving] = useState<boolean>(false);
  const [aiMessages, setAiMessages] = useState<string[]>([]);

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
    [clothes]
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

  const selectedItems = useMemo(() => {
    return Object.keys(selectedBySlot)
      .map((s) => selectedBySlot[s as Slot])
      .filter((v): v is ClothingItem[] => Boolean(v));
  }, [selectedBySlot]);

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

  const generateAiThoughts = useCallback((): string => {
    setMascotState("thinking");
    if (selectedItems.length === 0) {
      return "Select items to start building your outfit. I’ll review color balance and pieces as you go.";
    }
    console.log("selectedItems", selectedItems);
    const parts = selectedItems.map((i) => i.map((c) => c.type.toLowerCase()));
    const colours = selectedItems.flatMap((i) => i.map((c) => c.colour) || []);
    const uniqueColours = Array.from(new Set(colours));
    const summary = `Current picks: ${parts.join(", ")}.`;
    const colourNote =
      uniqueColours.length > 0 ? ` Palette: ${uniqueColours.join(", ")}.` : "";
    const tips: string[] = [];
    if (uniqueColours.length >= 3)
      tips.push("Consider limiting to 2–3 core colours for cohesion.");
    if (
      parts.some((p) => p.includes("jacket")) &&
      parts.some((p) => p.includes("shorts"))
    )
      tips.push("Layering with shorts works best in mild weather.");
    if (
      uniqueColours.some((c) =>
        /black|white|beige|grey|navy/i.test((c as unknown) as string)
      )
    )
      tips.push(
        "Neutrals detected — easy to pair. Add one accent colour for pop."
      );
    if (tips.length === 0)
      tips.push("Looks balanced. Try contrasting textures or an accent piece.");
    setMascotState("idle");
    return `${summary}${colourNote} ${tips.join(" ")}`;
  }, [selectedItems]);

  useEffect(() => {
    setAiMessages([generateAiThoughts()]);
  }, [generateAiThoughts]);

  return (
    <div className="bg-indigo-200 w-full min-h-screen top-0 z-10 p-4 h-full">
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

      <div className="grid grid-rows-[0.5fr,0.3fr,0.4fr] lg:grid-cols-[0.5fr,0.3fr,0.4fr] gap-4 pl-2">
        <div
          id="create-outfit-form"
          className="bg-white/80 backdrop-blur border border-indigo-200 rounded-xl p-3 shadow-md"
        >
          <h3 className="font-medium text-indigo-900 mb-2">Your Clothes</h3>
          {isLoadingClothes ? (
            <div className="flex justify-center items-center h-[260px]">
              <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-indigo-500"></div>
            </div>
          ) : error ? (
            <div className="flex justify-center items-center h-[260px]">
              <p className="text-indigo-900">Error loading clothes</p>
            </div>
          ) : (
            <div className="grid grid-cols-[repeat(auto-fill,_80px)] md:grid-cols-[repeat(auto-fill,_110px)] gap-3 justify-center overflow-y-auto max-h-[200px] sm:max-h-[500px] md:max-h-[800px]">
              {clothes?.map((item: ClothingItem) => {
                const isSelected = selectedItems.some((s) =>
                  s.some((c) => c._id === item._id)
                );
                return (
                  <button
                    key={item._id}
                    type="button"
                    onClick={() => toggleSelect(item._id)}
                    className={`relative border rounded-lg overflow-hidden  md:h-[120px] md:w-[120px] h-[80px] w-[80px] ${
                      isSelected
                        ? "ring-2 ring-indigo-500"
                        : "border-indigo-200"
                    }`}
                  >
                    <Image
                      src={item.imageSrc}
                      alt={item.type}
                      width={120}
                      height={120}
                      className="object-cover h-full w-full"
                    />
                    <span className="absolute bottom-1 left-1 bg-white/80 text-indigo-900 text-[10px] px-1.5 py-0.5 rounded">
                      {item.slot}
                    </span>
                    {isSelected && (
                      <span className="absolute top-1 right-1 bg-indigo-600 text-white text-[10px] px-2 py-0.5 rounded-full">
                        Selected
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div
          id="outfit-preview"
          className="w-full bg-white/80 backdrop-blur border border-indigo-200 rounded-xl p-3 shadow-md"
        >
          <h3 className="font-medium text-indigo-900 mb-2">Outfit Preview</h3>
          <div className="flex flex-col gap-3">
            {Object.keys(selectedBySlot).map((slot) => {
              const item = selectedBySlot[slot as Slot];
              return (
                <div
                  key={slot}
                  className="border border-indigo-200 w-full rounded-lg p-3 min-h-[140px] flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="text-sm text-indigo-900 capitalize w-16 shrink-0">
                      {slot}
                    </div>
                    {item && item.length > 0 ? (
                      <div className="relative h-[110px] w-[180px]">
                        {item.map((i: ClothingItem, idx: number) => (
                          <div
                            key={i._id}
                            className="absolute top-0"
                            style={{ left: `${idx * 20}px`, zIndex: idx + 1 }}
                          >
                            <Image
                              onClick={() =>
                                setSelectedBySlot((prev) => ({
                                  ...prev,
                                  [i.slot]: prev[i.slot]?.filter(
                                    (c: ClothingItem) => c._id !== i._id
                                  ),
                                }))
                              }
                              src={i.imageSrc}
                              alt={i.type}
                              width={100}
                              height={100}
                              className="object-cover rounded border border-indigo-200 shadow-sm"
                            />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-[110px] w-[110px] rounded-md bg-indigo-50 border border-indigo-200">
                        {slot === "head" && (
                          <svg
                            width="48"
                            height="48"
                            viewBox="0 0 64 64"
                            fill="none"
                            aria-hidden="true"
                          >
                            <circle
                              cx="32"
                              cy="24"
                              r="12"
                              stroke="#4f46e5"
                              strokeWidth="3"
                            />
                            <rect
                              x="24"
                              y="36"
                              width="16"
                              height="6"
                              rx="3"
                              fill="#4f46e5"
                            />
                          </svg>
                        )}
                        {slot === "body" && (
                          <svg
                            width="60"
                            height="48"
                            viewBox="0 0 80 64"
                            fill="none"
                            aria-hidden="true"
                          >
                            <rect
                              x="24"
                              y="8"
                              width="32"
                              height="30"
                              rx="6"
                              stroke="#4f46e5"
                              strokeWidth="3"
                            />
                            <rect
                              x="6"
                              y="12"
                              width="14"
                              height="18"
                              rx="6"
                              stroke="#4f46e5"
                              strokeWidth="3"
                            />
                            <rect
                              x="60"
                              y="12"
                              width="14"
                              height="18"
                              rx="6"
                              stroke="#4f46e5"
                              strokeWidth="3"
                            />
                          </svg>
                        )}
                        {slot === "legs" && (
                          <svg
                            width="60"
                            height="48"
                            viewBox="0 0 80 64"
                            fill="none"
                            aria-hidden="true"
                          >
                            <rect
                              x="24"
                              y="8"
                              width="10"
                              height="30"
                              rx="4"
                              stroke="#4f46e5"
                              strokeWidth="3"
                            />
                            <rect
                              x="46"
                              y="8"
                              width="10"
                              height="30"
                              rx="4"
                              stroke="#4f46e5"
                              strokeWidth="3"
                            />
                          </svg>
                        )}
                        {slot === "feet" && (
                          <svg
                            width="60"
                            height="48"
                            viewBox="0 0 80 64"
                            fill="none"
                            aria-hidden="true"
                          >
                            <ellipse
                              cx="30"
                              cy="32"
                              rx="10"
                              ry="6"
                              stroke="#4f46e5"
                              strokeWidth="3"
                            />
                            <ellipse
                              cx="50"
                              cy="32"
                              rx="10"
                              ry="6"
                              stroke="#4f46e5"
                              strokeWidth="3"
                            />
                          </svg>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div
          id="ai-stylist"
          className="bg-white/80 backdrop-blur border border-indigo-200 rounded-xl p-3 shadow-md"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="leading-tight">
                <h3 className="font-medium text-indigo-900">AI Stylist</h3>
                <div className="text-[10px] text-indigo-700/70">
                  Almaari Assistant
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setAiMessages([generateAiThoughts()])}
              className="inline-flex items-center justify-center gap-2 text-xs font-medium px-3 h-8 rounded-lg cursor-pointer border border-indigo-300 bg-indigo-100/70 text-indigo-900 hover:bg-indigo-500 hover:text-white"
            >
              Refresh
            </button>
          </div>
          <div className="h-[260px] overflow-auto space-y-2 pr-1">
            {aiMessages.map((m, idx) => (
              <div key={`ai-${idx}`} className="flex items-start">
                <Image
                  src={
                    mascotState === "thinking"
                      ? almaariMascotThinking.src
                      : almaariMascot.src
                  }
                  alt="AI"
                  width={60}
                  height={16}
                  className="mt-0.5"
                />
                <div className="relative bg-indigo-50 border border-indigo-100 text-indigo-900 text-sm p-2 rounded-lg max-w-[90%]">
                  {m}
                  <span
                    className="absolute -left-1 top-3 h-0 w-0 border-t-8 border-b-8 border-r-8 border-t-transparent border-b-transparent border-r-indigo-100"
                    aria-hidden="true"
                  ></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default CreateOutfitUI;
