"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const server_1 = require("@/server");
const account_query_service_1 = __importDefault(require("@/service/account-query-service"));
server_1.server.route({
    method: "GET",
    url: "/account/user-info",
    async handler(request, reply) {
        const token = request.cookies.authorization;
        if (!token) {
            throw new Error("Token is not set");
        }
        const account = await (0, account_query_service_1.default)(token);
        return reply.send(account);
    },
});
