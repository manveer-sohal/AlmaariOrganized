"use client";
import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useUser } from "@auth0/nextjs-auth0/client";

type ClothingItem = {
  uniqueId: string;
  type: string;
  colour: string[];
  imageSrc: string;
};

type Outfit = {
  uniqueId: string;
  name: string;
  outfit_items: ClothingItem[];
};

function ViewOutfits() {
  const { user } = useUser();
  const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001";
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      setLoading(true);
      console.log("Loading Clothes");
      const response = await fetch(`${API_BASE_URL}/api/clothes/getOutfits`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ auth0Id: user.sub }),
      });
      try {
        if (!response.ok) return;
        const data = await response.json();
        const list: Outfit[] = (data?.outfits || data?.Outfits || []).reverse();
        setOutfits(list);
        setActiveId(list[0]?.uniqueId || null);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [API_BASE_URL, user]);

  const activeOutfit = useMemo(
    () => outfits.find((o) => o.uniqueId === activeId) || null,
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
              {outfits.map((o) => (
                <button
                  key={o.uniqueId}
                  className={`w-full text-left px-3 py-2 rounded-lg border ${
                    o.uniqueId === activeId
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : "bg-white border-indigo-200 hover:bg-indigo-50"
                  }`}
                  onClick={() => setActiveId(o.uniqueId)}
                >
                  <div className="font-medium truncate">
                    {o.name || "Untitled outfit"}
                  </div>
                  <div className="text-xs opacity-80">
                    {o.outfit_items.length} items
                  </div>
                </button>
              ))}
            </div>

            <div className="md:col-span-2">
              {!activeOutfit ? (
                <div className="text-indigo-900">
                  Select an outfit to preview
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {activeOutfit.outfit_items.map((item) => (
                    <div
                      key={item.uniqueId}
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
                              key={`${item.uniqueId}-c-${idx}`}
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
