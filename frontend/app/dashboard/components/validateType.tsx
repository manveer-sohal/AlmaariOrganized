import React, { Dispatch, useState } from "react";

type ValidateTypeProp = {
  type: Dispatch<React.SetStateAction<string[] | null | undefined>>;
};
function ValidateType({ type }: ValidateTypeProp) {
  //type of clothes
  const type_List = [
    "Shirt",
    "Jeans",
    "Sweater",
    "Jacket",
    "T-shirt",
    "Shorts",
    "Skirt",
    "Dress",
    "Blouse",
    "Trousers",
    "Hoodie",
    "Coat",
    "Cardigan",
    "Tank Top",
    "Pajamas",
    "Socks",
    "Scarf",
    "Hat",
    "Gloves",
    "Cargos",
    "Jeans",
    "Dress Shirt",
    "Leggings",
    "Vest",
    "Swimsuit",
    "Raincoat",
    "Overalls",
    "Jumper",
    "Blazer",
    "Crop Top",
    "Pants",
    "Capri Pants",
    "Suit",
    "Tie",
    "Belt",
    "Tunic",
    "Poncho",
    "Robe",
    "Underwear",
    "Shoes",
  ];

  const [validType, setValidType] = useState<boolean | null>(null);

  const [usersClothType, setUsersClothType] = useState<string[]>([]);

  const [inputTypeValue, setInputTypeValue] = useState<string>("");

  //a filtered list of clothes which will change depedending on the user input for filtered results
  const [filtered_type_List, set_Filtered_type_List] = useState(type_List);
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

  const validateType = () => {
    const formatted = formatInput(inputTypeValue);
    if (
      type_List.includes(formatted) &&
      !usersClothType.includes(formatted) &&
      formatted
    ) {
      console.log("valid type");
      setValidType(true);
      return true;
    } else if (formatted) {
      console.log("invlaid type");
      setValidType(false);
    } else if (!usersClothType) {
      console.log("empty colour");
      setValidType(false);
    } else if (usersClothType.length > 0 && !formatted) {
      console.log(usersClothType);
      console.log("empty input full list");
      setValidType(true);
      return true;
    } else {
      console.log("empty");
      setValidType(false);
    }
    return false;
  };

  function setUserType() {
    //type list is not even formatted
    const formatted = formatInput(inputTypeValue);
    const valid = validateType();
    if (valid && formatted) {
      setUsersClothType((usersClothType) => [...usersClothType, formatted]);
      setInputTypeValue("");
      type([...usersClothType, formatted]);
    }
  }

  //if user clicks off, the value in the feild gets entered
  const onBlur = () => {
    setUserType();
  };
  //when enter is clicked while typing on the colours feild
  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();

      setUserType();
    }
  };

  const filter = (
    input: string,
    list: string[],
    setState: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    const filtered = list
      .filter((item) => item.toLowerCase().startsWith(input.toLowerCase()))
      .slice(0, 10);
    setState(filtered);
  };

  //delete colour
  const handleClick = (value: string) => {
    const filteredTypeVar = usersClothType.filter((item) =>
      item !== value ? item : null
    );
    setUsersClothType(filteredTypeVar);
    type(filteredTypeVar);
    if (usersClothType.length == 0) {
      setValidType(false);
    }
  };

  return (
    <>
      <label htmlFor="input-tag">Type:</label>
      <div className="colour-input-container">
        <input
          placeholder="Enter clothes type ie. pants"
          autoComplete="on"
          required
          className="valid"
          type="text"
          id="input-tag"
          list="types"
          value={inputTypeValue}
          onBlur={() => onBlur()}
          onKeyDown={handleKeyDown}
          onChange={(e) => {
            const value = e.target.value;
            filter(value, type_List, set_Filtered_type_List);
            setInputTypeValue(value);
            e.target.className = validType ? "invalid" : "valid";
          }}
        ></input>
        <button
          type="button"
          className="w-1/4 block font-semibold px-4 py-2 rounded-3xl m-1 cursor-pointer  hover:bg-indigo-500 hover:text-white transition-colors duration-300"
          onClick={setUserType}
        >
          +
        </button>
      </div>
      {validType == false && (
        <span className="error">Enter a valid Clothes type</span>
      )}
      <div className="selected-colours-container">
        {usersClothType.map((colour, index) => (
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

      <datalist id="types">
        {filtered_type_List.map((type, index) => (
          <option key={index} value={type}></option>
        ))}{" "}
      </datalist>
    </>
  );
}

export default ValidateType;
