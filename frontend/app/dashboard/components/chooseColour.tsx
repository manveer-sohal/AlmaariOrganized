import React, { Dispatch, useState } from "react";
import { colours_List } from "../../data/constants";
type ChooseColourProps = {
  colour: Dispatch<React.SetStateAction<string[] | null | undefined>>;
};
function ChooseColour({ colour }: ChooseColourProps) {
  const [validColour, setValidColour] = useState<boolean | null>(null);

  const [usersColours, setUsersColours] = useState<string[]>([]);

  const [inputColourValue, setInputColourValue] = useState<string>("");

  //a filtered list of colours which will change depedending on the user input for filtered results
  const [filtered_colours_List, set_Filtered_colours_List] = useState(
    colours_List,
  );

  //list of colours for clothes

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

  //add type for return maybe
  const validateColour = () => {
    const formatted = formatInput(inputColourValue);
    if (
      colours_List.includes(formatted) &&
      !usersColours.includes(formatted) &&
      formatted
    ) {
      setValidColour(true);
      return true;
    } else if (formatted) {
      console.log("invlaid colour");
      setValidColour(false);
    } else if (!usersColours) {
      console.log("empty colour");
      setValidColour(false);
    } else if (usersColours.length > 0 && !formatted) {
      console.log(usersColours);
      console.log("empty input full list");
      setValidColour(true);
      return true;
    } else {
      console.log("empty");
      setValidColour(false);
    }
    return false;
  };

  //updates the colour tags the user has on the inputed cloth
  function setUserColour() {
    const formatted = formatInput(inputColourValue);
    const valid = validateColour();
    if (valid && formatted) {
      setUsersColours((usersColours) => [...usersColours, formatted]);
      setInputColourValue("");
      colour([...usersColours, formatted]);
    }
  }

  //if user clicks off, the value in the feild gets entered
  const onBlur = () => {
    setUserColour();
  };
  //when enter is clicked while typing on the colours feild
  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();

      setUserColour();
    }
  };

  const filter = (
    input: string,
    list: string[],
    setState: React.Dispatch<React.SetStateAction<string[]>>,
  ) => {
    const filtered = list
      .filter((item) => item.toLowerCase().startsWith(input.toLowerCase()))
      .slice(0, 10);
    setState(filtered);
  };

  //delete colour
  const handleClick = (value: string) => {
    const filteredColoursVar = usersColours.filter((item) =>
      item !== value ? item : null,
    );
    setUsersColours(filteredColoursVar);
    colour(filteredColoursVar);
    if (usersColours.length == 0) {
      setValidColour(false);
    }
  };
  // height: 100%;
  //   display: inline-flex;
  //   align-items: center;
  return (
    <>
      <label htmlFor="input-colour">Colour:</label>
      <div className="h-full inline-flex items-center">
        <input
          placeholder="Enter multiple colours ie. red"
          enterKeyHint="next"
          type="text"
          id="input-colour"
          list="colours"
          value={inputColourValue}
          onBlur={() => onBlur()}
          onKeyDown={handleKeyDown}
          onChange={(e) => {
            const value = e.target.value;
            filter(value, colours_List, set_Filtered_colours_List);
            setInputColourValue(value);
          }}
        ></input>
        <button
          type="button"
          className="w-1/4 block font-semibold px-4 py-2 rounded-3xl m-1 cursor-pointer  hover:bg-indigo-500 hover:text-white transition-colors duration-300"
          onClick={setUserColour}
        >
          +
        </button>
      </div>
      {validColour == false && (
        <span className="error">Enter a valid Colour</span>
      )}
      <div className="selected-colours-container">
        {usersColours.map((colour, index) => (
          <div
            className="selected-colours"
            key={index}
            id={colour}
            onClick={(e) => handleClick(e.currentTarget.id)}
          >
            {colour}
          </div>
        ))}
      </div>

      <datalist id="colours">
        {filtered_colours_List.map((colour, index) => (
          <option key={index} value={colour}></option>
        ))}{" "}
      </datalist>
    </>
  );
}

export default ChooseColour;
