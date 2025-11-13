"use client";

import { useEffect, useState } from "react";
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
  age?: number | null;
  gender?: string | null;
  role: "doctor" | "patient" | "admin";
  created_at?: string;
  updated_at?: string;
  onboarded?: boolean;
};

type Message = {
  id: string;
  message: string;
  patientid: string;
  doctorid: string;
  created_at: string;
};

export default function ChatPage() {
  const [user, setUser] = useState<User | null>(null);
  const [userList, setUserList] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  // ✅ Fetch current user + users list
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      try {
        // 1. Get auth user
        const { data: authData, error: authError } =
          await supabase.auth.getUser();
        if (authError) throw authError;

        const authUser = authData.user;
        if (!authUser) return setLoading(false);

        // 2. Get profile
        const { data: profile } = await supabase
          .from("users")
          .select("*")
          .eq("id", authUser.id)
          .single();

        if (!profile) throw new Error("User profile not found.");
        setUser(profile);

        // 3. Fetch all users
        const { data: allUsers } = await supabase
          .from("users")
          .select("*")
          .returns<User[]>();

        // ✅ Use a mutable variable for filtering
        let filteredUsers: User[] = allUsers || [];

        // 4. Role-based filtering
        if (profile.role === "patient") {
          filteredUsers = filteredUsers.filter((u) => u.role === "doctor");
        } else if (profile.role === "doctor") {
          filteredUsers = filteredUsers.filter((u) => u.id !== profile.id);
        }

        setUserList(filteredUsers);
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // ✅ Load messages between logged-in user & selected user
  const loadMessages = async (otherUser: User) => {
    if (!user) return;

    setSelectedUser(otherUser);

    try {
      const { data } = await supabase
        .from("message")
        .select("*")
        .or(
          `and(patientid.eq.${user.id},doctorid.eq.${otherUser.id}),and(patientid.eq.${otherUser.id},doctorid.eq.${user.id})`
        )
        .order("created_at", { ascending: true });

      setMessages(data || []);
    } catch (err) {
      console.error("Error loading messages:", err);
    }
  };

  // ✅ Subscribe to new messages
  useEffect(() => {
    if (!user || !selectedUser) return;

    const channel = supabase
      .channel("message-listener")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "message" },
        (payload) => {
          const newMsg = payload.new as Message;

          const isBetween =
            (newMsg.patientid === user.id &&
              newMsg.doctorid === selectedUser.id) ||
            (newMsg.doctorid === user.id &&
              newMsg.patientid === selectedUser.id);

          if (isBetween) setMessages((prev) => [...prev, newMsg]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, selectedUser]);

  // ✅ Send a message
  const sendMessage = async () => {
    if (!newMessage.trim() || !user || !selectedUser) return;
    setIsSending(true);

    const isPatient = user.role === "patient";

    try {
      await supabase.from("message").insert({
        message: newMessage.trim(),
        patientid: isPatient ? user.id : selectedUser.id,
        doctorid: isPatient ? selectedUser.id : user.id,
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

  return (
    <div className="flex h-screen gap-6 p-6">
      {/* User List */}
      <div className="w-1/4 overflow-y-auto">
        {userList.map((u) => (
          <Card
            key={u.id}
            className="p-3 mb-2 cursor-pointer hover:shadow-md"
            onClick={() => loadMessages(u)}
          >
            <div className="flex items-center gap-3">
              <Avatar />
              <p>
                {u.role === "doctor" ? "Dr. " : ""}
                {u.first_name} {u.last_name}
              </p>
            </div>
          </Card>
        ))}
      </div>

      {/* Chat Window */}
      <div className="flex-1 flex flex-col">
        {selectedUser ? (
          <>
            <h2 className="mb-4 border-b pb-2">
              Chat with {selectedUser.role === "doctor" ? "Dr. " : ""}
              {selectedUser.first_name} {selectedUser.last_name}
            </h2>

            <div className="flex-1 overflow-y-auto mb-4 space-y-2">
              {messages.map((msg) => {
                const sentByUser =
                  (msg.patientid === user?.id && user.role === "patient") ||
                  (msg.doctorid === user?.id && user.role === "doctor");

                return (
                  <div
                    key={msg.id}
                    className={sentByUser ? "text-right" : "text-left"}
                  >
                    <div
                      className={`inline-block p-2 rounded ${
                        sentByUser ? "bg-blue-500 text-white" : "bg-gray-200"
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
                );
              })}
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
            Select a user to start chatting
          </div>
        )}
      </div>
    </div>
  );
}
