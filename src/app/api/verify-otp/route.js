import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import clientPromise from "@/lib/mongodb";

export async function POST(req) {
  const { email, otp } = await req.json();
  const client = await clientPromise;
  const db = client.db("test");

  const session = await getServerSession(authOptions);
  if (session) {
    return NextResponse.json({ message: "Already logged in" }, { status: 400 });
  }

  const user = await db.collection("users").findOne({ email });
  if (!user || user.otp !== otp) {
    return NextResponse.json({ message: "Invalid OTP" }, { status: 400 });
  }

  // Simulate successful login by creating a session (use NextAuth signIn)
  await signIn("credentials", {
    email,
    callbackUrl: "/dashboard",
  });

  return NextResponse.json({ message: "Login successful" }, { status: 200 });
}