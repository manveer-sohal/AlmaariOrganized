import Image from "next/image";
import { ClothingItem } from "../../types/clothes";

const UsersClothes = ({
  isLoadingClothes,
  error,
  clothes,
  selectedItems,
  toggleSelect,
}: {
  isLoadingClothes: boolean;
  error: Error | null;
  clothes: ClothingItem[];
  selectedItems: ClothingItem[][];
  toggleSelect: (id: string) => void;
}) => {
  return (
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
        </div>
      )}
    </div>
  );
};

export default UsersClothes;
