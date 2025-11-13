"use client";

import { useEffect, useState, useRef } from "react";
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
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Fetch current user + user list
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const { data: authData, error: authError } =
          await supabase.auth.getUser();
        if (authError) throw authError;

        const authUser = authData.user;
        if (!authUser) return setLoading(false);

        const { data: profile } = await supabase
          .from("users")
          .select("*")
          .eq("id", authUser.id)
          .single();
        if (!profile) throw new Error("User profile not found.");
        setUser(profile);

        const { data: allUsers } = await supabase
          .from("users")
          .select("*")
          .returns<User[]>();
        let filteredUsers: User[] = allUsers || [];

        // Only show doctors for patients, exclude self for doctors/admin
        if (profile.role === "patient") {
          filteredUsers = filteredUsers.filter((u) => u.role === "doctor");
        } else if (profile.role === "doctor" || profile.role === "admin") {
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

  // Load messages between logged-in user & selected user
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

  // Subscribe to new messages
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

  // Send a message
  const sendMessage = async () => {
    if (!newMessage.trim() || !user || !selectedUser) return;
    setIsSending(true);

    const isPatient = user.role === "patient";

    try {
      await supabase.from("message").insert({
        message: newMessage.trim(),
        patientid:
          isPatient || user.role === "admin" ? user.id : selectedUser.id,
        doctorid: isPatient
          ? selectedUser.id
          : user.role === "admin"
          ? selectedUser.id
          : user.id,
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
        {userList.map((u) => {
          // Show all users if logged-in user is a doctor
          if (user?.role === "doctor" || u.role === "doctor") {
            return (
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
            );
          }
          return null;
        })}
      </div>

      {/* Chat Window */}
      <div className="flex-1 flex flex-col border rounded-lg p-4">
        {selectedUser ? (
          <>
            <h2 className="mb-4 border-b pb-2 text-lg font-semibold">
              Chat with {selectedUser.role === "doctor" ? "Dr. " : ""}
              {selectedUser.first_name} {selectedUser.last_name}
            </h2>

            <div className="flex-1 overflow-y-auto mb-4 space-y-2 px-2">
              {messages.map((msg) => {
                const isOwnMessage =
                  (user?.role === "patient" && msg.patientid === user?.id) ||
                  (user?.role === "doctor" && msg.doctorid === user?.id) ||
                  (user?.role !== "doctor" && msg.patientid === user?.id); // admin aligned like patient

                return (
                  <div
                    key={msg.id}
                    className={`flex ${
                      isOwnMessage ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-xs md:max-w-md p-3 rounded-lg break-words ${
                        isOwnMessage
                          ? "bg-blue-500 text-white rounded-br-none"
                          : "bg-gray-200 text-gray-800 rounded-bl-none"
                      }`}
                    >
                      {msg.message}
                      <div className="text-xs opacity-60 mt-1 text-right">
                        {formatDistanceToNow(new Date(msg.created_at), {
                          addSuffix: true,
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
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
