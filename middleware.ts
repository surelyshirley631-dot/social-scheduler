import { NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"

const PUBLIC_PREFIXES = ["/api/auth", "/api/oauth"]

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  for (const p of PUBLIC_PREFIXES) {
    if (pathname.startsWith(p)) {
      return NextResponse.next()
    }
  }

  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  })

  if (!token) {
    const signinUrl = new URL("/api/auth/signin", req.url)
    signinUrl.searchParams.set("callbackUrl", req.nextUrl.pathname)
    return NextResponse.redirect(signinUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/dashboard/:path*", "/api/:path*"],
}

