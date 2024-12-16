import React, { useEffect, useState, useContext } from "react";

type addClothesUIProm = {
  toggleForm: () => void;
};
function AddClothesUI({ toggleForm }: addClothesUIProm) {
  //file can either be of type file or type null
  const [file, setFile] = useState<File | null>(null);
  //file can either be of type string or type null
  const [preview, setPreview] = useState<string>("null");

  const handleSubmit = () => {
    console.log("submit");
  };
  useEffect(() => {
    if (file) {
      //gets the url value of the file
      const objectUrl = URL.createObjectURL(file);
      setPreview(objectUrl);
    }
  }, [file]);
  return (
    <div className="add-clothes-container">
      <button onClick={toggleForm} className="nav-bar-li">
        Go back
      </button>
      <form onSubmit={() => handleSubmit()} className="add-clothes-form">
        <div className="image-container">
          <img
            src={preview}
            alt="your pic"
            style={{ height: "200px" }}
            className="display-preview"
          ></img>
        </div>
        <label htmlFor="input-tag">Type:</label>
        <input type="text" id="input-tag"></input>

        <label htmlFor="input-colour">Colour:</label>

        <input type="text" id="input-colour"></input>
        <label
          htmlFor="input-file"
          id="input-file-label"
          className="add-picture"
        >
          Add Picture
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
      </form>
    </div>
  );
}

export default AddClothesUI;
