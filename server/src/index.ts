import "reflect-metadata";
import { createConnection } from "typeorm";
import { ApolloServer } from "apollo-server-express";
import * as express from "express";
import * as cookieParser from "cookie-parser";

import { typeDefs } from "./typeDefs";
import { resolvers } from "./resolvers";
import { verify } from "jsonwebtoken";
import { User } from "./entity/User";
import { createTokens, consoleLogTokens } from "./auth";

const startServer = async () => {
  const server = new ApolloServer({
    // These will be defined for both new or existing servers
    typeDefs,
    resolvers,
    context: ({ req, res }: any) => ({ req, res })
  });

  await createConnection();

  const app = express();

  app.use(cookieParser());
  // run this before server.apply - prior to the resolvers running
  app.use(async (req: any, res: any, next) => {
    const refreshToken = req.cookies["refresh-token"];
    const accessToken = req.cookies["access-token"];

    consoleLogTokens(
      "=====NEW REQUEST " + Date.now().toString() + " =====",
      req
    );

    if (!refreshToken && !accessToken) {
      consoleLogTokens("**Neither Token Exists**", req);
      return next();
    }

    // there is no need to refresh the refreshToken if accessToken is good to go
    try {
      const data = verify(accessToken, "asjhgdjhgd") as any;
      // if we get a valid userId, it is a given that the token was verified
      req.userId = data.userId;

      consoleLogTokens("**Via Access Token**", req);

      return next();
    } catch {
      // if you want to refresh the token in the case of an error - do it here
    }

    //
    if (!refreshToken) {
      consoleLogTokens("**No refresh Token**", req);
      return next();
    }

    let data;

    try {
      data = verify(refreshToken, "asjhgdjhgd") as any;
    } catch {
      return next();
    }

    const user = await User.findOne(data.userId);

    // if token has been invalidate
    if (!user || user.count !== data.count) {
      consoleLogTokens("**Tokens have been invalidated**", req);
      return next();
    }

    const tokens = createTokens(user);

    // the refreshToken is optional
    // keep it to keep create a sliding expiration
    res.cookie("refresh-token", tokens.refreshToken);
    res.cookie("access-token", tokens.accessToken);
    req.userId = user.id;

    consoleLogTokens("**Tokens have been recreated**", req);

    next();
  });

  server.applyMiddleware({ app }); // app is from an existing express app

  app.listen({ port: 4000 }, () =>
    console.log(`🚀 Server ready at http://localhost:4000${server.graphqlPath}`)
  );
};

startServer();
