import * as Y from "yjs";
import { CodeStepCard } from "@/models/code-docs";

interface YPushCardProps {
  yDoc: Y.Doc;
  card: CodeStepCard;
}

function YPushCard(props: YPushCardProps) {
  const { yDoc, card } = props;
  const yCardArray = yDoc.getArray<string>("cards");
  const cardData = JSON.stringify(card);
  yCardArray.insert(yCardArray.length, [cardData]);
}

export default YPushCard;
