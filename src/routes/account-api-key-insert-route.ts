import { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { server } from "@/server";
import { insertAccountOpenAIApiKeyByEmailService } from "@/service/account-api-key-service";
import accountQueryService from "@/service/account-query-service";

server.withTypeProvider<ZodTypeProvider>().route({
  method: "POST",
  url: "/account/api-key",
  schema: {
    body: z.object({
      apiKey: z.string(),
    }),
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
    const apiKey = req.body.apiKey;
    await insertAccountOpenAIApiKeyByEmailService(account.email, apiKey);
    res.send({
      success: true,
    });
  },
});
