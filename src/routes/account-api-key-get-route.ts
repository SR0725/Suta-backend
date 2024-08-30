import { server } from "@/server";
import { getAccountApiKeyByEmailService } from "@/service/account-api-key-service";
import accountQueryService from "@/service/account-query-service";

server.route({
  method: "GET",
  url: "/account/api-key",
  async handler(request, reply) {
    const token = request.cookies.authorization;
    if (!token) {
      throw new Error("Token is not set");
    }
    const account = await accountQueryService(token);

    const accountApiKey = await getAccountApiKeyByEmailService(account.email);
    return reply.send(accountApiKey);
  },
});
