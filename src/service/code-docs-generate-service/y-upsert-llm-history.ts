import * as Y from "yjs";

interface YUpsertLLMHistoryProps {
  yDoc: Y.Doc;
  nodeType: string;
  llmHistoryId: string;
  newContent: string;
  prompt: string;
  input: string;
  targetCardId?: string;
  stepIndex?: number;
}

function yUpsertLLMHistory(props: YUpsertLLMHistoryProps) {
  const {
    yDoc,
    nodeType,
    llmHistoryId,
    newContent,
    targetCardId,
    prompt,
    input,
    stepIndex,
  } = props;
  const yLLMHistoryArray =
    yDoc.getArray<Y.Map<Y.Text | string>>("llmHistoryList");
  const yLLMHistoryList = yLLMHistoryArray.toArray();
  let yLLMHistory = yLLMHistoryList.find(
    (yLLMHistory) => yLLMHistory.get("id")?.toString() === llmHistoryId
  );

  if (!yLLMHistory) {
    yLLMHistory = new Y.Map<Y.Text | string>();
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

  const yText = yLLMHistory.get("response") as Y.Text;
  yText.insert(yText.length, newContent);
}

export default yUpsertLLMHistory;
