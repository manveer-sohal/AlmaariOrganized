"use client";

import AddClothesUI from "@/components/addClothesUI";

function AddClothes({
  displayAddClothes,
}: {
  displayAddClothes: (displayAddClothes: boolean) => void;
}) {
  return (
    <main>
      <AddClothesUI displayAddClothes={displayAddClothes}></AddClothesUI>
    </main>
  );
}

export default AddClothes;
