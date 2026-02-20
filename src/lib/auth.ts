import { prisma } from "@/lib/db"

export type AppSession = {
  user: {
    id: string
    email: string | null
  }
}

export async function auth(): Promise<AppSession> {
  const email = "demo@example.com"
  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: { email },
  })
  return {
    user: {
      id: user.id,
      email: user.email,
    },
  }
}
