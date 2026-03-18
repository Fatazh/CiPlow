// middleware/auth.global.ts
// Global auth middleware — redirects unauthenticated users to /login
// and authenticated users away from /login and /register

export default defineNuxtRouteMiddleware(async (to) => {
  const { user, initialized, fetchUser } = useAuth()

  // Initialize auth state on first navigation (works on both SSR and Client)
  if (!initialized.value) {
    try {
      await fetchUser()
    } catch (e) {
      // Ignore errors silently on initial fetch (like 401s)
    }
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
