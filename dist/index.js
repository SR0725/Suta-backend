"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("module-alias/register");
require("@/routes/account-user-info-route");
require("@/routes/code-docs-delete-route");
require("@/routes/code-docs-generate-route");
require("@/routes/code-docs-get-route");
require("@/routes/code-docs-list-get-by-user-email-route");
require("@/routes/code-docs-update-route");
require("@/routes/google-login-callback-route");
const server_1 = require("@/server");
const PORT = Number(process.env.PORT || 8080);
server_1.server.listen({ port: PORT, host: "0.0.0.0" }, (err, address) => {
    if (err) {
        console.error(err);
        process.exit(1);
    }
    console.log(`Server listening at ${address}`);
});
