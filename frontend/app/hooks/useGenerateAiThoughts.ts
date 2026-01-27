import { useQuery } from "@tanstack/react-query";
import { ClothingItem } from "../types/clothes";
//hook to generate ai thoughts for the selected items

export const useGenerateAiThoughts = (selectedItems: ClothingItem[][]) => {
  const enabled = selectedItems.length > 0;
  console.log("selectedItems", selectedItems);

  const {
    data: thoughts,
    isLoading: isLoadingThoughts,
    error: errorThoughts,
  } = useQuery({
    queryKey: ["thoughts", selectedItems.flatMap((i) => i.map((c) => c._id))],
    enabled,
    queryFn: async () => {
      const response = await fetch(`/api/aiStylist/generateAiThoughts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          selectedItems: formatSelectedItems(selectedItems),
        }),
      });
      if (!response.ok) throw new Error("Failed to generate ai thoughts");
      const data = await response.json();
      return data;
    },
  });
  return { thoughts, isLoadingThoughts, errorThoughts };
};

const formatSelectedItems = (selectedItems: ClothingItem[][]) => {
  return selectedItems.map((group) =>
    group.map((item) => ({
      type: item.type,
      colour: item.colour,
      slot: item.slot,
    })),
  );
};
