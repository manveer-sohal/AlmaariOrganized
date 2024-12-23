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
    { colour: string[]; type: string; imageSrc: string }[]
  >([]);

  const { user, isLoading } = useUser();
  const [isVisible, setIsVisible] = useState(false);

  const toggleForm = () => {
    setIsVisible((prev) => !prev);
  };

  const addClothes = (file: string, type: string, colour: string[]) => {
    const temp = {
      colour: colour,
      type: type,
      imageSrc: file,
    };
    setClothesCard((clothesCard) => [temp, ...clothesCard]);
  };

  useEffect(() => {
    const load = async () => {
      if (!user) {
        console.error(
          "User is not authenticated. Cannot upload a real picture."
        );
        return;
      }
      const auth0Id = user.sub;
      const response = await fetch("/api/clothes/listClothes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          auth0Id: auth0Id,
        }),
      });
      const data = await response.json();
      console.log("Fetched user data:", data);
      const list = data.Clothes;
      list.map((item: { colour: string[]; type: string; imageSrc: string }) =>
        setClothesCard((clothesCard) => [...clothesCard, item])
      );
    };
    if (user) {
      load();
    }
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
                colour={item.colour}
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
