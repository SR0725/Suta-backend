import { CodeLine } from "@/models/code-docs";

interface ModifyOptions {
  addCodes: {
    insertAfter: number;
    code: string;
  }[];
  modifyCodes: {
    modifyStartLine: number;
    modifyEndLine: number;
    code: string;
  }[];
}
function applyCodeModify(code: string, modify: ModifyOptions) {
  const codeLines = code.split("\n").map((line, index) => ({
    index,
    line,
  }));
  const resultCodeLine: CodeLine[] = [];

  // 逐行檢查
  codeLines.forEach((codeLine) => {
    // 檢查是否有程式碼需要新增
    const addCodes = modify.addCodes.filter(
      ({ insertAfter }) => insertAfter === codeLine.index
    );

    // 檢查是否該行將被修改
    const modifyCodes = modify.modifyCodes.filter(
      ({ modifyStartLine, modifyEndLine }) =>
        codeLine.index >= modifyStartLine && codeLine.index <= modifyEndLine
    );
    // TODO: 目前程序只支持一次修改
    const modifyCode = modifyCodes[0];

    // 確認是否保留該程式碼
    if (modifyCodes.length === 0) {
      // 如果該程式碼不會被修改，直接新增
      resultCodeLine.push({
        text: codeLine.line,
      });
    }

    // 如果有程式碼需要新增
    if (addCodes.length > 0) {
      addCodes.forEach(({ code }) => {
        code.split("\n").forEach((line) => {
          resultCodeLine.push({
            text: line,
            isAdded: true,
          });
        });
      });
    }

    // 如果該行將被修改
    if (modifyCode) {
      // 套用修改
      if (modifyCode.modifyStartLine === codeLine.index) {
        modifyCode.code.split("\n").forEach((line) => {
          resultCodeLine.push({
            text: line,
            isModified: true,
          });
        });
      }
    }
  });

  return resultCodeLine;
}

export default applyCodeModify;
