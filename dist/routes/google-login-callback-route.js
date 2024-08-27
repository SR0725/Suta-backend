"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const server_1 = require("@/server");
const account_login_or_register_service_1 = __importDefault(require("@/service/account-login-or-register-service"));
server_1.server.route({
    method: "GET",
    url: "/login/google/callback",
    async handler(request, reply) {
        const tokenResponse = await this.googleOAuth2.getAccessTokenFromAuthorizationCodeFlow(request, reply);
        const userInfoResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
            headers: {
                Authorization: "Bearer " + tokenResponse.token.access_token,
            },
        });
        const userInfo = (await userInfoResponse.json());
        const { token, account } = await (0, account_login_or_register_service_1.default)(userInfo);
        const frontendAuthCallbackUrl = process.env.FRONTEND_AUTH_CALLBACK_URL;
        if (!frontendAuthCallbackUrl) {
            throw new Error("FRONTEND_AUTH_CALLBACK_URL is not set");
        }
        return reply.redirect(`${frontendAuthCallbackUrl}?token=${token}`);
    },
});
