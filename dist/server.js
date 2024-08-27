"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ysocketio = exports.io = exports.server = void 0;
const fastify_1 = __importDefault(require("fastify"));
const fastify_type_provider_zod_1 = require("fastify-type-provider-zod");
const socket_io_1 = require("socket.io");
const server_1 = require("y-socket.io/dist/server");
const cors_1 = __importDefault(require("@fastify/cors"));
const auth_middleware_1 = __importDefault(require("./middlewares/auth-middleware"));
exports.server = (0, fastify_1.default)();
exports.io = new socket_io_1.Server(exports.server.server);
exports.ysocketio = new server_1.YSocketIO(exports.io);
exports.ysocketio.initialize();
exports.server.setValidatorCompiler(fastify_type_provider_zod_1.validatorCompiler);
exports.server.setSerializerCompiler(fastify_type_provider_zod_1.serializerCompiler);
const frontendUrl = process.env.FRONTEND_URL;
exports.server.register(cors_1.default, {
    origin: frontendUrl,
    methods: ["GET", "POST", "DELETE", "PUT"],
    credentials: true,
});
(0, auth_middleware_1.default)(exports.server);
