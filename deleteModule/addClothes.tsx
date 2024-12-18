import React, { useEffect, useState, useContext } from "react";
import ClothesCard from "../frontend/app/components/clothesCard";

function AddClothes() {
  //file can either be of type file or type null
  const [file, setFile] = useState<File | null>(null);
  //file can either be of type string or type null
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    if (file) {
      //gets the url value of the file
      const objectUrl = URL.createObjectURL(file);
      setPreview(objectUrl);
    }
  }, [file]);

  useEffect(() => {
    if (preview) {
      var temp = document.getElementsByClassName("cards-container")[0];
      temp.append(
        '<ClothesCard key={1} name={"f"} color={"R"} type={"shirt"} imageSrc={preview != null ? preview : null}></ClothesCard>'
      );
    }
  }, [preview]);

  return (
    <>
      {preview &&
        (document.getElementsByClassName("cards-container")[0],
        (
          <ClothesCard
            key={1}
            name={"f"}
            color={"R"}
            type={"shirt"}
            imageSrc={preview != null ? preview : null}
          ></ClothesCard>
        ))}
      <label htmlFor="input-file" id="input-file-label" className="nav-bar-li">
        +
      </label>
      <input
        type="file"
        accept="image/jpeg,image/png, image/jpg"
        id="input-file"
        style={{ display: "none" }}
        onChange={(e) => {
          e.target.files && e.target.files[0]
            ? setFile(e.target.files[0])
            : console.log("null");
        }}
      ></input>
    </>
  );
}

export default AddClothes;
