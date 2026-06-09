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
      className=" w-full bg-white/80 backdrop-blur border border-indigo-200 rounded-xl p-3 shadow-md h-full  overflow-hidden min-h-[350px]"
    >
      <h3 className=" font-medium text-indigo-900 mb-2">Outfit Preview</h3>
      <div className="flex flex-col gap-3 h-full hidden-scrollbar overflow-y-scroll  overflow-hidden">
        {Object.keys(selectedBySlot).map((slot) => {
          const item = selectedBySlot[slot as Slot];
          return (
            <div
              key={slot}
              className="border border-indigo-200 w-full rounded-lg md:min-h-[100px] flex items-center  overflow-x-scroll hidden-scrollbar overflow-hidden"
            >
              <div className="flex flex-col md:flex-row items-center">
                {item && item.length > 0 ? (
                  <div className="relative h-[85px] w-[85px] md:h-[110px] md:w-[110px] ">
                    {item.map((i: ClothingItem, idx: number) => (
                      <div
                        key={i._id}
                        className={`absolute top-0 p-1 flex items-center justify-center h-[85px] w-[85px] md:h-[110px] md:w-[110px] rounded-md overflow-hidden cursor-pointer hover:scale-105 hover:z-10 hover:bg-indigo-50/50 hover:shadow-2xl z-${idx +
                          1}`}
                        style={{
                          left: `${idx * 25}px`,
                        }}
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
                          width={100}
                          height={100}
                          className="object-cover h-full w-full md:h-[100px] md:w-[100px]"
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-[75px] w-[75px] md:h-[100px] md:w-[89px] rounded-md bg-white border border-indigo-200">
                    {slot === "head" && (
                      <svg
                        width="52"
                        height="52"
                        viewBox="0 0 64 64"
                        fill="none"
                        aria-hidden="true"
                      >
                        <path
                          d="M32 4 C23 4 16 11 16 20 V28 C16 33 18.5 37.5 22.5 40.5 L27.5 44 H36.5 L41.5 40.5 C45.5 37.5 48 33 48 28 V20 C48 11 41 4 32 4 Z"
                          stroke="#4f46e5"
                          strokeWidth="2.75"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M16 18 H14.5 C13.1 18 12 19.1 12 20.5 V29 C12 30.4 13.1 31.5 14.5 31.5 H16"
                          stroke="#4f46e5"
                          strokeWidth="2.75"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M48 18 H49.5 C50.9 18 52 19.1 52 20.5 V29 C52 30.4 50.9 31.5 49.5 31.5 H48"
                          stroke="#4f46e5"
                          strokeWidth="2.75"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                    {slot === "body" && (
                      <svg
                        width="58"
                        height="58"
                        viewBox="0 0 64 64"
                        fill="none"
                        aria-hidden="true"
                      >
                        <path
                          d="M24 10 L20 8 L12 24 V50 H22 V40 H42 V50 H52 V24 L44 8 L40 10"
                          stroke="#4f46e5"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M24 14 H40"
                          stroke="#4f46e5"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                        />
                        <path
                          d="M24 10 L24 15"
                          stroke="#4f46e5"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                        />
                        <path
                          d="M40 10 L40 15"
                          stroke="#4f46e5"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                        />
                      </svg>
                    )}
                    {slot === "legs" && (
                      <svg
                        width="48"
                        height="64"
                        viewBox="0 0 48 64"
                        fill="none"
                        aria-hidden="true"
                      >
                        <path
                          d="M14 8 H34 V50 H26 V20 H22 V50 H14 Z"
                          stroke="#4f46e5"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                    {slot === "feet" && (
                      <svg
                        width="42"
                        height="42"
                        viewBox="0 0 80 64"
                        fill="none"
                        aria-hidden="true"
                      >
                        <g transform="translate(64,0) scale(-1,1)">
                          <path
                            d="M24 20 V18 H40 V30 L44 36 C55 39 58 44 58 50 C58 55 54 58 49 58 H29 L24 58 V20"
                            stroke="#4f46e5"
                            strokeWidth="4"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M24 30 H40"
                            stroke="#4f46e5"
                            strokeWidth="3"
                            strokeLinecap="round"
                          />
                          <path
                            d="M40 41 L45 36"
                            stroke="#4f46e5"
                            strokeWidth="3"
                            strokeLinecap="round"
                          />
                        </g>

                        <g transform="translate(15,0)">
                          <path
                            d="M24 20 V18 H40 V30 L44 36 C55 39 58 44 58 50 C58 55 54 58 49 58 H29 L24 58 V20"
                            stroke="#4f46e5"
                            strokeWidth="4"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M24 30 H40"
                            stroke="#4f46e5"
                            strokeWidth="3"
                            strokeLinecap="round"
                          />
                          <path
                            d="M40 41 L45 36"
                            stroke="#4f46e5"
                            strokeWidth="3"
                            strokeLinecap="round"
                          />
                        </g>
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
