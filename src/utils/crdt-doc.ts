import { SocketIOProvider } from "y-socket.io";
import * as Y from "yjs";

export interface CRDTDoc {
  doc: Y.Doc;
  provider: SocketIOProvider;
  destroy: () => void;
}

function createCRDTDoc(docsId: string): CRDTDoc {
  const PORT = Number(process.env.PORT || 8080);
  const doc = new Y.Doc();
  const provider = new SocketIOProvider(
    `ws://localhost:${PORT}`,
    docsId,
    doc,
    {}
  );

  const destroy = () => {
    provider.disconnect();
    provider.destroy();
  };

  return {
    doc,
    provider,
    destroy,
  };
}

export default createCRDTDoc;
