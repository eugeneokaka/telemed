"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";

const supabase = createClient();

type User = {
  id: string;
  first_name: string;
  last_name: string;
  gender?: string;
  role: string;
  last_seen?: string;
};

type ChatRoom = {
  id: string;
  doctor_id: string;
  patient_id: string;
  created_at: string;
};

type Message = {
  id: string;
  room_id: string;
  sender_id: string;
  message: string;
  created_at: string;
};

type RoomWithUnread = ChatRoom & { unread: number };

export default function ChatPage() {
  const [user, setUser] = useState<User | null>(null);
  const [rooms, setRooms] = useState<RoomWithUnread[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [doctors, setDoctors] = useState<User[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  // Fetch user, rooms, users, and doctors
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Get authenticated user
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser();
        if (!authUser) throw new Error("Not authenticated");

        // Fetch profile
        const { data: profile } = await supabase
          .from("users")
          .select("*")
          .eq("id", authUser.id)
          .single();
        if (!profile) throw new Error("User profile not found");
        setUser(profile);

        // Fetch rooms for this user
        const roleColumn =
          profile.role === "doctor" ? "doctor_id" : "patient_id";
        const { data: roomsData } = await supabase
          .from("chat_rooms")
          .select("*")
          .eq(roleColumn, profile.id);
        setRooms((roomsData || []).map((r) => ({ ...r, unread: 0 })));

        // Fetch all users
        const { data: allUsers } = await supabase.from("users").select("*");
        setUsers(allUsers || []);

        // Fetch all doctors
        const { data: doctorsList } = await supabase
          .from("users")
          .select("*")
          .ilike("role", "doctor");
        setDoctors(doctorsList || []);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Load messages for selected room
  const selectRoom = async (room: ChatRoom) => {
    setSelectedRoom(room);
    setIsLoading(true);
    try {
      const { data: msgs } = await supabase
        .from("messages")
        .select("*")
        .eq("room_id", room.id)
        .order("created_at", { ascending: true });
      setMessages(msgs || []);

      // Mark unread as 0
      setRooms((prev) =>
        prev.map((r) => (r.id === room.id ? { ...r, unread: 0 } : r))
      );
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  // Start chat with a doctor (patient)
  const startChatWithDoctor = async (doctor: User) => {
    if (!user) return;
    try {
      // Check if room exists
      const { data: existing } = await supabase
        .from("chat_rooms")
        .select("*")
        .eq("doctor_id", doctor.id)
        .eq("patient_id", user.id)
        .maybeSingle();

      if (existing) {
        selectRoom(existing);
        return;
      }

      // Create new room
      const { data: newRoom, error } = await supabase
        .from("chat_rooms")
        .insert({ doctor_id: doctor.id, patient_id: user.id })
        .select()
        .single();
      if (error) throw error;

      setRooms((prev) => [...prev, { ...newRoom, unread: 0 }]);
      setSelectedRoom(newRoom);
      setMessages([]);
    } catch (error) {
      console.error(error);
    }
  };

  // Send message
  const sendMessage = async () => {
    if (!newMessage || !selectedRoom || !user) return;
    setIsSending(true);
    try {
      const { error } = await supabase.from("messages").insert({
        room_id: selectedRoom.id,
        sender_id: user.id,
        message: newMessage,
      });
      if (error) throw error;

      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          room_id: selectedRoom.id,
          sender_id: user.id,
          message: newMessage,
          created_at: new Date().toISOString(),
        },
      ]);
      setNewMessage("");
    } catch (error) {
      console.error(error);
    } finally {
      setIsSending(false);
    }
  };

  // Get other user in room
  const getOtherUser = (room: ChatRoom) => {
    if (!user) return null;
    const otherId = user.role === "doctor" ? room.patient_id : room.doctor_id;
    return users.find((u) => u.id === otherId);
  };

  // UI
  if (isLoading)
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );

  if (!user)
    return (
      <div className="flex items-center justify-center h-screen">
        <Card className="p-6">
          <h2 className="text-xl font-bold mb-2">Please log in to chat</h2>
          <Button onClick={() => (window.location.href = "/login")}>
            Go to Login
          </Button>
        </Card>
      </div>
    );

  console.log("Rendered allusers:", users);
  console.log("Rendered doctors:", doctors);

  return (
    <div className="p-6 h-screen flex gap-6">
      {/* Sidebar */}
      <div className="w-1/4 flex flex-col">
        <Card className="p-4 mb-4">
          <Input
            type="search"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="mb-4"
          />
          <div className="space-y-2 max-h-[calc(100vh-200px)] overflow-y-auto">
            {user.role === "patient"
              ? doctors.map((doctor) => (
                  <Card
                    key={doctor.id}
                    className="p-3 cursor-pointer transition hover:shadow-md"
                    onClick={() => startChatWithDoctor(doctor)}
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
                ))
              : rooms.map((r) => {
                  const otherUser = getOtherUser(r);
                  if (!otherUser) return null;
                  return (
                    <Card
                      key={r.id}
                      className={`p-3 cursor-pointer transition hover:shadow-md ${
                        selectedRoom?.id === r.id ? "border-blue-500" : ""
                      }`}
                      onClick={() => selectRoom(r)}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar />
                        <div className="flex-1">
                          <div className="font-medium">
                            {otherUser.first_name} {otherUser.last_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {otherUser.gender || "Not specified"}
                          </div>
                        </div>
                        {r.unread > 0 && (
                          <div className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                            {r.unread}
                          </div>
                        )}
                      </div>
                    </Card>
                  );
                })}
          </div>
        </Card>
      </div>

      {/* Chat area */}
      <Card className="flex-1 flex flex-col p-4">
        {selectedRoom ? (
          <>
            <div className="border-b pb-4 mb-4">
              <div className="flex items-center gap-3">
                <Avatar />
                <div>
                  <h3 className="font-medium">
                    Chat with {getOtherUser(selectedRoom)?.first_name}{" "}
                    {getOtherUser(selectedRoom)?.last_name}
                  </h3>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto mb-4 space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${
                    msg.sender_id === user?.id ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[70%] ${
                      msg.sender_id === user?.id
                        ? "bg-blue-500 text-white"
                        : "bg-gray-100"
                    } p-3 rounded-lg`}
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
            {user.role === "patient"
              ? "Select a doctor to start chatting"
              : "Select a chat to start messaging"}
          </div>
        )}
      </Card>
    </div>
  );
}
