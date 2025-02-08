"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Navbar from "@/components/custom/navbar";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface User {
  username: string;
  email: string;
}

export default function ProfilePage() {
  const params = useParams();
  const username = params?.username as string;
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!username) return;

    async function fetchUserProfile() {
      try {
        const res = await fetch(`/api/v1/profile/${username}`);
        if (!res.ok) throw new Error("User not found");

        const data = await res.json();
        setUser(data);
      } catch (error) {
        console.error(error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    fetchUserProfile();
  }, [username]);

  if (loading) return <div className="text-center">Loading...</div>;
  if (!user) return <div className="text-center">User not found</div>;

  return (
    <>
      <Navbar />
      <div className="flex flex-col items-center p-4">
        <Avatar className="w-32 h-32">
          <AvatarImage src="#" alt="Profile Picture" />
          <AvatarFallback>{username ? username.charAt(0).toUpperCase() : "U"}</AvatarFallback>
        </Avatar>
        <div className="text-2xl font-bold">{user.username}</div>
        <p className="text-gray-600">{user.email}</p>
      </div>
    </>
  );
}
