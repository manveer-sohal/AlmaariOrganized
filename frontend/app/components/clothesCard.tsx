import React from "react";
import Image from "next/image";

/*
this is a prop

the components works like, when this component is called, it needs to also
be passed in variables like a function, name, color, type, imageSrc

then what it does is useses those variables to load up the "card" 

this is called in the main page layout, and only when the user is authenticated

future:
not for this file
but the component should be filled in with real data not our dummy local data

*/
type ClothingItemProps = {
  name: string;
  color: string[];
  type: string;
  imageSrc: string;
};

export default function ClothesCard({
  name,
  color,
  type,
  imageSrc,
}: ClothingItemProps) {
  return (
    <div
      style={{ border: "1px solid black", margin: "10px", padding: "10px" }}
      className="cards"
    >
      <h3>{name}</h3>
      <p>Type: {type}</p>
      <p>Color: {color}</p>
      <Image src={imageSrc} alt="image" width="200" height="200"></Image>
    </div>
  );
}
