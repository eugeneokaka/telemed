"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
const supabase = createClient();
export default function ChatWindow({ chatRoom, user }: any) {
  const [messages, setMessages] = useState<any[]>([]);
  const [message, setMessage] = useState("");

  // 1️⃣ Load messages
  useEffect(() => {
    const loadMessages = async () => {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .eq("room_id", chatRoom.id)
        .order("created_at", { ascending: true });

      setMessages(data || []);
    };
    loadMessages();
  }, [chatRoom]);

  // 2️⃣ Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel(`room:${chatRoom.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          setMessages((prev) => [...prev, payload.new]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chatRoom.id]);

  // 3️⃣ Send message
  const sendMessage = async () => {
    if (!message.trim()) return;
    await supabase.from("messages").insert([
      {
        room_id: chatRoom.id,
        sender_id: user.id,
        message,
      },
    ]);
    setMessage("");
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 p-4 overflow-y-auto space-y-2">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`p-2 rounded-lg max-w-sm ${
              msg.sender_id === user.id
                ? "bg-blue-500 text-white ml-auto"
                : "bg-gray-200 text-gray-800"
            }`}
          >
            {msg.message}
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="p-3 border-t flex gap-2">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="flex-1 border rounded p-2"
          placeholder="Type a message..."
        />
        <button
          onClick={sendMessage}
          className="px-4 py-2 bg-blue-500 text-white rounded"
        >
          Send
        </button>
      </div>
    </div>
  );
}
