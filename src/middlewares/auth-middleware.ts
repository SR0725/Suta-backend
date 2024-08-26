import { FastifyInstance } from "fastify/types/instance";
import oauthPlugin, { OAuth2Token, Token } from "@fastify/oauth2";

declare module "fastify" {
  interface FastifyInstance {
    googleOAuth2: {
      getAccessTokenFromAuthorizationCodeFlow: (
        request: FastifyRequest,
        reply: FastifyReply
      ) => Promise<OAuth2Token>;
      generateAuthorizationUri: (
        request: FastifyRequest,
        reply: FastifyReply,
        callback: (err: Error, authorizationEndpoint: string) => void
      ) => Promise<string>;
    };
  }
}

async function addAuthMiddleware(app: FastifyInstance) {
  const ClientId = process.env.GOOGLE_CLIENT_ID;
  const ClientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const CallbackUrl = process.env.AUTH_CALLBACK_URL;

  if (!ClientId || !ClientSecret || !CallbackUrl) {
    throw new Error("ClientId or ClientSecret is not set");
  }

  await app.register(oauthPlugin, {
    name: "googleOAuth2",
    scope: ["profile", "email"],
    credentials: {
      client: {
        id: ClientId,
        secret: ClientSecret,
      },
      auth: oauthPlugin.GOOGLE_CONFIGURATION,
    },
    startRedirectPath: "/login/google",
    callbackUri: CallbackUrl,
    callbackUriParams: {
      access_type: "offline",
    },
    pkce: "S256",
  });
}

export default addAuthMiddleware;
