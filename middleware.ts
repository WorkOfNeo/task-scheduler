import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// List of public routes that don't require authentication
const publicRoutes = ['/login', '/signup']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Check if the route is public
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))

  // Get the Firebase auth token from the cookies
  const authToken = request.cookies.get('auth-token')?.value

  // If the route is public and the user is authenticated, redirect to dashboard
  if (isPublicRoute && authToken) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // If the route is not public and the user is not authenticated, redirect to login
  if (!isPublicRoute && !authToken) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

// Configure the middleware to run on specific paths
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
} 