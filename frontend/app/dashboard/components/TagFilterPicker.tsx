import React, { Dispatch, useState } from "react";
import { Plus } from "lucide-react";

type TagFilterPickerProps = {
  label: string;
  placeholder: string;
  inputId: string;
  datalistId: string;
  options: string[];
  onTagsChange: Dispatch<React.SetStateAction<string[] | null | undefined>>;
};

function TagFilterPicker({
  label,
  placeholder,
  inputId,
  datalistId,
  options,
  onTagsChange,
}: TagFilterPickerProps) {
  const [valid, setValid] = useState<boolean | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [filteredOptions, setFilteredOptions] = useState(options);

  const formatInput = (value: string) => {
    const spaceValue = value.indexOf(" ");
    if (spaceValue > 0) {
      return (
        value.substring(0, 1).toUpperCase() +
        value.substring(1, spaceValue).toLowerCase() +
        value.substring(spaceValue, spaceValue + 2).toUpperCase() +
        value.substring(spaceValue + 2).toLowerCase()
      );
    }
    return (
      value.substring(0, 1).toUpperCase() + value.substring(1).toLowerCase()
    );
  };

  const validate = () => {
    const formatted = formatInput(inputValue);
    if (
      options.includes(formatted) &&
      !selectedTags.includes(formatted) &&
      formatted
    ) {
      setValid(true);
      return true;
    }
    if (formatted) {
      setValid(false);
    } else if (selectedTags.length > 0) {
      setValid(true);
      return true;
    } else {
      setValid(false);
    }
    return false;
  };

  const addTag = () => {
    const formatted = formatInput(inputValue);
    if (validate() && formatted) {
      const next = [...selectedTags, formatted];
      setSelectedTags(next);
      setInputValue("");
      onTagsChange(next);
    }
  };

  const removeTag = (value: string) => {
    const next = selectedTags.filter((item) => item !== value);
    setSelectedTags(next);
    onTagsChange(next);
    if (next.length === 0) {
      setValid(false);
    }
  };

  const filter = (input: string) => {
    const filtered = options
      .filter((item) => item.toLowerCase().startsWith(input.toLowerCase()))
      .slice(0, 10);
    setFilteredOptions(filtered);
  };

  return (
    <>
      <label htmlFor={inputId}>{label}</label>
      <div className="h-full inline-flex items-center">
        <input
          className="w-full rounded-xl border border-indigo-300 bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
          placeholder={placeholder}
          enterKeyHint="next"
          type="text"
          id={inputId}
          list={datalistId}
          value={inputValue}
          onBlur={addTag}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              addTag();
            }
          }}
          onChange={(e) => {
            const value = e.target.value;
            filter(value);
            setInputValue(value);
          }}
        />
        <button
          type="button"
          className="w-1/7 block font-semibold rounded-3xl m-1 cursor-pointer hover:bg-indigo-500 hover:text-white transition-colors duration-300"
          onClick={addTag}
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
      {valid === false && (
        <span className="error">Enter a valid {label.replace(":", "")}</span>
      )}
      <div className="selected-colours-container">
        {selectedTags.map((tag, index) => (
          <div
            className="selected-colours"
            key={index}
            id={tag}
            onClick={() => removeTag(tag)}
          >
            {tag}
          </div>
        ))}
      </div>
      <datalist id={datalistId}>
        {filteredOptions.map((option, index) => (
          <option key={index} value={option} />
        ))}
      </datalist>
    </>
  );
}

export default TagFilterPicker;
