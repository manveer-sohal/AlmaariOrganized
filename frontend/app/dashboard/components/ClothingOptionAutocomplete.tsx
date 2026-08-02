"use client";

import { useId, useMemo, useState } from "react";

type ClothingOptionAutocompleteProps = {
  id: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  inputClassName: string;
  placeholder?: string;
  required?: boolean;
  onBlur?: () => void;
  onKeyDown?: (event: React.KeyboardEvent<HTMLInputElement>) => void;
  maxSuggestions?: number;
};

export default function ClothingOptionAutocomplete({
  id,
  value,
  onChange,
  options,
  inputClassName,
  placeholder,
  required,
  onBlur,
  onKeyDown,
  maxSuggestions = 10,
}: ClothingOptionAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const listId = useId().replace(/:/g, "");

  const suggestions = useMemo(() => {
    const query = value.trim().toLowerCase();
    const matches = query
      ? options.filter((item) => item.toLowerCase().startsWith(query))
      : options;
    return matches.slice(0, maxSuggestions);
  }, [value, options, maxSuggestions]);

  const showDropdown = open && suggestions.length > 0;

  const selectOption = (option: string) => {
    onChange(option);
    setOpen(false);
  };

  return (
    <div className="relative w-full">
      <input
        id={id}
        type="text"
        role="combobox"
        value={value}
        required={required}
        placeholder={placeholder}
        autoComplete="off"
        className={inputClassName}
        aria-autocomplete="list"
        aria-expanded={showDropdown}
        aria-controls={showDropdown ? `${listId}-listbox` : undefined}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          window.setTimeout(() => setOpen(false), 120);
          onBlur?.();
        }}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            setOpen(false);
            return;
          }
          onKeyDown?.(e);
        }}
      />

      {showDropdown ? (
        <div
          id={`${listId}-listbox`}
          role="presentation"
          className="absolute left-0 right-0 top-full z-50 mt-1 max-h-52 overflow-y-auto overscroll-contain rounded-almaari border border-almaari-border bg-almaari-surface-raised py-1 shadow-soft"
        >
          <ul role="listbox" className="flex flex-col">
            {suggestions.map((option) => (
              <li key={option} role="option" aria-selected={value === option}>
                <button
                  type="button"
                  className="flex w-full px-3 py-2.5 text-left text-sm text-almaari-ink transition hover:bg-almaari-accent-soft focus:bg-almaari-accent-soft focus:outline-none"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => selectOption(option)}
                >
                  {option}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
