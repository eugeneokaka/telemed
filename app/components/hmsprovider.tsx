"use client";

import { HMSRoomProvider } from "@100mslive/react-sdk";

export function HMSProvider({ children }: { children: React.ReactNode }) {
  return <HMSRoomProvider>{children}</HMSRoomProvider>;
}
