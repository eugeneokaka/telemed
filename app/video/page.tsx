"use client";

import {
  useHMSStore,
  selectIsConnectedToRoom,
  useHMSActions,
} from "@100mslive/react-sdk";
import { useEffect } from "react";
import JoinForm from "../components/joinform";
import Conference from "../components/confrence";
import Footer from "./footer";

export default function Home() {
  const isConnected = useHMSStore(selectIsConnectedToRoom);
  const hmsActions = useHMSActions();

  // Leave room on refresh/close
  useEffect(() => {
    window.onunload = () => {
      if (isConnected) hmsActions.leave();
    };
  }, [hmsActions, isConnected]);

  return (
    <main className="app">
      {isConnected ? (
        <div>
          {" "}
          <Conference /> <Footer />
        </div>
      ) : (
        <JoinForm />
      )}
    </main>
  );
}
