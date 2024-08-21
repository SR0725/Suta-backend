import * as Y from "yjs";

interface YUpsertLLMHistoryProps {
  yDoc: Y.Doc;
  nodeType: string;
  llmHistoryId: string;
  newContent: string;
  targetCardId?: string;
}

function yUpsertLLMHistory(props: YUpsertLLMHistoryProps) {
  const { yDoc, nodeType, llmHistoryId, newContent, targetCardId } = props;
  const yLLMHistoryArray = yDoc.getArray<Y.Map<Y.Text>>("llmHistoryList");
  const yLLMHistoryList = yLLMHistoryArray.toArray();
  let yLLMHistory = yLLMHistoryList.find(
    (yLLMHistory) => yLLMHistory.get("id")?.toString() === llmHistoryId
  );

  if (!yLLMHistory) {
    yLLMHistory = new Y.Map<Y.Text>();
    yLLMHistory.set("id", new Y.Text(llmHistoryId));
    yLLMHistory.set("nodeType", new Y.Text(nodeType));
    yLLMHistory.set("response", new Y.Text(""));
    if (targetCardId) {
      yLLMHistory.set("targetCardId", new Y.Text(targetCardId));
    }
    yLLMHistoryArray.insert(yLLMHistoryArray.length, [yLLMHistory]);
  }

  const yText = yLLMHistory.get("response")!;
  yText.insert(yText.length, newContent);
}

export default yUpsertLLMHistory;
