// src/components/JoinForm.tsx
"use client";

import { useState } from "react";
import { useHMSActions } from "@100mslive/react-sdk";

export default function JoinForm() {
  const hmsActions = useHMSActions();
  const [inputValues, setInputValues] = useState({ name: "", roomCode: "" });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValues((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { name, roomCode } = inputValues;

    try {
      const authToken = await hmsActions.getAuthTokenByRoomCode({ roomCode });
      await hmsActions.join({
        userName: name,
        authToken,

        // <-- important
      });
    } catch (err) {
      console.error("HMS join error:", err);
    }
  };

  //   const handleSubmit = async (e: React.FormEvent) => {
  //     e.preventDefault();
  //     const { name, roomCode } = inputValues;

  //     try {
  //       const authToken = await hmsActions.getAuthTokenByRoomCode({ roomCode });
  //       await hmsActions.join({ userName: name, authToken });
  //     } catch (err) {
  //       console.error(err);
  //     }
  //   };

  return (
    <form onSubmit={handleSubmit} className="join-form">
      <input
        name="name"
        placeholder="Your Name"
        value={inputValues.name}
        onChange={handleChange}
        required
      />
      <input
        name="roomCode"
        placeholder="Room Code"
        value={inputValues.roomCode}
        onChange={handleChange}
        required
      />
      <button type="submit">Join Room</button>
    </form>
  );
}
