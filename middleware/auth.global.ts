// middleware/auth.global.ts
// Global auth middleware — redirects unauthenticated users to /login
// and authenticated users away from /login and /register

export default defineNuxtRouteMiddleware(async (to) => {
  // Skip on server
  if (import.meta.server) return

  const { user, initialized, fetchUser } = useAuth()

  // Initialize auth state on first navigation
  if (!initialized.value) {
    await fetchUser()
  }

  const publicPages = ['/login', '/register']
  const isPublicPage = publicPages.includes(to.path)

  // Not logged in → redirect to login (unless already on public page)
  if (!user.value && !isPublicPage) {
    return navigateTo('/login')
  }

  // Logged in → redirect away from login/register
  if (user.value && isPublicPage) {
    return navigateTo('/')
  }
})
