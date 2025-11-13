// src/components/Conference.tsx
"use client";

import { useHMSStore, selectPeers } from "@100mslive/react-sdk";
import Peer from "./peer";

export default function Conference() {
  const peers = useHMSStore(selectPeers);
  return (
    <div className="conference">
      {peers.map((peer) => (
        <Peer key={peer.id} peer={peer} />
      ))}
    </div>
  );
}
