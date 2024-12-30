import User from "../models/Users.js";
import connectMongoDB from "../libs/mongodb.js";

// export const POST = async (request, response) => {
//   const { auth0Id, email } = await request.body;

//   await connectMongoDB();

//   try {
//     await connectMongoDB();

//     const newUser = await User.create({ auth0Id, email, Clothes: [] });
//     return response.status(201).json({ message: "User Created", newUser });
//   } catch (e) {
//     return response.status(500).json({ error: "Internal Server Error", e });
//   }
// };

// export const getData = async (request, response) => {
//   if (request.method === "GET") {
//     try {
//       const { auth0Id } = request.query;
//       await connectMongoDB();

//       const userData = await User.findOne({ auth0Id });
//       if (userData) {
//         return response.status(200).json(userData);
//       } else {
//         return response.status(500).json({ error: "User Not Found" });
//       }
//     } catch (e) {
//       return response
//         .status(500)
//         .json({ error: "Failed to fetch user data", e });
//     }
//   } else {
//     return response.status(405).json({ error: "Method Not Allowed" });
//   }
// };

export const test = async (req, res) => {
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
    console.log(auth0Id);
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
};
