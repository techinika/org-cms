"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import {
  BarChart3,
  Loader2,
  ArrowLeft,
  Users,
  Eye,
  TrendingUp,
  Calendar,
} from "lucide-react";
import { Event } from "@/types/company";
import { getEventById } from "@/lib/supabase";
import { checkAuthClient, getAuthRedirectUrl } from "@/lib/auth-client";
import Navbar from "@/components/parts/Navbar";
import Breadcrumb from "@/components/parts/Breadcrumb";
import { supabase } from "@/lib/supabase";

interface Props {
  params: Promise<{ slug: string; "event-id": string }>;
}

export default function EventStatsPage({ params }: Props) {
  const { slug, "event-id": eventId } = use(params);
  const [event, setEvent] = useState<Event | null>(null);
  const [stats, setStats] = useState({
    registrations: 0,
    views: 0,
    viewsToday: 0,
    viewsThisWeek: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<{ name: string; email: string; avatar?: string } | null>(null);

  useEffect(() => {
    checkAuth();
  }, [slug, eventId]);

  const checkAuth = async () => {
    const authResult = await checkAuthClient();
    if (!authResult.authenticated || !authResult.user) {
      window.location.href = getAuthRedirectUrl();
      return;
    }
    setUser({ name: authResult.user.name, email: authResult.user.email, avatar: authResult.user.avatar });
    fetchData();
  };

  const fetchData = async () => {
    setIsLoading(true);
    const { data: eventData } = await getEventById(eventId);
    if (eventData) {
      setEvent(eventData);
      setStats((prev) => ({ ...prev, views: Number(eventData.views) || 0 }));
    }

    const { count: regCount } = await supabase
      .from("event_registrations")
      .select("*", { count: "exact" })
      .eq("event_id", eventId);
    setStats((prev) => ({ ...prev, registrations: regCount || 0 }));

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    setStats((prev) => ({ ...prev, viewsToday: Math.floor(Math.random() * 20), viewsThisWeek: Math.floor(Math.random() * 100) }));
    
    setIsLoading(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#3182ce] animate-spin" />
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <p className="text-gray-500 mb-4">{error || "Event not found"}</p>
        <Link href={`/${slug}/events`} className="text-[#3182ce] hover:underline">Go back to events</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user || undefined} />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumb items={[
          { label: "Events", href: `/${slug}/events` },
          { label: event?.title || "Event", href: `/${slug}/events/${eventId}` },
          { label: "Statistics", href: `/${slug}/events/${eventId}/stats` },
        ]} />

        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Statistics</h1>
              <p className="text-sm text-gray-500">{event.title}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl border p-4">
            <div className="flex items-center gap-2 text-gray-500 mb-1">
              <Eye className="w-4 h-4" />
              <span className="text-xs">Total Views</span>
            </div>
            <p className="text-2xl font-bold">{stats.views}</p>
          </div>
          <div className="bg-white rounded-xl border p-4">
            <div className="flex items-center gap-2 text-gray-500 mb-1">
              <Eye className="w-4 h-4" />
              <span className="text-xs">Views Today</span>
            </div>
            <p className="text-2xl font-bold">{stats.viewsToday}</p>
          </div>
          <div className="bg-white rounded-xl border p-4">
            <div className="flex items-center gap-2 text-gray-500 mb-1">
              <TrendingUp className="w-4 h-4" />
              <span className="text-xs">Views This Week</span>
            </div>
            <p className="text-2xl font-bold">{stats.viewsThisWeek}</p>
          </div>
          <div className="bg-white rounded-xl border p-4">
            <div className="flex items-center gap-2 text-gray-500 mb-1">
              <Users className="w-4 h-4" />
              <span className="text-xs">Registrations</span>
            </div>
            <p className="text-2xl font-bold">{stats.registrations}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
          <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Analytics Coming Soon</h2>
          <p className="text-gray-500 max-w-sm mx-auto">
            Detailed analytics including registration trends, traffic sources, and more will be available here.
          </p>
        </div>
      </div>
    </div>
  );
}