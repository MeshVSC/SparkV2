import { AchievementProvider } from "@/components/achievement-provider"
import { AuthProvider } from "@/components/auth-provider"
import { GuestProvider } from "@/contexts/guest-context"

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <GuestProvider>
      <AuthProvider>
        <AchievementProvider>
          {children}
        </AchievementProvider>
      </AuthProvider>
    </GuestProvider>
  )
}