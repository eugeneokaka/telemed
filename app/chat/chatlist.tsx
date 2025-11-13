"use client";

import { createClient } from "@/utils/supabase/client";
import { Card } from "@/components/ui/card";

export default function ChatList({ patients, currentUser, onSelectChat }: any) {
  const supabase = createClient();
  const startChat = async (patient: any) => {
    // Check if chat already exists
    const { data: existing } = await supabase
      .from("chat_rooms")
      .select("*")
      .or(`patient_id.eq.${currentUser.id},doctor_id.eq.${currentUser.id}`)
      .or(`patient_id.eq.${patient.id},doctor_id.eq.${patient.id}`)
      .limit(1);

    let chatRoom;
    if (existing && existing.length > 0) {
      chatRoom = existing[0];
    } else {
      const { data, error } = await supabase
        .from("chat_rooms")
        .insert([{ patient_id: currentUser.id, doctor_id: patient.id }])
        .select()
        .single();

      if (error) {
        console.error(error);
        return;
      }
      chatRoom = data;
    }

    onSelectChat(chatRoom);
  };

  return (
    <div className="space-y-2">
      {patients.map((patient: any) => (
        <Card
          key={patient.id}
          onClick={() => startChat(patient)}
          className="p-3 cursor-pointer hover:bg-gray-100 transition"
        >
          <p className="font-medium">
            {patient.first_name} {patient.last_name}
          </p>
          <p className="text-sm text-gray-500">{patient.gender}</p>
        </Card>
      ))}
    </div>
  );
}
