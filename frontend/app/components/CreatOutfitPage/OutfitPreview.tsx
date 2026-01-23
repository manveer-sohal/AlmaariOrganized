import Image from "next/image";
import { ClothingItem, Slot } from "../../types/clothes";

const OutfitPreview = ({
  selectedBySlot,
  setSelectedBySlot,
}: {
  selectedBySlot: Partial<Record<Slot, ClothingItem[] | null>>;
  setSelectedBySlot: (
    selectedBySlot: (
      prev: Partial<Record<Slot, ClothingItem[] | null>>,
    ) => Partial<Record<Slot, ClothingItem[] | null>>,
  ) => void;
}) => {
  return (
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
                  <div className="relative h-[100px] w-[100px]">
                    {item.map((i: ClothingItem, idx: number) => (
                      <div
                        key={i._id}
                        className={`absolute top-0 p-1 flex items-center justify-center h-[110px] w-[110px] rounded-md overflow-hidden cursor-pointer hover:scale-105 hover:z-10 hover:bg-indigo-50/50 hover:shadow-2xl z-${idx +
                          1}`}
                        style={{ left: `${idx * 20}px` }}
                      >
                        <Image
                          onClick={() =>
                            setSelectedBySlot((prev) => {
                              const next =
                                prev[i.slot]?.filter((c) => c._id !== i._id) ??
                                [];
                              return {
                                ...prev,
                                [i.slot]: next.length > 0 ? next : null,
                              };
                            })
                          }
                          src={i.imageSrc}
                          alt={i.type}
                          width={110}
                          height={110}
                          className="object-cover h-full w-full"
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
  );
};

export default OutfitPreview;
