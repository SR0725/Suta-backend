"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const zod_1 = require("zod");
const server_1 = require("@/server");
const account_api_key_service_1 = require("@/service/account-api-key-service");
const account_query_service_1 = __importDefault(require("@/service/account-query-service"));
server_1.server.withTypeProvider().route({
    method: "POST",
    url: "/account/api-key",
    schema: {
        body: zod_1.z.object({
            apiKey: zod_1.z.string(),
        }),
        response: {
            200: zod_1.z.any(),
        },
    },
    async handler(req, res) {
        const token = req.cookies.authorization;
        if (!token) {
            throw new Error("Token is not set");
        }
        const account = await (0, account_query_service_1.default)(token);
        const apiKey = req.body.apiKey;
        await (0, account_api_key_service_1.insertAccountOpenAIApiKeyByEmailService)(account.email, apiKey);
        res.send({
            success: true,
        });
    },
});
