import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  const url = new URL("/dashboard", req.url)
  return NextResponse.redirect(url)
}

export async function POST(req: NextRequest) {
  const url = new URL("/dashboard", req.url)
  return NextResponse.redirect(url)
}

export async function PUT() {
  return new NextResponse("Auth disabled", { status: 410 })
}

export async function DELETE() {
  return new NextResponse("Auth disabled", { status: 410 })
}
