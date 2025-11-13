"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

const supabase = createClient();

const TIME_SLOTS = [
  "SLOT_09_10",
  "SLOT_10_11",
  "SLOT_11_12",
  "SLOT_12_13",
  "SLOT_14_15",
];

export default function BookingPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [date, setDate] = useState("");
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState("");
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Check user login
  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUserId(user?.id ?? null);
    };

    fetchUser();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUserId(session?.user?.id ?? null);
      }
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  // Fetch available slots for selected date
  useEffect(() => {
    if (!date) return;

    const fetchAvailableSlots = async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select("time_slot")
        .eq("scheduled_date", date);

      if (error) {
        setError("Failed to fetch slots");
        return;
      }

      const bookedSlots = data.map((b: any) => b.time_slot);
      setAvailableSlots(TIME_SLOTS.filter((s) => !bookedSlots.includes(s)));
    };

    fetchAvailableSlots();
  }, [date]);

  const handleBooking = async () => {
    if (!userId) return setError("You must be logged in to book");
    if (!date || !selectedSlot)
      return setError("Please select date and timeslot");

    setLoading(true);
    setError("");

    try {
      const { error } = await supabase.from("bookings").insert([
        {
          user_id: userId,
          scheduled_date: date,
          time_slot: selectedSlot,
          reason,
          notes,
        },
      ]);

      setLoading(false);

      if (error) setError(error.message);
      else {
        alert("Booking confirmed!");
        setDate("");
        setSelectedSlot("");
        setReason("");
        setNotes("");
        setAvailableSlots([]);
      }
    } catch {
      setLoading(false);
      setError("Something went wrong");
    }
  };

  if (!userId) {
    return (
      <div className="max-w-md mx-auto mt-10 p-6 text-center">
        <p className="text-red-500 font-semibold">
          Please log in to book an appointment.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-10">
      <Card>
        <CardHeader>
          <CardTitle>Book an Appointment</CardTitle>
          <CardDescription>
            Select a date and time slot to schedule your appointment.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && <p className="text-red-500">{error}</p>}

          <div className="space-y-2">
            <label>Select Date</label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label>Select Time Slot</label>
            <select
              value={selectedSlot}
              onChange={(e) => setSelectedSlot(e.target.value)}
              className="w-full border rounded p-2"
            >
              <option value="">-- Select a slot --</option>
              {availableSlots.map((s) => (
                <option key={s} value={s}>
                  {s.replace("SLOT_", "").replace("_", " - ")}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label>Reason (optional)</label>
            <Input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label>Notes (optional)</label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <Button
            onClick={handleBooking}
            disabled={loading || !selectedSlot}
            className="w-full bg-black text-white hover:bg-gray-800"
          >
            {loading ? "Booking..." : "Book Appointment"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
