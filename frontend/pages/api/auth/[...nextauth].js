import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import FacebookProvider from "next-auth/providers/facebook";
import GithubProvider from "next-auth/providers/github";
import CredentialsProvider from "next-auth/providers/credentials";

export default NextAuth({
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
    }),
    GithubProvider({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // Call Django backend API for login with Djoser JWT
        const res = await fetch("http://localhost:8000/api/auth/jwt/create/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(credentials),
        });
        const data = await res.json();
        
        if (res.ok && data.access) {
          // Get user details using the token
          const userRes = await fetch("http://localhost:8000/api/auth/users/me/", {
            headers: {
              "Authorization": `JWT ${data.access}`,
              "Content-Type": "application/json",
            },
          });
          const user = await userRes.json();
          
          return {
            ...user,
            accessToken: data.access,
            refreshToken: data.refresh,
          };
        }
        return null;
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user,account,profile }) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
        token.accessToken = user.accessToken;
        token.refreshToken = user.refreshToken;
      }

      
      // For OAuth logins (Google, GitHub, Facebook)
      if (account && profile && !user?.accessToken) {
        try {
          // Send user data to Django backend to register/login
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/social_login/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: profile.email,
              first_name: profile.given_name || profile.name?.split(" ")[0],
              last_name: profile.family_name || profile.name?.split(" ")[1],
              provider: account.provider,
            }),
          });

          const backendUser = await res.json();

          token.id = backendUser.id;
          token.role = backendUser.role;
          token.verification_status = backendUser.verification_status;
        } catch (err) {
          console.error("Error syncing OAuth login with backend:", err);
        }
      }
      return token;
    },
    async session({ session, token }) {
      session.user.role = token.role;
      session.user.id = token.id;
      session.accessToken = token.accessToken;
      session.refreshToken = token.refreshToken;
      return session;
    },
  },
});
