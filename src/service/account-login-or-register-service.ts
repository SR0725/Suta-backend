import jwt from "jsonwebtoken";
import { Account } from "@/models/account";
import getAccountByEmail from "@/repositories/account/get-account-by-email";
import upsertAccount from "@/repositories/account/upsert-account";

export interface GoogleProfile {
  id: string;
  email: string;
  verified_email: boolean;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
}

function generateJWT(account: Account): string {
  const secret = process.env.JWT_SECRET || "your-secret-key";
  return jwt.sign({ ...account }, secret, {
    expiresIn: "1d",
  });
}

async function accountLoginOrRegisterService(googleProfile: GoogleProfile) {
  const _account = await getAccountByEmail(googleProfile.email);

  const account: Account = _account || {
    email: googleProfile.email,
    name: googleProfile.name,
    picture: googleProfile.picture,
    lastLoginAt: new Date(),
  };

  await upsertAccount({
    ...account,
    lastLoginAt: new Date(),
  });

  const token = generateJWT(account);

  return { account, token };
}

export default accountLoginOrRegisterService;
