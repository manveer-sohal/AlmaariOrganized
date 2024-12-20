"use client";
import ClothesCard from "./components/clothesCard";
import AddClothesUI from "./components/addClothesUI";
import { useUser } from "@auth0/nextjs-auth0/client";
import NavBar from "./components/navBar";
import SideBar from "./components/sideBar";
import React, { useEffect, useState } from "react";
import Link from "next/link";

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
  const [clothesCard, setClothesCard] = useState<
    { name: string; color: string[]; type: string; imageSrc: string }[]
  >([]);

  const { user, isLoading } = useUser();
  const [isVisible, setIsVisible] = useState(false);

  const toggleForm = () => {
    console.log("+ has been clicked");
    setIsVisible((prev) => !prev);
  };

  const addClothes = (file: string, type: string, colour: string[]) => {
    console.log(file, type, colour);
    console.log("+ has been clicked");
    const temp = {
      name: "opium",
      color: colour,
      type: type,
      imageSrc: file,
    };
    setClothesCard((clothesCard) => [temp, ...clothesCard]);
  };

  useEffect(() => {
    const handleBackendSync = async () => {
      // if (!user) {
      //   console.error("User is not authenticated. Cannot sync login.");
      //   return;
      // }
      // const auth0Id = user.sub;
      // const email = user.email || "default@example.com"; // Fallback if email is missing
      // try {
      //   const response = await fetch("/api/Users/login", {
      //     method: "POST",
      //     headers: { "Content-Type": "application/json" },
      //     body: JSON.stringify({ auth0Id, email }),
      //   });
      //   if (!response.ok) {
      //     const error = await response.json();
      //     console.error("Error syncing with backend:", error);
      //     return;
      //   }
      //   const data = await response.json();
      //   console.log("Successfully synced login with backend:", data);
      // } catch (error) {
      //   console.error("Failed to sync login with backend:", error);
      // }
    };
    handleBackendSync();
  }, [user]);

  if (isLoading) {
    // Optionally show a loading spinner while user authentication is being checked
    return <p>Loading...</p>;
  }

  return (
    <main>
      {isVisible && (
        <AddClothesUI
          toggleForm={toggleForm}
          addClothes={addClothes}
        ></AddClothesUI>
      )}
      {!user && (
        <>
          <Link className="nav-bar-li" href="/api/auth/login">
            Login
          </Link>
          <p>
            You are not logged in. Log in to see your personalized wardrobe.
          </p>
        </>
      )}

      {user && (
        <div>
          <div className="nav-container">
            <NavBar toggleForm={toggleForm}></NavBar>
            <div className="sidebar-container">
              <SideBar></SideBar>
            </div>
          </div>

          <div className="cards-container">
            {clothesCard.map((item, index) => (
              <ClothesCard
                key={index}
                name={item.name}
                color={item.color}
                type={item.type}
                imageSrc={item.imageSrc}
              />
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
