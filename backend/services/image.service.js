import dotenv from "dotenv";
import axios from "axios";
dotenv.config();

const CROP_SERVICE_URL = process.env.CROP_SERVICE_URL;

export const toBase64 = (file) => {
  return `data:image/png;base64,${file.toString("base64")}`;
};

export const cropImage = async (base64Image) => {
  const res = await axios.post(
    `${CROP_SERVICE_URL}/crop`,
    {
      image: base64Image,
    },
    {
      timeout: 15000,
    }
  );

  return res.data.image;
};
