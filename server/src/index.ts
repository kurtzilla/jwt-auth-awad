import "reflect-metadata";
import * as dotenv from "dotenv";

import { createConnection } from "typeorm";
import { ApolloServer } from "apollo-server-express";
import * as express from "express";
import * as cookieParser from "cookie-parser";

import { typeDefs } from "./typeDefs";
import { resolvers } from "./resolvers";
import { verify } from "jsonwebtoken";
import { User } from "./entity/User";
import { createTokens } from "./auth";

dotenv.config();

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

  // TODO move this to a separate file
  // run this before server.apply - prior to the resolvers running
  app.use(async (req: any, res: any, next) => {
    const refreshToken = req.cookies["refresh-token"];
    const accessToken = req.cookies["access-token"];

    if (!refreshToken && !accessToken) {
      return next();
    }

    // there is no need to refresh the refreshToken if accessToken is good to go
    try {
      const data = verify(accessToken, process.env
        .SESSION_SECRET as string) as any;

      // if we get a valid userId, it is a given that the token was verified
      req.userId = data.userId;

      return next();
    } catch {
      // if you want to refresh the token in the case of an error - do it here
    }

    if (!refreshToken) {
      return next();
    }

    let data;

    try {
      data = verify(refreshToken, process.env.SESSION_SECRET as string) as any;
    } catch {
      return next();
    }

    const user = await User.findOne(data.userId);

    // if token has been invalidate
    if (!user || user.count !== data.count) {
      return next();
    }

    const tokens = createTokens(user);

    // the refreshToken is optional here
    res.cookie("refresh-token", tokens.refreshToken);
    res.cookie("access-token", tokens.accessToken);
    req.userId = user.id;

    next();
  });

  server.applyMiddleware({ app }); // app is from an existing express app

  app.listen({ port: 4000 }, () =>
    console.log(`🚀 Server ready at http://localhost:4000${server.graphqlPath}`)
  );
};

startServer();
