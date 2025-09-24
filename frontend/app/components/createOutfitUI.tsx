import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useUser } from "@auth0/nextjs-auth0/client";
import Link from "next/link";

type ClothingItem = {
  _id: string;
  type: string;
  colour: string[];
  imageSrc: string;
};

function CreateOutfitUI() {
  const { user } = useUser();
  const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001";

  const [clothes, setClothes] = useState<ClothingItem[]>([]);
  type Slot = "head" | "body" | "legs" | "feet";
  const slots: Slot[] = ["head", "body", "legs", "feet"];
  const [selectedBySlot, setSelectedBySlot] = useState<
    Partial<Record<Slot, ClothingItem | null>>
  >({ head: null, body: null, legs: null, feet: null });
  const [name, setName] = useState<string>("");
  const [saving, setSaving] = useState<boolean>(false);

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      const response = await fetch(`${API_BASE_URL}/api/clothes/listClothes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ auth0Id: user.sub }),
      });
      if (!response.ok) return;
      const data = await response.json();
      setClothes(data.Clothes || []);
    };
    load();
  }, [API_BASE_URL, user]);

  const mapTypeToSlot = (type: string): Slot => {
    const t = type.toLowerCase();
    if (
      t.includes("hat") ||
      t.includes("cap") ||
      t.includes("beanie") ||
      t.includes("scarf")
    ) {
      return "head";
    }
    if (
      t.includes("shirt") ||
      t.includes("t-shirt") ||
      t.includes("tee") ||
      t.includes("hoodie") ||
      t.includes("jacket") ||
      t.includes("coat") ||
      t.includes("sweater") ||
      t.includes("jumper") ||
      t.includes("blouse") ||
      t.includes("dress") ||
      t.includes("top") ||
      t.includes("cardigan") ||
      t.includes("vest")
    ) {
      return "body";
    }
    if (
      t.includes("jeans") ||
      t.includes("pants") ||
      t.includes("trousers") ||
      t.includes("leggings") ||
      t.includes("shorts") ||
      t.includes("skirt") ||
      t.includes("cargos") ||
      t.includes("capri")
    ) {
      return "legs";
    }
    if (
      t.includes("shoes") ||
      t.includes("boots") ||
      t.includes("sneakers") ||
      t.includes("sandals") ||
      t.includes("heels") ||
      t.includes("socks")
    ) {
      return "feet";
    }
    return "body";
  };

  const toggleSelect = (id: string) => {
    const item = clothes.find((c) => c._id === id);
    if (!item) return;
    const slot = mapTypeToSlot(item.type);
    setSelectedBySlot((prev) => {
      const current = prev[slot];
      if (current && current._id === id) {
        return { ...prev, [slot]: null };
      }
      return { ...prev, [slot]: item };
    });
  };

  const selectedItems = useMemo(() => {
    return slots
      .map((s) => selectedBySlot[s])
      .filter((v): v is ClothingItem => Boolean(v));
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
        outfit_items: JSON.stringify(
          selectedItems.map((i) => ({
            uniqueId: i._id,
            type: i.type,
            imageSrc: i.imageSrc,
            colour: i.colour,
          }))
        ),
      };
      const response = await fetch(`${API_BASE_URL}/api/clothes/createOutfit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error("Failed to save outfit");
      setSelectedBySlot({ head: null, body: null, legs: null, feet: null });
      setName("");
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-indigo-200 w-full min-h-screen top-0 z-10 p-4">
      <div className="flex items-center justify-between mb-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 font-medium px-4 h-10 rounded-xl m-1 cursor-pointer border border-indigo-300 bg-indigo-100/70 text-indigo-900 hover:bg-indigo-500 hover:text-white active:bg-purple-600 transition-colors duration-300"
        >
          ← Back
        </Link>
        <div className="inline-flex items-center gap-2">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Outfit name (optional)"
            className="rounded-xl border border-indigo-300 bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white/80 backdrop-blur border border-indigo-200 rounded-xl p-3 shadow-md">
          <h3 className="font-medium text-indigo-900 mb-2">Your Clothes</h3>
          <div className="grid grid-cols-[repeat(auto-fill,_120px)] gap-3 justify-center">
            {clothes.map((item) => {
              const isSelected = selectedItems.some((s) => s._id === item._id);
              const slot = mapTypeToSlot(item.type);
              return (
                <button
                  key={item._id}
                  type="button"
                  onClick={() => toggleSelect(item._id)}
                  className={`relative border rounded-lg overflow-hidden h-[120px] w-[120px] ${
                    isSelected ? "ring-2 ring-indigo-500" : "border-indigo-200"
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
                    {slot}
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
        </div>

        <div className="bg-white/80 backdrop-blur border border-indigo-200 rounded-xl p-3 shadow-md">
          <h3 className="font-medium text-indigo-900 mb-2">Outfit Preview</h3>
          <div className="grid grid-cols-2 gap-3">
            {slots.map((slot) => {
              const item = selectedBySlot[slot];
              return (
                <div
                  key={slot}
                  className="border border-indigo-200 rounded-lg p-2 min-h-[140px] flex flex-col items-center justify-center"
                >
                  <div className="text-xs text-indigo-900 mb-1 capitalize">
                    {slot}
                  </div>
                  {item ? (
                    <div className="relative">
                      <Image
                        src={item.imageSrc}
                        alt={item.type}
                        width={100}
                        height={100}
                        className="object-cover rounded"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedBySlot((prev) => ({
                            ...prev,
                            [slot]: null,
                          }))
                        }
                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center"
                        aria-label={`Remove ${slot}`}
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <div className="text-indigo-900/70 text-xs">
                      No item selected
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default CreateOutfitUI;
