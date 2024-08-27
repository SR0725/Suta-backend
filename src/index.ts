import "module-alias/register";
import "@/routes/account-user-info-route";
import "@/routes/code-docs-delete-route";
import "@/routes/code-docs-generate-route";
import "@/routes/code-docs-get-route";
import "@/routes/code-docs-list-get-by-user-email-route";
import "@/routes/google-login-callback-route";
import { server } from "@/server";

const PORT = Number(process.env.PORT || 8080);

server.listen({ port: PORT, host: "0.0.0.0" }, (err, address) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`Server listening at ${address}`);
});
