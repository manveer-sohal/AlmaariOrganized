"use client";

import { useCallback, useMemo, useState } from "react";
import {
  OutfitRecommendation,
  StylistGeneration,
  StylistInputs,
  StylistMode,
} from "../types/aiStylist";

const outfitSignature = (itemIds: string[]) =>
  [...itemIds]
    .map(String)
    .sort()
    .join("|");

export function useStylistSession() {
  const [generations, setGenerations] = useState<StylistGeneration[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);

  const activeGeneration = generations[activeIndex] ?? null;
  const recommendations = activeGeneration?.outfits ?? [];

  const priorOutfitSignatures = useMemo(() => {
    return generations.flatMap((gen) =>
      gen.outfits.map((outfit) => outfitSignature(outfit.itemIds)),
    );
  }, [generations]);

  const appendGeneration = useCallback(
    (input: {
      id: string;
      parentGenerationId?: string | null;
      mode: StylistMode;
      prompt?: string | null;
      requiredItemIds: string[];
      anchoredItemIds?: string[];
      inputs: StylistInputs;
      outfits: OutfitRecommendation[];
    }) => {
      const anchoredItemIds =
        input.anchoredItemIds ?? input.requiredItemIds ?? [];
      const generation: StylistGeneration = {
        id: input.id,
        parentGenerationId: input.parentGenerationId ?? null,
        mode: input.mode,
        prompt: input.prompt ?? null,
        requiredItemIds: input.requiredItemIds,
        anchoredItemIds,
        inputs: input.inputs,
        outfits: input.outfits,
        createdAt: new Date().toISOString(),
      };
      setGenerations((prev) => {
        const next = [...prev, generation];
        setActiveIndex(next.length - 1);
        return next;
      });
    },
    [],
  );

  const goPrev = useCallback(() => {
    setActiveIndex((prev) => Math.max(0, prev - 1));
  }, []);

  const goNext = useCallback(() => {
    setActiveIndex((prev) => Math.min(generations.length - 1, prev + 1));
  }, [generations.length]);

  const selectIndex = useCallback(
    (index: number) => {
      if (index < 0 || index >= generations.length) return;
      setActiveIndex(index);
    },
    [generations.length],
  );

  const clearHistory = useCallback(() => {
    setGenerations([]);
    setActiveIndex(0);
  }, []);

  return {
    generations,
    activeIndex,
    activeGeneration,
    recommendations,
    priorOutfitSignatures,
    appendGeneration,
    goPrev,
    goNext,
    selectIndex,
    clearHistory,
    hasHistory: generations.length > 0,
    generationLabel:
      generations.length === 0
        ? null
        : `Generation ${activeIndex + 1} of ${generations.length}`,
  };
}
