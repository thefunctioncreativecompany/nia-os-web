"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import type { CurrentUser } from "@/lib/auth"
import { createClient } from "@/lib/supabase/client"
import { getInitials } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const MAX_AVATAR_BYTES = 2 * 1024 * 1024 // 2 MB
const AVATAR_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"]

export function ProfileForm({ user }: { user: CurrentUser }) {
  const router = useRouter()
  const fileInput = useRef<HTMLInputElement>(null)
  const [name, setName] = useState(user.name)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(user.avatarUrl)
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  // Free the temporary preview URL when it's replaced.
  useEffect(() => {
    return () => {
      if (preview?.startsWith("blob:")) URL.revokeObjectURL(preview)
    }
  }, [preview])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!AVATAR_TYPES.includes(file.type)) {
      setError("Please choose a PNG, JPG, WebP or GIF image.")
      return
    }
    if (file.size > MAX_AVATAR_BYTES) {
      setError("Please choose an image smaller than 2 MB.")
      return
    }

    setError(null)
    setAvatarFile(file)
    setPreview(URL.createObjectURL(file))
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsSaving(true)
    setError(null)

    try {
      let avatarUrl = user.avatarUrl

      if (avatarFile) {
        // Each user uploads into their own folder: avatars/<user id>/...
        const extension = avatarFile.name.split(".").pop() ?? "png"
        const path = `${user.id}/avatar-${Date.now()}.${extension}`
        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(path, avatarFile, { contentType: avatarFile.type })
        if (uploadError) throw uploadError

        avatarUrl = supabase.storage.from("avatars").getPublicUrl(path).data
          .publicUrl
      }

      const { error: updateError } = await supabase.auth.updateUser({
        data: { full_name: name.trim(), avatar_url: avatarUrl },
      })
      if (updateError) throw updateError

      setAvatarFile(null)
      toast.success("Profile saved")
      // Re-load server data so the sidebar shows the new name and photo.
      router.refresh()
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-medium">Profile</CardTitle>
        <CardDescription>
          This is how you appear to others in Nia OS.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSave}>
        <CardContent className="flex flex-col gap-6">
          <div className="flex items-center gap-4">
            <Avatar className="size-16 rounded-xl">
              <AvatarImage src={preview ?? undefined} alt="Your avatar" />
              <AvatarFallback className="rounded-xl text-lg">
                {getInitials(name, user.email)}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col gap-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInput.current?.click()}
              >
                Change photo
              </Button>
              <p className="text-xs text-muted-foreground">
                PNG, JPG, WebP or GIF, up to 2 MB.
              </p>
            </div>
            <input
              ref={fileInput}
              type="file"
              accept={AVATAR_TYPES.join(",")}
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              maxLength={80}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={user.email} disabled />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </CardContent>
        <CardFooter className="mt-6">
          <Button type="submit" disabled={isSaving}>
            {isSaving ? "Saving..." : "Save changes"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
