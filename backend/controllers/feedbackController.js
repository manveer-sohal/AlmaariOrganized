import { Feedback } from "../models/Feedback.js";
import connectMongoDB from "../libs/mongodb.js";
// import csv from "csv-parser";

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

//returns all feedback as csv
export const getFeedback = async (req, res) => {
  //
};

// Get paginated feedback with optional filters and sorting
export const getPaginatedFeedback = async (req, res) => {
  try {
    const {
      priority,
      type,
      dateFrom,
      dateTo,
      search,
      sortBy = "createdAt",
      sortOrder = "desc",
      page = 1,
      limit = 20,
    } = req.query;

    await connectMongoDB();

    const query = {};
    if (priority) query.priority = priority;
    if (type) query.type = type;
    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
      if (dateTo) query.createdAt.$lte = new Date(dateTo);
    }
    if (search && search.trim()) {
      query.$or = [
        { email: { $regex: search.trim(), $options: "i" } },
        { subject: { $regex: search.trim(), $options: "i" } },
      ];
    }

    const safeSortBy = ["createdAt", "priority", "type"].includes(sortBy)
      ? sortBy
      : "createdAt";
    const sortDir = sortOrder === "asc" ? 1 : -1;
    const skip =
      (Math.max(1, parseInt(page, 10)) - 1) *
      Math.min(50, Math.max(1, parseInt(limit, 10)));
    const take = Math.min(50, Math.max(1, parseInt(limit, 10)));

    const total = await Feedback.countDocuments(query);
    const feedback = await Feedback.find(query)
      .sort({ [safeSortBy]: sortDir })
      .skip(skip)
      .limit(take)
      .lean();

    return res.status(200).json({
      feedback,
      total,
      page: Math.max(1, parseInt(page, 10)),
      limit: take,
      sortBy: safeSortBy,
      sortOrder: sortOrder === "asc" ? "asc" : "desc",
    });
  } catch (error) {
    console.error(error);
    return res.status(error.status || 500).json({
      error: error.message || "Failed to get paginated feedback",
      details: error.details || null,
    });
  }
};

//3. Supports filtering by:
//   - priority (low, medium, high)
//   - type
//   - date range
//4. Supports search by:
//   - email
//   - subject
//5. Allows sorting by:
//   - createdAt
//   - priority
