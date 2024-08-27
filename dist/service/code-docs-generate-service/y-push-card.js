"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function YPushCard(props) {
    const { yDoc, card } = props;
    const yCardArray = yDoc.getArray("cards");
    const cardData = JSON.stringify(card);
    yCardArray.insert(yCardArray.length, [cardData]);
}
exports.default = YPushCard;
