"use client";

import { useEffect, useState, type ReactNode } from "react";
import {
  startOnboardingTourFromForm,
  stopOnboardingTour,
} from "../../components/OnBoardingTour";
import { AnimatePresence, motion } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import { useUser } from "@auth0/nextjs-auth0/client";
import {
  ArrowLeft,
  ArrowRight,
  Camera,
  Check,
  Forward,
  Shirt,
  Sparkles,
} from "lucide-react";
import { usePrefersReducedMotion } from "../../components/ux/motion";
import { useClothesData, ONBOARDING_CLOTHES_PAGE_SIZE } from "../../hooks/useClothesData";
import { useSampleWardrobe } from "../../hooks/useSampleWardrobe";
import { completeProfileOnboarding } from "../../utils/completeProfileOnboarding";
import AddClothesUI from "../addClothes/addClothesUI";
import BrandAutocomplete from "./BrandAutocomplete";
import ConfettiBurst from "./ConfettiBurst";
import { SEASONAL_PALETTES, STYLE_OPTIONS } from "./constants";

type Step =
  | "styles"
  | "palette"
  | "brands"
  | "celebrate"
  | "wardrobe"
  | "upload"
  | "welcome";

type OnboardingWizardProps = {
  onComplete: () => void;
};

function progressFor(step: Step) {
  const map: Partial<Record<Step, number>> = {
    styles: 1,
    palette: 2,
    brands: 3,
    celebrate: 3,
    wardrobe: 4,
    upload: 4,
    welcome: 5,
  };
  return map[step] ?? 1;
}

