"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface User {
  id: string;
  first_name: string | null;
  last_name: string | null;
  role: string;
}

export default function CreatePrescriptionPage() {
  const supabase = createClient();
  const [firstNameSearch, setFirstNameSearch] = useState("");
  const [lastNameSearch, setLastNameSearch] = useState("");
  const [patients, setPatients] = useState<User[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<User | null>(null);
  const [drugName, setDrugName] = useState("");
  const [dosage, setDosage] = useState("");
  const [instructions, setInstructions] = useState("");
  const [loading, setLoading] = useState(false);

  // ✅ Search by first name
  const handleSearchByFirstName = async () => {
    if (!firstNameSearch.trim()) {
      toast.error("Enter a first name to search.");
      return;
    }

    const { data, error } = await supabase
      .from("users")
      .select("id, first_name, last_name, role")
      //   .eq("role", "patient")
      .ilike("first_name", `%${firstNameSearch.trim()}%`);

    //   .eq("role", "patient")
    //   .ilike("first_name", `${firstNameSearch}`);

    if (error) {
      console.error(error);
      toast.error("Error searching by first name.");
    } else {
      console.log(firstNameSearch);
      console.log(data);
      setPatients(data || []);
      if (data?.length === 0) toast("No patients found.");
    }
  };

  // ✅ Search by last name
  const handleSearchByLastName = async () => {
    if (!lastNameSearch.trim()) {
      toast.error("Enter a last name to search.");
      return;
    }

    const { data, error } = await supabase
      .from("users")
      .select("id, first_name, last_name, role")
      //   .eq("role", "patient")
      .ilike("last_name", `%${lastNameSearch}%`);

    if (error) {
      console.error(error);
      toast.error("Error searching by last name.");
    } else {
      setPatients(data || []);
      if (data?.length === 0) toast("No patients found.");
    }
  };

  // ✅ Create prescription
  const handleSubmit = async () => {
    if (!selectedPatient) {
      toast.error("Please select a patient.");
      return;
    }
    if (!drugName || !dosage) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error } = await supabase.from("prescriptions").insert([
      {
        doctor_id: user?.id,
        patient_id: selectedPatient.id,
        medication_name: drugName,
        dosage,
        instructions,
      },
    ]);

    setLoading(false);

    if (error) {
      console.error(error);
      toast.error("Failed to save prescription.");
    } else {
      toast.success("Prescription created successfully!");
      setSelectedPatient(null);
      setDrugName("");
      setDosage("");
      setInstructions("");
      setFirstNameSearch("");
      setLastNameSearch("");
      setPatients([]);
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-10 space-y-6">
      {/* Patient Search Section */}
      <Card>
        <CardHeader>
          <CardTitle>Search Patient</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <Label>First Name</Label>
              <Input
                placeholder="Enter first name"
                value={firstNameSearch}
                onChange={(e) => setFirstNameSearch(e.target.value)}
              />
            </div>
            <Button onClick={handleSearchByFirstName}>Search</Button>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex-1">
              <Label>Last Name</Label>
              <Input
                placeholder="Enter last name"
                value={lastNameSearch}
                onChange={(e) => setLastNameSearch(e.target.value)}
              />
            </div>
            <Button onClick={handleSearchByLastName}>Search</Button>
          </div>

          {patients.length > 0 && (
            <div className="border rounded mt-2 max-h-40 overflow-y-auto">
              {patients.map((p) => (
                <div
                  key={p.id}
                  onClick={() => setSelectedPatient(p)}
                  className={`p-2 cursor-pointer hover:bg-muted ${
                    selectedPatient?.id === p.id ? "bg-muted" : ""
                  }`}
                >
                  {p.first_name} {p.last_name}
                </div>
              ))}
            </div>
          )}

          {selectedPatient && (
            <p className="text-sm mt-2 text-muted-foreground">
              Selected: {selectedPatient.first_name} {selectedPatient.last_name}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Prescription Form Section */}
      <Card>
        <CardHeader>
          <CardTitle>Create Prescription</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Drug Name</Label>
            <Input
              placeholder="e.g. Amoxicillin"
              value={drugName}
              onChange={(e) => setDrugName(e.target.value)}
            />
          </div>

          <div>
            <Label>Dosage</Label>
            <Input
              placeholder="e.g. 500mg twice daily"
              value={dosage}
              onChange={(e) => setDosage(e.target.value)}
            />
          </div>

          <div>
            <Label>Instructions (optional)</Label>
            <Textarea
              placeholder="Add any special notes..."
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
            />
          </div>

          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Saving..." : "Create Prescription"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
