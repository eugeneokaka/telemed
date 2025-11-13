"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
interface IUser {
  id: string;
  first_name: string;
  last_name: string;
  gender?: string;
  role: string;
}

const supabase = createClient();

type User = {
  id: string;
  first_name: string;
  last_name: string;
  gender?: string;
  role: string;
};

type ChatRoom = {
  id: string;
  doctor_id: string;
  patient_id: string;
  created_at: string;
};

type ChatMessage = {
  id: string;
  room_id: string;
  sender_id: string;
  message: string;
  attachment_url?: string;
  created_at: string;
};

export default function PatientChatPage() {
  const [user, setUser] = useState<IUser | null>(null);
  const [doctors, setDoctors] = useState<User[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<User | null>(null);
  const [room, setRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  // Fetch current user and all doctors
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase.auth.getUser();
        if (error || !data.user) throw new Error("Not authenticated");

        const authUser = data.user;

        const { data: profile } = await supabase
          .from("users")
          .select("*")
          .eq("id", authUser.id)
          .single();

        if (!profile) throw new Error("User profile not found");

        setUser(profile);

        const { data: doctorsList } = await supabase
          .from("users")
          .select("*")
          .eq("role", "doctor");

        setDoctors(doctorsList || []);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Start chat
  const startChat = async (doctor: User) => {
    if (!user) return;

    setSelectedDoctor(doctor);
    setIsLoading(true);

    try {
      const { data: existingRoom } = await supabase
        .from("chat_rooms")
        .select("*")
        .eq("doctor_id", doctor.id)
        .eq("patient_id", user.id)
        .maybeSingle();

      let chatRoom: ChatRoom;

      if (existingRoom) {
        chatRoom = existingRoom;
      } else {
        const { data: newRoom, error } = await supabase
          .from("chat_rooms")
          .insert({
            doctor_id: doctor.id,
            patient_id: user.id,
          })
          .select()
          .single();

        if (error || !newRoom) throw new Error("Failed to create chat room");

        chatRoom = newRoom;
      }

      setRoom(chatRoom);

      // Fetch messages
      const { data: msgs } = await supabase
        .from("messages")
        .select("*")
        .eq("room_id", chatRoom.id)
        .order("created_at", { ascending: true });

      setMessages(msgs || []);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  // REALTIME MESSAGE LISTENER
  useEffect(() => {
    if (!room) return;

    const channel = supabase
      .channel(`room-${room.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `room_id=eq.${room.id}`,
        },
        (payload) => {
          const newMsg = payload.new as ChatMessage;
          setMessages((prev) => [...prev, newMsg]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [room]);

  // Send message
  const sendMessage = async () => {
    if (!newMessage.trim() || !room || !user) return;

    setIsSending(true);

    try {
      const { error } = await supabase.from("messages").insert({
        room_id: room.id,
        sender_id: user.id,
        message: newMessage.trim(),
      });

      if (error) throw error;

      setNewMessage("");
    } catch (error) {
      console.error(error);
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading)
    return (
      <div className="flex justify-center items-center h-screen">
        Loading...
      </div>
    );

  return (
    <div className="p-6 flex gap-6 h-screen">
      {/* Doctors List */}
      <div className="w-1/4">
        <Card className="p-4 mb-4">
          <Input
            type="search"
            placeholder="Search doctors..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="mb-4"
          />

          <div className="space-y-2 max-h-[calc(100vh-200px)] overflow-y-auto">
            {doctors
              .filter(
                (d) =>
                  d.first_name
                    .toLowerCase()
                    .includes(searchTerm.toLowerCase()) ||
                  d.last_name.toLowerCase().includes(searchTerm.toLowerCase())
              )
              .map((doctor) => (
                <Card
                  key={doctor.id}
                  className="p-3 cursor-pointer hover:shadow-md"
                  onClick={() => startChat(doctor)}
                >
                  <div className="flex items-center gap-3">
                    <Avatar />
                    <div>
                      <div className="font-medium">
                        Dr. {doctor.first_name} {doctor.last_name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {doctor.gender || "Not specified"}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
          </div>
        </Card>
      </div>

      {/* Chat Area */}
      <Card className="flex-1 flex flex-col p-4">
        {room ? (
          <>
            <div className="border-b pb-4 mb-4">
              <h3 className="font-medium">
                Chat with Dr. {selectedDoctor?.first_name}{" "}
                {selectedDoctor?.last_name}
              </h3>
            </div>

            <div className="flex-1 overflow-y-auto mb-4 space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${
                    msg.sender_id === user.id ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[70%] p-3 rounded-lg ${
                      msg.sender_id === user.id
                        ? "bg-blue-500 text-white"
                        : "bg-gray-100"
                    }`}
                  >
                    <p>{msg.message}</p>

                    <p className="text-xs mt-1 opacity-70">
                      {formatDistanceToNow(new Date(msg.created_at), {
                        addSuffix: true,
                      })}
                    </p>
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
                disabled={isSending}
              />

              <Button
                onClick={sendMessage}
                disabled={isSending || !newMessage.trim()}
              >
                {isSending ? "Sending..." : "Send"}
              </Button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            Select a doctor to start chatting
          </div>
        )}
      </Card>
    </div>
  );
}
