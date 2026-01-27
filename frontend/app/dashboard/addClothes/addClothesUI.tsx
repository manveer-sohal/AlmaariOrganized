import React, { useEffect, useState, useRef, useCallback } from "react";
import { useUser } from "@auth0/nextjs-auth0/client";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query"; // or "react-query" if you're on v3
import { View } from "../../types/clothes";
import { colours_List, type_List } from "../../data/constants";
import { goToNextTourStep } from "../../components/OnBoardingTour";

type addClothesUIProm = {
  setView: (view: View) => void;
};

function AddClothesUI({ setView }: addClothesUIProm) {
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();

  const handleBack = () => {
    setView("home");
  };

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
    colours_List,
  );
  //a filtered list of clothes which will change depedending on the user input for filtered results
  const [filtered_type_List, set_Filtered_type_List] = useState(type_List);

  const { user } = useUser();

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);
  const lastPosRef = useRef({ x: 0, y: 0 });
  const imageRef = useRef<HTMLImageElement | null>(null);
  // const [croppedBlob, setCroppedBlob] = useState<Blob | null>(null);

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
    setState: React.Dispatch<React.SetStateAction<string[]>>,
  ) => {
    const filtered = list
      .filter((item) => item.toLowerCase().startsWith(input.toLowerCase()))
      .slice(0, 10);
    setState(filtered);
  };

  const drawCropPreview = useCallback(
    (imageSrc: string, zoomLevel: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      let img = imageRef.current;

      if (!img) {
        img = new window.Image();
        img.src = imageSrc;
        imageRef.current = img;
      }

      if (!img.complete) {
        img.onload = () => drawCropPreview(imageSrc, zoomLevel);
        return;
      }

      let size = 355; // square crop size
      console.log("img.width", img.width);
      console.log("img.height", img.height);

      canvas.width = size;
      canvas.height = size;
      if (img.width < 280) {
        canvas.width = img.width;
      }
      if (img.height < 400) {
        canvas.height = img.height + 10;
      }
      size = Math.min(canvas.width, canvas.height);
      ctx.clearRect(0, 0, size, size);

      const minZoom = Math.max(size / img.width, size / img.height);
      const scale = minZoom * zoom;

      const baseX = (size - img.width * scale) / 2;
      const baseY = (size - img.height * scale) / 2;

      const x = baseX + offset.x;
      const y = baseY + offset.y;

      ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
    },
    [canvasRef, imageRef, offset, zoom],
  );

  useEffect(() => {
    if (!file) return;

    setValidFile(true);

    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);

    imageRef.current = null;
    // Draw initial crop preview
    drawCropPreview(objectUrl, 1);
    setOffset({ x: 0, y: 0 });

    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  useEffect(() => {
    if (preview) {
      drawCropPreview(preview, zoom);
    }
  }, [zoom, preview, offset, drawCropPreview]);

  const generateCroppedImage = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    return new Promise<Blob | null>((resolve) => {
      canvas.toBlob((blob) => {
        resolve(blob);
      }, "image/png");
    });
  };

  const clampOffset = (
    x: number,
    y: number,
    imgW: number,
    imgH: number,
    scale: number,
  ) => {
    const size = 400;
    const maxX = Math.max(0, (imgW * scale - size) / 2);
    const maxY = Math.max(0, (imgH * scale - size) / 2);

    return {
      x: Math.min(maxX, Math.max(-maxX, x)),
      y: Math.min(maxY, Math.max(-maxY, y)),
    };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    lastPosRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current || !preview || !imageRef.current) return;

    const dx = e.clientX - lastPosRef.current.x;
    const dy = e.clientY - lastPosRef.current.y;
    lastPosRef.current = { x: e.clientX, y: e.clientY };

    const img = imageRef.current;
    const minZoom = Math.max(400 / img.width, 400 / img.height);
    const scale = minZoom * zoom;

    setOffset((prev) => {
      const next = { x: prev.x + dx, y: prev.y + dy };
      return clampOffset(next.x, next.y, img.width, img.height, scale);
    });
  };

  const getTouchPoint = (e: React.TouchEvent) => {
    const t = e.touches[0];
    return { x: t.clientX, y: t.clientY };
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    isDraggingRef.current = true;
    lastPosRef.current = getTouchPoint(e);
  };

  const handleTouchEnd = () => {
    isDraggingRef.current = false;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDraggingRef.current || !preview || !imageRef.current) return;

    const { x, y } = getTouchPoint(e);
    const dx = x - lastPosRef.current.x;
    const dy = y - lastPosRef.current.y;
    lastPosRef.current = { x, y };

    const img = imageRef.current;
    const minZoom = Math.max(400 / img.width, 400 / img.height);
    const scale = minZoom * zoom;

    setOffset((prev) => {
      const next = { x: prev.x + dx, y: prev.y + dy };
      return clampOffset(next.x, next.y, img.width, img.height, scale);
    });
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
    const cropped = await generateCroppedImage();
    if (cropped) {
      formData.append("image", cropped, "cropped.png");
    } else if (file) {
      formData.append("image", file);
    }

    console.log(formData);
    const response = await fetch(`/api/clothes/upload`, {
      method: "POST",
      body: formData,
    });

    console.log("response", response);
    return await response;
  };

  //If submit is clicked
  const handleSubmit = async (
    event: React.MouseEvent<HTMLAnchorElement, MouseEvent>,
  ) => {
    event.preventDefault();
    setLoading(true);
    console.log("submit clicked");

    if (validateColour() && validateType() && file) {
      const response = await pushDB();

      if (response && response.ok) {
        console.log("picture uploaded1");
        await queryClient.invalidateQueries({
          queryKey: ["clothesData", user?.sub],
        });
        setView("home");
        goToNextTourStep();
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
      usersColours.filter((item) => (item !== value ? item : null)),
    );
    if (usersColours.length == 0) {
      setValidColour(false);
    }
  };
  //If a new file is uplaoded, the file state is changed
  //therefore letting us get the url for preview and for
  //FUTURE: sending it to database

  //maybe refractor this to a const function

  //  .image-container {
  //   background-color: #ffffff84;
  //   width: 200px;
  //   height: 300px;
  //   margin: 0px 0 0 90px;
  // }
  return (
    <div className=" p-1 z-10 backdrop-blur-sm min-h-screen w-full h-full md:h-120vh sticky sm:h-full">
      <form
        id="add-clothes-form"
        className="md:mt-5 mt-2 bg-white/80 backdrop-blur border border-indigo-200 rounded-xl w-full max-w-xl mx-auto p-6 shadow-md text-base flex flex-col md:gap-4 sm:gap-2 gap-1"
      >
        <div className="w-full mx-auto mb-1 flex justify-start">
          <button
            onClick={handleBack}
            className="inline-flex items-center gap-2 font-medium px-4 h-10 rounded-xl cursor-pointer border border-indigo-300 bg-indigo-100/70 text-indigo-900 hover:bg-indigo-500 hover:text-white active:bg-purple-600 transition-colors duration-300"
          >
            ← Back
          </button>
        </div>
        {/* Add Picture */}
        <div className=" rounded-lg p-2 w-full">
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
            className="relative bg-white border border-indigo-200 rounded-lg md:h-[360px] h-[280px] mx-auto flex items-center overflow-hidden justify-center  cursor-pointer hover:opacity-90 transition"
            onClick={() => {
              if (!preview) fileInputRef.current?.click();
            }}
          >
            {preview ? (
              <div className="flex items-center justify-center cursor-pointer hover:opacity-90 transition">
                <canvas
                  ref={canvasRef}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                  className="cursor-grab active:cursor-grabbing touch-none"
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute top-2 right-2 bg-white/80 text-xs px-2 py-1 rounded shadow"
                >
                  Replace
                </button>
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-xs text-indigo-700 bg-white/70 px-2 py-1 rounded">
                  Drag to reposition • Zoom to crop
                </div>
              </div>
            ) : (
              <div className="text-indigo-900/60 text-sm">
                Click to add image
              </div>
            )}
          </div>
        </div>

        <input
          type="range"
          min="1"
          max="2.5"
          step="0.01"
          value={zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
          className="w-full"
        />
        <span className="text-xs text-indigo-700">Adjust crop</span>
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
        <div className="flex items-center gap-1">
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
            className="rounded-xl border border-indigo-300 bg-white px-3 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-300"
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
