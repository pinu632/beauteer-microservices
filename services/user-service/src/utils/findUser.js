import { User } from "../models/user.model.js";

export const findUserByEmail = async (email) => {
    const user = await User.findOne({ email }).select("+password"); // Need password for login
    if (!user) return null;
    return { user };
};
