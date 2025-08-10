// import { getServerSession, signOut } from "next-auth/next";
// import { NextResponse } from "next/server";
// import { authOptions } from "@/lib/auth";

// export async function POST(req) {
//   try {
//     console.log("Logout request received");
//     const session = await getServerSession(authOptions);

//     if (!session) {
//       console.log("No active session found, redirecting to login");
//       const response = NextResponse.json(
//         { message: "No active session" },
//         { status: 200 }
//       );
//       response.headers.set("Location", "/login");
//       response.status = 302;
//       return response;
//     }

//     console.log("Active session found, attempting to sign out");
//     // Attempt to sign out the session
//     await signOut({ redirect: false, callbackUrl: "/login" });
//     console.log("Sign-out completed");

//     // Clear any custom token cookie if used
//     const response = NextResponse.json(
//       { message: "Logout successful" },
//       { status: 200 }
//     );
//     response.cookies.set("token", "", {
//       path: "/",
//       expires: new Date(0),
//       httpOnly: true,
//       secure: process.env.NODE_ENV === "production",
//       sameSite: "strict",
//     });

//     // Redirect to login page
//     response.headers.set("Location", "/login");
//     response.status = 302;

//     return response;
//   } catch (error) {
//     console.error("❌ Logout API error:", error.message, error.stack);
//     return NextResponse.json(
//       { error: "Internal server error", details: error.message },
//       { status: 500 }
//     );
//   }
// }


// src/app/api/logout/route.js
// src/app/api/logout/route.js
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const response = NextResponse.redirect(new URL('/login', process.env.NEXTAUTH_URL || 'http://localhost:3000'), 302);

    // Clear the NextAuth session cookies
    response.cookies.set('authjs.session-token', '', {
      path: '/',
      expires: new Date(0),
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    response.cookies.set('__Secure-authjs.session-token', '', {
      path: '/',
      expires: new Date(0),
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    // Clear any custom token cookie if used
    response.cookies.set('token', '', {
      path: '/',
      expires: new Date(0),
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    console.log('Logout successful, redirecting to /login');
    return response;
  } catch (error) {
    console.error('❌ Logout API error:', error.message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}