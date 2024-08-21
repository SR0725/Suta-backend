import "@/route/code-docs-generate-route";
import "@/route/code-docs-get-route";
import { server } from "@/server";

const PORT = Number(process.env.PORT || 8080);

server.listen({ port: PORT }, (err, address) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`Server listening at ${address}`);
});
