// src/components/Peer.tsx
"use client";

import { useVideo } from "@100mslive/react-sdk";

interface PeerProps {
  peer: any;
}

export default function Peer({ peer }: PeerProps) {
  const { videoRef } = useVideo({ trackId: peer.videoTrack });
  return (
    <div className="peer-container">
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className={peer.isLocal ? "local" : ""}
      />
      <div>
        {peer.name} {peer.isLocal && "(You)"}
      </div>
    </div>
  );
}
