import jwt from "jsonwebtoken";
import { Account } from "@/models/account";

function decodeUserJWT(token: string): Account | null {
  const secret = process.env.JWT_SECRET || "your-secret-key";
  return jwt.verify(token, secret) as Account;
}

export default decodeUserJWT;
