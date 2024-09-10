import { users } from "../dummyData/data.js";

const userResolver = {
    Query: {
        users: () => users,
        user:async (_,{userId})=> {
            try {
				const user = await User.findById(userId);
				return user;
			} catch (err) {
				console.error("Error in user query:", err);
				throw new Error(err.message || "Error getting user");
			}
        }
    },

    Mutation: {
    }
}
export default userResolver
