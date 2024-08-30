"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const agent_1 = __importDefault(require("./agent"));
async function testOpenAiApiKeyWork(apiKey) {
    const response = await (0, agent_1.default)({
        prompt: "",
        apiKey,
        messages: [
            {
                role: "user",
                content: "just say ok",
            },
        ],
    });
    return response;
}
exports.default = testOpenAiApiKeyWork;
