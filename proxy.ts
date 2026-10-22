import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

/**
 * Prefissi di URL che richiedono l'autenticazione.
 * Corrispondono alle pagine dentro il route group /app/(dashboard).
 */
const PROTECTED_PREFIXES = [
  "/dashboard",
  "/transactions",
  "/reports",
  "/recurring",
  "/budgets",
  "/categories",
  "/settings",
]

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + "/")
  )
}

export async function proxy(request: NextRequest) {
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // Refresh della sessione se scaduta — necessario per Server Components e Server Actions.
  // getClaims() verifica il JWT in locale: niente chiamata al server Auth a ogni richiesta.
  const { data } = await supabase.auth.getClaims()
  const isAuthenticated = Boolean(data?.claims?.sub)

  // Route protette: se non autenticato, redirect al login.
  if (!isAuthenticated && isProtectedPath(request.nextUrl.pathname)) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder (immagini, manifest.json)
     * - api/mcp (autenticato col token personale, non con la sessione)
     */
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|api/mcp|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
