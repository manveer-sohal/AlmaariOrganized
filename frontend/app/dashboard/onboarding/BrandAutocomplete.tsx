"use client";

import { useMemo, useRef, useState } from "react";
import { Check, Plus, X } from "lucide-react";
import { BRAND_CATALOG } from "./constants";

type BrandAutocompleteProps = {
  selected: string[];
  onChange: (brands: string[]) => void;
  minCount?: number;
};

export default function BrandAutocomplete({
  selected,
  onChange,
  minCount = 3,
}: BrandAutocompleteProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return BRAND_CATALOG.filter((b) => !selected.includes(b)).slice(0, 8);
    }
    return BRAND_CATALOG.filter(
      (b) => b.toLowerCase().includes(q) && !selected.includes(b),
    ).slice(0, 10);
  }, [query, selected]);

  const exactMatch = BRAND_CATALOG.find(
    (b) => b.toLowerCase() === query.trim().toLowerCase(),
  );
  const canAddCustom =
    query.trim().length >= 2 &&
    !selected.some((b) => b.toLowerCase() === query.trim().toLowerCase()) &&
    !exactMatch;

  const addBrand = (brand: string) => {
    const trimmed = brand.trim();
    if (!trimmed) return;
    if (selected.some((b) => b.toLowerCase() === trimmed.toLowerCase())) {
      setQuery("");
      return;
    }
    onChange([...selected, trimmed]);
    setQuery("");
    setOpen(true);
    inputRef.current?.focus();
  };

  const removeBrand = (brand: string) => {
    onChange(selected.filter((b) => b !== brand));
  };

  return (
    <div className="space-y-3">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => {
            // Allow click on suggestion before closing.
            window.setTimeout(() => setOpen(false), 120);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              if (suggestions[0]) addBrand(suggestions[0]);
              else if (canAddCustom) addBrand(query);
            }
          }}
          placeholder="Search brands you shop…"
          className="min-h-12 w-full rounded-almaari border border-almaari-border bg-almaari-surface-raised px-4 text-sm text-almaari-ink outline-none ring-almaari-accent focus:ring-2"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls="brand-suggestions"
        />

        {open && (suggestions.length > 0 || canAddCustom) ? (
          <ul
            id="brand-suggestions"
            role="listbox"
            className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-almaari border border-almaari-border bg-almaari-surface-raised py-1 shadow-soft"
          >
            {suggestions.map((brand) => (
              <li key={brand} role="option" aria-selected={false}>
                <button
                  type="button"
                  className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm text-almaari-ink hover:bg-almaari-accent-soft"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => addBrand(brand)}
                >
                  {brand}
                  <Plus className="h-4 w-4 text-almaari-muted" aria-hidden />
                </button>
              </li>
            ))}
            {canAddCustom ? (
              <li role="option" aria-selected={false}>
                <button
                  type="button"
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm font-medium text-almaari-accent hover:bg-almaari-accent-soft"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => addBrand(query)}
                >
                  <Plus className="h-4 w-4" aria-hidden />
                  Add “{query.trim()}”
                </button>
              </li>
            ) : null}
          </ul>
        ) : null}
      </div>

      {selected.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {selected.map((brand) => (
            <button
              key={brand}
              type="button"
              onClick={() => removeBrand(brand)}
              className="inline-flex items-center gap-1.5 rounded-full bg-almaari-accent px-3 py-1.5 text-xs font-semibold text-white"
              aria-label={`Remove ${brand}`}
            >
              <Check className="h-3 w-3" aria-hidden />
              {brand}
              <X className="h-3.5 w-3.5 opacity-80" aria-hidden />
            </button>
          ))}
        </div>
      ) : null}

      <p className="text-xs text-almaari-muted">
        {selected.length >= minCount
          ? `${selected.length} brands selected`
          : `Pick at least ${minCount} · ${selected.length}/${minCount}`}
      </p>
    </div>
  );
}
