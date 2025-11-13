// "use client";

// import { useState, useEffect } from "react";
// import { createClient } from "@/utils/supabase/client";
// import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
// import { Input } from "@/components/ui/input";
// import { Button } from "@/components/ui/button";
// import { Avatar, AvatarFallback } from "@/components/ui/avatar";
// import { toast } from "sonner";

// // ✅ Local TS types
// interface UserRow {
//   id: string;
//   first_name: string | null;
//   last_name: string | null;
//   age: number | null;
//   gender: string | null;
//   role: "doctor" | "patient" | "admin";
// }

// interface MessageRow {
//   id: string;
//   room_id: string;
//   sender_id: string;
//   message: string | null;
//   created_at: string;
// }

// interface ChatRoomRow {
//   id: string;
//   doctor_id: string;
//   patient_id: string;
// }

// export default function ChatPage() {
//   const supabase = createClient();

//   const [user, setUser] = useState<UserRow | null>(null);
//   const [doctors, setDoctors] = useState<UserRow[]>([]);
//   const [selectedDoctor, setSelectedDoctor] = useState<UserRow | null>(null);
//   const [roomId, setRoomId] = useState<string | null>(null);
//   const [messages, setMessages] = useState<MessageRow[]>([]);
//   const [newMessage, setNewMessage] = useState("");

//   // ✅ Load logged-in user
//   useEffect(() => {
//     async function loadUser() {
//       const { data } = await supabase.auth.getUser();
//       if (data?.user) {
//         const { id } = data.user;
//         const { data: profile } = await supabase
//           .from("users")
//           .select("*")
//           .eq("id", id)
//           .maybeSingle();

//         setUser(profile as UserRow | null);
//       }
//     }
//     loadUser();
//   }, []);

//   // ✅ Load doctors
//   useEffect(() => {
//     async function loadDoctors() {
//       const { data, error } = await supabase
//         .from("users")
//         .select("id, first_name, last_name, role, age, gender")
//         .eq("role", "doctor");

//       if (error) toast.error(error.message);
//       else setDoctors(data as UserRow[]);
//     }
//     loadDoctors();
//   }, []);

//   // ✅ When a doctor is selected, get or create chat room
//   async function startChat(doc: UserRow) {
//     if (!user) return toast.error("You must be logged in.");

//     const { data: existing } = await supabase
//       .from("chat_rooms")
//       .select("id, doctor_id, patient_id")
//       .eq("doctor_id", doc.id)
//       .eq("patient_id", user.id)
//       .maybeSingle();

//     let room: string | null = existing ? existing.id : null;

//     if (!room) {
//       const { data, error } = await supabase
//         .from("chat_rooms")
//         .insert({ doctor_id: doc.id, patient_id: user.id })
//         .select("id")
//         .single();

//       if (error) return toast.error(error.message);
//       room = data.id;
//     }

//     setSelectedDoctor(doc);
//     setRoomId(room);
//     loadMessages(room!);
//   }

//   // ✅ Load messages for a room
//   async function loadMessages(room: string) {
//     const { data, error } = await supabase
//       .from("messages")
//       .select("*")
//       .eq("room_id", room)
//       .order("created_at", { ascending: true });

//     if (error) toast.error(error.message);
//     else setMessages(data as MessageRow[]);
//   }

//   // ✅ Send message
//   async function sendMessage() {
//     if (!newMessage.trim() || !roomId || !user) return;

//     const { error } = await supabase.from("messages").insert({
//       room_id: roomId,
//       sender_id: user.id,
//       message: newMessage,
//     });

//     if (error) return toast.error(error.message);

//     setNewMessage("");
//     loadMessages(roomId);
//   }

//   return (
//     <div className="flex h-screen p-4 gap-4">
//       <Card className="w-1/3 h-full overflow-y-auto">
//         <CardHeader>
//           <CardTitle>Doctors</CardTitle>
//         </CardHeader>
//         <CardContent>
//           {doctors.map((doc) => (
//             <div
//               key={doc.id}
//               className="flex items-center p-3 mb-2 rounded hover:bg-slate-100 cursor-pointer"
//               onClick={() => startChat(doc)}
//             >
//               <Avatar className="mr-3">
//                 <AvatarFallback>{doc.first_name?.charAt(0)}</AvatarFallback>
//               </Avatar>
//               <p className="font-medium">
//                 {doc.first_name} {doc.last_name}
//               </p>
//             </div>
//           ))}
//         </CardContent>
//       </Card>

//       <Card className="flex-1 h-full flex flex-col">
//         <CardHeader>
//           <CardTitle>
//             {selectedDoctor
//               ? `Chat with Dr. ${selectedDoctor.first_name}`
//               : "Select a doctor"}
//           </CardTitle>
//         </CardHeader>

//         <CardContent className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
//           {messages.map((m) => (
//             <div
//               key={m.id}
//               className={`p-2 rounded max-w-sm ${
//                 m.sender_id === user?.id
//                   ? "bg-blue-500 text-white ml-auto"
//                   : "bg-white text-gray-900"
//               }`}
//             >
//               {m.message}
//             </div>
//           ))}
//         </CardContent>

//         {selectedDoctor && (
//           <div className="p-3 border-t flex gap-2">
//             <Input
//               placeholder="Type a message..."
//               value={newMessage}
//               onChange={(e) => setNewMessage(e.target.value)}
//               className="flex-1"
//             />
//             <Button onClick={sendMessage}>Send</Button>
//           </div>
//         )}
//       </Card>
//     </div>
//   );
// }
