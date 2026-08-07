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
import { applyClothingTypeInferencesToTags } from "../../utils/clothingTypeInferences";
import {
  createClientTraceId,
  isAiAnalyzeTimingEnabled,
  logAnalyzeGroup,
  logAnalyzeStep,
  logAnalyzeTotal,
} from "../../utils/aiAnalyzeTiming";
import { Sparkles, Send, ArrowLeft } from "lucide-react";
import {
  clearAuthTokenCache,
  getAuthHeaders,
} from "../../utils/getAuthHeaders";
import { createIdempotencyKey } from "../../utils/idempotencyKey";
import { clothesQueryKeys } from "../../hooks/useClothesData";
import StyleDetailsSection from "../components/StyleDetailsSection";
import ClothingCropSurface from "../components/ClothingCropSurface";
import {
  createWorkingImageBlob,
  CropRotation,
  CropServiceMode,
  ABSOLUTE_MIN_USER_ZOOM,
} from "../../utils/clientImageCrop";
import { getCroppedClothingBlob } from "../../utils/getCroppedClothingBlob";
import type { Area, Point } from "react-easy-crop";
import {
  CROP_OVERLAY_OPTIONS,
  CropOverlayId,
  cropOverlayFromClothingType,
} from "../../utils/cropOverlays";
import { warmupAiClothingService } from "../../utils/warmupAiService";
import ImageUploadFlow, {
  UploadStage,
} from "../../components/ux/ImageUploadFlow";
import InlineSuccessState from "../../components/ux/InlineSuccessState";
import ClothingImageSourcePicker from "../../components/clothing-upload/ClothingImageSourcePicker";
import ClothingOptionAutocomplete from "../components/ClothingOptionAutocomplete";
import CropAdjustControls from "../components/CropAdjustControls";

const DEFAULT_CLOTHING_TYPE = "T-shirt";

