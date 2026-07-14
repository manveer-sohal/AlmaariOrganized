import connectMongoDB from "../libs/mongodb.js";
import { Clothes, User } from "../models/Users.js";
import { runStylistPipeline } from "./aiStylist/pipeline.js";

export const generateRecommendationsForUser = async ({
  auth0Id,
  requestBody,
}) => runStylistPipeline({ auth0Id, requestBody });

export const verifyOwnedItemIds = async (auth0Id, itemIds) => {
  await connectMongoDB();
  const user = await User.findOne({ auth0Id }, { _id: 1 });
  if (!user) {
    throw { status: 404, message: "User not found" };
  }

  const count = await Clothes.countDocuments({
    _id: { $in: itemIds },
    userId: user._id,
  });

  return count === itemIds.length;
};
