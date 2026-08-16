"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { Filter, Plus, Search, Sparkles, X } from "lucide-react";
import { ClothingItem } from "../../types/clothes";
import { useClothesStore } from "../../store/useClothesStore";
import { useClothesData, WARDROBE_IN_VIEW_OPTIONS, WARDROBE_PAGE_SIZE } from "../../hooks/useClothesData";
import { useSampleWardrobe } from "../../hooks/useSampleWardrobe";
import { useInView } from "react-intersection-observer";
import ClothingGrid from "../../components/ux/ClothingGrid";
import EmptyState from "../../components/ux/EmptyState";
import FilterBottomSheet from "../../components/ux/FilterBottomSheet";
import ChooseColour from "../components/chooseColour";
import ValidateType from "../components/validateType";
import TagFilterPicker from "../components/TagFilterPicker";
import { materials_List, fits_List, patterns_List } from "../../data/constants";

const SAMPLE_SEED_THRESHOLD = 10;

type WardrobeScreenProps = {
  onSelectItem?: (item: ClothingItem) => void;
  onAddClothes?: () => void;
  onStyleItem?: (item: ClothingItem) => void;
};

export default function WardrobeScreen({
  onSelectItem,
  onAddClothes,
  onStyleItem,
}: WardrobeScreenProps) {
  const filters = useClothesStore((s) => s.filters);
  const setFilters = useClothesStore((s) => s.setFilters);
  const [filterOpen, setFilterOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [draftColour, setDraftColour] = useState<
    string[] | null | undefined
  >(filters.colour);
  const [draftType, setDraftType] = useState<string[] | null | undefined>(
    filters.type,
  );
  const [draftMaterial, setDraftMaterial] = useState<
    string[] | null | undefined
  >(filters.material);
  const [draftFit, setDraftFit] = useState<string[] | null | undefined>(
    filters.fit,
  );
  const [draftPattern, setDraftPattern] = useState<
    string[] | null | undefined
  >(filters.pattern);

  const {
    clothes,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoadingClothes,
    error,
  } = useClothesData(WARDROBE_PAGE_SIZE);
  const { seedSamples, clearSamples } = useSampleWardrobe();
  const { ref, inView } = useInView(WARDROBE_IN_VIEW_OPTIONS);
  const didSyncSamples = useRef(false);

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const sampleCount = useMemo(
    () => clothes.filter((item) => item.isSample).length,
    [clothes],
  );

  useEffect(() => {
    if (sampleCount === 0 || didSyncSamples.current || seedSamples.isPending)
      return;
    didSyncSamples.current = true;
    seedSamples.mutate();
  }, [sampleCount, seedSamples]);

  const activeFilterCount =
    filters.colour.length +
    filters.type.length +
    filters.material.length +
    filters.fit.length +
    filters.pattern.length;

  const filteredClothes = useMemo(() => {
    const { colour, type, material, fit, pattern, search } = filters;
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
  }, [clothes, filters]);

  const openFilters = () => {
    setDraftColour(filters.colour);
    setDraftType(filters.type);
    setDraftMaterial(filters.material);
    setDraftFit(filters.fit);
    setDraftPattern(filters.pattern);
    setFilterOpen(true);
  };

  const applyFilters = () => {
    setFilters({
      ...filters,
      colour: draftColour ?? [],
      type: draftType ?? [],
      material: draftMaterial ?? [],
      fit: draftFit ?? [],
      pattern: draftPattern ?? [],
    });
    setFilterOpen(false);
  };

  const clearFilters = () => {
    setDraftColour([]);
    setDraftType([]);
    setDraftMaterial([]);
    setDraftFit([]);
    setDraftPattern([]);
    setFilters({
      ...filters,
      colour: [],
      type: [],
      material: [],
      fit: [],
      pattern: [],
    });
  };

  const canOfferSamples =
    clothes.length < SAMPLE_SEED_THRESHOLD && sampleCount === 0;

  const stickyHeader = (
    <div className="sticky top-0 z-20 space-y-2 border-b border-almaari-border/50 bg-almaari-bg/95 px-3 py-3 backdrop-blur-md">
      <div className="flex items-center justify-between gap-2">
        <h1 className="font-display text-xl text-almaari-ink">Wardrobe</h1>
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Search"
            onClick={() => setSearchOpen((o) => !o)}
            className="touch-target inline-flex items-center justify-center rounded-full text-almaari-ink hover:bg-almaari-accent-soft"
          >
            <Search className="h-5 w-5" />
          </button>
          <button
            type="button"
            aria-label="Filters"
            onClick={openFilters}
            className="relative touch-target inline-flex items-center justify-center rounded-full text-almaari-ink hover:bg-almaari-accent-soft md:hidden"
          >
            <Filter className="h-5 w-5" />
            {activeFilterCount > 0 ? (
              <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-almaari-accent px-1 text-[10px] font-bold text-white">
                {activeFilterCount}
              </span>
            ) : null}
          </button>
          <button
            type="button"
            id="add-clothes-btn-mobile"
            aria-label="Add clothes"
            onClick={onAddClothes}
            className="touch-target inline-flex items-center justify-center rounded-full bg-almaari-accent text-white shadow-soft md:hidden"
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>
      </div>

      {searchOpen || filters.search ? (
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-almaari-muted" />
          <input
            type="search"
            value={filters.search}
            onChange={(e) =>
              setFilters({ ...filters, search: e.target.value.toLowerCase() })
            }
            placeholder="Search your wardrobe"
            className="min-h-touch w-full rounded-almaari border border-almaari-border bg-almaari-surface-raised py-2 pl-9 pr-9 text-sm text-almaari-ink outline-none focus:border-almaari-accent focus:ring-2 focus:ring-almaari-accent/20"
            autoFocus={searchOpen}
          />
          {filters.search ? (
            <button
              type="button"
              aria-label="Clear search"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-almaari-muted"
              onClick={() => setFilters({ ...filters, search: "" })}
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      ) : null}

      {/* Desktop inline filters trigger */}
      <div className="hidden items-center gap-2 md:flex">
        <button
          type="button"
          onClick={openFilters}
          className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-almaari-border bg-almaari-surface-raised px-3 text-sm font-semibold text-almaari-ink"
        >
          <Filter className="h-4 w-4" />
          Filters
          {activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
        </button>
        {activeFilterCount > 0 ? (
          <button
            type="button"
            onClick={clearFilters}
            className="text-sm font-semibold text-almaari-muted hover:text-almaari-ink"
          >
            Clear
          </button>
        ) : null}
      </div>
    </div>
  );

  const banners =
    sampleCount > 0 ? (
      <div className="mx-3 mb-3 flex flex-wrap items-center justify-between gap-2 rounded-almaari bg-almaari-accent-soft/70 px-3 py-2 text-left">
        <p className="text-xs font-medium text-almaari-ink sm:text-sm">
          Showing {sampleCount} sample {sampleCount === 1 ? "item" : "items"}
        </p>
        <button
          type="button"
          disabled={clearSamples.isPending}
          onClick={() => clearSamples.mutate()}
          className="inline-flex min-h-9 items-center rounded-full bg-almaari-surface-raised px-3 text-xs font-semibold"
        >
          {clearSamples.isPending ? "Removing…" : "Clear samples"}
        </button>
      </div>
    ) : canOfferSamples && clothes.length > 0 ? (
      <div className="mx-3 mb-3 flex flex-col gap-2 rounded-almaari bg-almaari-warm px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-semibold text-almaari-ink">
          Want more pieces for AI outfits?
        </p>
        <button
          type="button"
          disabled={seedSamples.isPending}
          onClick={() => seedSamples.mutate()}
          className="inline-flex min-h-10 items-center gap-1.5 rounded-full bg-almaari-accent px-4 text-xs font-semibold text-white"
        >
          <Sparkles className="h-3.5 w-3.5" />
          {seedSamples.isPending ? "Loading…" : "Try sample clothes"}
        </button>
      </div>
    ) : null;

  return (
    <div className="relative min-h-full pb-nav md:pb-6">
      {stickyHeader}
      {banners}

      <ClothingGrid
        items={filteredClothes}
        onSelectItem={onSelectItem}
        onStyleItem={onStyleItem}
        loading={isLoadingClothes}
        empty={
          error && clothes.length === 0 ? (
            <p className="px-4 py-12 text-center text-almaari-muted">
              Couldn’t load your wardrobe. Try again.
            </p>
          ) : (
            <EmptyState
              title="Your wardrobe starts here."
              actionLabel="Add your first item"
              onAction={onAddClothes}
              illustration={
                <Image
                  src="/almaari-mascot-chilling.png"
                  alt=""
                  width={200}
                  height={200}
                  className="h-auto w-[min(60vw,200px)]"
                />
              }
            />
          )
        }
        header={
          clothes.length === 0 && !isLoadingClothes ? (
            <div className="mb-2 flex justify-center px-4">
              <button
                type="button"
                disabled={seedSamples.isPending}
                onClick={() => seedSamples.mutate()}
                className="inline-flex min-h-11 items-center gap-2 rounded-full border border-almaari-border bg-almaari-surface-raised px-5 text-sm font-semibold"
              >
                <Sparkles className="h-4 w-4" />
                {seedSamples.isPending
                  ? "Loading samples…"
                  : "Try with sample clothes"}
              </button>
            </div>
          ) : undefined
        }
        sentinel={
          <>
            {isFetchingNextPage
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="aspect-[4/5] animate-pulse rounded-almaari bg-almaari-chrome/40"
                  />
                ))
              : null}
            {hasNextPage ? <div ref={ref} className="col-span-full h-8" /> : null}
          </>
        }
      />

      {/* Desktop filter panel as sheet-like modal too for consistency */}
      <FilterBottomSheet
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        title="Filters"
        footer={
          <div className="flex gap-2">
            <button
              type="button"
              onClick={clearFilters}
              className="min-h-touch flex-1 rounded-almaari border border-almaari-border text-sm font-semibold"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={applyFilters}
              className="min-h-touch flex-1 rounded-almaari bg-almaari-accent text-sm font-semibold text-white"
            >
              Apply
            </button>
          </div>
        }
      >
        <div className="space-y-3 text-left">
          <ChooseColour colour={setDraftColour} />
          <ValidateType type={setDraftType} />
          <TagFilterPicker
            label="Material:"
            placeholder="Enter material"
            inputId="wardrobe-filter-material"
            datalistId="wardrobe-filter-materials"
            options={[...materials_List]}
            onTagsChange={setDraftMaterial}
          />
          <TagFilterPicker
            label="Fit:"
            placeholder="Enter fit"
            inputId="wardrobe-filter-fit"
            datalistId="wardrobe-filter-fits"
            options={[...fits_List]}
            onTagsChange={setDraftFit}
          />
          <TagFilterPicker
            label="Pattern:"
            placeholder="Enter pattern"
            inputId="wardrobe-filter-pattern"
            datalistId="wardrobe-filter-patterns"
            options={[...patterns_List]}
            onTagsChange={setDraftPattern}
          />
        </div>
      </FilterBottomSheet>
    </div>
  );
}
