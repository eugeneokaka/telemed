"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";

// ✅ LOGIN ACTION
export async function login(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email and password are required" };
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/", "layout");
  return { success: true };
}

// ✅ SIGNUP ACTION
export async function signup(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const first_name = formData.get("first_name") as string;
  const last_name = formData.get("last_name") as string;
  const age = Number(formData.get("age"));
  const gender = formData.get("gender") as string;
  const role = formData.get("role") as string;

  if (password.length < 6) {
    return { error: "Password must be at least 6 characters long" };
  }

  // Create Supabase auth user
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (signUpError) {
    return { error: signUpError.message };
  }

  const user = signUpData.user;
  if (!user) {
    return { error: "Something went wrong. Please try again." };
  }

  // Insert metadata
  const { data, error: insertError } = await supabase.from("users").insert([
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
  console.log(data);

  if (insertError) {
    return { error: insertError.message };
  }

  // Auto login
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError) {
    return { error: signInError.message };
  }

  revalidatePath("/", "layout");
  return { success: true };
}
