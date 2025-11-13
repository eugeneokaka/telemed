"use client";

import { use, useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";

const supabase = createClient();

type User = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  role: string;
};

type ChatRoom = {
  id: string;
  patient_id: string;
  doctor_id: string;
};

type Message = {
  id: string;
  room_id: string;
  sender_id: string;
  message: string;
  created_at: string;
};

export default function ChatPage() {
  const [user, setUser] = useState<User | null>(null);
  const [doctors, setDoctors] = useState<User[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<User | null>(null);
  const [room, setRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  // ✅ Fetch current user + doctors
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const { data: authData, error: authError } =
          await supabase.auth.getUser();
        if (authError) throw authError;

        const authUser = authData.user;
        if (!authUser) return setLoading(false);

        const { data: profile, error: profileError } = await supabase
          .from("users")
          .select("*")
          .eq("id", authUser.id)
          .single();

        if (profileError || !profile) throw profileError;

        setUser(profile as User);

        const { data: doctorList, error: doctorError } = await supabase
          .from("users")
          .select("*")
          .eq("role", "doctor");

        if (doctorError) throw doctorError;

        setDoctors((doctorList || []) as User[]);
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);
  console.log(user?.id);

  // ✅ Start chat / create room if it doesn't exist
  const startChat = async (doctor: User) => {
    if (!user) return;
    setSelectedDoctor(doctor);

    try {
      const { data: existingRoom } = await supabase
        .from("chat_rooms")
        .select("*")
        .eq("patient_id", user.id)
        .eq("doctor_id", doctor.id)
        .maybeSingle();

      let chatRoom: ChatRoom;

      if (existingRoom) {
        chatRoom = existingRoom as ChatRoom;
      } else {
        const { data: newRoom } = await supabase
          .from("chat_rooms")
          .insert({ patient_id: user.id, doctor_id: doctor.id })
          .select()
          .single();
        chatRoom = newRoom as ChatRoom;
      }

      setRoom(chatRoom);
      console.log(chatRoom);
    } catch (err) {
      console.error("Error starting chat:", err);
    }
  };
  ///////fetch all rooms

  // ✅ Load messages + subscribe to new messages
  useEffect(() => {
    if (!room) return;

    const fetchMessages = async () => {
      try {
        const { data } = await supabase
          .from("messages")
          .select("*")
          .eq("room_id", room.id)
          .order("created_at", { ascending: true });
        setMessages((data || []) as Message[]);
      } catch (err) {
        console.error("Error fetching messages:", err);
      }
    };

    fetchMessages();

    const channel = supabase
      .channel(`room-${room.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const newMsg = payload.new as Message;
          if (newMsg.room_id === room.id) {
            setMessages((prev) => [...prev, newMsg]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [room]);

  // ✅ Send message
  const sendMessage = async () => {
    if (!newMessage.trim() || !room || !user) return;
    setIsSending(true);

    try {
      await supabase.from("messages").insert({
        room_id: room.id,
        sender_id: user.id,
        message: newMessage.trim(),
      });

      setNewMessage("");
    } catch (err) {
      console.error("Error sending message:", err);
    } finally {
      setIsSending(false);
    }
  };

  if (loading)
    return (
      <div className="flex justify-center items-center h-screen">
        Loading...
      </div>
    );

  if (!user)
    return (
      <div className="flex justify-center items-center h-screen">
        Please log in
      </div>
    );

  return (
    <div className="flex h-screen gap-6 p-6">
      {/* Doctors List */}
      <div className="w-1/4 overflow-y-auto">
        {doctors.map((doctor) => (
          <Card
            key={doctor.id}
            className="p-3 mb-2 cursor-pointer hover:shadow-md"
            onClick={() => startChat(doctor)}
          >
            <div className="flex items-center gap-3">
              <Avatar />
              <p>
                Dr. {doctor.first_name} {doctor.last_name}
              </p>
            </div>
          </Card>
        ))}
      </div>

      {/* Chat Window */}
      <div className="flex-1 flex flex-col">
        {room && selectedDoctor ? (
          <>
            <h2 className="mb-4 border-b pb-2">
              Chat with Dr. {selectedDoctor.first_name}{" "}
              {selectedDoctor.last_name}
            </h2>
            <div className="flex-1 overflow-y-auto mb-4 space-y-2">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`${
                    msg.sender_id === user.id ? "text-right" : "text-left"
                  }`}
                >
                  <div
                    className={`inline-block p-2 rounded ${
                      msg.sender_id === user.id
                        ? "bg-blue-500 text-white"
                        : "bg-gray-200"
                    }`}
                  >
                    {msg.message}
                    <div className="text-xs opacity-70 mt-1">
                      {formatDistanceToNow(new Date(msg.created_at), {
                        addSuffix: true,
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              />
              <Button onClick={sendMessage} disabled={isSending}>
                {isSending ? "Sending..." : "Send"}
              </Button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex justify-center items-center text-gray-500">
            Select a doctor to start chatting
          </div>
        )}
      </div>
    </div>
  );
}
