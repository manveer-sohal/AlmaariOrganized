"use client";
import ClothesCard from "./components/clothesCard";
import AddClothesUI from "./components/addClothesUI";
import { useUser } from "@auth0/nextjs-auth0/client";
import pants1 from "./pants1.jpeg";
import pants2 from "./pants2.jpeg";
import shirt1 from "./shirt1.jpeg";
import shirt2 from "./shirt2.jpeg";
import shirt3 from "./shirt3.jpeg";
import NavBar from "./components/navBar";
import SideBar from "./components/sideBar";
import React, { useState } from "react";
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
const clothes = [
  { name: "Red Jacket", color: "Red", type: "Jacket", imageSrc: pants1 },
  { name: "Blue Shirt", color: "Blue", type: "Shirt", imageSrc: pants2 },
  {
    name: "Green Trousers",
    color: "Green",
    type: "Trousers",
    imageSrc: shirt2,
  },
  {
    name: "Green Trousers",
    color: "Green",
    type: "Trousers",
    imageSrc: shirt1,
  },
  {
    name: "Green Trousers",
    color: "Green",
    type: "Trousers",
    imageSrc: pants1,
  },
  {
    name: "Green Trousers",
    color: "Green",
    type: "Trousers",
    imageSrc: pants1,
  },
  {
    name: "Green Trousers",
    color: "Green",
    type: "Trousers",
    imageSrc: shirt1,
  },
  {
    name: "opium",
    color: "black",
    type: "Shirt",
    imageSrc: shirt3,
  },
  {
    name: "Green Trousers",
    color: "Green",
    type: "Trousers",
    imageSrc: pants1,
  },
  {
    name: "Green Trousers",
    color: "Green",
    type: "Trousers",
    imageSrc: pants1,
  },
  {
    name: "Green Trousers",
    color: "Green",
    type: "Trousers",
    imageSrc: pants1,
  },
  {
    name: "Green Trousers",
    color: "Green",
    type: "Trousers",
    imageSrc: shirt2,
  },
  {
    name: "opium",
    color: "black",
    type: "Shirt",
    imageSrc: shirt3,
  },
];

export default function Home() {
  const { user, isLoading } = useUser();
  const [isVisible, setIsVisible] = useState(false);

  const toggleForm = () => {
    console.log("+ has been clicked");
    setIsVisible((prev) => !prev);
  };

  if (isLoading) {
    // Optionally show a loading spinner while user authentication is being checked
    return <p>Loading...</p>;
  }

  return (
    <main>
      {isVisible && <AddClothesUI toggleForm={toggleForm}></AddClothesUI>}
      {!user && (
        <>
          <a className="nav-bar-li" href="/api/auth/login">
            Login
          </a>
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
            {clothes.map((item, index) => (
              <ClothesCard
                key={index}
                name={item.name}
                color={item.color}
                type={item.type}
                imageSrc={item.imageSrc.src}
              />
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
