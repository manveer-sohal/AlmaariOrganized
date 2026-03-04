import { Feedback } from "../models/Feedback.js";
import connectMongoDB from "../libs/mongodb.js";

export const createFeedback = async (req, res) => {
  try {
    const { auth0Id, type, subject, email, message, priority } = req.body;
    if (!auth0Id || !type || !subject || !email || !message) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    console.log("auth0Id", auth0Id);
    console.log("type", type);
    console.log("subject", subject);
    console.log("email", email);
    console.log("message", message);
    console.log("priority", priority);

    await connectMongoDB();

    const feedback = await Feedback.create({
      auth0Id,
      email,
      type,
      subject,
      message,
      priority,
    });
    return res
      .status(201)
      .json({ message: "Feedback created successfully", feedback });
  } catch (error) {
    console.error(error);
    return res.status(error.status || 500).json({
      error: error.message || "Failed to create feedback",
      details: error.details || null,
    });
  }
};
