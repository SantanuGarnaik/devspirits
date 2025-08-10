import GoogleProvider from "next-auth/providers/google";
import { MongoDBAdapter } from "@next-auth/mongodb-adapter";
import clientPromise, { getTestDatabase } from "@/lib/mongodb";

export const authOptions = {
  adapter: MongoDBAdapter(clientPromise, { dbName: "test" }),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile, credentials }) {
      const db = await getTestDatabase();
      const existingUser = await db.collection("users").findOne({ email: user.email });

      if (existingUser) {
        if (existingUser.googleId === account.providerAccountId) {
          await db.collection("accounts").updateOne(
            { providerAccountId: account.providerAccountId, provider: account.provider },
            {
              $set: {
                userId: existingUser._id.toString(),
                ...account,
              },
            },
            { upsert: true }
          );
          return { ...user, id: existingUser._id.toString(), callbackUrl: "/dashboard" };
        }
        return false; // OAuthAccountNotLinked
      }

      const result = await db.collection("users").updateOne(
        { email: user.email },
        {
          $set: {
            name: user.name,
            email: user.email,
            image: user.image,
            googleId: account.providerAccountId,
            lastLogin: new Date(),
            verified: true,
          },
        },
        { upsert: true }
      );

      const userId = result.upsertedId?.toString() || `user_${Date.now()}`;
      await db.collection("accounts").insertOne({ userId, ...account });
      return { ...user, id: userId, callbackUrl: "/dashboard" };
    },
    async jwt({ token, user, account }) {
      if (account && account.access_token) {
        token.accessToken = account.access_token;
        token.id = user?.id || token.id;
        token.name = user?.name || token.name;
        token.email = user?.email || token.email;
        token.picture = user?.image || token.picture;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.name = token.name;
        session.user.email = token.email;
        session.user.image = token.picture;
        session.accessToken = token.accessToken;
      }
      return session;
    },
  },
  secret: process.env.JWT_SECRET || "a-very-secure-random-secret-key-change-me",
  jwt: {
    secret: process.env.JWT_SECRET || "a-very-secure-random-secret-key-change-me",
    maxAge: 30 * 24 * 60 * 60,
  },
  pages: {
    signIn: "/login",
    error: "/login?error=OAuthAccountNotLinked",
  },
};
