import React, { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { useUser } from "@auth0/nextjs-auth0/client";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query"; // or "react-query" if you're on v3
import { ClothingItem, View } from "../types/clothes";
import { colours_List, type_List } from "../data/constants";
import { goToNextTourStep } from "./OnBoardingTour";
//prop to allow accses to the toggleForm function in the main page, this lets us
//send infromation if the back button is clicked, if it is the state of toggle form
//is flipped (ie. false) which will not load the <AddClothesUI> </AddClothesUI> component
type addClothesUIProm = {
  setView: (view: View) => void;
};

function AddClothesUI({ setView }: addClothesUIProm) {
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();

  const handleBack = () => {
    setView("home");
  };

  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;
    goToNextTourStep();
  }, []);

  const API_BASE_URL =
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080";

  const fileInputRef = useRef<HTMLInputElement | null>(null);

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
    const formatted = formatInput(inputTypeValue);
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

      if (event.currentTarget.id === "add-colour-btn") {
        setUserColour();
      }
      if (event.currentTarget.id === "add-type-btn") {
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

    const auth0Id = user.sub;
    const formData = new FormData();

    formData.append("auth0Id", auth0Id ?? "");
    formData.append("type", usersClothType);
    formData.append("colour", JSON.stringify(usersColours));
    if (file) {
      formData.append("image", file);
    } else {
      console.error("No file selected");
      return;
    }

    console.log(formData);
    const response = await fetch(`${API_BASE_URL}/api/clothes/upload`, {
      method: "POST",
      body: formData,
    });

    console.log("response", response);
    return await response;
  };

  //If submit is clicked
  const handleSubmit = async (
    event: React.MouseEvent<HTMLAnchorElement, MouseEvent>
  ) => {
    event.preventDefault();
    setLoading(true);
    console.log("submit clicked");

    if (validateColour() && validateType() && file) {
      const response = await pushDB();

      if (response && response.ok) {
        console.log("picture uploaded1");
        const data = await response.json();

        queryClient.setQueryData<ClothingItem[]>(
          ["clothes", user?.sub],
          (old) => {
            if (!old) return [data.clothing];
            return [data.clothing, ...old];
          }
        );

        setView("home");
        queryClient.invalidateQueries({ queryKey: ["onboarding"] });
      } else {
        console.error("Failed to upload picture");
      }
    } else {
      event.preventDefault();
      if (file == null) {
        setValidFile(false);
      }
      console.log("form not filled in properly");
    }
    setLoading(false);

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
      console.log(objectUrl);
      setPreview(objectUrl);
    }
  }, [file]);

  //  .image-container {
  //   background-color: #ffffff84;
  //   width: 200px;
  //   height: 300px;
  //   margin: 0px 0 0 90px;
  // }
  return (
    <div className="backdrop-blur-sm min-h-screen w-full h-120vh sticky top-0 p-4">
      <form
        id="add-clothes-form"
        className="bg-white/80 backdrop-blur border border-indigo-200 rounded-xl w-full max-w-xl mx-auto p-6 shadow-md text-base flex flex-col gap-4"
      >
        <div className="w-full mx-auto mb-3 flex justify-start">
          <button
            onClick={handleBack}
            className="inline-flex items-center gap-2 font-medium px-4 h-10 rounded-xl cursor-pointer border border-indigo-300 bg-indigo-100/70 text-indigo-900 hover:bg-indigo-500 hover:text-white active:bg-purple-600 transition-colors duration-300"
          >
            ← Back
          </button>
        </div>
        <div className="w-full">
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={(e) => {
              setFile(e.target.files?.[0] ?? null);
            }}
            className="hidden"
          />
          <div
            id="add-picture-btn"
            className="bg-white border border-indigo-200 rounded-lg w-full aspect-[6/4] flex items-center justify-center overflow-hidden cursor-pointer hover:opacity-90 transition"
            onClick={() => {
              fileInputRef.current?.click();
            }}
          >
            {preview ? (
              <Image
                src={preview}
                alt="your pic"
                width={600}
                height={600}
                className="object-contain h-full w-full"
              />
            ) : (
              <div className="text-indigo-900/60 text-sm">
                Click to add image
              </div>
            )}
          </div>
        </div>
        <label
          htmlFor="input-tag"
          className="text-sm font-medium text-indigo-900"
        >
          Type
        </label>
        <input
          id="add-type-btn"
          placeholder="Enter clothes type ie. pants"
          autoComplete="on"
          required
          className="rounded-xl border border-indigo-300 bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
          type="text"
          list="types"
          value={inputTypeValue}
          onBlur={() => onBlur("type")}
          onKeyDown={handleKeyDown}
          onChange={(e) => {
            const value = e.target.value;
            filter(value, type_List, set_Filtered_type_List);
            setInputTypeValue(value);
            e.target.className = validType
              ? "rounded-xl border border-red-300 bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-300"
              : "rounded-xl border border-indigo-300 bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300";
          }}
        ></input>
        {validType == false && (
          <span className="text-sm text-red-600">
            Enter a valid Clothes type
          </span>
        )}

        <datalist id="types">
          {filtered_type_List.map((type, index) => (
            <option key={index} value={type}></option>
          ))}{" "}
        </datalist>

        <label
          htmlFor="input-colour"
          className="text-sm font-medium text-indigo-900"
        >
          Colour
        </label>
        <div className="colour-input-container">
          <input
            placeholder="Enter multiple colours ie. red"
            enterKeyHint="next"
            type="text"
            id="add-colour-btn"
            list="colours"
            value={inputColourValue}
            onBlur={() => onBlur("colour")}
            onKeyDown={handleKeyDown}
            onChange={(e) => {
              const value = e.target.value;
              filter(value, colours_List, set_Filtered_colours_List);
              setInputColourValue(value);
            }}
            className="rounded-xl border border-indigo-300 bg-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
          ></input>
          <button
            type="button"
            className="inline-flex items-center justify-center gap-2 font-medium px-4 h-10 rounded-xl m-1 cursor-pointer border border-indigo-300 bg-indigo-100/70 text-indigo-900 hover:bg-indigo-500 hover:text-white transition-colors duration-200"
            onClick={setUserColour}
          >
            Add
          </button>
        </div>
        {validColour == false && (
          <span className="text-sm text-red-600">Enter a valid Colour</span>
        )}
        <div className="flex flex-wrap gap-2">
          {usersColours.map((colour, index) => (
            <div
              className="inline-flex items-center gap-1 px-2 py-1 rounded-full border border-indigo-200 bg-indigo-100/60 text-indigo-900 text-xs cursor-pointer hover:bg-indigo-500 hover:text-white"
              key={index}
              id={colour}
              onClick={(e) => handleClick(e.currentTarget.id)}
            >
              <span
                className="h-3 w-3 rounded-full border border-indigo-200"
                style={{ backgroundColor: colour }}
                aria-hidden="true"
              />
              <span>{colour}</span>
            </div>
          ))}
        </div>

        <datalist id="colours">
          {filtered_colours_List.map((colour, index) => (
            <option key={index} value={colour}></option>
          ))}{" "}
        </datalist>

        {/* <input
         
         
          }}
        />
        <label
          htmlFor="input-file"
          id="input-file-label"
          className="inline-flex items-center justify-center gap-2 font-medium px-4 h-10 rounded-xl m-1 cursor-pointer bg-indigo-600 text-white hover:bg-indigo-700"
        >
          Add Picture
        </label> */}
        {validFile == false && (
          <span className="text-sm text-red-600">Enter a Picture</span>
        )}
        <div id="submit-btn" className="mt-2 flex items-center gap-2">
          {loading ? (
            <div className="inline-flex items-center justify-center gap-2 font-medium px-4 h-10 rounded-xl cursor-pointer bg-indigo-600 text-white hover:bg-indigo-700">
              Loading...
            </div>
          ) : (
            <Link
              href="/"
              type="button"
              onClick={(event) => handleSubmit(event)}
              className="inline-flex items-center justify-center gap-2 font-medium px-4 h-10 rounded-xl cursor-pointer bg-indigo-600 text-white hover:bg-indigo-700"
            >
              Submit
            </Link>
          )}
        </div>
      </form>
    </div>
  );
}

export default AddClothesUI;
