"use client";

import React, { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import {
  colours_List,
  fits_List,
  materials_List,
  patterns_List,
  type_List,
} from "../../data/constants";
import { Slot } from "../../types/clothes";
import { formatClothingInput } from "../../utils/formatClothingInput";
import { mapTypeToSlot } from "../../utils/mapTypeToSlot";
import { ClothingMetadataDraft } from "../../utils/validateClothingMetadata";

type ClothingMetadataEditorProps = {
  value: ClothingMetadataDraft;
  onChange: (next: ClothingMetadataDraft) => void;
};

function filterOptions(input: string, list: string[]) {
  return list
    .filter((item) => item.toLowerCase().startsWith(input.toLowerCase()))
    .slice(0, 10);
}

function FieldLabel({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="text-sm font-medium text-indigo-700">
      {children}
    </label>
  );
}

export default function ClothingMetadataEditor({
  value,
  onChange,
}: ClothingMetadataEditorProps) {
  const [colourInput, setColourInput] = useState("");
  const [colourError, setColourError] = useState<string | null>(null);

  const filteredTypes = useMemo(
    () => filterOptions(value.type, type_List),
    [value.type],
  );
  const filteredMaterials = useMemo(
    () => filterOptions(value.material, materials_List),
    [value.material],
  );
  const filteredFits = useMemo(
    () => filterOptions(value.fit, fits_List),
    [value.fit],
  );
  const filteredPatterns = useMemo(
    () => filterOptions(value.pattern, patterns_List),
    [value.pattern],
  );
  const filteredColours = useMemo(
    () => filterOptions(colourInput, colours_List),
    [colourInput],
  );

  const addColour = () => {
    const formatted = formatClothingInput(colourInput);
    if (!formatted || !colours_List.includes(formatted)) {
      setColourError("Enter a valid colour.");
      return;
    }
    if (value.colour.includes(formatted)) {
      setColourError("Colour already added.");
      return;
    }
    onChange({ ...value, colour: [...value.colour, formatted] });
    setColourInput("");
    setColourError(null);
  };

  const removeColour = (colour: string) => {
    onChange({
      ...value,
      colour: value.colour.filter((item) => item !== colour),
    });
  };

  const updateType = (nextType: string) => {
    const formatted = formatClothingInput(nextType);
    onChange({
      ...value,
      type: formatted,
      slot: formatted ? mapTypeToSlot(formatted) : value.slot,
    });
  };

  const updateScalar = (
    field: "material" | "fit" | "pattern",
    nextValue: string,
  ) => {
    onChange({ ...value, [field]: formatClothingInput(nextValue) });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <FieldLabel htmlFor="edit-type">Type</FieldLabel>
        <input
          id="edit-type"
          list="edit-types"
          value={value.type}
          onChange={(e) => updateType(e.target.value)}
          onBlur={(e) => updateType(e.target.value)}
          placeholder="Enter type ie. shirt"
          className="w-full rounded-xl border border-indigo-300 bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
        />
        <datalist id="edit-types">
          {filteredTypes.map((option) => (
            <option key={option} value={option} />
          ))}
        </datalist>
      </div>

      <div className="space-y-2">
        <FieldLabel htmlFor="edit-colour">Colours</FieldLabel>
        <div className="inline-flex w-full items-center gap-2">
          <input
            id="edit-colour"
            list="edit-colours"
            value={colourInput}
            onChange={(e) => {
              setColourInput(e.target.value);
              setColourError(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addColour();
              }
            }}
            onBlur={() => {
              if (colourInput.trim()) addColour();
            }}
            placeholder="Enter colour ie. red"
            className="w-full rounded-xl border border-indigo-300 bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />
          <button
            type="button"
            onClick={addColour}
            className="rounded-full p-2 hover:bg-indigo-500 hover:text-white transition-colors duration-200"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
        {colourError && (
          <p className="text-sm text-red-600">{colourError}</p>
        )}
        <div className="flex flex-wrap gap-2">
          {value.colour.map((colour) => (
            <button
              key={colour}
              type="button"
              onClick={() => removeColour(colour)}
              className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-indigo-100 text-indigo-900 border border-indigo-200 hover:bg-indigo-200"
              title="Remove colour"
            >
              {colour}
            </button>
          ))}
        </div>
        <datalist id="edit-colours">
          {filteredColours.map((option) => (
            <option key={option} value={option} />
          ))}
        </datalist>
      </div>

      <div className="space-y-2">
        <FieldLabel htmlFor="edit-material">Material</FieldLabel>
        <input
          id="edit-material"
          list="edit-materials"
          value={value.material}
          onChange={(e) => updateScalar("material", e.target.value)}
          onBlur={(e) => updateScalar("material", e.target.value)}
          placeholder="Enter material ie. cotton"
          className="w-full rounded-xl border border-indigo-300 bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
        />
        <datalist id="edit-materials">
          {filteredMaterials.map((option) => (
            <option key={option} value={option} />
          ))}
        </datalist>
      </div>

      <div className="space-y-2">
        <FieldLabel htmlFor="edit-fit">Fit</FieldLabel>
        <input
          id="edit-fit"
          list="edit-fits"
          value={value.fit}
          onChange={(e) => updateScalar("fit", e.target.value)}
          onBlur={(e) => updateScalar("fit", e.target.value)}
          placeholder="Enter fit ie. slim"
          className="w-full rounded-xl border border-indigo-300 bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
        />
        <datalist id="edit-fits">
          {filteredFits.map((option) => (
            <option key={option} value={option} />
          ))}
        </datalist>
      </div>

      <div className="space-y-2">
        <FieldLabel htmlFor="edit-pattern">Pattern</FieldLabel>
        <input
          id="edit-pattern"
          list="edit-patterns"
          value={value.pattern}
          onChange={(e) => updateScalar("pattern", e.target.value)}
          onBlur={(e) => updateScalar("pattern", e.target.value)}
          placeholder="Enter pattern ie. striped"
          className="w-full rounded-xl border border-indigo-300 bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
        />
        <datalist id="edit-patterns">
          {filteredPatterns.map((option) => (
            <option key={option} value={option} />
          ))}
        </datalist>
      </div>

      <div className="space-y-2">
        <FieldLabel htmlFor="edit-slot">Slot</FieldLabel>
        <select
          id="edit-slot"
          value={value.slot}
          onChange={(e) =>
            onChange({ ...value, slot: e.target.value as Slot })
          }
          className="w-full rounded-xl border border-indigo-300 bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300 capitalize"
        >
          {(["head", "body", "legs", "feet"] as Slot[]).map((slot) => (
            <option key={slot} value={slot}>
              {slot.charAt(0).toUpperCase() + slot.slice(1)}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
