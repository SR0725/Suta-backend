import deleteApiKeyByEmailRepository from "@/repositories/account-api-key/delete-api-key-by-email";
import getApiKeyByEmailRepository from "@/repositories/account-api-key/get-api-key-by-email";
import insertApiKeyByEmailRepository from "@/repositories/account-api-key/insert-api-key-by-email";

export async function getAccountApiKeyByEmailService(email: string) {
  return getApiKeyByEmailRepository(email);
}

export async function insertAccountOpenAIApiKeyByEmailService(
  email: string,
  apiKey: string
) {
  return insertApiKeyByEmailRepository(email, apiKey, "open-ai");
}

export async function deleteAccountApiKeyByEmailService(email: string) {
  return deleteApiKeyByEmailRepository(email);
}
