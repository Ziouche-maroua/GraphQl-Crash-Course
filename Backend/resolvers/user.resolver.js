import { users } from "../dummyData/data.js";

const userResolver = {
    Query: {
        users: () => users,
        user: (_,{userId})=> {
            try {
				const user =  users.find((user)=> user._id === userId);
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
