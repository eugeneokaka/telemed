"use server";

import { createClient } from "@/utils/supabase/server";

export async function signup(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const first_name = formData.get("first_name") as string;
  const last_name = formData.get("last_name") as string;
  const age = Number(formData.get("age"));
  const gender = formData.get("gender") as string;
  const role = formData.get("role") as string;

  // ✅ Create user account
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (signUpError) {
    return { error: signUpError.message };
  }

  const user = signUpData.user;
  if (!user) {
    return { error: "Failed to create user. Try again." };
  }

  // ✅ Insert into users table
  const { error: insertError } = await supabase.from("users").insert([
    {
      id: user.id,
      first_name,
      last_name,
      age,
      gender,
      role,
      onboarded: false,
    },
  ]);

  if (insertError) {
    return { error: insertError.message };
  }

  // ✅ Auto login
  const { error: loginError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (loginError) {
    return { error: loginError.message };
  }

  return { success: true };
}
