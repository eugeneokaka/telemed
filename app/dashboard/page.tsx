"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";

interface Prescription {
  id: string;
  medication_name: string;
  dosage: string;
  instructions: string | null;
  issued_date: string | null;
  status: string | null;
  doctor_id: string | null;
  patient_id: string | null;
  doctor_name?: string;
  patient_name?: string;
}

export default function DashboardPage() {
  const supabase = createClient();
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const fetchPrescriptions = async () => {
      setLoading(true);
      // get current user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) {
        toast.error("Could not get user info");
        setLoading(false);
        return;
      }

      setUserId(user.id);

      // fetch role from users table
      const { data: userData, error: roleError } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .single();

      if (roleError || !userData) {
        toast.error("Could not get user role");
        setLoading(false);
        return;
      }

      setUserRole(userData.role);

      let query = supabase.from("prescriptions").select(`
          *,
          doctor_id (first_name, last_name),
          patient_id (first_name, last_name)
        `);

      if (userData.role === "doctor") {
        query = query.eq("doctor_id", user.id);
      } else if (userData.role === "patient") {
        query = query.eq("patient_id", user.id);
      }

      const { data, error } = await query.order("issued_date", {
        ascending: false,
      });

      if (error) {
        console.error(error);
        toast.error("Failed to fetch prescriptions");
      } else {
        const formatted: Prescription[] = (data || []).map((p: any) => ({
          ...p,
          doctor_name: `${p.doctor_id?.first_name ?? ""} ${
            p.doctor_id?.last_name ?? ""
          }`,
          patient_name: `${p.patient_id?.first_name ?? ""} ${
            p.patient_id?.last_name ?? ""
          }`,
        }));
        setPrescriptions(formatted);
      }

      setLoading(false);
    };

    fetchPrescriptions();
  }, []);

  return (
    <div className="max-w-5xl mx-auto mt-10">
      <Card>
        <CardHeader>
          <CardTitle>Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Loading prescriptions...</p>
          ) : prescriptions.length === 0 ? (
            <p>No prescriptions found.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Medication</TableHead>
                  <TableHead>Dosage</TableHead>
                  <TableHead>Instructions</TableHead>
                  <TableHead>Issued Date</TableHead>
                  {userRole === "doctor" && <TableHead>Patient</TableHead>}
                  {userRole === "patient" && <TableHead>Doctor</TableHead>}
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {prescriptions.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>{p.medication_name}</TableCell>
                    <TableCell>{p.dosage}</TableCell>
                    <TableCell>{p.instructions || "-"}</TableCell>
                    <TableCell>
                      {p.issued_date
                        ? new Date(p.issued_date).toLocaleDateString()
                        : "-"}
                    </TableCell>
                    {userRole === "doctor" && (
                      <TableCell>{p.patient_name}</TableCell>
                    )}
                    {userRole === "patient" && (
                      <TableCell>{p.doctor_name}</TableCell>
                    )}
                    <TableCell>{p.status}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
