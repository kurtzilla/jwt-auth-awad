import { sign } from "jsonwebtoken";
import { User } from "./entity/User";

export const createTokens = (user: User) => {
  const refreshToken = sign(
    { userId: user.id, count: user.count },
    "asjhgdjhgd", // TODO store secret in .env
    {
      expiresIn: "7d"
    }
  );

  const accessToken = sign({ userId: user.id }, "asjhgdjhgd", {
    expiresIn: "15min"
  });

  return { refreshToken, accessToken };
};

export const consoleLogTokens = (title: string, req: any) => {
  const refreshToken = req.cookies["refresh-token"];
  const accessToken = req.cookies["access-token"];

  console.log(title);
  console.log(
    "Access",
    accessToken
      ? accessToken.substring(accessToken.length, accessToken.length - 5)
      : "",
    "- Refresh",
    refreshToken
      ? refreshToken.substring(refreshToken.length, refreshToken.length - 5)
      : "",
    "Req.UserId",
    req.userId
  );
};
