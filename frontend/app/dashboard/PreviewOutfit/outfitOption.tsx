import { useState } from "react";
import { Outfit } from "../../types/clothes";

export default function OutfitOption({
  outfit,
  activeId,
  setActiveId,
  onDelete,
}: {
  outfit: Outfit;
  activeId: string | null;
  setActiveId: (id: string | null) => void;
  onDelete: () => void;
}) {
  const [hover, setHover] = useState<boolean>(false);
  return (
    <div
      key={outfit.uniqueId}
      className={`w-full text-left px-3 py-2 rounded-lg border ${
        outfit.uniqueId === activeId
          ? "bg-indigo-600 text-white border-indigo-600"
          : "bg-white border-indigo-200 hover:bg-indigo-50"
      }`}
      onClick={() => setActiveId(outfit.uniqueId)}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div className="font-medium truncate">
        {outfit.name || "Untitled outfit"}
      </div>

      <div className="text-xs opacity-80 flex justify-between">
        <p>{outfit.outfit_items.length} items</p>
        {hover && (
          <button onClick={onDelete} className="text-red-500">
            <p>delete</p>
          </button>
        )}
      </div>
    </div>
  );
}
