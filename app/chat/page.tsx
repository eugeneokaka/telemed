"use client";

import { useEffect, useState, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { useRouter } from "next/navigation";

const supabase = createClient();

type User = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  role: "doctor" | "patient" | "admin";
};

type Message = {
  id: string;
  message: string;
  patientid: string;
  doctorid: string;
  created_at: string;
  sender_id?: string;
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

  const router = useRouter();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const { data: authData } = await supabase.auth.getUser();
        const authUser = authData.user;
        if (!authUser) return setLoading(false);

        const { data: profile } = await supabase
          .from("users")
          .select("*")
          .eq("id", authUser.id)
          .single();

        if (!profile) throw new Error("User not found");
        setUser(profile);

        const { data: allUsers } = await supabase.from("users").select("*");
        let filteredUsers = allUsers || [];

        if (profile.role === "patient") {
          filteredUsers = filteredUsers.filter((u) => u.role === "doctor");
        } else if (profile.role === "doctor" || profile.role === "admin") {
          filteredUsers = filteredUsers.filter((u) => u.id !== profile.id);
        }

        setUserList(filteredUsers);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

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
      console.error(err);
    }
  };

  useEffect(() => {
    if (!user || !selectedUser) return;

    const channel = supabase
      .channel("message-listener")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "message" },
        (payload) => {
          const newMsg = payload.new as Message;

          const isRelevant =
            (newMsg.patientid === user.id &&
              newMsg.doctorid === selectedUser.id) ||
            (newMsg.doctorid === user.id &&
              newMsg.patientid === selectedUser.id);

          if (isRelevant) setMessages((prev) => [...prev, newMsg]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, selectedUser?.id]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !user || !selectedUser) return;
    setIsSending(true);

    try {
      await supabase.from("message").insert({
        message: newMessage.trim(),
        patientid: user.role === "patient" ? user.id : selectedUser.id,
        doctorid: user.role === "doctor" ? user.id : selectedUser.id,
        sender_id: user.id,
      });

      setNewMessage("");
    } catch (err) {
      console.error(err);
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
    <div className="flex flex-col md:flex-row h-screen gap-4 p-2 md:p-6">
      {/* User List */}
      {/* User List */}
      <div className="w-full md:w-1/4 md:overflow-y-auto flex md:flex-col gap-3 overflow-x-auto pb-2">
        {userList.map((u) => (
          <Card
            key={u.id}
            className="p-4 cursor-pointer hover:shadow-md min-w-[220px] md:min-w-0"
            onClick={() => loadMessages(u)}
          >
            <div className="flex items-center gap-4">
              <Avatar className="h-10 w-10" />
              <p className="text-base md:text-lg font-medium">
                {u.role === "doctor" ? "Dr. " : ""}
                {u.first_name} {u.last_name}
              </p>
            </div>
          </Card>
        ))}
      </div>

      {/* Chat Window */}
      <div className="flex-1 flex flex-col border rounded-lg p-3 md:p-4">
        {selectedUser ? (
          <>
            <div className="flex justify-between items-center mb-3 border-b pb-2">
              <h2 className="text-base md:text-lg font-semibold">
                Chat with {selectedUser.role === "doctor" ? "Dr. " : ""}
                {selectedUser.first_name} {selectedUser.last_name}
              </h2>
            </div>

            <div className="flex-1 overflow-y-auto mb-4 space-y-2 px-1 md:px-2">
              {messages.map((msg) => {
                const isOwnMessage = msg.sender_id === user?.id;

                return (
                  <div
                    key={msg.id}
                    className={`flex w-full ${
                      isOwnMessage ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[80%] md:max-w-[75%] p-3 break-words shadow-sm rounded-2xl
                      ${
                        isOwnMessage
                          ? "bg-blue-500 text-white rounded-br-none rounded-tl-2xl"
                          : "bg-gray-200 text-gray-800 rounded-bl-none rounded-tr-2xl"
                      }`}
                    >
                      <p className="text-sm md:text-base">{msg.message}</p>
                      <p
                        className={`text-[10px] md:text-xs opacity-60 mt-1 ${
                          isOwnMessage ? "text-right" : "text-left"
                        }`}
                      >
                        {formatDistanceToNow(new Date(msg.created_at), {
                          addSuffix: true,
                        })}
                      </p>
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
                className="text-sm md:text-base"
              />
              <Button
                onClick={sendMessage}
                disabled={isSending}
                className="text-sm md:text-base"
              >
                {isSending ? "Sending..." : "Send"}
              </Button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex justify-center items-center text-gray-500 text-sm md:text-base">
            Select a user to start chatting
          </div>
        )}
      </div>
    </div>
  );
}
