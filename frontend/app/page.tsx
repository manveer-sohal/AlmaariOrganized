"use client";
import { useUser } from "@auth0/nextjs-auth0/client";
import NavBar from "./components/navBar";
import SideBar from "./components/sideBar";
import React, { useEffect, useState } from "react";
import DisplayClothes from "./components/displayClothes";
import Login from "./components/login";
import CreateOutfitUI from "./components/createOutfitUI";
import ViewOutfits from "./components/viewOutfits";
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

export default function Home() {
  const { user, isLoading } = useUser();
  const [hasLoaded, setHasLoaded] = useState(false); // State to track if data is loaded
  const [searchTerm, setSearchTerm] = useState("");
  const [displayOutfits, setDisplayOutfits] = useState<boolean>(false);
  const [displayCreateOutfits, setDisplayCreateOutfits] =
    useState<boolean>(false);
  const [displayHome, setDisplayHome] = useState<boolean>(true);

  const [query, setQuery] = useState<
    | { colour: string[] | null | undefined; type: string[] | null | undefined }
    | undefined
  >();

  useEffect(() => {
    if (!user || hasLoaded) return;
    const load = async () => {
      if (!user || hasLoaded) return; // Prevent fetching multiple times

      setHasLoaded(true);
    };

    load();
  }, [user, hasLoaded]);

  if (isLoading) {
    return <p>Loading...</p>;
  }

  return (
    <main>
      {!user && (
        <>
          <Login></Login>
        </>
      )}

      {user && (
        <div>
          <div className="nav-container">
            <NavBar onSearchTermChange={setSearchTerm}></NavBar>
            <div className="sidebar-container">
              <SideBar
                onQuery={setQuery}
                displayOutfits={setDisplayOutfits}
                displayCreateOutfits={setDisplayCreateOutfits}
                displayHome={setDisplayHome}
              ></SideBar>
            </div>
          </div>

          {!hasLoaded && (
            <h1
              style={{
                fontSize: 120,
                textAlign: "center",
              }}
            >
              pictures are loading...
            </h1>
          )}
          {displayCreateOutfits && <CreateOutfitUI></CreateOutfitUI>}
          {displayOutfits && <ViewOutfits></ViewOutfits>}
          {displayHome && (
            <DisplayClothes
              query={query}
              searchTerm={searchTerm}
            ></DisplayClothes>
          )}
        </div>
      )}
    </main>
  );
}
