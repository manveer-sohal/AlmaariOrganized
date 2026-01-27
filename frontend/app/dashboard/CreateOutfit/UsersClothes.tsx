import Image from "next/image";
import { ClothingItem } from "../../types/clothes";
import LoadingClothesCard from "../components/loadingclothesCard";
import { AnimatePresence } from "framer-motion";
import { RefObject } from "react";

const UsersClothes = ({
  isLoadingClothes,
  error,
  clothes,
  selectedItems,
  toggleSelect,
  ref,
  hasNextPage,
  isFetchingNextPage,
}: {
  isLoadingClothes: boolean;
  error: Error | null;
  clothes: ClothingItem[];
  selectedItems: ClothingItem[][];
  toggleSelect: (id: string) => void;
  ref: RefObject<HTMLDivElement>;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
}) => {
  return (
    <div
      id="create-outfit-form"
      className="bg-white/80 backdrop-blur border border-indigo-200 rounded-xl p-3 shadow-md h-full md:h-[calc(100vh-200px)] overflow-y-auto relative"
    >
      <h3 className="font-medium text-indigo-900 mb-2">Your Clothes</h3>

      {isLoadingClothes ? (
        <div className="grid grid-cols-[repeat(auto-fill,_80px)] md:grid-cols-[repeat(auto-fill,_110px)] gap-3 justify-center  max-h-[200px] sm:max-h-[500px] md:max-h-[800px]">
          {Array.from({ length: 20 }, (_, index) => (
            <LoadingClothesCard key={index} index={index} smaller={true} />
          ))}
        </div>
      ) : error ? (
        <p className="text-xl">Error loading clothes</p>
      ) : clothes.length === 0 ? (
        <p className="text-xl">Add Some Clothes!</p>
      ) : (
        <AnimatePresence mode="popLayout">
          <div className="grid grid-cols-[repeat(auto-fill,_80px)] md:grid-cols-[repeat(auto-fill,_110px)] gap-3 justify-center  max-h-[200px] sm:max-h-[500px] md:max-h-[800px]">
            {clothes?.map((item: ClothingItem) => {
              const isSelected = selectedItems.some((s) =>
                s.some((c) => c._id === item._id),
              );
              return (
                <button
                  key={item._id}
                  type="button"
                  onClick={() => toggleSelect(item._id)}
                  className={`relative border rounded-lg overflow-hidden  md:h-[120px] md:w-[120px] h-[80px] w-[80px] ${
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
            {isFetchingNextPage &&
              Array.from({ length: 20 }, (_, index) => (
                <LoadingClothesCard key={index} index={index} smaller={true} />
              ))}
          </div>
        </AnimatePresence>
      )}
      {hasNextPage && (
        <div ref={ref} className="h-10 w-full">
          test
        </div>
      )}
    </div>
  );
};

export default UsersClothes;
