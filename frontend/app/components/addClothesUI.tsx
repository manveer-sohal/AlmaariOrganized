import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useUser } from "@auth0/nextjs-auth0/client";
import Link from "next/link";

//promp to allow accses to the toggleForm function in the main page, this lets us
//send infromation if the back button is clicked, if it is the state of toggle form
//is flipped (ie. false) which will not load the <AddClothesUI> </AddClothesUI> component
type addClothesUIProm = {
  addClothes: (file: string, type: string, colour: string[]) => void;
};
function AddClothesUI({ addClothes }: addClothesUIProm) {
  //list of colours for clothes
  const colours_List = [
    "Black",
    "White",
    "Brown",
    "Beige",
    "Grey",
    "Pink",
    "Navy",
    "Green",
    "Red",
    "Blue",
    "Purple",
    "Yellow",
    "Orange",
    "Camo",
  ];

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

  const [validColour, setValidColour] = useState<boolean | null>(null);
  const [validFile, setValidFile] = useState<boolean | null>(null);

  const [validType, setValidType] = useState<boolean | null>(null);

  const [usersColours, setUsersColours] = useState<string[]>([]);
  const [usersClothType, setUsersClothType] = useState<string>("");

  const [inputColourValue, setInputColourValue] = useState<string>("");
  const [inputTypeValue, setInputTypeValue] = useState<string>("");

  //file can either be of type file or type null
  const [file, setFile] = useState<File | null>(null);
  //file can either be of type string or type null
  const [preview, setPreview] = useState<string | null>(null);
  //a filtered list of colours which will change depedending on the user input for filtered results
  const [filtered_colours_List, set_Filtered_colours_List] = useState(
    colours_List
  );
  //a filtered list of clothes which will change depedending on the user input for filtered results
  const [filtered_type_List, set_Filtered_type_List] = useState(type_List);

  const { user } = useUser();

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

  const validateColour = () => {
    const formatted = formatInput(inputColourValue);
    console.log(formatted);
    if (
      colours_List.includes(formatted) &&
      !usersColours.includes(formatted) &&
      formatted
    ) {
      console.log("valid colour");
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
    console.log(validColour);
    if (valid && formatted) {
      setUsersColours((usersColours) => [...usersColours, formatted]);
      setInputColourValue("");
    }
  }

  const validateType = () => {
    const formatted = formatInput(inputTypeValue);
    console.log(formatted);
    if (type_List.includes(formatted) && formatted) {
      console.log("valid type");
      setValidType(true);
      return true;
    } else if (formatted) {
      console.log("invlaid type");
      setValidType(false);
    } else {
      console.log("empty");
      setValidType(false);
    }
    return false;
  };

  function setUserType() {
    //type list is not even formatted
    const formatted = inputTypeValue.toLowerCase();
    const valid = validateType();
    if (valid) {
      console.log("valid type");
      setUsersClothType(formatted);
    }
  }

  //if user clicks off, the value in the feild gets entered
  const onBlur = (element: string) => {
    if (element === "colour") {
      setUserColour();
    }
    if (element === "type") {
      setUserType();
    }
  };
  //when enter is clicked while typing on the colours feild
  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();

      if (event.currentTarget.id === "input-colour") {
        setUserColour();
      }
      if (event.currentTarget.id === "input-tag") {
        setUserType();
      }
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

  const pushDB = async () => {
    if (!user) {
      console.error("User is not authenticated. Cannot upload a real picture.");
      return;
    }

    const toBase64 = (file: File) =>
      new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = (error) => reject(error);
      });

    const base64File = await toBase64(file!);

    const auth0Id = user.sub;

    const Data = {
      type: usersClothType,
      imageSrc: base64File,
      favourite: null,
      createdAt: null,
      colour: usersColours,
    };

    const response = await fetch("/api/clothes/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        auth0Id: auth0Id,
        Clothes: Data,
      }),
    });
    console.log(response);
  };
  //If submit is clicked
  const handleSubmit = (
    event: React.MouseEvent<HTMLAnchorElement, MouseEvent>
  ) => {
    validateType();

    if (validateColour() && validateType() && file) {
      pushDB();
      addClothes(URL.createObjectURL(file), usersClothType, usersColours);
    } else {
      event.preventDefault();
      if (file == null) {
        setValidFile(false);
      }
      console.log("form not filled in properly");
    }

    //toggleForm();
  };

  //delete colour
  const handleClick = (value: string) => {
    setUsersColours(
      usersColours.filter((item) => (item !== value ? item : null))
    );
    if (usersColours.length == 0) {
      setValidColour(false);
    }
  };
  //If a new file is uplaoded, the file state is changed
  //therefore letting us get the url for preview and for
  //FUTURE: sending it to database

  //maybe refractor this to a const function
  useEffect(() => {
    if (file) {
      console.log(file);

      setValidFile(true);
      const objectUrl = URL.createObjectURL(file);
      setPreview(objectUrl);
    }
  }, [file]);

  return (
    <div className="add-clothes-background">
      <Link href="/" className="nav-bar-li">
        Go back
      </Link>
      <form className="add-clothes-form">
        <div className="image-container">
          {preview && (
            <Image
              src={preview}
              alt="your pic"
              width={100}
              height={100}
              className="display-preview"
            ></Image>
          )}
        </div>
        <label htmlFor="input-tag">Type:</label>
        <input
          placeholder="Enter clothes type ie. pants"
          autoComplete="on"
          required
          className="valid"
          type="text"
          id="input-tag"
          list="types"
          value={inputTypeValue}
          onBlur={() => onBlur("type")}
          onKeyDown={handleKeyDown}
          onChange={(e) => {
            const value = e.target.value;
            filter(value, type_List, set_Filtered_type_List);
            setInputTypeValue(value);
            e.target.className = validType ? "invalid" : "valid";
          }}
        ></input>
        {validType == false && (
          <span className="error">Enter a valid Clothes type</span>
        )}

        <datalist id="types">
          {filtered_type_List.map((type, index) => (
            <option key={index} value={type}></option>
          ))}{" "}
        </datalist>

        <label htmlFor="input-colour">Colour:</label>
        <div className="colour-input-container">
          <input
            placeholder="Enter multiple colours ie. red"
            enterKeyHint="next"
            type="text"
            id="input-colour"
            list="colours"
            value={inputColourValue}
            onBlur={() => onBlur("colour")}
            onKeyDown={handleKeyDown}
            onChange={(e) => {
              const value = e.target.value;
              filter(value, colours_List, set_Filtered_colours_List);
              setInputColourValue(value);
            }}
          ></input>
          <button type="button" className="add-picture" onClick={setUserColour}>
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

        <input
          type="file"
          accept="image/jpeg,image/png, image/jpg"
          id="input-file"
          style={{ display: "none" }}
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              setFile(e.target.files[0]);
            } else {
              console.log("null");
            }
          }}
        ></input>
        <label
          htmlFor="input-file"
          id="input-file-label"
          className="add-picture"
        >
          Add Picture
        </label>
        {validFile == false && <span className="error">Enter a Picture</span>}
        <Link
          href="/"
          type="button"
          onClick={(event) => handleSubmit(event)}
          className="add-picture"
        >
          Submit
        </Link>
      </form>
    </div>
  );
}

export default AddClothesUI;
