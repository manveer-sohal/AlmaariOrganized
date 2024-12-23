import connectMongoDB from "@/libs/mongodb";
import User from "@/models/Users";

import { NextApiRequest, NextApiResponse } from "next";

export default async function uploadData(
  request: NextApiRequest,
  response: NextApiResponse
) {
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
}
