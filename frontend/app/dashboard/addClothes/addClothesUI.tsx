import React, { useEffect, useState, useRef, useCallback } from "react";
import { useUser } from "@auth0/nextjs-auth0/client";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query"; // or "react-query" if you're on v3
import { View } from "../../types/clothes";
import {
  colours_List,
  fits_List,
  materials_List,
  patterns_List,
  type_List,
} from "../../data/constants";
import { goToNextTourStep } from "../../components/OnBoardingTour";
import { useCredits } from "../../hooks/useCredits";
import { useAnalyzeClothing } from "../../hooks/useAnalyzeClothing";
import {
  ClothingAnalysisTags,
  ClothingTagField,
  ColourListTagField,
} from "../../types/clothingAnalysis";
import { prepareImagePayloadForAnalysis } from "../../utils/imageAnalysis";
import {
  createClientTraceId,
  isAiAnalyzeTimingEnabled,
  logAnalyzeGroup,
  logAnalyzeStep,
  logAnalyzeTotal,
} from "../../utils/aiAnalyzeTiming";
import { Sparkles, Send } from "lucide-react";
import { clearAuthTokenCache, getAuthHeaders } from "../../utils/getAuthHeaders";
type addClothesUIProm = {
  setView: (view: View) => void;
};

function AddClothesUI({ setView }: addClothesUIProm) {
  const { credits, isLoadingCredits } = useCredits();
  const {
    mutateAsync: analyzeClothing,
    isPending: isAnalyzing,
    error: analyzeError,
    reset: resetAnalyzeError,
  } = useAnalyzeClothing();
  const [analyzeMessage, setAnalyzeMessage] = useState<string | null>(null);
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

  const [inputMaterialValue, setInputMaterialValue] = useState<string>("");
  const [usersClothMaterial, setUsersClothMaterial] = useState<string>("");

  const [filtered_materials_List, set_Filtered_materials_List] = useState(
    materials_List,
  );
  const [filtered_fits_List, set_Filtered_fits_List] = useState(fits_List);
  const [filtered_patterns_List, set_Filtered_patterns_List] = useState(
    patterns_List,
  );
  const [inputFitValue, setInputFitValue] = useState<string>("");
  const [inputPatternValue, setInputPatternValue] = useState<string>("");
  const [validMaterial, setValidMaterial] = useState<boolean | null>(null);
  const [validFit, setValidFit] = useState<boolean | null>(null);
  const [validPattern, setValidPattern] = useState<boolean | null>(null);
  const [usersClothFit, setUsersClothFit] = useState<string>("");
  const [usersClothPattern, setUsersClothPattern] = useState<string>("");
  //file can either be of type file or type null
  const [file, setFile] = useState<File | null>(null);
  //file can either be of type string or type null
  const [preview, setPreview] = useState<string | null>(null);
  const [pythonCropStatus, setPythonCropStatus] = useState<
    "idle" | "pending" | "ready" | "failed"
  >("idle");
  const [pythonCroppedBlob, setPythonCroppedBlob] = useState<Blob | null>(null);
  const pythonCropJobIdRef = useRef(0);
  const pythonCropPromiseRef = useRef<Promise<Blob | null> | null>(null);
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

  const startPythonCrop = useCallback(
    (nextFile: File | null): Promise<Blob | null> => {
      pythonCropJobIdRef.current += 1;
      const jobId = pythonCropJobIdRef.current;

      setPythonCroppedBlob(null);
      if (!nextFile) {
        setPythonCropStatus("idle");
        pythonCropPromiseRef.current = null;
        return Promise.resolve(null);
      }

      setPythonCropStatus("pending");

      const work = (async (): Promise<Blob | null> => {
        const formData = new FormData();
        formData.append("image", nextFile);

        const controller = new AbortController();
        const timeout = window.setTimeout(() => controller.abort(), 20000);

        try {
          const postCrop = async () =>
            fetch("/api/clothes/crop", {
              method: "POST",
              headers: await getAuthHeaders(),
              body: formData,
              signal: controller.signal,
            });

          let response = await postCrop();
          if (response.status === 401) {
            clearAuthTokenCache();
            response = await postCrop();
          }

          if (!response.ok) return null;

          const blob = await response.blob();

          if (pythonCropJobIdRef.current !== jobId) return null;
          setPythonCroppedBlob(blob);
          setPythonCropStatus("ready");
          return blob;
        } catch {
          if (pythonCropJobIdRef.current === jobId) {
            setPythonCropStatus("failed");
          }
          return null;
        } finally {
          window.clearTimeout(timeout);
          if (pythonCropJobIdRef.current === jobId) {
            pythonCropPromiseRef.current = null;
          }
        }
      })();

      pythonCropPromiseRef.current = work;
      return work;
    },
    [],
  );

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
  const validateMaterial = () => {
    const formatted = formatInput(inputMaterialValue);
    if (materials_List.includes(formatted) && formatted) {
      setValidMaterial(true);
      return true;
    } else if (formatted) {
      setValidMaterial(false);
    } else {
      setValidMaterial(false);
    }
    return false;
  };

  function setUserMaterial() {
    const formatted = formatInput(inputMaterialValue);
    const valid = validateMaterial();
    if (valid) {
      setUsersClothMaterial(formatted);
      setInputMaterialValue(formatted);
    }
  }

  const validateFit = () => {
    const formatted = formatInput(inputFitValue);
    if (fits_List.includes(formatted) && formatted) {
      setValidFit(true);
      return true;
    } else if (formatted) {
      setValidFit(false);
    } else {
      setValidFit(false);
    }
    return false;
  };

  function setUserFit() {
    const formatted = formatInput(inputFitValue);
    const valid = validateFit();
    if (valid) {
      setUsersClothFit(formatted);
      setInputFitValue(formatted);
    }
  }

  const validatePattern = () => {
    const formatted = formatInput(inputPatternValue);
    if (patterns_List.includes(formatted) && formatted) {
      setValidPattern(true);
      return true;
    } else if (formatted) {
      setValidPattern(false);
    } else {
      setValidPattern(false);
    }
    return false;
  };

  function setUserPattern() {
    const formatted = formatInput(inputPatternValue);
    const valid = validatePattern();
    if (valid) {
      setUsersClothPattern(formatted);
      setInputPatternValue(formatted);
    }
  }

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
      setInputTypeValue(formatted);
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
    if (element === "material") {
      setUserMaterial();
    }
    if (element === "fit") {
      setUserFit();
    }
    if (element === "pattern") {
      setUserPattern();
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
      if (event.currentTarget.id === "add-material-btn") {
        setUserMaterial();
      }
      if (event.currentTarget.id === "add-fit-btn") {
        setUserFit();
      }
      if (event.currentTarget.id === "add-pattern-btn") {
        setUserPattern();
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
    (
      imageSrc: string,
      zoomLevel: number,
      drawOffset: { x: number; y: number },
    ) => {
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
        img.onload = () => drawCropPreview(imageSrc, zoomLevel, drawOffset);
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
      const scale = minZoom * zoomLevel;

      const baseX = (size - img.width * scale) / 2;
      const baseY = (size - img.height * scale) / 2;

      const x = baseX + drawOffset.x;
      const y = baseY + drawOffset.y;

      ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
    },
    [],
  );

  useEffect(() => {
    if (!file) return;

    setValidFile(true);

    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);

    imageRef.current = null;
    const initialOffset = { x: 0, y: 0 };
    setOffset(initialOffset);
    drawCropPreview(objectUrl, 1, initialOffset);
    startPythonCrop(file);

    return () => URL.revokeObjectURL(objectUrl);
  }, [file, drawCropPreview, startPythonCrop]);

  useEffect(() => {
    if (preview) {
      drawCropPreview(preview, zoom, offset);
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

  /** Source blob for AI only — uses crop canvas when available, else raw file. */
  const getAnalysisSourceBlob = async (): Promise<Blob | null> => {
    if (pythonCropStatus === "ready" && pythonCroppedBlob) {
      return pythonCroppedBlob;
    }
    const cropped = await generateCroppedImage();
    if (cropped) return cropped;
    if (file) return file;
    return null;
  };

  const getAnalysisImagePayload = async (
    traceId: string,
  ): Promise<string | null> => {
    const sourceStart = performance.now();
    const source = await getAnalysisSourceBlob();
    logAnalyzeStep(
      traceId,
      "crop/source blob preparation",
      performance.now() - sourceStart,
    );

    if (!source) return null;
    return prepareImagePayloadForAnalysis(source, traceId);
  };

  const applyTagValue = (
    tag: ClothingTagField | undefined,
    apply: (formatted: string) => void,
  ) => {
    if (!tag?.value) return;
    const formatted = formatInput(tag.value);
    if (!formatted) return;
    apply(formatted);
  };

  const applyColourList = (tag: ColourListTagField | undefined) => {
    if (!tag?.value?.length) return;
    const normalized: string[] = [];
    for (const raw of tag.value) {
      const formatted = formatInput(raw);
      if (!formatted || !colours_List.includes(formatted)) continue;
      if (!normalized.includes(formatted)) normalized.push(formatted);
    }
    if (normalized.length === 0) return;
    setUsersColours((prev) => {
      const merged = [...prev];
      for (const colour of normalized) {
        if (!merged.includes(colour)) merged.push(colour);
      }
      return merged;
    });
    setValidColour(true);
  };

  const applyAnalysisTags = (tags: ClothingAnalysisTags) => {
    applyTagValue(tags.type, (formatted) => {
      setUsersClothType(formatted);
      setInputTypeValue(formatted);
      setValidType(type_List.includes(formatted));
    });

    applyColourList(tags.colour);

    applyTagValue(tags.material, (formatted) => {
      setUsersClothMaterial(formatted);
      setInputMaterialValue(formatted);
      setValidMaterial(materials_List.includes(formatted));
    });

    applyTagValue(tags.fit, (formatted) => {
      setUsersClothFit(formatted);
      setInputFitValue(formatted);
      setValidFit(fits_List.includes(formatted));
    });

    applyTagValue(tags.pattern, (formatted) => {
      setUsersClothPattern(formatted);
      setInputPatternValue(formatted);
      setValidPattern(patterns_List.includes(formatted));
    });
  };

  const analyzeImage = async () => {
    resetAnalyzeError();
    setAnalyzeMessage(null);

    if (!file && !preview) {
      setValidFile(false);
      return;
    }

    if (!user?.sub) {
      setAnalyzeMessage("You must be logged in to analyze images.");
      return;
    }

    if ((credits ?? 0) < 1) {
      setAnalyzeMessage("You need at least 1 credit to analyze an image.");
      return;
    }

    const traceId = createClientTraceId();
    const flowStart = performance.now();
    const stepMs: Record<string, number> = {};

    try {
      const prepStart = performance.now();
      const image = await getAnalysisImagePayload(traceId);
      stepMs["image prep (crop + optimize + base64)"] =
        performance.now() - prepStart;

      if (!image) {
        setValidFile(false);
        return;
      }

      const networkStart = performance.now();
      const result = await analyzeClothing({
        image,
        requestId: traceId,
      });
      stepMs["network + backend + AI"] = performance.now() - networkStart;

      if (result.tags) {
        applyAnalysisTags(result.tags);
      }
      setAnalyzeMessage(result.message ?? "Analysis completed");

      stepMs["total frontend"] = performance.now() - flowStart;
      if (isAiAnalyzeTimingEnabled()) {
        logAnalyzeGroup(traceId, "frontend analyze breakdown", stepMs);
        logAnalyzeTotal(traceId, "total analyze click → response", flowStart);
      }
    } catch {
      stepMs["total frontend (error)"] = performance.now() - flowStart;
      if (isAiAnalyzeTimingEnabled()) {
        logAnalyzeGroup(traceId, "frontend analyze breakdown (error)", stepMs);
      }
      // error surfaced via analyzeError from mutation
    }
  };

  const pushDB = async () => {
    if (!user) {
      console.error("User is not authenticated. Cannot upload a real picture.");
      return;
    }

    const formData = new FormData();

    formData.append("type", usersClothType);
    formData.append("colour", JSON.stringify(usersColours));
    formData.append("material", usersClothMaterial);
    formData.append("fit", usersClothFit);
    formData.append("pattern", usersClothPattern);

    // Submit must wait for python crop completion if pending.
    let pythonBlob: Blob | null = null;
    if (file) {
      if (pythonCropStatus === "pending" && pythonCropPromiseRef.current) {
        pythonBlob = await pythonCropPromiseRef.current;
      } else if (pythonCropStatus === "ready" && pythonCroppedBlob) {
        pythonBlob = pythonCroppedBlob;
      } else if (pythonCropStatus === "idle") {
        pythonBlob = await startPythonCrop(file);
      }
    }

    if (pythonBlob) {
      formData.append("image", pythonBlob, "python-cropped.png");
      formData.append("imageAlreadyCropped", "true");
    } else {
      const cropped = await generateCroppedImage();
      if (cropped) {
        formData.append("image", cropped, "cropped.png");
      } else if (file) {
        formData.append("image", file);
      }
    }

    const uploadClothes = async () =>
      fetch(`/api/clothes/upload`, {
        method: "POST",
        headers: await getAuthHeaders(),
        body: formData,
      });

    let response = await uploadClothes();
    if (response.status === 401) {
      clearAuthTokenCache();
      response = await uploadClothes();
    }

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

    if (
      validateColour() &&
      validateType() &&
      validateMaterial() &&
      validateFit() &&
      validatePattern() &&
      file
    ) {
      setUserType();
      setUserMaterial();
      setUserFit();
      setUserPattern();
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

  const handleDeleteTag = (category: "colour", value: string) => {
    setUsersColours((prev) => {
      const next = prev.filter((item) => item !== value);
      if (next.length === 0) setValidColour(false);
      return next;
    });
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
  const inputClassName = (invalid: boolean | null) =>
    `w-full min-w-0 rounded-xl border bg-white px-3 py-2.5 text-base sm:text-sm focus:outline-none focus:ring-2 ${
      invalid === false
        ? "border-red-300 focus:ring-red-300"
        : "border-indigo-300 focus:ring-indigo-300"
    }`;

  return (
    <div className="bg-indigo-200 w-full h-full min-h-0 overflow-x-hidden overflow-y-auto px-2 py-2 pb-24 sm:p-1 sm:pb-4">
      <form
        id="add-clothes-form"
        className="mt-2 md:mt-16 bg-white border border-indigo-200 rounded-xl w-full max-w-lg md:max-w-4xl mx-auto p-3 sm:p-5 md:p-6 shadow-md text-base flex flex-col gap-3 sm:gap-4"
      >
        <div className="relative flex items-center min-h-10 w-full">
          <button
            type="button"
            onClick={handleBack}
            className="relative z-10 inline-flex items-center gap-1.5 font-medium px-2.5 sm:px-4 min-h-10 h-10 rounded-xl cursor-pointer border border-indigo-300 bg-indigo-100/70 text-indigo-900 hover:bg-indigo-500 hover:text-white active:bg-purple-600 transition-colors duration-300 text-sm shrink-0"
          >
            ← Back
          </button>
          <h1 className="absolute inset-x-0 text-sm sm:text-lg font-semibold text-indigo-900 uppercase tracking-wide text-center truncate px-14 pointer-events-none">
            Add clothes
          </h1>
        </div>
        <div className="w-full flex flex-col md:grid md:grid-cols-2 md:gap-6 md:items-start gap-3 mx-auto">
          {/* Image upload & crop — left on md+, stacked first on small screens */}
          <div className="flex flex-col gap-2 w-full md:sticky md:top-0 shrink-0">
            <div className="rounded-lg w-full">
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
                className="relative bg-white border border-indigo-200 rounded-lg h-[min(220px,42vh)] sm:h-[260px] md:h-[320px] w-full max-w-full sm:max-w-sm mx-auto flex items-center overflow-hidden justify-center cursor-pointer hover:opacity-90 transition"
                onClick={() => {
                  if (!preview) fileInputRef.current?.click();
                }}
              >
                {preview ? (
                  <div className="flex items-center justify-center w-full h-full cursor-pointer hover:opacity-90 transition">
                    <canvas
                      ref={canvasRef}
                      onMouseDown={handleMouseDown}
                      onMouseMove={handleMouseMove}
                      onMouseUp={handleMouseUp}
                      onMouseLeave={handleMouseUp}
                      onTouchStart={handleTouchStart}
                      onTouchMove={handleTouchMove}
                      onTouchEnd={handleTouchEnd}
                      className="max-w-full max-h-full cursor-grab active:cursor-grabbing touch-none"
                    />

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        fileInputRef.current?.click();
                      }}
                      className="absolute top-2 right-2 bg-white/90 text-xs px-2.5 py-1.5 rounded-lg shadow min-h-8"
                    >
                      Replace
                    </button>
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 max-w-[90%] text-center text-[11px] sm:text-xs text-indigo-700 bg-white/80 px-2 py-1 rounded">
                      <span className="sm:hidden">
                        Drag to reposition • slider to zoom
                      </span>
                      <span className="hidden sm:inline">
                        Drag to reposition • Zoom to crop
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-indigo-900/60 text-sm px-4 text-center">
                    Tap to add image
                  </div>
                )}
              </div>
            </div>

            {preview && (
              <>
                <input
                  type="range"
                  min="1"
                  max="2.5"
                  step="0.01"
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="w-full min-h-8 accent-indigo-600 touch-manipulation"
                />
                <span className="text-xs text-indigo-700">Adjust crop</span>
              </>
            )}
            {validFile == false && (
              <span className="text-sm text-red-600">Enter a Picture</span>
            )}
            <label
              htmlFor="input-tag"
              className="text-sm font-medium text-indigo-900"
            >
              Fill Form with AI
            </label>
            <button
              type="button"
              disabled={
                isAnalyzing || isLoadingCredits || !file || (credits ?? 0) < 1
              }
              className="inline-flex items-center justify-center gap-2 font-medium px-3 sm:px-4 min-h-11 h-11 rounded-xl cursor-pointer border border-indigo-300 bg-indigo-100/70 text-indigo-900 hover:bg-indigo-500 hover:text-white transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed w-full text-sm sm:text-base"
              onClick={() => analyzeImage()}
            >
              <Sparkles className="w-4 h-4 shrink-0" />
              {isAnalyzing ? (
                "Analyzing..."
              ) : (
                <>
                  <span className="sm:hidden">Analyze (1 credit)</span>
                  <span className="hidden sm:inline">
                    Analyze Image (1 credit)
                  </span>
                </>
              )}
            </button>
            {analyzeError && (
              <span className="text-sm text-red-600">
                {analyzeError.message}
              </span>
            )}
            {analyzeMessage && !analyzeError && (
              <span className="text-sm text-indigo-700">{analyzeMessage}</span>
            )}
            {!isLoadingCredits && (credits ?? 0) < 1 && !analyzeMessage && (
              <span className="text-sm text-red-600">
                Insufficient credits for analysis.
              </span>
            )}
          </div>

          {/* Form inputs — right on md+, below image on small screens */}

          <div className="flex flex-col gap-3 w-full min-w-0">
            <label
              htmlFor="input-type"
              className="text-sm font-medium text-indigo-900"
            >
              Type
            </label>
            <input
              id="add-type-btn"
              placeholder="e.g. pants, shirt"
              autoComplete="on"
              required
              className={inputClassName(validType)}
              type="text"
              list="types"
              value={inputTypeValue}
              onBlur={() => onBlur("type")}
              onKeyDown={handleKeyDown}
              onChange={(e) => {
                const value = e.target.value;
                filter(value, type_List, set_Filtered_type_List);
                setInputTypeValue(value);
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
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <input
                placeholder="e.g. red, blue"
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
                className={inputClassName(validColour)}
              ></input>
              <button
                type="button"
                className="inline-flex items-center justify-center font-medium px-4 min-h-11 h-11 rounded-xl cursor-pointer border border-indigo-300 bg-indigo-100/70 text-indigo-900 hover:bg-indigo-500 hover:text-white transition-colors duration-200 sm:shrink-0 sm:w-20"
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
                  onClick={(e) => handleDeleteTag("colour", e.currentTarget.id)}
                >
                  <span
                    className="h-3 w-3 rounded-full border border-indigo-200"
                    style={
                      colour === "Camo"
                        ? { backgroundColor: "green" }
                        : { backgroundColor: colour }
                    }
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-x-4">
              <div className="flex flex-col gap-1.5 min-w-0">
                <label
                  htmlFor="input-material"
                  className="text-sm font-medium text-indigo-900"
                >
                  Material
                </label>
                <input
                  id="add-material-btn"
                  placeholder="e.g. cotton"
                  autoComplete="on"
                  required
                  className={inputClassName(validMaterial)}
                  type="text"
                  list="materials"
                  value={inputMaterialValue}
                  onBlur={() => onBlur("material")}
                  onKeyDown={handleKeyDown}
                  onChange={(e) => {
                    const value = e.target.value;
                    filter(value, materials_List, set_Filtered_materials_List);
                    setInputMaterialValue(value);
                  }}
                ></input>
                {validMaterial == false && (
                  <span className="text-xs sm:text-sm text-red-600">
                    Enter a valid material
                  </span>
                )}
                <datalist id="materials">
                  {filtered_materials_List.map((material, index) => (
                    <option key={index} value={material}></option>
                  ))}{" "}
                </datalist>
              </div>

              <div className="flex flex-col gap-1.5 min-w-0">
                <label
                  htmlFor="input-fit"
                  className="text-sm font-medium text-indigo-900"
                >
                  Fit
                </label>
                <input
                  id="add-fit-btn"
                  placeholder="e.g. slim"
                  autoComplete="on"
                  required
                  className={inputClassName(validFit)}
                  type="text"
                  list="fits"
                  value={inputFitValue}
                  onBlur={() => onBlur("fit")}
                  onKeyDown={handleKeyDown}
                  onChange={(e) => {
                    const value = e.target.value;
                    filter(value, fits_List, set_Filtered_fits_List);
                    setInputFitValue(value);
                  }}
                ></input>
                {validFit == false && (
                  <span className="text-xs sm:text-sm text-red-600">
                    Enter a valid fit
                  </span>
                )}
                <datalist id="fits">
                  {filtered_fits_List.map((fit, index) => (
                    <option key={index} value={fit}></option>
                  ))}{" "}
                </datalist>
              </div>

              <div className="flex flex-col gap-1.5 min-w-0 sm:col-span-2">
                <label
                  htmlFor="input-pattern"
                  className="text-sm font-medium text-indigo-900"
                >
                  Pattern
                </label>
                <input
                  id="add-pattern-btn"
                  placeholder="e.g. striped"
                  autoComplete="on"
                  required
                  className={inputClassName(validPattern)}
                  type="text"
                  list="patterns"
                  value={inputPatternValue}
                  onBlur={() => onBlur("pattern")}
                  onKeyDown={handleKeyDown}
                  onChange={(e) => {
                    const value = e.target.value;
                    filter(value, patterns_List, set_Filtered_patterns_List);
                    setInputPatternValue(value);
                  }}
                ></input>
                {validPattern == false && (
                  <span className="text-xs sm:text-sm text-red-600">
                    Enter a valid pattern
                  </span>
                )}
                <datalist id="patterns">
                  {filtered_patterns_List.map((pattern, index) => (
                    <option key={index} value={pattern}></option>
                  ))}{" "}
                </datalist>
              </div>
            </div>

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
            <div
              id="submit-btn"
              className=" bottom-0 z-10 mt-2 pt-3 pb-1 -mx-1 px-1 bg-gradient-to-t from-white via-white/95 to-transparent sm:static sm:mt-auto sm:pt-2 sm:pb-0 sm:mx-0 sm:px-0 sm:bg-transparent shrink-0"
            >
              {loading ? (
                <div className="w-full inline-flex items-center justify-center gap-2 font-medium px-4 min-h-11 h-11 rounded-xl cursor-pointer bg-indigo-600 text-white">
                  Loading...
                </div>
              ) : (
                <Link
                  href="/"
                  type="button"
                  onClick={(event) => handleSubmit(event)}
                  className="w-full inline-flex items-center justify-center gap-2 font-medium px-4 min-h-11 h-11 rounded-xl cursor-pointer bg-indigo-600 text-white hover:bg-indigo-700 active:bg-indigo-800 shadow-md sm:shadow-none"
                >
                  <Send className="w-4 h-4 shrink-0" />
                  Submit
                </Link>
              )}
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

export default AddClothesUI;
