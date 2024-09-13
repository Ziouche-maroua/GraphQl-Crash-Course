import express from "express";
import http from "http";
import cors from "cors";
import dotenv from "dotenv";

import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import {connectDB} from "./database/connectDb.js"

import passport from "passport";
import {buildContext} from "graphql-passport";
import session from "express-session";
import connectMongo from "connect-mongodb-session";

import mergedResolvers from "./resolvers/index.js";
import mergedTypeDefs from "./typeDefs/index.js";

import { configurePassport } from "./passport/passport.config.js";

const app = express();
dotenv.config();
configurePassport();

const httpServer = http.createServer(app);

const MongoDBStore = connectMongo(session);

const store = new MongoDBStore({
	uri: process.env.MONGO_URI,
	collection: "sessions",
});
store.on("error", (err) => console.log(err));

app.use(
    session({
		secret: process.env.SESSION_SECRET,
		resave: false, // this option specifies whether to save the session to the store on every request
		saveUninitialized: false, // option specifies whether to save uninitialized sessions
		cookie: {
			maxAge: 1000 * 60 * 60 * 24 * 7, // 7days :)
			httpOnly: true, // this option prevents the Cross-Site Scripting (XSS) attacks
		},
		store: store,
	})
)

app.use(passport.initialize());
app.use(passport.session());

const server = new ApolloServer({
	typeDefs: mergedTypeDefs,
	resolvers: mergedResolvers,
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
})

// Ensure we wait for our server to start
await server.start();

// Set up our Express middleware to handle CORS, body parsing,
// and our expressMiddleware function.
app.use(
	"/graphql",
	cors({
		origin: "http://localhost:3000",  // Allow requests from the frontend
		credentials: true,
	}),
	express.json(),
	// expressMiddleware accepts the same arguments:
	// an Apollo Server instance and optional configuration options
	expressMiddleware(server, {
		context: async ({ req, res }) => {
            const context = buildContext({ req, res });
            return { ...context, user: req.user };
          },
	})
);


// Route to start Google OAuth authentication process
// app.get(
//     "/auth/google",
//     passport.authenticate("google", { scope: ["profile", "email"] })
//   );
  
//   // Route to handle the callback after Google has authenticated the user
//   app.get(
//     "/auth/google/callback",
//     passport.authenticate("google", { failureRedirect: "/login" }),
//     (req, res) => {
//       // Successful authentication, redirect to your dashboard or homepage
//       res.redirect("/dashboard");
//     }
//   );

  

await new Promise((resolve) => httpServer.listen({ port: 4000 }, resolve));
await connectDB();


console.log(`🚀 Server ready at http://localhost:4000/graphql`);