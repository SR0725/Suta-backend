"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const oauth2_1 = __importDefault(require("@fastify/oauth2"));
async function addAuthMiddleware(app) {
    const ClientId = process.env.GOOGLE_CLIENT_ID;
    const ClientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const CallbackUrl = process.env.AUTH_CALLBACK_URL;
    if (!ClientId || !ClientSecret || !CallbackUrl) {
        throw new Error("ClientId or ClientSecret is not set");
    }
    await app.register(oauth2_1.default, {
        name: "googleOAuth2",
        scope: ["profile", "email"],
        credentials: {
            client: {
                id: ClientId,
                secret: ClientSecret,
            },
            auth: oauth2_1.default.GOOGLE_CONFIGURATION,
        },
        startRedirectPath: "/login/google",
        callbackUri: CallbackUrl,
        callbackUriParams: {
            access_type: "offline",
        },
        pkce: "S256",
    });
}
exports.default = addAuthMiddleware;
