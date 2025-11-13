"use client";

import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from "next/image";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white text-black flex flex-col">
      {/* Hero Section */}
      <section className="bg-green-50 py-20">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-10 px-4">
          {/* Text */}
          <div className="flex-1 text-center md:text-left space-y-6">
            <h1 className="text-4xl md:text-5xl font-bold">
              Welcome to TeleMed
            </h1>
            <p className="text-lg md:text-xl text-gray-700">
              Your all-in-one telemedicine platform. Chat, video call, and book
              appointments with ease.
            </p>
            <div className="flex justify-center md:justify-start gap-4 flex-wrap">
              <Link href="/chat">
                <Button className="bg-black text-white hover:bg-gray-800">
                  Chat
                </Button>
              </Link>
              <Link href="/video">
                <Button className="bg-black text-white hover:bg-gray-800">
                  Video
                </Button>
              </Link>
              <Link href="/booking">
                <Button className="bg-black text-white hover:bg-gray-800">
                  Book Appointment
                </Button>
              </Link>
            </div>
          </div>

          {/* Hero Image */}
          <div className="flex-1">
            <Image
              src="https://images.unsplash.com/photo-1535914254981-b5012eebbd15?q=80&w=870&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
              alt="Telemedicine Illustration"
              width={500}
              height={400}
              className="mx-auto"
            />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8 px-4">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle>Instant Chat</CardTitle>
              <CardDescription>
                Communicate with doctors in real-time through secure messaging.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Ask questions and get responses quickly without leaving your
                home.
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle>Video Consultations</CardTitle>
              <CardDescription>
                Have face-to-face video consultations with healthcare
                professionals.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                High quality and secure video calls for a professional
                experience.
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle>Book Appointments</CardTitle>
              <CardDescription>
                Schedule your appointments easily with available time slots.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Manage your health with our intuitive booking system.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Banner Section */}
      <section className="bg-green-50 py-20">
        <div className="max-w-6xl mx-auto text-center px-4">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Telemedicine Made Simple
          </h2>
          <p className="text-gray-700 mb-8">
            Access healthcare from anywhere with just a few clicks.
          </p>
          <Image
            src="https://images.unsplash.com/photo-1543362905-bddfadc3d44f?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1yZWxhdGVkfDV8fHxlbnwwfHx8fHw%3D"
            alt="Telemedicine Illustration"
            width={600}
            height={400}
            className="mx-auto"
          />
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black text-white mt-auto">
        <div className="max-w-6xl mx-auto py-8 px-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <span>© 2025 TeleMed. All rights reserved.</span>
          <div className="flex gap-6">
            <Link href="/chat" className="hover:underline">
              Chat
            </Link>
            <Link href="/video" className="hover:underline">
              Video
            </Link>
            <Link href="/booking" className="hover:underline">
              Booking
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
