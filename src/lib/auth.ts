import { getServerSession, type NextAuthOptions } from "next-auth"
import Google from "next-auth/providers/google"
import { prisma } from "@/lib/db"

const googleClientId = process.env.GOOGLE_CLIENT_ID
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET
const nextAuthSecret = process.env.NEXTAUTH_SECRET

console.log("[AUTH] GOOGLE_CLIENT_ID loaded:", !!googleClientId)
console.log("[AUTH] GOOGLE_CLIENT_SECRET loaded:", !!googleClientSecret)
console.log("[AUTH] NEXTAUTH_SECRET loaded:", !!nextAuthSecret)

export const authOptions: NextAuthOptions = {
  secret: nextAuthSecret,
  providers: [
    Google({
      clientId: googleClientId ?? "",
      clientSecret: googleClientSecret ?? "",
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async signIn({ user }) {
      if (!user.email) return false
      const dbUser = await prisma.user.upsert({
        where: { email: user.email },
        update: {
          name: user.name ?? undefined,
          image: user.image ?? undefined,
        },
        create: {
          email: user.email,
          name: user.name ?? null,
          image: user.image ?? null,
        },
      })
      ;(user as any).id = dbUser.id
      return true
    },
    async jwt({ token, user }) {
      if (user) {
        token.userId = (user as any).id
      }
      return token
    },
    async session({ session, token }) {
      if (session.user && token.userId) {
        ;(session.user as any).id = token.userId
      }
      return session
    },
  },
}

export function auth() {
  return getServerSession(authOptions)
}
