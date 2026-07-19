"use client";

import { useEffect, useState } from "react";
import { User } from "lucide-react";
import { getAssetById } from "@/lib/worker";

interface AuthorAvatarProps {
  imageRef?: string | null;
  name?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export default function AuthorAvatar({ imageRef, name = "", className = "", size = "md" }: AuthorAvatarProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    async function fetchAvatar() {
      if (!imageRef) {
        setLoading(false);
        return;
      }
      
      try {
        const { data: asset } = await getAssetById(imageRef);
        setImageUrl(asset?.url || null);
      } catch (error) {
        console.error("Failed to fetch author avatar:", error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchAvatar();
  }, [imageRef]);
  
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-12 h-12",
  };
  
  const iconSizes = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };
  
  if (loading) {
    return (
      <div className={`${sizeClasses[size]} bg-gray-100 animate-pulse rounded-full ${className}`} />
    );
  }
  
  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={name}
        className={`${sizeClasses[size]} object-cover rounded-full ${className}`}
      />
    );
  }
  
  return (
    <div className={`${sizeClasses[size]} bg-gray-100 flex items-center justify-center rounded-full ${className}`}>
      <User className={`${iconSizes[size]} text-gray-400`} />
    </div>
  );
}