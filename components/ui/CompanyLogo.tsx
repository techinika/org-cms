"use client";

import { useEffect, useState } from "react";
import { Building2 } from "lucide-react";
import { FeaturedStartup } from "@/types/company";

interface CompanyLogoProps {
  company: FeaturedStartup;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export default function CompanyLogo({ company, className = "", size = "md" }: CompanyLogoProps) {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    async function fetchLogo() {
      if (!company.image_ref) {
        setLoading(false);
        return;
      }
      
      try {
        const { createClient } = await import("@supabase/supabase-js");
        const supabase = createClient(
          process.env.NEXT_PUBLIC_PROJECT_URL!,
          process.env.NEXT_PUBLIC_API_KEY!
        );
        const { data: asset } = await supabase
          .from("assets")
          .select("url")
          .eq("id", company.image_ref)
          .single();
        setLogoUrl(asset?.url || null);
      } catch (error) {
        console.error("Failed to fetch company logo:", error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchLogo();
  }, [company.image_ref]);
  
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16",
  };
  
  const iconSizes = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
  };
  
  if (loading) {
    return (
      <div className={`${sizeClasses[size]} bg-gray-100 animate-pulse rounded-lg ${className}`} />
    );
  }
  
  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt={company.name}
        className={`${sizeClasses[size]} object-cover rounded-lg ${className}`}
      />
    );
  }
  
  return (
    <div className={`${sizeClasses[size]} bg-gray-50 border border-gray-100 flex items-center justify-center rounded-lg ${className}`}>
      <Building2 className={`${iconSizes[size]} text-gray-300`} />
    </div>
  );
}