function FormSection({
  title,
  description,
  children,
  className = "",
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-almaari-lg border border-almaari-border/70 bg-almaari-surface p-4 space-y-3 overflow-visible ${className}`}
    >
      <div>
        <h2 className="font-display text-base text-almaari-ink">{title}</h2>
        {description ? (
          <p className="mt-0.5 text-xs leading-relaxed text-almaari-muted">
            {description}
          </p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function FieldLabel({
  htmlFor,
  children,
  required,
}: {
  htmlFor: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <label htmlFor={htmlFor} className="text-sm font-medium text-almaari-ink">
      {children}
      {required ? (
        <span className="font-normal text-almaari-muted"> (required)</span>
      ) : null}
    </label>
  );
}

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

  const [validType, setValidType] = useState<boolean | null>(true);

  const [usersColours, setUsersColours] = useState<string[]>([]);
  const [usersClothType, setUsersClothType] = useState<string>(
    DEFAULT_CLOTHING_TYPE,
  );

  const [inputColourValue, setInputColourValue] = useState<string>("");
  const [inputTypeValue, setInputTypeValue] = useState<string>(
    DEFAULT_CLOTHING_TYPE,
  );

  const [inputMaterialValue, setInputMaterialValue] = useState<string>("");
  const [usersClothMaterial, setUsersClothMaterial] = useState<string>("");

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

  const { user } = useUser();

  const croppedAreaPixelsRef = useRef<Area | null>(null);
  const [zoom, setZoom] = useState(1);
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [cropOverlay, setCropOverlay] = useState<CropOverlayId>(() =>
    cropOverlayFromClothingType(DEFAULT_CLOTHING_TYPE),
  );
  const [rotation, setRotation] = useState<CropRotation>(0);
  /** Working (downscaled) PNG used for framing + rembg input. */
  const workingBlobRef = useRef<Blob | null>(null);
  /** In-flight or completed rembg-only result for the current generation. */
  const rembgPromiseRef = useRef<Promise<Blob | null> | null>(null);
  const rembgBlobRef = useRef<Blob | null>(null);
  const rembgGenerationRef = useRef(0);
  const uploadIdempotencyKeyRef = useRef<string | null>(null);
  const analyzeIdempotencyKeyRef = useRef<string | null>(null);
  const submitInFlightRef = useRef(false);
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

  const resetCropState = useCallback(() => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
    croppedAreaPixelsRef.current = null;
  }, []);

  const handleCropComplete = useCallback((_area: Area, pixels: Area) => {
    croppedAreaPixelsRef.current = pixels;
  }, []);

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
        resetCropState();

        const rembgPromise = removeBackground(working.blob, "rembg_only");
        rembgPromiseRef.current = rembgPromise;
        const rembgBlob = await rembgPromise;
        if (cancelled || generation !== rembgGenerationRef.current) return;

        rembgBlobRef.current = rembgBlob;
        if (!rembgBlob) return;

        const rembgUrl = trackUrl(URL.createObjectURL(rembgBlob));
        setPreview(rembgUrl);
        resetCropState();
      } catch (err) {
        console.error("Failed to prepare image for rembg:", err);
        if (cancelled || generation !== rembgGenerationRef.current) return;
        const fallbackUrl = trackUrl(URL.createObjectURL(file));
        workingBlobRef.current = file;
        setPreview(fallbackUrl);
        resetCropState();
      }
    })();

    return () => {
      cancelled = true;
      revokeTrackedUrls();
    };
  }, [file, removeBackground, resetCropState]);

  useEffect(() => {
    setCrop({ x: 0, y: 0 });
  }, [rotation]);

  const exportFramedBlob = async (): Promise<Blob | null> => {
    if (!croppedAreaPixelsRef.current) return null;

    let rembgBlob = rembgBlobRef.current;
    if (!rembgBlob && rembgPromiseRef.current) {
      rembgBlob = await rembgPromiseRef.current;
      rembgBlobRef.current = rembgBlob;
    }

    let exportUrl = preview;
    let tempUrl: string | null = null;
    if (rembgBlob) {
      tempUrl = URL.createObjectURL(rembgBlob);
      exportUrl = tempUrl;
    }
    if (!exportUrl) return null;

    try {
      return await getCroppedClothingBlob(
        exportUrl,
        croppedAreaPixelsRef.current,
        rotation,
      );
    } finally {
      if (tempUrl) URL.revokeObjectURL(tempUrl);
    }
  };

  /** Source blob for AI — always the user-framed crop when available. */
  const getAnalysisSourceBlob = async (): Promise<Blob | null> => {
    const cropped = await exportFramedBlob();
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
    const inferredTags = applyClothingTypeInferencesToTags(tags);

    applyTagValue(inferredTags.type, (formatted) => {
      setUsersClothType(formatted);
      setInputTypeValue(formatted);
      setValidType(type_List.includes(formatted));
      setCropOverlay(cropOverlayFromClothingType(formatted));
    });

    applyColourList(inferredTags.colour);

    applyTagValue(inferredTags.material, (formatted) => {
      setUsersClothMaterial(formatted);
      setInputMaterialValue(formatted);
      setValidMaterial(materials_List.includes(formatted));
    });

    applyTagValue(inferredTags.fit, (formatted) => {
      setUsersClothFit(formatted);
      setInputFitValue(formatted);
      setValidFit(fits_List.includes(formatted));
    });

    applyTagValue(inferredTags.pattern, (formatted) => {
      setUsersClothPattern(formatted);
      setInputPatternValue(formatted);
      setValidPattern(patterns_List.includes(formatted));
    });

    if (inferredTags.styleCategory?.value) {
      const match = styleCategories_List.find(
        (item) =>
          item.toLowerCase() ===
          String(inferredTags.styleCategory?.value).toLowerCase(),
      );
      if (match) {
        setStyleCategory(match);
        setStyleFromAi(true);
      }
    }

    if (Array.isArray(inferredTags.occasionTags?.value)) {
      const next = inferredTags.occasionTags.value.filter(
        (tag): tag is OccasionTag =>
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
      if (!analyzeIdempotencyKeyRef.current) {
        analyzeIdempotencyKeyRef.current = createIdempotencyKey("analyze");
      }
      const result = await analyzeClothing({
        image,
        requestId: traceId,
        idempotencyKey: analyzeIdempotencyKeyRef.current,
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

    // Await rembg if still running, then export the user's crop locally.
    // Do not call the crop service again on submit.
    if (!preview) return;

    const framed = await exportFramedBlob();
    if (!framed) return;

    formData.append("image", framed, "cropped.png");
    formData.append("imageAlreadyCropped", "true");

    if (!uploadIdempotencyKeyRef.current) {
      uploadIdempotencyKeyRef.current = createIdempotencyKey("upload");
    }

    const uploadClothes = async () =>
      fetch(`/api/clothes/upload`, {
        method: "POST",
        headers: await getAuthHeaders({
          "Idempotency-Key": uploadIdempotencyKeyRef.current!,
        }),
        body: formData,
      });

    let response = await uploadClothes();
    if (response.status === 401) {
      clearAuthTokenCache();
      response = await uploadClothes();
    }

    return await response;
  };

  //If submit is clicked
  const handleSubmit = async (event: React.MouseEvent | React.FormEvent) => {
    event.preventDefault();
    if (submitInFlightRef.current || loading) return;
    submitInFlightRef.current = true;
    setLoading(true);

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
        uploadIdempotencyKeyRef.current = null;
        analyzeIdempotencyKeyRef.current = null;
        await queryClient.invalidateQueries({
          queryKey: clothesQueryKeys.all,
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
    submitInFlightRef.current = false;

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
  const handleFileSelected = (
    picked: File,
    overlayFromCamera?: CropOverlayId,
  ) => {
    setValidFile(true);
    setFile(picked);
    if (overlayFromCamera !== undefined) {
      setCropOverlay(overlayFromCamera);
    }
  };

  const inputClassName = (invalid: boolean | null) =>
    `w-full min-w-0 rounded-almaari border bg-almaari-surface-raised px-3 py-2.5 text-base sm:text-sm text-almaari-ink placeholder:text-almaari-muted/70 focus:outline-none focus:ring-2 ${
      invalid === false
        ? "border-red-300 focus:ring-red-200"
        : "border-almaari-border focus:ring-almaari-accent/25 focus:border-almaari-accent/40"
    }`;

  const selectClassName =
    "w-full min-h-11 rounded-almaari border border-almaari-border bg-almaari-surface-raised px-3 text-sm text-almaari-ink focus:outline-none focus:ring-2 focus:ring-almaari-accent/25 focus:border-almaari-accent/40";

  const chipButtonClass =
    "inline-flex items-center justify-center gap-1.5 rounded-almaari border border-almaari-border bg-almaari-surface-raised px-4 min-h-11 text-sm font-semibold text-almaari-ink transition hover:bg-almaari-accent-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-almaari-accent/30";

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
      <div className="bg-almaari-bg w-full h-full min-h-0 overflow-x-hidden overflow-y-auto px-3 py-3 pb-24 sm:px-4 sm:pb-6">
        <form
          id="add-clothes-form"
          className="mx-auto flex w-full max-w-lg flex-col gap-4 md:max-w-4xl md:gap-5"
        >
          <header className="space-y-1">
            <div className="relative flex min-h-10 items-center">
              <button
                type="button"
                onClick={handleBack}
                className="relative z-10 inline-flex min-h-10 items-center gap-1.5 rounded-almaari border border-almaari-border bg-almaari-surface-raised px-3 text-sm font-medium text-almaari-ink transition hover:bg-almaari-accent-soft focus:outline-none focus-visible:ring-2 focus-visible:ring-almaari-accent/30"
              >
                <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
                Back
              </button>
              <h1 className="pointer-events-none absolute inset-x-0 text-center font-display text-lg text-almaari-ink sm:text-xl">
                Add to wardrobe
              </h1>
            </div>
          </header>

          <div className="mx-auto flex w-full flex-col gap-4 md:grid md:grid-cols-2 md:items-start md:gap-5">
            {/* Photo column */}
            <div className="flex w-full shrink-0 flex-col gap-4 md:sticky md:top-3">
              <FormSection
                title="Photo"
                description="One item per photo on a plain background works best."
              >
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={(e) => {
                    const picked = e.target.files?.[0];
                    if (picked) handleFileSelected(picked);
                    e.target.value = "";
                  }}
                  className="hidden"
                />
                {preview ? (
                  <div
                    id="add-picture-btn"
                    className="relative flex h-[min(220px,42vh)] w-full items-center justify-center overflow-hidden rounded-almaari-lg border border-almaari-border bg-almaari-warm sm:h-[260px] md:h-[300px]"
                  >
                    <div className="relative flex h-full w-full items-center justify-center">
                      <ClothingCropSurface
                        imageUrl={preview}
                        crop={crop}
                        zoom={zoom}
                        rotation={rotation}
                        minZoom={ABSOLUTE_MIN_USER_ZOOM}
                        cropOverlay={cropOverlay}
                        onCropChange={setCrop}
                        onZoomChange={setZoom}
                        onRotationChange={setRotation}
                        onCropComplete={handleCropComplete}
                      />

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          fileInputRef.current?.click();
                        }}
                        className="absolute right-2 top-2 z-10 min-h-8 rounded-lg border border-almaari-border bg-white/95 px-2.5 py-1.5 text-xs font-semibold text-almaari-ink shadow-sm backdrop-blur-sm hover:bg-white"
                      >
                        Replace
                      </button>
                      <p className="absolute bottom-2 left-1/2 z-10 max-w-[90%] -translate-x-1/2 rounded-lg bg-white/90 px-2 py-1 text-center text-[11px] text-almaari-muted backdrop-blur-sm sm:text-xs">
                        <span className="sm:hidden">
                          Drag · dial to rotate · zoom
                        </span>
                        <span className="hidden sm:inline">
                          Drag to reposition · use dial and slider to rotate and zoom
                        </span>
                      </p>
                    </div>
                  </div>
                ) : (
                  <ClothingImageSourcePicker
                    fileInputRef={fileInputRef}
                    onFileSelected={handleFileSelected}
                    clothingType={usersClothType || inputTypeValue}
                  />
                )}

                {validFile === false ? (
                  <p className="text-sm text-red-600" role="alert">
                    Add a photo to continue.
                  </p>
                ) : null}

                <div className="space-y-2">
                  <FieldLabel htmlFor="crop-overlay-select">
                    Crop guide
                  </FieldLabel>
                  <select
                    id="crop-overlay-select"
                    value={cropOverlay}
                    onChange={(e) =>
                      setCropOverlay(e.target.value as CropOverlayId)
                    }
                    className={selectClassName}
                  >
                    {CROP_OVERLAY_OPTIONS.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {preview ? (
                  <CropAdjustControls
                    zoom={zoom}
                    minZoom={ABSOLUTE_MIN_USER_ZOOM}
                    rotation={rotation}
                    onZoomChange={setZoom}
                    onRotationChange={setRotation}
                  />
                ) : null}
              </FormSection>

              <FormSection
                title="Smart fill"
                description="Let Almaari read your photo and fill in the form. Uses 1 credit."
              >
                <button
                  id="AI_analyze_button"
                  type="button"
                  disabled={
                    isAnalyzing ||
                    isLoadingCredits ||
                    !file ||
                    (credits ?? 0) < 1
                  }
                  className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-almaari border border-almaari-accent/25 bg-almaari-accent-soft px-4 text-sm font-semibold text-almaari-ink transition hover:border-almaari-accent/40 hover:bg-almaari-accent/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-almaari-accent/30 disabled:cursor-not-allowed disabled:opacity-50"
                  onClick={() => analyzeImage()}
                >
                  <Sparkles className="h-4 w-4 shrink-0 text-almaari-accent" />
                  {isAnalyzing ? (
                    "Identifying your item…"
                  ) : (
                    <>
                      <span className="sm:hidden">Analyze (1 credit)</span>
                      <span className="hidden sm:inline">
                        Analyze image (1 credit)
                      </span>
                    </>
                  )}
                </button>
                {analyzeError ? (
                  <p className="text-sm text-red-600" role="alert">
                    {analyzeError.message}
                  </p>
                ) : null}
                {analyzeMessage && !analyzeError ? (
                  <p className="text-sm text-almaari-muted">{analyzeMessage}</p>
                ) : null}
                {!isLoadingCredits && (credits ?? 0) < 1 && !analyzeMessage ? (
                  <p className="text-sm text-red-600" role="alert">
                    Insufficient credits for analysis.
                  </p>
                ) : null}
              </FormSection>
            </div>

            {/* Details column */}
            <div className="flex min-w-0 w-full flex-col gap-4 overflow-visible">
              <FormSection
                title="Item details"
                description="These fields help Almaari match and style this piece."
              >
                <div className="space-y-1.5">
                  <FieldLabel htmlFor="add-type-btn" required>
                    Type
                  </FieldLabel>
                  <ClothingOptionAutocomplete
                    id="add-type-btn"
                    placeholder="e.g. T-shirt, Jeans"
                    required
                    value={inputTypeValue}
                    options={type_List}
                    inputClassName={inputClassName(validType)}
                    onChange={setInputTypeValue}
                    onBlur={() => onBlur("type")}
                    onKeyDown={handleKeyDown}
                  />
                  {validType == false && (
                    <p className="text-sm text-red-600" role="alert">
                      Enter a valid clothing type.
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <FieldLabel htmlFor="add-colour-btn" required>
                    Colour
                  </FieldLabel>
                  <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-start">
                    <div className="min-w-0 flex-1">
                      <ClothingOptionAutocomplete
                        id="add-colour-btn"
                        placeholder="e.g. red, blue"
                        value={inputColourValue}
                        options={colours_List}
                        inputClassName={inputClassName(validColour)}
                        onChange={setInputColourValue}
                        onBlur={() => onBlur("colour")}
                        onKeyDown={handleKeyDown}
                      />
                    </div>
                    <button
                      type="button"
                      className={`${chipButtonClass} sm:w-24 sm:shrink-0`}
                      onClick={setUserColour}
                    >
                      Add
                    </button>
                  </div>
                  {validColour == false && (
                    <p className="text-sm text-red-600" role="alert">
                      Enter a valid colour.
                    </p>
                  )}
                  {usersColours.length > 0 ? (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {usersColours.map((colour, index) => (
                        <button
                          type="button"
                          className="inline-flex items-center gap-1.5 rounded-full border border-almaari-border bg-almaari-accent-soft px-2.5 py-1 text-xs font-medium text-almaari-ink transition hover:border-almaari-accent/40 hover:bg-almaari-accent hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-almaari-accent/30"
                          key={index}
                          id={colour}
                          onClick={(e) =>
                            handleDeleteTag("colour", e.currentTarget.id)
                          }
                          aria-label={`Remove ${colour}`}
                        >
                          <span
                            className="h-3 w-3 rounded-full border border-almaari-border/60"
                            style={
                              colour === "Camo"
                                ? { backgroundColor: "green" }
                                : { backgroundColor: colour }
                            }
                            aria-hidden="true"
                          />
                          <span>{colour}</span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-almaari-muted">
                      Add one or more colours, then tap Save.
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="flex min-w-0 flex-col gap-1.5">
                    <FieldLabel htmlFor="add-material-btn" required>
                      Material
                    </FieldLabel>
                    <ClothingOptionAutocomplete
                      id="add-material-btn"
                      placeholder="e.g. cotton"
                      required
                      value={inputMaterialValue}
                      options={materials_List}
                      inputClassName={inputClassName(validMaterial)}
                      onChange={setInputMaterialValue}
                      onBlur={() => onBlur("material")}
                      onKeyDown={handleKeyDown}
                    />
                    {validMaterial == false && (
                      <p
                        className="text-xs text-red-600 sm:text-sm"
                        role="alert"
                      >
                        Enter a valid material.
                      </p>
                    )}
                  </div>

                  <div className="flex min-w-0 flex-col gap-1.5">
                    <FieldLabel htmlFor="add-fit-btn" required>
                      Fit
                    </FieldLabel>
                    <ClothingOptionAutocomplete
                      id="add-fit-btn"
                      placeholder="e.g. slim"
                      required
                      value={inputFitValue}
                      options={fits_List}
                      inputClassName={inputClassName(validFit)}
                      onChange={setInputFitValue}
                      onBlur={() => onBlur("fit")}
                      onKeyDown={handleKeyDown}
                    />
                    {validFit == false && (
                      <p
                        className="text-xs text-red-600 sm:text-sm"
                        role="alert"
                      >
                        Enter a valid fit.
                      </p>
                    )}
                  </div>

                  <div className="flex min-w-0 flex-col gap-1.5 sm:col-span-2">
                    <FieldLabel htmlFor="add-pattern-btn" required>
                      Pattern
                    </FieldLabel>
                    <ClothingOptionAutocomplete
                      id="add-pattern-btn"
                      placeholder="e.g. striped"
                      required
                      value={inputPatternValue}
                      options={patterns_List}
                      inputClassName={inputClassName(validPattern)}
                      onChange={setInputPatternValue}
                      onBlur={() => onBlur("pattern")}
                      onKeyDown={handleKeyDown}
                    />
                    {validPattern == false && (
                      <p
                        className="text-xs text-red-600 sm:text-sm"
                        role="alert"
                      >
                        Enter a valid pattern.
                      </p>
                    )}
                  </div>

                  <div className="sm:col-span-2">
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
                </div>
              </FormSection>
            </div>
          </div>

          <div
            id="submit-btn"
            className="mt-2 shrink-0 pb-[max(0.75rem,var(--safe-bottom))] md:mt-4"
          >
            {loading ? (
              <div className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-almaari bg-almaari-accent/80 px-4 text-sm font-semibold text-white">
                Adding to wardrobe…
              </div>
            ) : (
              <button
                type="button"
                onClick={(event) => handleSubmit(event)}
                className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-almaari bg-almaari-accent px-4 text-sm font-semibold text-white shadow-soft transition hover:bg-almaari-accent-strong focus:outline-none focus-visible:ring-2 focus-visible:ring-almaari-accent/40"
              >
                <Send className="h-4 w-4 shrink-0" aria-hidden />
                Save to wardrobe
              </button>
            )}
            <InlineSuccessState show={false} className="mt-2 justify-center" />
          </div>
        </form>
      </div>
    </ImageUploadFlow>
  );
}

export default AddClothesUI;
