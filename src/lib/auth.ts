export type AppSession = {
  user: {
    id: string
    email: string | null
  }
}

export async function auth(): Promise<AppSession> {
  return {
    user: {
      id: "demo-user",
      email: "demo@example.com",
    },
  }
}
