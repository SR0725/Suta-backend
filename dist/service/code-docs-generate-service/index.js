"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const create_empty_code_docs_1 = __importDefault(require("../../repositories/code-docs/create-empty-code-docs"));
const crypto_1 = require("crypto");
const upsert_account_1 = __importDefault(require("@/repositories/account/upsert-account"));
const get_code_docs_by_id_1 = __importDefault(require("@/repositories/code-docs/get-code-docs-by-id"));
const update_code_docs_1 = __importDefault(require("@/repositories/code-docs/update-code-docs"));
const crdt_doc_1 = __importDefault(require("@/utils/crdt-doc"));
const entire_step_node_1 = __importDefault(require("./entire-step-node"));
const initial_code_architecture_node_1 = __importDefault(require("./initial-code-architecture-node"));
const initial_purpose_node_1 = __importDefault(require("./initial-purpose-node"));
async function startNodes(docsId, code, crdtDoc) {
    // 設定 doc isGenerating
    const yIsGenerating = crdtDoc.doc.getText("isGenerating");
    yIsGenerating.insert(0, "true");
    // 初始解析
    await (0, initial_purpose_node_1.default)({
        docsId,
        code,
        yDoc: crdtDoc.doc,
    });
    // 生成初始程式碼
    const initialCode = await (0, initial_code_architecture_node_1.default)({
        docsId,
        code,
        yDoc: crdtDoc.doc,
    });
    if (!initialCode) {
        throw new Error("Initial code not found");
    }
    // 創建全部步驟
    await (0, entire_step_node_1.default)({
        docsId,
        fullCode: code,
        startCode: initialCode,
        yDoc: crdtDoc.doc,
    });
    // 完成工作
    const codeDocs = await (0, get_code_docs_by_id_1.default)(docsId);
    if (!codeDocs) {
        throw new Error("CodeDocs not found");
    }
    await (0, update_code_docs_1.default)(docsId, Object.assign(Object.assign({}, codeDocs), { isGenerating: false }));
    // 更新 YJS 資料庫
    yIsGenerating.delete(0, yIsGenerating.length);
    yIsGenerating.insert(0, "false");
}
async function codeDocsGenerateService(account, code) {
    var _a, _b;
    const docsId = (0, crypto_1.randomUUID)();
    const crdtDoc = (0, crdt_doc_1.default)(docsId);
    await (0, create_empty_code_docs_1.default)(docsId, code, account);
    startNodes(docsId, code, crdtDoc)
        .then(() => {
        console.log("startNodes done");
    })
        .catch((error) => {
        console.error(error);
    })
        .finally(() => {
        setTimeout(() => {
            console.log("destroy");
            crdtDoc.destroy();
        }, 5000);
    });
    await (0, upsert_account_1.default)(Object.assign(Object.assign({}, account), { codeDocsGenerateUsage: {
            thisDayGeneratedCount: ((_a = account === null || account === void 0 ? void 0 : account.codeDocsGenerateUsage) === null || _a === void 0 ? void 0 : _a.lastGeneratedAt.toDateString()) ===
                new Date().toDateString()
                ? ((_b = account === null || account === void 0 ? void 0 : account.codeDocsGenerateUsage) === null || _b === void 0 ? void 0 : _b.thisDayGeneratedCount) + 1
                : 1,
            lastGeneratedAt: new Date(),
        } }));
    return docsId;
}
exports.default = codeDocsGenerateService;
