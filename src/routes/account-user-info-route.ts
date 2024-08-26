import { server } from "@/server";
import accountQueryService from "@/service/account-query-service";

server.route({
  method: "GET",
  url: "/account/user-info",
  async handler(request, reply) {
    const token = request.cookies.authorization;
    if (!token) {
      throw new Error("Token is not set");
    }
    const account = await accountQueryService(token);
    return reply.send(account);
  },
});
