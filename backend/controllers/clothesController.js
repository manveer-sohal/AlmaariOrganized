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

export const uploadData = async (request, response) => {
  console.log("Uploading");

  try {
    const { auth0Id, Clothes } = request.body;

    await connectMongoDB();

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
