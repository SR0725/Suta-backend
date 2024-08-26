import { server } from "@/server";
import accountLoginOrRegisterService, {
  GoogleProfile,
} from "@/service/account-login-or-register-service";

server.route({
  method: "GET",
  url: "/login/google/callback",
  async handler(request, reply) {
    const tokenResponse =
      await this.googleOAuth2.getAccessTokenFromAuthorizationCodeFlow(
        request,
        reply
      );
    const userInfoResponse = await fetch(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      {
        headers: {
          Authorization: "Bearer " + tokenResponse.token.access_token,
        },
      }
    );
    const userInfo = (await userInfoResponse.json()) as GoogleProfile;
    const { token, account } = await accountLoginOrRegisterService(userInfo);
    const frontendAuthCallbackUrl = process.env.FRONTEND_AUTH_CALLBACK_URL;
    if (!frontendAuthCallbackUrl) {
      throw new Error("FRONTEND_AUTH_CALLBACK_URL is not set");
    }
    return reply.redirect(`${frontendAuthCallbackUrl}?token=${token}`);
  },
});
