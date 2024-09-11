import passport from "passport";
import bcrypt from "bcryptjs";

import User from "../models/user.model.js";
import { GraphQLLocalStrategy } from "graphql-passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";

export const configurePassport = async () => {
	passport.serializeUser((user, done) => {
		console.log("Serializing user");
		done(null, user.id);
	});

	passport.deserializeUser(async (id, done) => {
		console.log("Deserializing user");
		try {
			const user = await User.findById(id);
			done(null, user);
		} catch (err) {
			done(err);
		}
	});

	passport.use(
		new GraphQLLocalStrategy(async (username, password, done) => {
			try {
				const user = await User.findOne({ username });
				if (!user) {
					throw new Error("Invalid username or password");
				}
				const validPassword = await bcrypt.compare(password, user.password);

				if (!validPassword) {
					throw new Error("Invalid username or password");
				}

				return done(null, user);
			} catch (err) {
				return done(err);
			}
		})
	);
    // Google authentication strategy
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: "/auth/google/callback", // The URL where Google will redirect after successful authentication
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          let user = await User.findOne({ googleId: profile.id });
          if (!user) {
            // If user does not exist, create a new one
            user = new User({
              googleId: profile.id,
              username: profile.displayName,
              email: profile.emails[0].value,
            });
            await user.save();
          }
          return done(null, user); // Pass user to serializeUser
        } catch (err) {
          return done(err);
        }
      }
    )
  );

};