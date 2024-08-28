"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function getCodeModuleText(code, codeLineModules) {
    const codeLines = code.split("\n");
    const codeModuleText = codeLineModules.map((module, index) => {
        const nextModule = codeLineModules[index + 1];
        const startLine = module.startLine;
        const endLine = nextModule ? nextModule.startLine - 1 : codeLines.length;
        return codeLines.slice(startLine, endLine).join("\n");
    });
    const codeModuleTextWithTitle = codeModuleText.map((text, index) => {
        return `# module ${index}：${codeLineModules[index].title}\n${text}`;
    });
    return codeModuleTextWithTitle.join("\n");
}
exports.default = getCodeModuleText;
