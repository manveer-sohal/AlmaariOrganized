"use client";
import { useUser } from "@auth0/nextjs-auth0/client";
import NavBar from "../components/navBar";
import SideBar from "../components/sideBar";
import React, { useEffect, useState } from "react";
import DisplayClothes from "../components/displayClothes";
import CreateOutfitUI from "../components/createOutfitUI";
import ViewOutfits from "../components/viewOutfits";
import AddClothesUI from "../components/addClothesUI";
import MobileNavBar from "../components/mobileNavbar";
import MobileSideBar from "../components/mobileSidebar";
import { goToNextTourStep } from "../components/OnBoardingTour";
// import { startOnboardingTour } from "../components/OnBoardingTour";
import CheckList from "../components/CheckList";
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
type View = "home" | "outfits" | "createOutfit" | "addClothes";

export default function Dashboard() {
  const { user, isLoading } = useUser();
  const [hasLoaded, setHasLoaded] = useState(false); // State to track if data is loaded
  const [view, setView] = useState<View>("home");
  // const { menuOpen } = useClothesStore();

  useEffect(() => {
    if (!user || hasLoaded) return;
    const load = async () => {
      if (!user || hasLoaded) return; // Prevent fetching multiple times

      // const response = await fetch(
      //   `${API_BASE_URL}/api/users/hasCompletedOnboarding`,
      //   {
      //     method: "POST",
      //     headers: { "Content-Type": "application/json" },
      //     body: JSON.stringify({ auth0Id: user?.sub }),
      //   }
      // );
      // const data = await response.json();

      // if (!data.hasCompletedOnboardingForClothes) {
      //   startOnboardingTour();
      // }
      setHasLoaded(true);
    };

    load();
  }, [user, hasLoaded]);

  const onClickAddClothes = () => {
    setView("addClothes");
  };

  return (
    <main>
      <div className="z-20 sticky top-0 box-shadow-md">
        <div className="block md:hidden">
          <MobileNavBar></MobileNavBar>
        </div>

        <div className="hidden md:block">
          <NavBar setView={setView}></NavBar>
        </div>

        <div className="block md:hidden">
          <MobileSideBar view={view} setView={setView}></MobileSideBar>
        </div>

        <div className="hidden md:block">
          <div className="sidebar-container">
            <SideBar view={view} setView={setView}></SideBar>
          </div>
        </div>
      </div>
      {isLoading ? (
        <div className="flex justify-center items-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-indigo-500"></div>
        </div>
      ) : (
        <>
          {!user && (
            <div className="flex justify-center items-center h-screen">
              <p>please log in to view your dashboard</p>
            </div>
          )}
        </>
      )}
      {user && (
        <div className="h-full w-full relative">
          {view === "addClothes" && (
            <div className="fixed w-full h-full z-20">
              <AddClothesUI setView={setView}></AddClothesUI>
            </div>
          )}

          {/* previously had a loading screen here before the whole page loaded*/}
          {view === "createOutfit" && <CreateOutfitUI></CreateOutfitUI>}
          {view === "outfits" && <ViewOutfits></ViewOutfits>}
          {(view === "home" || view === "addClothes") && (
            <DisplayClothes></DisplayClothes>
          )}
          <div className="block md:hidden">
            <div
              className="absolute bottom-0 right-0"
              onClick={onClickAddClothes}
            >
              <button
                id="add-clothes-btn-mobile"
                onClick={goToNextTourStep}
                title="Add Clothes"
                className="fixed bottom-0 right-0 inline-flex items-center gap-2 font-medium px-4 h-10 rounded-xl m-1 cursor-pointer border border-indigo-300 bg-indigo-100/70 text-indigo-900 hover:bg-indigo-500 hover:text-white active:bg-purple-600 transition-colors duration-300"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M12 5v14M5 12h14"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
                <span>Add Clothes</span>
              </button>
            </div>
          </div>
          <div
            className="   
  z-10 fixed
  left-0 bottom-0
  md:left-auto
  md:top-20 md:right-0
  lg:right-0 lg:top-20
  xl:top-20 xl:right-0
"
          >
            <CheckList />
          </div>
        </div>
      )}
    </main>
  );
}
