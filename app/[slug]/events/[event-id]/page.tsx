"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import {
  Calendar,
  Loader2,
  ArrowLeft,
  MapPin,
  CalendarDays,
  Users,
  Building2,
  ClipboardList,
  BarChart3,
  Edit2,
  CheckCircle2,
  Send,
  HelpCircle,
  Ticket as TicketIcon,
} from "lucide-react";
import { Event } from "@/types/company";
import { getEventById } from "@/lib/supabase";
import { checkAuthClient, getAuthRedirectUrl } from "@/lib/auth-client";
import Navbar from "@/components/parts/Navbar";
import Breadcrumb from "@/components/parts/Breadcrumb";

interface Props {
  params: Promise<{ slug: string; "event-id": string }>;
}

export default function EventDetailPage({ params }: Props) {
  const { slug, "event-id": eventId } = use(params);
  const [event, setEvent] = useState<Event | null>(null);
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
    fetchEvent();
  };

  const fetchEvent = async () => {
    setIsLoading(true);
    const { data, error: eventError } = await getEventById(eventId);
    if (eventError || !data) {
      setError("Event not found");
      setIsLoading(false);
      return;
    }
    setEvent(data);
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

  const isPublished = event.publish_status === "published";

  const menuItems = [
    {
      title: "Review & Publish",
      description: isPublished ? "Event is live - view summary" : "Review all sections and publish",
      href: `/${slug}/events/${eventId}/review`,
      icon: isPublished ? CheckCircle2 : Send,
      color: isPublished ? "bg-green-50 text-green-600" : "bg-blue-50 text-blue-600",
    },
    {
      title: "Edit Event",
      description: "Update event details, dates, location and description",
      href: `/${slug}/events/${eventId}/edit`,
      icon: Edit2,
      color: "bg-blue-50 text-blue-600",
    },
    {
      title: "FAQs",
      description: "Manage frequently asked questions",
      href: `/${slug}/events/${eventId}/faqs`,
      icon: HelpCircle,
      color: "bg-teal-50 text-teal-600",
    },
    {
      title: "Speakers",
      description: "Manage event speakers and their sessions",
      href: `/${slug}/events/${eventId}/speakers`,
      icon: Users,
      color: "bg-purple-50 text-purple-600",
    },
    {
      title: "Agenda",
      description: "Manage event schedule and sessions",
      href: `/${slug}/events/${eventId}/agenda`,
      icon: CalendarDays,
      color: "bg-green-50 text-green-600",
    },
    {
      title: "Partners & Sponsors",
      description: "Manage partners and sponsors",
      href: `/${slug}/events/${eventId}/partners`,
      icon: Building2,
      color: "bg-orange-50 text-orange-600",
    },
    {
      title: "Tickets",
      description: "Manage event tickets and pricing",
      href: `/${slug}/events/${eventId}/tickets`,
      icon: TicketIcon,
      color: "bg-pink-50 text-pink-600",
    },
    ...(isPublished ? [{
      title: "RSVPs & Check-in",
      description: "Manage registrations and check in guests",
      href: `/${slug}/events/${eventId}/registrations`,
      icon: ClipboardList,
      color: "bg-indigo-50 text-indigo-600",
    }] : []),
    ...(!isPublished ? [{
      title: "Registrations (Preview)",
      description: "View registrations after publishing",
      href: `/${slug}/events/${eventId}/registrations`,
      icon: ClipboardList,
      color: "bg-gray-50 text-gray-400",
    }] : []),
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user || undefined} />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumb items={[
          { label: "Events", href: `/${slug}/events` },
          { label: event?.title || "Event", href: `/${slug}/events/${eventId}` },
        ]} />

        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-[#3182ce]/10 rounded-2xl flex items-center justify-center">
              <Calendar className="w-7 h-7 text-[#3182ce]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{event.title}</h1>
              <p className="text-gray-500">{event.format} • {event.location || "No location"}</p>
            </div>
          </div>
        </div>

        <div className="grid gap-4">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="bg-white rounded-2xl border border-gray-200 p-6 hover:border-[#3182ce]/30 hover:shadow-md transition-all group"
            >
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${item.color}`}>
                  <item.icon className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-semibold text-gray-900 group-hover:text-[#3182ce] transition-colors">
                    {item.title}
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">{item.description}</p>
                </div>
                <ArrowLeft className="w-5 h-5 text-gray-300 group-hover:text-[#3182ce] rotate-180 transition-colors" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}