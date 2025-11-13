"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import type { User } from "@supabase/supabase-js";
import { Menu, X } from "lucide-react";

export default function Navbar() {
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
    };

    getUser();

    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      getUser();
    });

    return () => listener.subscription.unsubscribe();
  }, [supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setMenuOpen(false);
  };

  const navLinks = (
    <>
      <Link href="/chat" className="hover:underline">
        Chat
      </Link>
      <Link href="/video" className="hover:underline">
        Video
      </Link>
      <Link href="/bookings" className="hover:underline">
        Booking
      </Link>
      <Link
        href="/dashboard
      "
        className="hover:underline"
      >
        Dashboard
      </Link>
    </>
  );

  return (
    <nav className="w-full bg-white shadow p-4 flex items-center justify-between relative">
      {/* Logo */}
      <Link href="/" className="text-xl font-bold">
        TeleMed
      </Link>

      {/* Desktop Links */}
      <div className="hidden md:flex items-center gap-6">
        {navLinks}

        {!user ? (
          <Link href="/login" className="hover:underline">
            Login
          </Link>
        ) : (
          <div className="flex items-center gap-4">
            <span className="text-gray-700 text-sm">{user.email}</span>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800"
            >
              Logout
            </button>
          </div>
        )}
      </div>

      {/* Mobile Menu Button */}
      <div className="md:hidden flex items-center">
        <button onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Dropdown */}
      {menuOpen && (
        <div className="absolute top-16 right-4 bg-white shadow-md rounded p-4 flex flex-col gap-3 md:hidden">
          {navLinks}
          {!user ? (
            <Link
              href="/login"
              className="px-4 py-2 bg-black text-white rounded text-center"
              onClick={() => setMenuOpen(false)}
            >
              Login
            </Link>
          ) : (
            <div className="flex flex-col gap-2">
              <span className="text-gray-700 text-sm">{user.email}</span>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-black text-white rounded"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
