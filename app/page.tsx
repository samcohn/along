import { redirect } from 'next/navigation'

// Root redirects to /app — middleware handles auth check
export default function RootPage() {
  redirect('/app')
}
