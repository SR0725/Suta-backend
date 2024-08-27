import { Account } from "@/models/account";
import getAccountByEmail from "@/repositories/account/get-account-by-email";
import decodeUserJWT from "@/utils/decode-user-jwt";

async function accountQueryService(token: string) {
  const decodedToken = decodeUserJWT(token);
  if (!decodedToken) {
    throw new Error("Invalid token");
  }
  const account = await getAccountByEmail(decodedToken.email);
  return account as Account;
}

export default accountQueryService;
