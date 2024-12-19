import connectMongoDB from "@/libs/mongodb";
import User from "@/models/Users";
import { NextApiRequest, NextApiResponse } from "next";

export default async function getData(
  request: NextApiRequest,
  response: NextApiResponse
) {
  if (request.method === "GET") {
    try {
      const { auth0Id } = request.query;
      await connectMongoDB();

      const userData = await User.findOne({ auth0Id });
      if (userData) {
        return response.status(200).json(userData);
      } else {
        return response.status(500).json({ error: "User Not Found" });
      }
    } catch (e) {
      return response
        .status(500)
        .json({ error: "Failed to fetch user data", e });
    }
  } else {
    return response.status(405).json({ error: "Method Not Allowed" });
  }
}
