import User from "../models/Users.js";
import connectMongoDB from "../libs/mongodb.js";

export const getData = async (request, response) => {
  try {
    const { auth0Id } = request.body;
    await connectMongoDB();

    const userData = await User.findOne({ auth0Id }, { Clothes: 1, _id: 0 });
    if (userData) {
      return response.json(userData);
    } else {
      return response.status(500).json({ error: "User Not Found" });
    }
  } catch (e) {
    return response.status(500).json({ error: "Failed to fetch user data", e });
  }
};

function addData() {
  const cold = [
    "Jeans",
    "Sweater",
    "Jacket",
    "Trousers",
    "Hoodie",
    "Coat",
    "Cardigan",
    "Pajamas",
    "Scarf",
    "Hat",
    "Gloves",
    "Cargos",
    "Jeans",
    "Leggings",
    "Vest",
    "Overalls",
    "Jumper",
    "Pants",
    "Tunic",
    "Poncho",
    "Robe",
  ];
  const warm = [
    "Shirt",
    "Jeans",
    "T-shirt",
    "Shorts",
    "Skirt",
    "Dress",
    "Blouse",
    "Trousers",
    "Cardigan",
    "Tank Top",
    "Pajamas",
    "Socks",
    "Cargos",
    "Jeans",
    "Leggings",
    "Swimsuit",
    "Crop Top",
    "Pants",
    "Capri Pants",
  ];

  const rain = [
    "Sweater",
    "Jacket",
    "Hoodie",
    "Coat",
    "Hat",
    "Swimsuit",
    "Raincoat",
    "Jumper",
    "Poncho",
  ];

  console.log(Clothes.type);
  if (cold.includes(Clothes.type)) {
    console.log("this is good for the cold");
  } else if (rain.includes(Clothes.type)) {
    console.log("this is good for the cold");
  } else if (warm.includes(Clothes.type)) {
    console.log("this is good for the cold");
  }
}
export const uploadData = async (request, response) => {
  console.log("Uploading");

  try {
    const { auth0Id, Clothes } = request.body;

    await connectMongoDB();
    addData(Clothes);

    const user = await User.findOneAndUpdate(
      { auth0Id: auth0Id },
      { $push: { Clothes: Clothes } },
      { new: true }
    );
    return response.status(200).json({ message: "Clothes Added", user });
  } catch (e) {
    return response.status(500).json({ error: "Failed to add clothes", e });
  }
};
