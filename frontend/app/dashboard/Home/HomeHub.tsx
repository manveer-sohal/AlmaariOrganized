"use client";

import { useMemo } from "react";
import { useUser } from "@auth0/nextjs-auth0/client";
import { Sparkles, ChevronRight } from "lucide-react";
import { ClothingItem, Outfit, View } from "../../types/clothes";
import { useClothesData } from "../../hooks/useClothesData";
import { useOutfits } from "../../hooks/useOutfits";
import { useOnboarding } from "../../hooks/useOnboarding";
import FeaturedOutfitCard from "../../components/ux/FeaturedOutfitCard";
import { startOnboardingTour } from "../../components/OnBoardingTour";
import { startOnboardingTourOutfit } from "../../components/OnBoardingTourOutfit";
import { humanizeClothingSubtype } from "../../utils/clothingSubtype";
import HomeHubSkeleton from "./HomeHubSkeleton";
import Image from "next/image";

type HomeHubProps = {
  setView: (view: View) => void;
  onSelectItem: (item: ClothingItem) => void;
  onAddClothes: () => void;
};

function greetingForHour(hour: number) {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default function HomeHub({
  setView,
  onSelectItem,
  onAddClothes,
}: HomeHubProps) {
  const { user } = useUser();
  const { clothes, isLoadingClothes } = useClothesData(20);
  const { data: outfits = [], isPending: isLoadingOutfits } = useOutfits();
  const { onboarding, isLoadingOnboarding } = useOnboarding();

  const greeting = greetingForHour(new Date().getHours());
  const firstName = String(
    user?.given_name || user?.name?.split(" ")[0] || user?.nickname || "there",
  );

  const featured: Outfit | null = outfits[0] ?? null;
  const recent = useMemo(() => clothes.slice(0, 8), [clothes]);

  const continueItems = useMemo(() => {
    const items: { id: string; label: string; action: () => void }[] = [];
    if (!onboarding?.hasCompletedOnboardingForClothes) {
      items.push({
        id: "add",
        label: "Complete your wardrobe setup",
        action: () => startOnboardingTour(),
      });
    }
    if (!onboarding?.hasCompletedOnboardingForOutfits) {
      items.push({
        id: "outfit",
        label: "Create your first look",
        action: () => startOnboardingTourOutfit(),
      });
    }
    return items;
  }, [onboarding]);

  // const suggestion =
  //   clothes.length < 5
  //     ? "Add more pieces for better looks"
  //     : featured
  //     ? "Refresh today’s look"
  //     : "Ask Almaari what to wear";

  if (isLoadingClothes || isLoadingOutfits || isLoadingOnboarding) {
    return <HomeHubSkeleton />;
  }

  return (
    <div className="box-border w-full max-w-full min-w-0 overflow-x-hidden px-3 pt-3 pb-nav sm:mx-auto sm:max-w-3xl sm:px-4 sm:pt-4 md:pb-8">
      <div className="flex w-full max-w-full min-w-0 flex-col gap-3 sm:gap-5">
        <header className="flex w-full min-w-0 items-center justify-between gap-2">
          <div className="min-w-0 flex-1 overflow-hidden">
            <p className="text-xs text-almaari-muted">{greeting}</p>
            <h1 className="truncate font-display text-lg leading-snug text-almaari-ink sm:text-2xl">
              Ready for today
              {firstName !== "there" ? `, ${firstName}` : ""}?
            </h1>
          </div>
          {user?.picture ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.picture}
              alt=""
              width={36}
              height={36}
              className="h-9 w-9 shrink-0 rounded-full object-cover ring-2 ring-almaari-accent-soft"
            />
          ) : (
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-almaari-accent-soft text-sm font-semibold text-almaari-ink">
              {firstName.charAt(0).toUpperCase()}
            </span>
          )}
        </header>

        <button
          type="button"
          onClick={() => setView("createOutfit")}
          className="box-border flex min-h-11 w-full max-w-full items-center justify-center gap-2 rounded-almaari-lg bg-almaari-accent px-3 py-2.5 text-sm font-semibold text-white shadow-soft active:scale-[0.98]"
        >
          <Sparkles className="h-4 w-4 shrink-0" aria-hidden />
          <span className="truncate">What should I wear?</span>
        </button>

        <div className="w-full max-w-full min-w-0">
          <FeaturedOutfitCard
            outfit={featured}
            reason={featured ? "Balanced for your wardrobe" : undefined}
            onWear={() => setView("outfits")}
            onGenerate={() => setView("createOutfit")}
          />
        </div>

        {continueItems.length > 0 ? (
          <section aria-label="Continue" className="w-full min-w-0">
            <h2 className="mb-1.5 text-xs font-semibold text-almaari-muted">
              Continue
            </h2>
            <ul className="">
              {continueItems.map((item) => (
                <li key={item.id} className="min-w-0">
                  <button
                    type="button"
                    onClick={item.action}
                    className="box-border flex min-h-11 w-full max-w-full min-w-0 items-center justify-between gap-2 rounded-almaari bg-almaari-surface-raised px-3 py-2.5 text-left text-sm font-semibold text-almaari-ink shadow-card"
                  >
                    <span className="min-w-0 flex-1 truncate">
                      {item.label}
                    </span>
                    <ChevronRight className="h-4 w-4 shrink-0 text-almaari-muted" />
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section aria-label="Recent wardrobe items" className="w-full min-w-0">
          <div className="mb-1.5 flex w-full min-w-0 items-center justify-between gap-2">
            <h2 className="text-xs font-semibold text-almaari-muted">Recent</h2>
            <button
              type="button"
              onClick={() => setView("wardrobe")}
              className="shrink-0 text-xs font-semibold text-almaari-accent"
            >
              See all
            </button>
          </div>
          {recent.length === 0 ? (
            <button
              type="button"
              onClick={onAddClothes}
              className="box-border w-full max-w-full rounded-almaari border border-dashed border-almaari-border px-3 py-5 text-sm font-semibold text-almaari-muted"
            >
              Add your first item
            </button>
          ) : (
            <div className="no-scrollbar w-full max-w-full overflow-x-auto">
              <div className="flex w-max gap-2 pb-1">
                {recent.map((item) => (
                  <button
                    key={item._id}
                    type="button"
                    onClick={() => onSelectItem(item)}
                    className="relative h-20 w-[4.5rem] shrink-0 overflow-hidden rounded-almaari bg-almaari-warm shadow-card active:scale-95"
                    aria-label={humanizeClothingSubtype(item)}
                  >
                    <Image
                      src={item.imageSrc}
                      alt={humanizeClothingSubtype(item)}
                      fill
                      className="object-cover"
                      sizes="72px"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* <section aria-label="Suggestion" className="w-full min-w-0 pb-1">
          <button
            type="button"
            onClick={() =>
              clothes.length < 5 ? onAddClothes() : setView("createOutfit")
            }
            className="box-border flex min-h-11 w-full max-w-full min-w-0 items-center justify-center gap-1.5 rounded-full bg-almaari-accent-soft px-3 text-sm font-semibold text-almaari-ink"
          >
            <Sparkles className="h-4 w-4 shrink-0" aria-hidden />
            <span className="min-w-0 truncate">{suggestion}</span>
          </button>
        </section> */}
      </div>
    </div>
  );
}
