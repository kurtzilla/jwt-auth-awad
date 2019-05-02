import "reflect-metadata";
// import { createConnection } from "typeorm";
import { ApolloServer } from "apollo-server-express";
import * as express from "express";

import { typeDefs } from "./typeDefs";
import { resolvers } from "./resolvers";
// import { User } from "./entity/User";

const server = new ApolloServer({
  typeDefs,
  resolvers
});
const app = express();

server.applyMiddleware({ app });

app.listen({ port: 4000 }, () =>
  console.log(`Server read at http://localhost:4000${server.graphqlPath}`)
);
