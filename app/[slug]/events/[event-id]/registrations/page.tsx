"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import {
  ClipboardList,
  Loader2,
  ArrowLeft,
  Users,
  Search,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";
import { Event } from "@/types/company";
import { getEventById } from "@/lib/supabase";
import { checkAuthClient, getAuthRedirectUrl } from "@/lib/auth-client";
import Navbar from "@/components/parts/Navbar";
import Breadcrumb from "@/components/parts/Breadcrumb";
import { supabase } from "@/lib/supabase";

interface Registration {
  id: string;
  event_id: string;
  user_id: string;
  status: string;
  created_at: string;
  user?: {
    name: string;
    email: string;
  avatar_url?: string;
  };
  ticket?: {
    name: string;
  };
}

interface Props {
  params: Promise<{ slug: string; "event-id": string }>;
}

export default function EventRegistrationsPage({ params }: Props) {
  const { slug, "event-id": eventId } = use(params);
  const [event, setEvent] = useState<Event | null>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<{ name: string; email: string; avatar?: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

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
    if (eventData) setEvent(eventData);

    const { data: regData } = await supabase
      .from("event_registrations")
      .select("*, ticket:event_tickets(*)")
      .eq("event_id", eventId)
      .order("created_at", { ascending: false });
    setRegistrations(regData || []);
    setIsLoading(false);
  };

  const updateStatus = async (regId: string, newStatus: string) => {
    await supabase.from("event_registrations").update({ status: newStatus }).eq("id", regId);
    fetchData();
  };

  const filteredRegs = registrations.filter((r) => {
    if (statusFilter !== "all" && r.status !== statusFilter) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return r.user?.email?.toLowerCase().includes(query);
    }
    return true;
  });

  const stats = {
    total: registrations.length,
    confirmed: registrations.filter((r) => r.status === "confirmed").length,
    pending: registrations.filter((r) => r.status === "pending_approval" || r.status === "pending_payment").length,
    cancelled: registrations.filter((r) => r.status === "cancelled").length,
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
          { label: "Registrations", href: `/${slug}/events/${eventId}/registrations` },
        ]} />

        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center">
              <ClipboardList className="w-6 h-6 text-pink-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Registrations</h1>
              <p className="text-sm text-gray-500">{event.title}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl border p-4">
            <div className="flex items-center gap-2 text-gray-500 mb-1">
              <Users className="w-4 h-4" />
              <span className="text-xs">Total</span>
            </div>
            <p className="text-2xl font-bold">{stats.total}</p>
          </div>
          <div className="bg-green-50 rounded-xl border p-4">
            <div className="flex items-center gap-2 text-green-600 mb-1">
              <CheckCircle className="w-4 h-4" />
              <span className="text-xs">Confirmed</span>
            </div>
            <p className="text-2xl font-bold">{stats.confirmed}</p>
          </div>
          <div className="bg-yellow-50 rounded-xl border p-4">
            <div className="flex items-center gap-2 text-yellow-600 mb-1">
              <Clock className="w-4 h-4" />
              <span className="text-xs">Pending</span>
            </div>
            <p className="text-2xl font-bold">{stats.pending}</p>
          </div>
          <div className="bg-red-50 rounded-xl border p-4">
            <div className="flex items-center gap-2 text-red-600 mb-1">
              <XCircle className="w-4 h-4" />
              <span className="text-xs">Cancelled</span>
            </div>
            <p className="text-2xl font-bold">{stats.cancelled}</p>
          </div>
        </div>

        <div className="flex gap-4 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 border border-gray-200 rounded-xl"
          >
            <option value="all">All Status</option>
            <option value="confirmed">Confirmed</option>
            <option value="pending_payment">Pending Payment</option>
            <option value="pending_approval">Pending Approval</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {filteredRegs.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
            <div className="w-16 h-16 bg-pink-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <ClipboardList className="w-8 h-8 text-pink-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No registrations yet</h2>
            <p className="text-gray-500">Registrations will appear here when people register for your event.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-200">
            {filteredRegs.map((reg) => (
              <div key={reg.id} className="p-4 flex items-center gap-4">
                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                  <Users className="w-5 h-5 text-gray-400" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{reg.user?.email}</p>
                  <p className="text-sm text-gray-500">{reg.ticket?.name}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full capitalize ${
                  reg.status === "confirmed" ? "bg-green-100 text-green-700" :
                  reg.status === "cancelled" ? "bg-red-100 text-red-700" :
                  "bg-yellow-100 text-yellow-700"
                }`}>
                  {reg.status.replace("_", " ")}
                </span>
                <select
                  value={reg.status}
                  onChange={(e) => updateStatus(reg.id, e.target.value)}
                  className="text-sm border rounded-lg px-2 py-1"
                >
                  <option value="pending_payment">Pending Payment</option>
                  <option value="pending_approval">Pending Approval</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}