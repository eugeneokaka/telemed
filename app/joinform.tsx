"use client";
import { useState, ChangeEvent, FormEvent } from "react";
import { useHMSActions } from "@100mslive/react-sdk";

type InputValues = {
  userName: string;
  roomCode: string;
};

function JoinForm() {
  const hmsActions = useHMSActions();
  const [inputValues, setInputValues] = useState<InputValues>({
    userName: "",
    roomCode: "",
  });

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setInputValues((prevValues) => ({
      ...prevValues,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const { userName, roomCode } = inputValues;

    try {
      const authToken = await hmsActions.getAuthTokenByRoomCode({ roomCode });
      await hmsActions.join({ userName, authToken });
    } catch (err) {
      console.error("Join error:", err);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Join Room</h2>

      <div className="input-container">
        <input
          required
          id="userName"
          name="userName"
          type="text"
          placeholder="Your name"
          value={inputValues.userName}
          onChange={handleInputChange}
        />
      </div>

      <div className="input-container">
        <input
          required
          id="roomCode"
          name="roomCode"
          type="text"
          placeholder="Room code"
          value={inputValues.roomCode}
          onChange={handleInputChange}
        />
      </div>

      <button type="submit" className="btn-primary">
        Join
      </button>
    </form>
  );
}

export default JoinForm;
