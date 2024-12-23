import connectMongoDB from "@/libs/mongodb";
import User from "@/models/Users";
import { NextApiRequest, NextApiResponse } from "next";

export default async function getData(
  request: NextApiRequest,
  response: NextApiResponse
) {
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
}