export default function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
  const { user } = useUser();
  const queryClient = useQueryClient();
  const reduced = usePrefersReducedMotion();
  const { seedSamples } = useSampleWardrobe();
  const { clothes, isLoadingClothes } = useClothesData(ONBOARDING_CLOTHES_PAGE_SIZE);
  const hasExistingClothes = !isLoadingClothes && clothes.length > 0;

  const [step, setStep] = useState<Step>("styles");
  const [styles, setStyles] = useState<string[]>([]);
  const [palette, setPalette] = useState<string | null>(null);
  const [brands, setBrands] = useState<string[]>([]);
  const [confettiKey, setConfettiKey] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalProgressSteps = 5;
  const progress = progressFor(step);

  const toggleStyle = (style: string) => {
    setStyles((prev) =>
      prev.includes(style)
        ? prev.filter((s) => s !== style)
        : [...prev, style],
    );
  };

  const fireConfetti = () => setConfettiKey((k) => k + 1);

  const goCelebrate = () => {
    fireConfetti();
    setStep("celebrate");
  };

  const persistAndEnter = async () => {
    if (!palette || styles.length < 1 || brands.length < 3) {
      setError("Finish your style profile before continuing.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const result = await completeProfileOnboarding({
        stylePreferences: styles,
        seasonalColorPalette: palette,
        favoriteBrands: brands,
      });
      if (user?.sub) {
        queryClient.setQueryData(["user", user.sub], (current: unknown) => {
          if (!current || typeof current !== "object") return current;
          return {
            ...current,
            ...result,
            hasCompletedProfileOnboarding: true,
          };
        });
      }
      onComplete();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not finish onboarding",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleSamples = async () => {
    setSaving(true);
    setError(null);
    try {
      await seedSamples.mutateAsync();
      fireConfetti();
      setStep("welcome");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not load sample clothes",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleUploadSuccess = () => {
    stopOnboardingTour();
    fireConfetti();
    setStep("welcome");
  };

  const handleSkipWardrobe = () => {
    fireConfetti();
    setStep("welcome");
  };

  useEffect(() => {
    if (step !== "upload") {
      stopOnboardingTour();
      return;
    }

    void startOnboardingTourFromForm();

    return () => stopOnboardingTour();
  }, [step]);

  return (
    <div className="relative flex h-[100dvh] w-full flex-col overflow-hidden bg-almaari-bg">
      <div
        className="pointer-events-none absolute inset-0 opacity-80"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 20% -10%, rgba(79,93,154,0.14), transparent), radial-gradient(ellipse 60% 40% at 90% 10%, rgba(232,122,107,0.1), transparent), linear-gradient(180deg, #fbf9f5 0%, #f4f1ec 55%, #ebe6dc 100%)",
        }}
        aria-hidden
      />

      <ConfettiBurst burstId={confettiKey} />

      {step !== "upload" ? (
        <header className="relative z-10 px-5 pb-2 pt-[max(1rem,var(--safe-top))]">
          <div className="mx-auto flex max-w-lg items-center justify-between gap-3">
            <p className="font-display text-xl tracking-tight text-almaari-ink">
              Almaari
            </p>
            <p className="text-xs font-medium text-almaari-muted">
              {progress} of {totalProgressSteps}
            </p>
          </div>
          <div className="mx-auto mt-3 h-1.5 max-w-lg overflow-hidden rounded-full bg-almaari-border/60">
            <motion.div
              className="h-full rounded-full bg-almaari-accent"
              initial={false}
              animate={{ width: `${(progress / totalProgressSteps) * 100}%` }}
              transition={{ duration: reduced ? 0 : 0.35 }}
            />
          </div>
        </header>
      ) : null}

      <div className="relative z-10 flex min-h-0 flex-1 flex-col">
        <AnimatePresence mode="wait">
          {step === "styles" ? (
            <StepShell
              key="styles"
              title="What’s your style?"
              subtitle="Pick every vibe that feels like you — you can choose more than one."
              reduced={reduced}
              footer={
                <FooterNav
                  onNext={() => setStep("palette")}
                  nextDisabled={styles.length === 0}
                  nextLabel="Continue"
                />
              }
            >
              <div className="flex flex-wrap gap-2">
                {STYLE_OPTIONS.map((style) => {
                  const active = styles.includes(style);
                  return (
                    <button
                      key={style}
                      type="button"
                      onClick={() => toggleStyle(style)}
                      className={`min-h-11 rounded-full px-4 text-sm font-semibold transition ${
                        active
                          ? "bg-almaari-accent text-white"
                          : "border border-almaari-border bg-almaari-surface-raised text-almaari-ink hover:bg-almaari-accent-soft"
                      }`}
                    >
                      {active ? (
                        <span className="inline-flex items-center gap-1.5">
                          <Check className="h-3.5 w-3.5" aria-hidden />
                          {style}
                        </span>
                      ) : (
                        style
                      )}
                    </button>
                  );
                })}
              </div>
            </StepShell>
          ) : null}

          {step === "palette" ? (
            <StepShell
              key="palette"
              title="Your seasonal palette"
              subtitle="Which colour story flatters you most?"
              reduced={reduced}
              onBack={() => setStep("styles")}
              footer={
                <FooterNav
                  onNext={() => setStep("brands")}
                  nextDisabled={!palette}
                  nextLabel="Continue"
                />
              }
            >
              <div className="grid gap-3">
                {SEASONAL_PALETTES.map((option) => {
                  const active = palette === option.id;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setPalette(option.id)}
                      className={`rounded-almaari-lg border p-4 text-left transition ${
                        active
                          ? "border-almaari-accent bg-almaari-accent-soft shadow-soft"
                          : "border-almaari-border bg-almaari-surface-raised hover:border-almaari-accent/40"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-display text-lg text-almaari-ink">
                            {option.name}
                          </p>
                          <p className="mt-0.5 text-sm text-almaari-muted">
                            {option.blurb}
                          </p>
                        </div>
                        {active ? (
                          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-almaari-accent text-white">
                            <Check className="h-4 w-4" aria-hidden />
                          </span>
                        ) : null}
                      </div>
                      <div className="mt-3 flex gap-2">
                        {option.swatches.map((color) => (
                          <span
                            key={color}
                            className="h-8 w-8 rounded-full border border-black/5 shadow-sm"
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </button>
                  );
                })}
              </div>
            </StepShell>
          ) : null}

          {step === "brands" ? (
            <StepShell
              key="brands"
              title="Where do you shop?"
              subtitle="Add at least three brands. Search the list or type your own."
              reduced={reduced}
              onBack={() => setStep("palette")}
              footer={
                <FooterNav
                  onNext={goCelebrate}
                  nextDisabled={brands.length < 3}
                  nextLabel="Looks good"
                />
              }
            >
              <BrandAutocomplete selected={brands} onChange={setBrands} />
            </StepShell>
          ) : null}

          {step === "celebrate" ? (
            <StepShell
              key="celebrate"
              title="Your taste is locked in"
              subtitle="Next, let’s get a few pieces into your wardrobe."
              reduced={reduced}
              centered
              footer={
                <FooterNav
                  onNext={() => setStep("wardrobe")}
                  nextLabel="Build my wardrobe"
                />
              }
            >
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-almaari-accent-soft">
                <Sparkles className="h-9 w-9 text-almaari-accent" aria-hidden />
              </div>
              <p className="mx-auto mt-4 max-w-sm text-center text-sm text-almaari-muted">
                {styles.slice(0, 3).join(" · ")}
                {styles.length > 3 ? " +" : ""} · {palette} · {brands.length}{" "}
                brands
              </p>
            </StepShell>
          ) : null}

          {step === "wardrobe" ? (
            <StepShell
              key="wardrobe"
              title="Start your wardrobe"
              subtitle="Add a real piece, or try sample clothes and explore Almaari right away."
              reduced={reduced}
              onBack={() => setStep("celebrate")}
            >
              <div className="grid gap-3">
                <button
                  type="button"
                  onClick={() => setStep("upload")}
                  className="flex items-start gap-4 rounded-almaari-lg border border-almaari-border bg-almaari-surface-raised p-4 text-left transition hover:border-almaari-accent/50 hover:shadow-soft"
                >
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-almaari bg-almaari-accent text-white">
                    <Camera className="h-5 w-5" aria-hidden />
                  </span>
                  <span>
                    <span className="block font-display text-lg text-almaari-ink">
                      Add a photo
                    </span>
                    <span className="mt-1 block text-sm text-almaari-muted">
                      Upload one clothing item from your closet.
                    </span>
                  </span>
                </button>

                <button
                  type="button"
                  disabled={saving || seedSamples.isPending}
                  onClick={() => void handleSamples()}
                  className="flex items-start gap-4 rounded-almaari-lg border border-almaari-border bg-almaari-surface-raised p-4 text-left transition hover:border-almaari-accent/50 hover:shadow-soft disabled:opacity-60"
                >
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-almaari bg-almaari-warm text-almaari-ink">
                    <Shirt className="h-5 w-5" aria-hidden />
                  </span>
                  <span>
                    <span className="block font-display text-lg text-almaari-ink">
                      Continue with samples
                    </span>
                    <span className="mt-1 block text-sm text-almaari-muted">
                      We’ll seed a starter wardrobe you can replace anytime.
                    </span>
                  </span>
                </button>

                {hasExistingClothes ? (
                  <button
                    type="button"
                    onClick={handleSkipWardrobe}
                    className="flex items-start gap-4 rounded-almaari-lg border border-almaari-border bg-almaari-surface-raised p-4 text-left transition hover:border-almaari-accent/50 hover:shadow-soft"
                  >
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-almaari bg-almaari-chrome/50 text-almaari-ink">
                      <Forward className="h-5 w-5" aria-hidden />
                    </span>
                    <span>
                      <span className="block font-display text-lg text-almaari-ink">
                        Skip - I already have clothes added
                      </span>
                      <span className="mt-1 block text-sm text-almaari-muted">
                        Head straight to Almaari with your existing wardrobe.
                      </span>
                    </span>
                  </button>
                ) : null}
              </div>
              {error ? (
                <p className="mt-3 text-sm text-red-600" role="alert">
                  {error}
                </p>
              ) : null}
            </StepShell>
          ) : null}

          {step === "upload" ? (
            <motion.div
              key="upload"
              className="flex min-h-0 flex-1 flex-col"
              initial={reduced ? false : { opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={reduced ? undefined : { opacity: 0, x: -16 }}
              transition={{ duration: 0.28 }}
            >
              <AddClothesUI
                setView={() => undefined}
                onBack={() => setStep("wardrobe")}
                onUploadSuccess={handleUploadSuccess}
              />
            </motion.div>
          ) : null}

          {step === "welcome" ? (
            <StepShell
              key="welcome"
              title="Welcome to Almaari"
              subtitle="Your wardrobe is ready. Let’s find looks you’ll actually wear."
              reduced={reduced}
              centered
              footer={
                <FooterNav
                  onNext={() => void persistAndEnter()}
                  nextDisabled={saving}
                  nextLabel={saving ? "Opening…" : "Enter Almaari"}
                />
              }
            >
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-almaari-accent text-white">
                <Check className="h-9 w-9" aria-hidden />
              </div>
              <p className="mx-auto mt-4 max-w-sm text-center text-sm text-almaari-muted">
                Congrats — you’re all set. Open your home hub to explore outfits
                and the stylist.
              </p>
              {error ? (
                <p className="mt-3 text-center text-sm text-red-600" role="alert">
                  {error}
                </p>
              ) : null}
            </StepShell>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}

function StepShell({
  title,
  subtitle,
  children,
  reduced,
  onBack,
  centered,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  reduced: boolean;
  onBack?: () => void;
  centered?: boolean;
  footer?: ReactNode;
}) {
  return (
    <motion.div
      className="mx-auto flex min-h-0 w-full max-w-lg flex-1 flex-col px-5 pb-[max(1.25rem,var(--safe-bottom))] pt-4"
      initial={reduced ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduced ? undefined : { opacity: 0, y: -12 }}
      transition={{ duration: 0.28 }}
    >
      {onBack ? (
        <button
          type="button"
          onClick={onBack}
          className="mb-3 inline-flex w-fit items-center gap-1 text-sm font-medium text-almaari-muted hover:text-almaari-ink"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Back
        </button>
      ) : (
        <div className="mb-3 h-6" />
      )}
      <div
        className={`flex min-h-0 flex-1 flex-col ${
          centered ? "justify-center" : ""
        }`}
      >
        <h1 className="font-display text-3xl leading-tight text-almaari-ink md:text-4xl">
          {title}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-almaari-muted md:text-base">
          {subtitle}
        </p>
        <div
          className={`mt-6 min-h-0 ${
            centered ? "" : "flex-1 overflow-y-auto pb-4"
          }`}
        >
          {children}
        </div>
      </div>
      {footer ? <div className="mt-auto shrink-0 pt-2">{footer}</div> : null}
    </motion.div>
  );
}

function FooterNav({
  onNext,
  nextDisabled,
  nextLabel,
}: {
  onNext: () => void;
  nextDisabled?: boolean;
  nextLabel: string;
}) {
  return (
    <div className="border-t border-almaari-border/50 pt-4">
      <button
        type="button"
        onClick={onNext}
        disabled={nextDisabled}
        className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-almaari bg-almaari-accent text-sm font-semibold text-white hover:bg-almaari-accent-strong disabled:opacity-50"
      >
        {nextLabel}
        <ArrowRight className="h-4 w-4" aria-hidden />
      </button>
    </div>
  );
}
