"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

type BookingType = {
  id: string;
  user_id: string;
  scheduled_date: string;
  time_slot: string;
  status: string;
  reason: string | null;
  notes: string | null;
  created_at: string;
  user?: {
    first_name: string | null;
    last_name: string | null;
  } | null;
};

export default function UserBookings() {
  const supabase = createClient();
  const [bookings, setBookings] = useState<BookingType[]>([]);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const fetchBookings = async () => {
      setLoading(true);

      // Get logged-in user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        console.error("User not logged in");
        setLoading(false);
        return;
      }

      // Fetch role from public.users
      const { data: profile, error: profileError } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profileError) {
        console.error("Error fetching user role:", profileError);
      }

      const userRole = profile?.role ?? "patient";
      setRole(userRole);

      let data, error;

      if (userRole === "doctor") {
        // Doctor sees ALL bookings + user info
        const result = await supabase
          .from("bookings")
          .select(
            `*,
            user:users (
              first_name,
              last_name
            )`
          )
          .order("scheduled_date", { ascending: true });

        data = result.data;
        error = result.error;
      } else {
        // Patient sees only their bookings
        const result = await supabase
          .from("bookings")
          .select("*")
          .eq("user_id", user.id)
          .order("scheduled_date", { ascending: true });

        data = result.data;
        error = result.error;
      }

      if (error) {
        console.error("Error fetching bookings:", error);
      } else {
        setBookings(data as BookingType[]);
      }

      setLoading(false);
    };

    fetchBookings();
  }, []);

  if (loading) return <p>Loading bookings...</p>;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">
        {role === "doctor" ? "All Bookings" : "Your Bookings"}
      </h2>

      {bookings.length === 0 && (
        <p className="text-gray-500">No bookings found.</p>
      )}

      {bookings.map((b) => (
        <div
          key={b.id}
          className="border rounded p-3 shadow-sm bg-white space-y-1"
        >
          {role === "doctor" && (
            <p>
              <strong>Booked By:</strong> {b.user?.first_name}{" "}
              {b.user?.last_name}
            </p>
          )}

          <p>
            <strong>Date:</strong> {b.scheduled_date}
          </p>
          <p>
            <strong>Time Slot:</strong> {b.time_slot}
          </p>
          <p>
            <strong>Status:</strong> {b.status}
          </p>

          {b.reason && (
            <p>
              <strong>Reason:</strong> {b.reason}
            </p>
          )}

          {b.notes && (
            <p>
              <strong>Notes:</strong> {b.notes}
            </p>
          )}

          <p className="text-sm text-gray-400">
            Created: {new Date(b.created_at).toLocaleString()}
          </p>
        </div>
      ))}
    </div>
  );
}
