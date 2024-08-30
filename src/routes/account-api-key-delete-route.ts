import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { server } from "@/server";
import { deleteAccountApiKeyByEmailService } from "@/service/account-api-key-service";
import accountQueryService from "@/service/account-query-service";

server.withTypeProvider<ZodTypeProvider>().route({
  method: "DELETE",
  url: "/account/api-key",
  schema: {
    response: {
      200: z.any(),
    },
  },
  async handler(req, res) {
    const token = req.cookies.authorization;
    if (!token) {
      throw new Error("Token is not set");
    }
    const account = await accountQueryService(token);
    await deleteAccountApiKeyByEmailService(account.email);
    res.send({
      success: true,
    });
  },
});
