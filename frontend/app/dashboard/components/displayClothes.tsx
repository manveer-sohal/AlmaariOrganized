import React, { useEffect, useMemo, useRef } from "react";
import Image from "next/image";
import ClothesCard from "./clothesCard";
import { useClothesStore } from "../../store/useClothesStore";
import LoadingClothesCard from "./loadingclothesCard";
import { AnimatePresence, motion } from "framer-motion";
import { ClothingItem } from "../../types/clothes";
import { useClothesData, WARDROBE_IN_VIEW_OPTIONS, WARDROBE_PAGE_SIZE } from "../../hooks/useClothesData";
import { useSampleWardrobe } from "../../hooks/useSampleWardrobe";
import { useInView } from "react-intersection-observer";
import { Sparkles } from "lucide-react";

const SAMPLE_SEED_THRESHOLD = 10;

type DisplayClothesProps = {
  onSelectItem?: (item: ClothingItem) => void;
};

function SeedSamplesButton({
  seeding,
  error,
  onSeed,
  fullWidth = false,
}: {
  seeding: boolean;
  error: string | null;
  onSeed: () => void;
  fullWidth?: boolean;
}) {
  return (
    <div
      className={`flex flex-col items-center gap-1.5 ${
        fullWidth ? "w-full max-w-sm" : ""
      }`}
    >
      <button
        type="button"
        disabled={seeding}
        onClick={onSeed}
        className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-indigo-300 bg-indigo-600 px-5 text-sm font-semibold text-white shadow-md transition-colors hover:bg-indigo-700 disabled:cursor-wait disabled:opacity-70 ${
          fullWidth ? "w-full" : ""
        }`}
      >
        <Sparkles className="h-4 w-4" aria-hidden />
        {seeding ? "Loading samples…" : "Try with sample clothes"}
      </button>
      <p className="text-center text-xs text-indigo-800/75">
        Adds 10 demo pieces so you can try AI outfits right away.
      </p>
      {error ? (
        <p className="text-center text-xs text-red-600" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function EmptyWardrobeState({
  seeding,
  seedError,
  onSeed,
}: {
  seeding: boolean;
  seedError: string | null;
  onSeed: () => void;
}) {
  return (
    <motion.div
      className="col-span-full flex min-h-[min(70vh,32rem)] flex-col items-center justify-center px-4 py-10"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
    >
      <div className="relative flex flex-col items-center">
        <div
          role="status"
          className="relative z-10 mb-3 max-w-[15rem] rounded-2xl border-[3px] border-[#273157] bg-[#F9F7F1] px-4 py-3 text-center text-base font-semibold leading-snug text-[#273157] shadow-sm sm:text-lg"
        >
          Add some clothes!
          <span
            aria-hidden
            className="absolute left-1/2 top-full -mt-px -translate-x-1/2 border-x-[11px] border-t-[14px] border-x-transparent border-t-[#273157]"
          />
          <span
            aria-hidden
            className="absolute left-1/2 top-full -translate-x-1/2 translate-y-[-2px] border-x-[8px] border-t-[11px] border-x-transparent border-t-[#F9F7F1]"
          />
        </div>

        <Image
          src="/almaari-mascot-chilling.png"
          alt="Almaari mascot waving"
          width={280}
          height={280}
          priority
          className="h-auto w-[min(72vw,260px)] select-none"
        />

        <div className="mt-5 w-full max-w-sm">
          <SeedSamplesButton
            fullWidth
            seeding={seeding}
            error={seedError}
            onSeed={onSeed}
          />
        </div>
      </div>
    </motion.div>
  );
}

function SampleWardrobeBanner({
  sampleCount,
  onClear,
  clearing,
}: {
  sampleCount: number;
  onClear: () => void;
  clearing: boolean;
}) {
  return (
    <div className="col-span-full mb-2 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-indigo-200 bg-indigo-50/80 px-3 py-2 text-left">
      <p className="text-xs font-medium text-indigo-900 sm:text-sm">
        Showing {sampleCount} sample {sampleCount === 1 ? "item" : "items"} —
        try AI outfits anytime.
      </p>
      <button
        type="button"
        disabled={clearing}
        onClick={onClear}
        className="inline-flex shrink-0 items-center justify-center rounded-full border border-indigo-300 bg-white px-3 py-1.5 text-xs font-semibold text-indigo-900 hover:bg-indigo-100 disabled:opacity-60"
      >
        {clearing ? "Removing…" : "Clear samples"}
      </button>
    </div>
  );
}

function SeedPromptBanner({
  clothingCount,
  seeding,
  seedError,
  onSeed,
}: {
  clothingCount: number;
  seeding: boolean;
  seedError: string | null;
  onSeed: () => void;
}) {
  return (
    <div className="col-span-full mb-2 flex flex-col gap-2 rounded-xl border border-indigo-200 bg-indigo-50/80 px-3 py-3 text-left sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-indigo-950">
          Want more pieces for AI outfits?
        </p>
        <p className="text-xs text-indigo-800/75">
          You have {clothingCount} {clothingCount === 1 ? "item" : "items"}. Add
          sample clothes to try styling right away.
        </p>
        {seedError ? (
          <p className="mt-1 text-xs text-red-600" role="alert">
            {seedError}
          </p>
        ) : null}
      </div>
      <button
        type="button"
        disabled={seeding}
        onClick={onSeed}
        className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-full bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 disabled:cursor-wait disabled:opacity-70"
      >
        <Sparkles className="h-3.5 w-3.5" aria-hidden />
        {seeding ? "Loading…" : "Try sample clothes"}
      </button>
    </div>
  );
}

function DisplayClothes({ onSelectItem }: DisplayClothesProps) {
  const { colour, type, material, fit, pattern, search } = useClothesStore(
    (s) => s.filters,
  );
  const numberOfClothes = WARDROBE_PAGE_SIZE;
  const {
    clothes,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoadingClothes,
    error,
  } = useClothesData(numberOfClothes);
  const { seedSamples, clearSamples } = useSampleWardrobe();
  const { ref, inView } = useInView(WARDROBE_IN_VIEW_OPTIONS);

  const seeding = seedSamples.isPending;
  const seedError =
    seedSamples.error instanceof Error ? seedSamples.error.message : null;
  const didSyncSamples = useRef(false);

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const sampleCount = useMemo(
    () => clothes.filter((item) => item.isSample).length,
    [clothes],
  );

  // Backfill any catalog items missing from an already-seeded sample wardrobe
  // (e.g. shoes required for AI outfit generation).
  useEffect(() => {
    if (sampleCount === 0 || didSyncSamples.current || seeding) return;
    didSyncSamples.current = true;
    seedSamples.mutate();
  }, [sampleCount, seeding, seedSamples]);

  const canOfferSamples =
    clothes.length < SAMPLE_SEED_THRESHOLD && sampleCount === 0;

  const filteredClothes = useMemo(() => {
    if (!clothes) return [];

    return clothes.filter((item: ClothingItem) => {
      const matchesColour =
        colour.length === 0 || item.colour.some((c) => colour.includes(c));

      const matchesType = type.length === 0 || type.includes(item.type);

      const matchesMaterial =
        material.length === 0 ||
        (item.material != null && material.includes(item.material));

      const matchesFit =
        fit.length === 0 || (item.fit != null && fit.includes(item.fit));

      const matchesPattern =
        pattern.length === 0 ||
        (item.pattern != null && pattern.includes(item.pattern));

      const matchesSearch =
        search.length === 0 ||
        item.type.toLowerCase().includes(search) ||
        item.colour.some((c) => c.toLowerCase().includes(search)) ||
        (item.material?.toLowerCase().includes(search) ?? false) ||
        (item.fit?.toLowerCase().includes(search) ?? false) ||
        (item.pattern?.toLowerCase().includes(search) ?? false);

      return (
        matchesColour &&
        matchesType &&
        matchesMaterial &&
        matchesFit &&
        matchesPattern &&
        matchesSearch
      );
    });
  }, [clothes, colour, type, material, fit, pattern, search]);

  return (
    <div className="justify-self-center w-full grid justify-center  p-2 text-center order-first grid-cols-[repeat(auto-fill,120px)] sm:grid-cols-[repeat(auto-fill,120px)] md:grid-cols-[repeat(auto-fill,150px)] lg:grid-cols-[repeat(auto-fill,200px)]">
      {isLoadingClothes ? (
        Array.from({ length: 20 }, (_, index) => (
          <LoadingClothesCard key={index} index={index} />
        ))
      ) : error && clothes.length === 0 ? (
        <p className="col-span-full text-xl">Error loading clothes</p>
      ) : clothes.length === 0 ? (
        <EmptyWardrobeState
          seeding={seeding}
          seedError={seedError}
          onSeed={() => seedSamples.mutate()}
        />
      ) : (
        <AnimatePresence mode="popLayout">
          {sampleCount > 0 ? (
            <SampleWardrobeBanner
              sampleCount={sampleCount}
              clearing={clearSamples.isPending}
              onClear={() => clearSamples.mutate()}
            />
          ) : canOfferSamples ? (
            <SeedPromptBanner
              clothingCount={clothes.length}
              seeding={seeding}
              seedError={seedError}
              onSeed={() => seedSamples.mutate()}
            />
          ) : null}
          {filteredClothes.map((item: ClothingItem) => (
            <ClothesCard key={item._id} {...item} onSelect={onSelectItem} />
          ))}
          {isFetchingNextPage &&
            Array.from({ length: 20 }, (_, index) => (
              <LoadingClothesCard key={index} index={index} />
            ))}
        </AnimatePresence>
      )}
      {hasNextPage && <div ref={ref} className="h-10 w-full"></div>}
    </div>
  );
}

export default DisplayClothes;
