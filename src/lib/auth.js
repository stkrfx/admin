import CredentialsProvider from 'next-auth/providers/credentials';
import { connectMongo } from '@/lib/db';
import User from '@/lib/models/User';
import bcrypt from 'bcryptjs';
import { limitKey } from '@/lib/rateLimiter';

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const { email, password } = credentials;
        
        // 1. Rate Limiting
        const key = `rl:signin:${email}`;
        const rl = await limitKey(key);
        if (!rl.success) throw new Error('Too many requests. Try again later.');

        await connectMongo();

        // 2. Find Admin User
        const user = await User.findOne({ 
          email: email.toLowerCase(),
          role: 'admin' 
        }).select('+password +forcePasswordChange'); // Ensure we get these fields

        if (!user) return null;

        // 3. Verify Password
        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) return null;
        
        if (user.isBanned) throw new Error("Account suspended");

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
          image: user.photo,
          forcePasswordChange: user.forcePasswordChange, // Critical for the middleware check
        };
      },
    }),
  ],
  session: { strategy: 'jwt' },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.forcePasswordChange = user.forcePasswordChange;
      }
      // Allow the client to update the session (e.g., after password change)
      if (trigger === "update" && session?.forcePasswordChange !== undefined) {
        token.forcePasswordChange = session.forcePasswordChange;
      }
      return token;
    },
    async session({ session, token }) {
      if (session?.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.forcePasswordChange = token.forcePasswordChange;
      }
      return session;
    },
  },
  pages: { signIn: '/login' },
  secret: process.env.NEXTAUTH_SECRET,
};