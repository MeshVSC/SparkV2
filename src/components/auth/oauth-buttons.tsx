"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Chrome, Github } from "lucide-react"

interface OAuthButtonsProps {
  onSuccess?: () => void
}

export function OAuthButtons({ onSuccess }: OAuthButtonsProps) {
  const [loading, setLoading] = useState(false)

  const handleOAuthSignIn = async (provider: string) => {
    setLoading(true)
    try {
      await signIn(provider, { callbackUrl: "/" })
      onSuccess?.()
    } catch (error) {
      toast.error("Something went wrong")
      setLoading(false)
    }
  }

  return (
    <div className="space-y-2">
      <Button
        variant="outline"
        className="w-full"
        onClick={() => handleOAuthSignIn("google")}
        disabled={loading}
      >
        <Chrome className="mr-2 h-4 w-4" />
        Continue with Google
      </Button>

      <Button
        variant="outline"
        className="w-full"
        onClick={() => handleOAuthSignIn("github")}
        disabled={loading}
      >
        <Github className="mr-2 h-4 w-4" />
        Continue with GitHub
      </Button>
    </div>
  )
}