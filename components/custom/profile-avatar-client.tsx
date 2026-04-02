"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CameraIcon, User } from "lucide-react";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";
import { authClient } from "@/lib/auth-client";
import { getInitials } from "@/lib/initials";
import { useTranslations } from "next-intl";
// import { toast } from "sonner"; // Or whatever toast library you use
// import { authClient } from "@/lib/auth-client"; // Adjust path to your better-auth client

export default function ProfileAvatarClient({
  userId,
  initialImage,
  userName,
  isOwner,
}: {
  userId: string;
  initialImage: string | null;
  userName: string | null;
  isOwner: boolean;
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Local state to show the new image instantly before the server refresh completes
  const [currentImage, setCurrentImage] = useState<string | null>(initialImage);

  const t = useTranslations();

  const handleAvatarFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    try {
      // 1. Upload to Cloudinary
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "user-avatars");

      const uploadResponse = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const uploadData = (await uploadResponse.json()) as {
        url?: string;
        error?: string;
      };

      if (!uploadResponse.ok) {
        throw new Error(uploadData.error || "Gagal mengunggah gambar.");
      }

      const newImageUrl = uploadData.url ?? "";

      // 2. Persist to database
      const patchRes = await fetch(`/api/profile/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: newImageUrl }),
      });

      if (!patchRes.ok) {
        const errData = (await patchRes.json()) as { error?: string };
        throw new Error(errData.error || "Gagal menyimpan gambar.");
      }

      // 3. Keep better-auth session image in sync (Uncomment when ready)
      await authClient.updateUser({ image: newImageUrl });

      // 4. Update UI
      setCurrentImage(newImageUrl);
      router.refresh();

      toast.success(t("Components.profile.avatar.updateSuccess"));
    } catch (error) {
      console.error("Error uploading avatar:", error);
    } finally {
      setIsUploading(false);
      // Reset the input so the user can upload the same file again if they want to
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="relative">
      {isOwner ? (
        // Owner View: Clickable Avatar with Hidden Input
        <div
          className="group relative cursor-pointer"
          onClick={() => !isUploading && fileInputRef.current?.click()}
        >
          <input
            type="file"
            accept="image/jpeg, image/png, image/gif, image/webp"
            className="hidden"
            ref={fileInputRef}
            onChange={handleAvatarFileChange}
            disabled={isUploading}
          />

          <Avatar className="size-28 ring-4 ring-background shadow-lg transition-all duration-200 group-hover:brightness-75">
            <AvatarImage
              src={currentImage ?? undefined}
              alt={userName ?? t("Components.profile.avatar.userFallback")}
              className="object-cover"
            />
            <AvatarFallback className="text-2xl font-bold">
              {getInitials(userName) ?? <User />}
            </AvatarFallback>
          </Avatar>

          {/* Hover Overlay */}
          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
            <CameraIcon className="size-8 text-white" />
          </div>

          {/* Uploading State Overlay */}
          {isUploading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center rounded-full bg-background/70 backdrop-blur-sm">
              <Spinner className="size-6" />
            </div>
          )}
        </div>
      ) : (
        // Public View: Static Avatar
        <Avatar className="size-28 ring-4 ring-background shadow-lg">
          <AvatarImage
            src={currentImage ?? undefined}
            alt={userName ?? t("Components.profile.avatar.userFallback")}
            className="object-cover"
          />
          <AvatarFallback className="text-2xl font-bold">
            {getInitials(userName) ?? <User />}
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}
