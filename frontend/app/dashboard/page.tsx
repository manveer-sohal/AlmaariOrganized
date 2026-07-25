"use client";

import { useUser } from "@auth0/nextjs-auth0/client";
import React, { useEffect, useState } from "react";
import CreateOutfitUI from "./CreateOutfit/createOutfitUI";
import ViewOutfits from "./PreviewOutfit/viewOutfits";
import OutfitDetailsView from "./PreviewOutfit/OutfitDetailsView";
import ClothingDetailsView from "./components/ClothingDetailsView";
import AddClothesUI from "./addClothes/addClothesUI";
import BuyCredits from "./components/BuyCredits";
import HomeHub from "./Home/HomeHub";
import WardrobeScreen from "./Wardrobe/WardrobeScreen";
import MobileBottomNavigation from "../components/ux/MobileBottomNavigation";
import DesktopNavigation from "../components/ux/DesktopNavigation";
import OnboardingTourBootstrap from "./components/OnboardingTourBootstrap";
import OnboardingWizard from "./onboarding/OnboardingWizard";
import { useOnboarding } from "../hooks/useOnboarding";
import { useRole } from "../hooks/useRole";
import { useDeleteOutfit } from "../hooks/useDeleteOutfit";
import { View, ClothingItem, Outfit } from "../types/clothes";
import { warmupAiClothingService } from "../utils/warmupAiService";

