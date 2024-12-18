import connectMongoDB from "@/libs/mongodb";
import User from "@/models/Users";
import { NextApiRequest, NextApiResponse } from "next";

/*
const ClothesSchema = new mongoose.Schema({
  type: { type: String, required: true },
  imageSrc: { type: String, required: true },
  favourite: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  colour: { type: [String], required: true },
});
*/
export default async function POST(
  request: NextApiRequest,
  response: NextApiResponse
) {
  const { auth0Id, email } = await request.body;

  await connectMongoDB();

  try {
    await connectMongoDB();

    const newUser = await User.create({ auth0Id, email, Clothes: [] });
    return response.status(201).json({ message: "User Created", newUser });
  } catch (error) {
    //this could come about if the user already exists
    return response.status(500).json({ error: "Internal Server Error" });
  }
}

export async function GET(response: NextApiResponse) {
  return response.status(405).json({ error: "Method Not Allowed" });
}
