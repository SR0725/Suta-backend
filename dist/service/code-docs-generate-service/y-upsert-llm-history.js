"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const Y = __importStar(require("yjs"));
function yUpsertLLMHistory(props) {
    const { yDoc, nodeType, llmHistoryId, newContent, targetCardId, prompt, input, stepIndex, } = props;
    const yLLMHistoryArray = yDoc.getArray("llmHistoryList");
    const yLLMHistoryList = yLLMHistoryArray.toArray();
    let yLLMHistory = yLLMHistoryList.find((yLLMHistory) => { var _a; return ((_a = yLLMHistory.get("id")) === null || _a === void 0 ? void 0 : _a.toString()) === llmHistoryId; });
    if (!yLLMHistory) {
        yLLMHistory = new Y.Map();
        yLLMHistory.set("id", llmHistoryId);
        yLLMHistory.set("nodeType", nodeType);
        yLLMHistory.set("prompt", prompt);
        yLLMHistory.set("input", input);
        yLLMHistory.set("response", new Y.Text(""));
        if (targetCardId) {
            yLLMHistory.set("targetCardId", targetCardId);
        }
        if (stepIndex) {
            yLLMHistory.set("stepIndex", stepIndex.toString());
        }
        yLLMHistoryArray.insert(yLLMHistoryArray.length, [yLLMHistory]);
    }
    const yText = yLLMHistory.get("response");
    yText.insert(yText.length, newContent);
}
exports.default = yUpsertLLMHistory;
