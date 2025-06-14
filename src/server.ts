import fastify from "fastify";
import {
  validatorCompiler,
  serializerCompiler,
} from "fastify-type-provider-zod";
import { Server } from "socket.io";
import { YSocketIO } from "y-socket.io/dist/server";
import cors from "@fastify/cors";
import addAuthMiddleware from "./middlewares/auth-middleware";

export const server = fastify();
export const io = new Server(server.server);
export const ysocketio = new YSocketIO(io);

ysocketio.initialize();

server.setValidatorCompiler(validatorCompiler);
server.setSerializerCompiler(serializerCompiler);

const frontendUrl = process.env.FRONTEND_URL;

server.register(cors, {
  origin: frontendUrl,
  methods: ["GET", "POST", "DELETE", "PUT"],
  credentials: true,
});

addAuthMiddleware(server);