export default function Dashboard() {
  const { user, isLoading } = useUser();
  const { onboarding, isLoadingOnboarding } = useOnboarding();
  const [hasLoaded, setHasLoaded] = useState(false);
  const [view, setView] = useState<View>("home");
  const [creditReturnView, setCreditReturnView] = useState<View>("home");
  const [detailsReturnView, setDetailsReturnView] = useState<View>("home");
  const [outfitReturnView, setOutfitReturnView] = useState<View>("outfits");
  const [selectedClothingItem, setSelectedClothingItem] =
    useState<ClothingItem | null>(null);
  const [selectedOutfit, setSelectedOutfit] = useState<Outfit | null>(null);
  const [styleSeedItem, setStyleSeedItem] = useState<ClothingItem | null>(null);
  const [improveSeedOutfit, setImproveSeedOutfit] = useState<Outfit | null>(
    null,
  );
  const deleteOutfit = useDeleteOutfit();

  useRole();

  useEffect(() => {
    if (!user || hasLoaded) return;
    setHasLoaded(true);
  }, [user, hasLoaded]);

  const onClickAddClothes = () => {
    warmupAiClothingService();
    setView("addClothes");
  };

  useEffect(() => {
    if (view === "addClothes") warmupAiClothingService();
  }, [view]);

  const openBuyCredits = () => {
    if (view !== "buyCredits") setCreditReturnView(view);
    setView("buyCredits");
  };

  const openClothingDetails = (item: ClothingItem) => {
    setDetailsReturnView(view);
    setSelectedClothingItem(item);
    setView("clothingDetails");
  };

  const closeClothingDetails = () => {
    setView(detailsReturnView);
    setSelectedClothingItem(null);
  };

  const openOutfitDetails = (outfit: Outfit) => {
    setOutfitReturnView(view === "outfitDetails" ? outfitReturnView : view);
    setSelectedOutfit(outfit);
    setView("outfitDetails");
  };

  const closeOutfitDetails = () => {
    setView(outfitReturnView);
    setSelectedOutfit(null);
  };

  const styleItem = (item: ClothingItem) => {
    setImproveSeedOutfit(null);
    setStyleSeedItem(item);
    setView("createOutfit");
  };

  const improveOutfit = (outfit: Outfit) => {
    setStyleSeedItem(null);
    setImproveSeedOutfit(outfit);
    setView("createOutfit");
  };

  const needsProfileOnboarding =
    !!user &&
    !isLoadingOnboarding &&
    !!onboarding &&
    !onboarding.hasCompletedProfileOnboarding;

  const hideChrome =
    needsProfileOnboarding ||
    view === "addClothes" ||
    view === "buyCredits" ||
    view === "clothingDetails" ||
    view === "outfitDetails";

  if (needsProfileOnboarding) {
    return (
      <main className="relative h-[100dvh] w-full max-w-[100vw] overflow-hidden bg-almaari-bg">
        <OnboardingWizard onComplete={() => setView("home")} />
      </main>
    );
  }

  return (
    <main className="relative grid h-[100dvh] w-full max-w-[100vw] grid-rows-1 overflow-hidden bg-almaari-bg">
      {view === "addClothes" && (
        <div className="absolute inset-0 z-50">
          <AddClothesUI setView={setView} />
        </div>
      )}

      <div className="relative flex h-full min-h-0 w-full max-w-full min-w-0 overflow-hidden">
        {!hideChrome ? (
          <DesktopNavigation
            view={view}
            setView={setView}
            onBuyCredits={openBuyCredits}
            onAddClothes={onClickAddClothes}
          />
        ) : null}

        <div className="h-full min-h-0 w-full flex-1 overflow-hidden bg-almaari-bg md:rounded-none">
          {isLoading || (user && isLoadingOnboarding) ? (
            <div className="flex h-full items-center justify-center">
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-almaari-accent border-t-transparent" />
            </div>
          ) : null}

          {!isLoading && !user ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
              <p className="font-display text-2xl text-almaari-ink">
                Sign in to open your wardrobe
              </p>
              <a
                href="/api/auth/login?returnTo=/dashboard"
                className="inline-flex min-h-touch items-center rounded-almaari bg-almaari-accent px-6 text-sm font-semibold text-white"
              >
                Log in
              </a>
            </div>
          ) : null}

          {user && !isLoadingOnboarding ? (
            <div className="h-full min-h-0 w-full max-w-full min-w-0 overflow-x-hidden overflow-y-auto">
              <OnboardingTourBootstrap setView={setView} />
              {view === "home" && (
                <HomeHub
                  setView={setView}
                  onSelectItem={openClothingDetails}
                  onAddClothes={onClickAddClothes}
                />
              )}
              {(view === "wardrobe" || view === "addClothes") && (
                <WardrobeScreen
                  onSelectItem={openClothingDetails}
                  onAddClothes={onClickAddClothes}
                  onStyleItem={styleItem}
                />
              )}
              {view === "createOutfit" && (
                <CreateOutfitUI
                  onBuyCredits={openBuyCredits}
                  onAddClothes={onClickAddClothes}
                  seedItem={styleSeedItem}
                  seedOutfit={improveSeedOutfit}
                  onSeedConsumed={() => {
                    setStyleSeedItem(null);
                    setImproveSeedOutfit(null);
                  }}
                />
              )}
              {view === "outfits" && (
                <ViewOutfits
                  onImprove={improveOutfit}
                  onSelectOutfit={openOutfitDetails}
                  onCreate={() => setView("createOutfit")}
                />
              )}
              {view === "outfitDetails" && selectedOutfit && (
                <OutfitDetailsView
                  outfit={selectedOutfit}
                  onBack={closeOutfitDetails}
                  onDelete={(id) => {
                    deleteOutfit.mutate(id);
                    closeOutfitDetails();
                  }}
                  onImprove={improveOutfit}
                  onSelectItem={openClothingDetails}
                />
              )}
              {view === "clothingDetails" && selectedClothingItem && (
                <ClothingDetailsView
                  item={selectedClothingItem}
                  onBack={closeClothingDetails}
                  onItemUpdated={setSelectedClothingItem}
                  onStyleItem={styleItem}
                  onSelectOutfit={openOutfitDetails}
                  onAddToOutfit={(item) => {
                    setStyleSeedItem(item);
                    setView("createOutfit");
                  }}
                />
              )}
              {view === "buyCredits" && (
                <BuyCredits onBack={() => setView(creditReturnView)} />
              )}
            </div>
          ) : null}
        </div>
      </div>

      {!hideChrome ? (
        <MobileBottomNavigation
          view={view}
          setView={setView}
          onBuyCredits={openBuyCredits}
        />
      ) : null}
    </main>
  );
}
