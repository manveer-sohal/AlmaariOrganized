import connectMongoDB from "@/libs/mongodb";
import User from "@/models/Users";
import { NextApiRequest, NextApiResponse } from "next";

export default async function test(req: NextApiRequest, res: NextApiResponse) {
  console.log("activate");
  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }
  console.log("activate1");

  try {
    // // Get the authenticated user's session from Auth0
    // const session = await getSession(req, res); // Await the promise

    // if (!session || !session.user) {
    //   return res.status(401).json({ error: "Unauthorized" });
    // }

    // const { sub: auth0Id, email } = session.user;
    const { auth0Id, email } = req.body;
    console.log("activate2");

    await connectMongoDB();
    console.log("activate3");

    // Check if the user already exists in MongoDB
    let dbUser = await User.findOne({ auth0Id });
    console.log("activate4");

    if (!dbUser) {
      // Create the user if they do not exist
      dbUser = await User.create({
        auth0Id,
        email,
        Clothes: [],
      });
    }
    console.log("activate5");

    return res.status(200).json({ message: "Login Successful", user: dbUser });
  } catch (error) {
    console.error("Error logging in user:", error);
    return res.status(500).json({ error: "Failed to log in" });
  }
}
