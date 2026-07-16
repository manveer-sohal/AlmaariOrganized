"use client";
import { useUser } from "@auth0/nextjs-auth0/client";
import NavBar from "../components/navBar";
import SideBar from "../components/sideBar";
import React, { useEffect, useState } from "react";
import DisplayClothes from "./components/displayClothes";
import CreateOutfitUI from "./CreateOutfit/createOutfitUI";
import ViewOutfits from "./PreviewOutfit/viewOutfits";
import ClothingDetailsView from "./components/ClothingDetailsView";
import AddClothesUI from "./addClothes/addClothesUI";
import MobileNavBar from "../components/mobileNavbar";
import MobileSearchBar from "../components/MobileSearchBar";
import { useClothesStore } from "../store/useClothesStore";
import CheckList from "./components/CheckList";
import BuyCredits from "./components/BuyCredits";
import { useRole } from "../hooks/useRole";
import { View, ClothingItem } from "../types/clothes";
import { warmupAiClothingService } from "../utils/warmupAiService";
import { PanelLeftOpen } from "lucide-react";
// import { startOnboardingTourOutfit } from "../components/OnBoardingTourOutfit";
/*
the main part of the  website, it loads the normal componets that any onlogged in user will have accses to, such as the nav bar and teh side bar
those shoudlnt really have any functioanliy untill they do log in

their is a statment which checks if the user state is true to see if their is a log in
this comes from the import { useUser } from "@auth0/nextjs-auth0/client";

if you are logged in, the acutaly clothes container will be displayed, as this is what makes each account unique
the clothes are "cards" which will display all the clothes youve inserted 

right now their is a form in the works for submitting the actual clothes, it will work in conjuntion to the addClothes
component. Once a picture is selcted, the form will show up to gather any more detials needed before proccsesig it

the form will show up ontop of everything and will be a serpate compoennt once i get it to a testable stage
*/
//example of a dataset of clothes, the mao function will load the clothesCard component 3 times, filling in the prop variables
export default function Dashboard() {
  const { user, isLoading } = useUser();
  const [hasLoaded, setHasLoaded] = useState(false); // State to track if data is loaded
  const [view, setView] = useState<View>("home");
  const [creditReturnView, setCreditReturnView] = useState<View>("home");
  const [detailsReturnView, setDetailsReturnView] = useState<View>("home");
  const [
    selectedClothingItem,
    setSelectedClothingItem,
  ] = useState<ClothingItem | null>(null);
  const { menuOpen, setMenuOpen } = useClothesStore();

  useRole();

  useEffect(() => {
    if (!user || hasLoaded) return;
    const load = async () => {
      if (!user || hasLoaded) return; // Prevent fetching multiple times

      setHasLoaded(true);
    };

    load();
  }, [user, hasLoaded]);

  const onClickAddClothes = () => {
    warmupAiClothingService();
    setView("addClothes");
  };

  useEffect(() => {
    if (view === "addClothes") {
      warmupAiClothingService();
    }
  }, [view]);

  const openBuyCredits = () => {
    if (view !== "buyCredits") {
      setCreditReturnView(view);
    }
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

  return (
    <main className="bg-indigo-400 h-screen w-full grid grid-rows-[auto_1fr] overflow-hidden relative">
      {view === "addClothes" && (
        <div className="absolute w-full h-full z-50 top-0">
          <AddClothesUI setView={setView}></AddClothesUI>
        </div>
      )}
      {/* top row: desktop navbar / mobile search */}
      <div className="w-[100vw]">
        <div className="block md:hidden">
          <MobileSearchBar enabled={view === "home"} />
        </div>

        <div className="hidden md:block">
          <NavBar setView={setView}></NavBar>
        </div>
      </div>
      {/* bottom row container, this contains the side bar and the content area*/}
      <div className="relative h-full min-h-0 grid md:grid-cols-[auto_1fr]">
        {/* side bar*/}
        <div
          id="desktop-sidebar"
          className={`z-10 hidden md:block overflow-hidden transition-[width] duration-300 ease-out ${
            menuOpen ? "w-[clamp(100px,20vw,280px)]" : "w-0"
          }`}
        >
          <div
            className={`sidebar-container h-full transition-transform duration-300 ease-out ${
              menuOpen ? "translate-x-0" : "-translate-x-full"
            }`}
            style={{ width: "clamp(100px,20vw,280px)" }}
            aria-hidden={!menuOpen}
          >
            <SideBar
              view={view}
              setView={setView}
              onBuyCredits={openBuyCredits}
            ></SideBar>
          </div>
        </div>
        {!menuOpen ? (
          <button
            type="button"
            aria-label="Expand sidebar"
            title="Show sidebar"
            onClick={() => setMenuOpen(true)}
            className="absolute left-0 top-1/2 z-20 hidden -translate-y-1/2 rounded-r-xl border border-l-0 border-indigo-300 bg-indigo-100/90 p-2 text-indigo-900 shadow-md backdrop-blur hover:bg-indigo-500 hover:text-white md:inline-flex"
          >
            <PanelLeftOpen className="h-5 w-5" aria-hidden />
          </button>
        ) : null}
        {/* content area*/}
        <div
          className={`${
            view === "createOutfit" ||
            view === "clothingDetails" ||
            view == "outfits"
              ? "bg-indigo-200"
              : "bg-background"
          } h-full min-h-0 w-full md:rounded-tl-3xl`}
        >
          {isLoading ? (
            <div className="flex justify-center items-center h-screen">
              <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-indigo-500"></div>
            </div>
          ) : (
            <>
              {!user && (
                <div className="flex justify-center items-center h-screen">
                  <p>please log in to view your dashboard in settings</p>
                </div>
              )}
            </>
          )}
          {user && (
            <div className="md:rounded-tl-3xl w-full overflow-y-auto h-full min-h-0 pb-20 md:pb-0">
              {/* previously had a loading screen here before the whole page loaded*/}
              {view === "createOutfit" && (
                <CreateOutfitUI
                  onBuyCredits={openBuyCredits}
                  onAddClothes={() => setView("addClothes")}
                />
              )}
              {view === "outfits" && <ViewOutfits></ViewOutfits>}
              {view === "clothingDetails" && selectedClothingItem && (
                <ClothingDetailsView
                  item={selectedClothingItem}
                  onBack={closeClothingDetails}
                  onItemUpdated={setSelectedClothingItem}
                />
              )}
              {view === "buyCredits" && (
                <BuyCredits onBack={() => setView(creditReturnView)} />
              )}
              {(view === "home" || view === "addClothes") && (
                <DisplayClothes onSelectItem={openClothingDetails} />
              )}
              <div className="z-10 fixed left-0 bottom-20 md:hidden">
                <CheckList />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="block md:hidden">
        <MobileNavBar
          view={view}
          setView={setView}
          onAddClothes={onClickAddClothes}
          onBuyCredits={openBuyCredits}
        />
      </div>
    </main>
  );
}
