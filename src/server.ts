import fastify from "fastify";
import { Server } from "socket.io";
import { YSocketIO } from "y-socket.io/dist/server";
import cors from "@fastify/cors";
import { validatorCompiler, serializerCompiler } from "fastify-type-provider-zod";

export const server = fastify();
export const io = new Server(server.server);
export const ysocketio = new YSocketIO(io);

ysocketio.initialize();

server.setValidatorCompiler(validatorCompiler);
server.setSerializerCompiler(serializerCompiler);

server.register(cors, {
  origin: "http://localhost:3000",
  methods: ["GET", "POST"],
  credentials: true,
});
