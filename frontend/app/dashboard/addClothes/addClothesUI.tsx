import React, { useEffect, useState, useRef, useCallback } from "react";
import { useUser } from "@auth0/nextjs-auth0/client";
import { useQueryClient } from "@tanstack/react-query"; // or "react-query" if you're on v3
import { View, OccasionTag, StyleCategory } from "../../types/clothes";
import {
  colours_List,
  fits_List,
  materials_List,
  patterns_List,
  styleCategories_List,
  occasionTags_List,
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
import {
  clearAuthTokenCache,
  getAuthHeaders,
} from "../../utils/getAuthHeaders";
import StyleDetailsSection from "../components/StyleDetailsSection";
import {
  CROP_OUTPUT_SIZE,
  canvasToPngBlob,
  clampCropOffset,
  createWorkingImageBlob,
  CropServiceMode,
  drawSquareCrop,
  frameImageBlob,
  getDrawScale,
  getMinUserZoom,
} from "../../utils/clientImageCrop";
import {
  CROP_OVERLAY_OPTIONS,
  CropOverlayId,
  cropOverlayFromClothingType,
} from "../../utils/cropOverlays";
import CropOverlayGuide from "./CropOverlayGuide";
import { warmupAiClothingService } from "../../utils/warmupAiService";
import ImageUploadFlow, {
  UploadStage,
} from "../../components/ux/ImageUploadFlow";
import InlineSuccessState from "../../components/ux/InlineSuccessState";
type addClothesUIProm = {
  setView: (view: View) => void;
  /** When set, called after a successful upload instead of navigating to wardrobe. */
  onUploadSuccess?: () => void;
  /** Override back navigation (e.g. return to onboarding). */
  onBack?: () => void;
};

function AddClothesUI({ setView, onUploadSuccess, onBack }: addClothesUIProm) {
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
    if (onBack) {
      onBack();
      return;
    }
    setView("wardrobe");
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
  const [styleCategory, setStyleCategory] = useState<StyleCategory | null>(
    null,
  );
  const [occasionTags, setOccasionTags] = useState<OccasionTag[]>([]);
  const [styleFromAi, setStyleFromAi] = useState(false);
  const [
    analysisSnapshot,
    setAnalysisSnapshot,
  ] = useState<ClothingAnalysisTags | null>(null);
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
  const [minZoom, setMinZoom] = useState(0.2);
  const [cropOverlay, setCropOverlay] = useState<CropOverlayId>("none");
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);
  const lastPosRef = useRef({ x: 0, y: 0 });
  const imageRef = useRef<HTMLImageElement | null>(null);
  /** Working (downscaled) PNG used for framing + rembg input. */
  const workingBlobRef = useRef<Blob | null>(null);
  /** In-flight or completed rembg-only result for the current generation. */
  const rembgPromiseRef = useRef<Promise<Blob | null> | null>(null);
  const rembgBlobRef = useRef<Blob | null>(null);
  const rembgGenerationRef = useRef(0);
  const previewUrlsRef = useRef<string[]>([]);

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
      setCropOverlay(cropOverlayFromClothingType(formatted));
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

      if (!img || img.src !== imageSrc) {
        img = new window.Image();
        img.src = imageSrc;
        imageRef.current = img;
      }

      if (!img.complete || img.naturalWidth === 0) {
        img.onload = () => {
          const nextMin = getMinUserZoom(img!.naturalWidth, img!.naturalHeight);
          setMinZoom(nextMin);
          setZoom((prev) => Math.max(nextMin, prev));
          drawCropPreview(imageSrc, Math.max(nextMin, zoomLevel), drawOffset);
        };
        return;
      }

      canvas.width = CROP_OUTPUT_SIZE;
      canvas.height = CROP_OUTPUT_SIZE;

      const nextMin = getMinUserZoom(img.naturalWidth, img.naturalHeight);
      const clampedZoom = Math.max(nextMin, zoomLevel);
      const scale = getDrawScale(
        img.naturalWidth,
        img.naturalHeight,
        clampedZoom,
      );
      const clampedOffset = clampCropOffset(
        drawOffset.x,
        drawOffset.y,
        img.naturalWidth,
        img.naturalHeight,
        scale,
      );

      drawSquareCrop(ctx, img, clampedZoom, clampedOffset);
    },
    [],
  );

  useEffect(() => {
    warmupAiClothingService();
  }, []);

  /** Background removal via /api/clothes/crop (mode=rembg_only preserves geometry). */
  const removeBackground = useCallback(
    async (
      blob: Blob,
      mode: CropServiceMode = "rembg_only",
    ): Promise<Blob | null> => {
      const cropForm = new FormData();
      cropForm.append("image", blob, "working.png");
      cropForm.append("mode", mode);

      const postCrop = async () =>
        fetch("/api/clothes/crop", {
          method: "POST",
          headers: await getAuthHeaders(),
          body: cropForm,
        });

      try {
        let response = await postCrop();
        if (response.status === 401) {
          clearAuthTokenCache();
          response = await postCrop();
        }
        if (!response.ok) return null;
        return await response.blob();
      } catch {
        return null;
      }
    },
    [],
  );

  useEffect(() => {
    if (!file) return;

    let cancelled = false;
    setValidFile(true);

    const generation = ++rembgGenerationRef.current;
    rembgBlobRef.current = null;
    rembgPromiseRef.current = null;
    workingBlobRef.current = null;

    const revokeTrackedUrls = () => {
      previewUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      previewUrlsRef.current = [];
    };

    const trackUrl = (url: string) => {
      previewUrlsRef.current.push(url);
      return url;
    };

    (async () => {
      try {
        const working = await createWorkingImageBlob(file);
        if (cancelled || generation !== rembgGenerationRef.current) return;

        workingBlobRef.current = working.blob;
        revokeTrackedUrls();
        const workingUrl = trackUrl(URL.createObjectURL(working.blob));
        setPreview(workingUrl);

        imageRef.current = null;
        const initialOffset = { x: 0, y: 0 };
        setZoom(1);
        setMinZoom(0.2);
        setCropOverlay("none");
        setOffset(initialOffset);
        drawCropPreview(workingUrl, 1, initialOffset);

        const rembgPromise = removeBackground(working.blob, "rembg_only");
        rembgPromiseRef.current = rembgPromise;
        const rembgBlob = await rembgPromise;
        if (cancelled || generation !== rembgGenerationRef.current) return;

        rembgBlobRef.current = rembgBlob;
        if (!rembgBlob) return;

        const rembgUrl = trackUrl(URL.createObjectURL(rembgBlob));
        // Soft-swap to transparent PNG; re-fit zoom/offset to the new dimensions.
        imageRef.current = null;
        setPreview(rembgUrl);
        drawCropPreview(rembgUrl, zoom, offset);
      } catch (err) {
        console.error("Failed to prepare image for rembg:", err);
        if (cancelled || generation !== rembgGenerationRef.current) return;
        const fallbackUrl = trackUrl(URL.createObjectURL(file));
        workingBlobRef.current = file;
        setPreview(fallbackUrl);
        drawCropPreview(fallbackUrl, 1, { x: 0, y: 0 });
      }
    })();

    return () => {
      cancelled = true;
      revokeTrackedUrls();
    };
    // Intentionally omits zoom/offset — file pick resets crop state above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file, drawCropPreview, removeBackground]);

  useEffect(() => {
    if (preview) {
      drawCropPreview(preview, zoom, offset);
    }
  }, [zoom, preview, offset, drawCropPreview]);

  const generateCroppedImage = async () => {
    const canvas = canvasRef.current;
    if (!canvas || !preview) return null;

    // Ensure the canvas reflects the latest zoom/offset before export.
    drawCropPreview(preview, zoom, offset);
    return canvasToPngBlob(canvas);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
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
    const scale = getDrawScale(img.naturalWidth, img.naturalHeight, zoom);

    setOffset((prev) =>
      clampCropOffset(
        prev.x + dx,
        prev.y + dy,
        img.naturalWidth,
        img.naturalHeight,
        scale,
      ),
    );
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
    const scale = getDrawScale(img.naturalWidth, img.naturalHeight, zoom);

    setOffset((prev) =>
      clampCropOffset(
        prev.x + dx,
        prev.y + dy,
        img.naturalWidth,
        img.naturalHeight,
        scale,
      ),
    );
  };

  /** Source blob for AI — always the user-framed canvas crop when available. */
  const getAnalysisSourceBlob = async (): Promise<Blob | null> => {
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
      setCropOverlay(cropOverlayFromClothingType(formatted));
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

    if (tags.styleCategory?.value) {
      const match = styleCategories_List.find(
        (item) =>
          item.toLowerCase() ===
          String(tags.styleCategory?.value).toLowerCase(),
      );
      if (match) {
        setStyleCategory(match);
        setStyleFromAi(true);
      }
    }

    if (Array.isArray(tags.occasionTags?.value)) {
      const next = tags.occasionTags.value.filter((tag): tag is OccasionTag =>
        occasionTags_List.includes(tag as OccasionTag),
      );
      if (next.length > 0) {
        setOccasionTags(next);
        setStyleFromAi(true);
      }
    }
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
        setAnalysisSnapshot(result.tags);
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
    if (styleCategory) {
      formData.append("styleCategory", styleCategory);
    }
    if (occasionTags.length > 0) {
      formData.append("occasionTags", JSON.stringify(occasionTags));
    }
    if (analysisSnapshot) {
      formData.append("analysisSnapshot", JSON.stringify(analysisSnapshot));
    }

    // Await early rembg_only (started on file pick). Then apply local pan/zoom framing.
    // Do not call the crop service again on submit.
    let rembgBlob = rembgBlobRef.current;
    if (!rembgBlob && rembgPromiseRef.current) {
      rembgBlob = await rembgPromiseRef.current;
      rembgBlobRef.current = rembgBlob;
    }

    const sourceForFrame =
      rembgBlob ?? workingBlobRef.current ?? file;
    if (!sourceForFrame) return;

    const framed =
      (await frameImageBlob(sourceForFrame, zoom, offset)) ??
      (await generateCroppedImage());
    if (!framed) return;

    formData.append("image", framed, "cropped.png");
    formData.append("imageAlreadyCropped", "true");

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
    event: React.MouseEvent | React.FormEvent,
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
        queryClient.invalidateQueries({ queryKey: ["user", user?.sub] });
        if (onUploadSuccess) {
          onUploadSuccess();
        } else {
          setView("wardrobe");
          goToNextTourStep();
        }
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

  const uploadStage: UploadStage = loading
    ? "details"
    : isAnalyzing
      ? "identifying"
      : preview && (usersClothType || usersColours.length > 0)
        ? "ready"
        : preview
          ? "preview"
          : "pick";

  return (
    <ImageUploadFlow stage={uploadStage}>
    <div className="bg-almaari-bg w-full h-full min-h-0 overflow-x-hidden overflow-y-auto px-2 py-2 pb-24 sm:p-1 sm:pb-4">
      <form
        id="add-clothes-form"
        className="mt-2 md:mt-8 bg-almaari-surface-raised border border-almaari-border rounded-almaari-lg w-full max-w-lg md:max-w-4xl mx-auto p-3 sm:p-5 md:p-6 shadow-card text-base flex flex-col gap-3 sm:gap-4"
      >
        <div className="relative flex items-center min-h-10 w-full">
          <button
            type="button"
            onClick={handleBack}
            className="relative z-10 inline-flex items-center gap-1.5 font-medium px-2.5 sm:px-4 min-h-10 h-10 rounded-xl cursor-pointer border border-indigo-300 bg-indigo-100/70 text-indigo-900 hover:bg-indigo-500 hover:text-white active:bg-purple-600 transition-colors duration-300 text-sm shrink-0"
          >
            ← Back
          </button>
          <h1 className="absolute inset-x-0 text-sm sm:text-lg font-display text-almaari-ink text-center truncate px-14 pointer-events-none">
            Add to wardrobe
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
                  <div className="relative flex h-full w-full items-center justify-center">
                    <div className="relative aspect-square h-full max-h-full w-auto max-w-full shrink-0">
                      <canvas
                        ref={canvasRef}
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                        onTouchStart={handleTouchStart}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleTouchEnd}
                        className="block h-full w-full cursor-grab active:cursor-grabbing touch-none"
                      />
                      <div className="pointer-events-none absolute inset-0">
                        <CropOverlayGuide overlay={cropOverlay} />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        fileInputRef.current?.click();
                      }}
                      className="absolute top-2 right-2 bg-white/90 text-xs px-2.5 py-1.5 rounded-lg shadow min-h-8 z-10"
                    >
                      Replace
                    </button>
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 max-w-[90%] text-center text-[11px] sm:text-xs text-indigo-700 bg-white/80 px-2 py-1 rounded z-10">
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
                <label
                  htmlFor="crop-overlay-select"
                  className="text-sm font-medium text-indigo-900"
                >
                  Crop guide
                </label>
                <select
                  id="crop-overlay-select"
                  value={cropOverlay}
                  onChange={(e) =>
                    setCropOverlay(e.target.value as CropOverlayId)
                  }
                  className="w-full min-h-11 rounded-xl border border-indigo-300 bg-white px-3 text-sm text-indigo-900 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                >
                  {CROP_OVERLAY_OPTIONS.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <input
                  type="range"
                  min={minZoom}
                  max={3}
                  step="0.01"
                  value={zoom}
                  onChange={(e) => {
                    const nextZoom = Number(e.target.value);
                    setZoom(nextZoom);
                    if (imageRef.current) {
                      const img = imageRef.current;
                      const scale = getDrawScale(
                        img.naturalWidth,
                        img.naturalHeight,
                        nextZoom,
                      );
                      setOffset((prev) =>
                        clampCropOffset(
                          prev.x,
                          prev.y,
                          img.naturalWidth,
                          img.naturalHeight,
                          scale,
                        ),
                      );
                    }
                  }}
                  className="w-full min-h-8 accent-indigo-600 touch-manipulation"
                  aria-label="Zoom image for crop"
                />
                <div className="flex items-center justify-between text-xs text-indigo-700">
                  <span>Zoom out</span>
                  <span>Adjust crop</span>
                  <span>Zoom in</span>
                </div>
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
              id="AI_analyze_button"
              type="button"
              disabled={
                isAnalyzing || isLoadingCredits || !file || (credits ?? 0) < 1
              }
              className="inline-flex items-center justify-center gap-2 font-medium px-3 sm:px-4 min-h-11 h-11 rounded-xl cursor-pointer border border-indigo-300 bg-indigo-100/70 text-indigo-900 hover:bg-indigo-500 hover:text-white transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed w-full text-sm sm:text-base"
              onClick={() => analyzeImage()}
            >
              <Sparkles className="w-4 h-4 shrink-0" />
              {isAnalyzing ? (
                "Identifying your item…"
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

              <StyleDetailsSection
                value={{ styleCategory, occasionTags }}
                userReviewedAt={styleFromAi ? null : "local"}
                onChange={(next) => {
                  setStyleCategory(next.styleCategory);
                  setOccasionTags(next.occasionTags);
                  setStyleFromAi(false);
                }}
              />
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
                <div className="w-full inline-flex items-center justify-center gap-2 font-medium px-4 min-h-11 h-11 rounded-almaari cursor-pointer bg-almaari-accent text-white">
                  Adding details…
                </div>
              ) : (
                <button
                  type="button"
                  onClick={(event) => handleSubmit(event)}
                  className="w-full inline-flex items-center justify-center gap-2 font-medium px-4 min-h-11 h-11 rounded-almaari cursor-pointer bg-almaari-accent text-white hover:bg-almaari-accent-strong shadow-soft"
                >
                  <Send className="w-4 h-4 shrink-0" />
                  Save to wardrobe
                </button>
              )}
              <InlineSuccessState show={false} className="mt-2 justify-center" />
            </div>
          </div>
        </div>
      </form>
    </div>
    </ImageUploadFlow>
  );
}

export default AddClothesUI;
