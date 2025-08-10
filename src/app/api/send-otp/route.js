import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import clientPromise from "@/lib/mongodb";

export async function POST(req) {
  const { email } = await req.json();
  if (!email) {
    return NextResponse.json({ message: "Email is required" }, { status: 400 });
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

  const client = await clientPromise;
  const db = client.db("interviewprep");

  try {
    await db.collection("otps").updateOne(
      { email },
      { $set: { otp, expires }, $setOnInsert: { createdAt: new Date() } },
      { upsert: true }
    );
    console.log(`Stored OTP for ${email} at ${new Date().toISOString()}: { otp: ${otp}, expires: ${expires.toISOString()} }`);

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: email,
      subject: "Your OTP for Login",
      text: `Your OTP is ${otp}. It is valid for 10 minutes. Do not share it with anyone.`,
    };

    await transporter.sendMail(mailOptions);
    return NextResponse.json({ message: "OTP stored and email sent successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error sending OTP:", error);
    await db.collection("otps").deleteOne({ email }); // Clean up on failure
    return NextResponse.json({ message: "Failed to send OTP" }, { status: 500 });
  }
}