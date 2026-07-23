import NextAuth from "next-auth";
import GithubProvider from "next-auth/providers/github";
// import EmailProvider from "next-auth/providers/email";
import User from "@/models/user";
import ConnectDb from "@/lib/mongodb";

export const authOptions = {
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_ID,
      clientSecret: process.env.GITHUB_SECRET,
      authorization: {
        params: {
          scope: "read:user user:email repo",
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      try {
        if (!user?.email) return false;

        if (account?.provider === "github") {
          await ConnectDb();

          await User.findOneAndUpdate(
            { email: user.email },
            {
              name: user.name || user.email.split("@")[0],
              email: user.email,
              username: user.email.split("@")[0],
              profilepic: user.image || "",
              githubId: account.providerAccountId,
              githubAccessToken: account.access_token,
            },
            {
              upsert: true,
              new: true,
            }
          );
        }

        return true;
      } catch (error) {
        console.error("[auth.signIn]", error);
        return false;
      }
    },

    async jwt({ token }) {
      if (token.email) {
        await ConnectDb();

        const dbUser = await User.findOne({
          email: token.email,
        });

        if (dbUser) {
          token.id = dbUser._id.toString();
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
      }
      return session;
    },
  },
};
const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };