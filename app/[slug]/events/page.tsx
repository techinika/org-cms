"use client";

import { useState, useEffect } from "react";
import { use } from "react";
import Link from "next/link";
import {
  Calendar,
  Loader2,
  ArrowLeft,
  MoreVertical,
  Trash2,
  Plus,
} from "lucide-react";
import { FeaturedStartup, Event } from "@/types/company";
import { getCompanyBySlug, getCompanyEvents, deleteEvent } from "@/lib/supabase";
import { checkAuthClient, getAuthRedirectUrl } from "@/lib/auth-client";
import Navbar from "@/components/parts/Navbar";

export default function CompanyEventsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [company, setCompany] = useState<FeaturedStartup | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<{ name: string; email: string; avatar?: string } | null>(null);
  const [showMenu, setShowMenu] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
  }, [slug]);

  const checkAuth = async () => {
    const authResult = await checkAuthClient();
    if (!authResult.authenticated || !authResult.user) {
      window.location.href = getAuthRedirectUrl();
      return;
    }
    setUser({ name: authResult.user.name, email: authResult.user.email, avatar: authResult.user.avatar });
    fetchCompany();
  };

  const fetchCompany = async () => {
    setIsLoading(true);
    const { data: companyData, error: companyError } = await getCompanyBySlug(slug);
    if (companyError || !companyData) {
      setError("Company not found");
      setIsLoading(false);
      return;
    }
    setCompany(companyData);

    const { data: eventsData, error: eventsError } = await getCompanyEvents(companyData.id);
    setEvents(eventsData || []);
    setIsLoading(false);
  };

  const handleDeleteEvent = async (eventId: string) => {
    setDeletingId(eventId);
    const { error } = await deleteEvent(eventId);
    if (!error) {
      setEvents(events.filter(e => e.id !== eventId));
    }
    setDeletingId(null);
    setShowMenu(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#3182ce] animate-spin" />
      </div>
    );
  }

  if (error || !company) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <p className="text-gray-500 mb-4">{error || "Company not found"}</p>
        <Link href="/" className="text-[#3182ce] hover:underline">Go back home</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user || undefined} />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link href={`/${slug}`} className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-[#3182ce] transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Company
          </Link>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Company Events</h1>
              <p className="text-sm text-gray-500 mt-1">Manage events for {company.name}</p>
            </div>
            <Link
              href={`/${slug}/events/new`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#3182ce] text-white rounded-xl font-medium text-sm hover:bg-[#2c5cb8] transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create Event
            </Link>
          </div>
        </div>

        {events.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-12">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-[#3182ce]/10 rounded-2xl flex items-center justify-center mb-4">
                <Calendar className="w-8 h-8 text-[#3182ce]" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">No events yet</h2>
              <p className="text-gray-500 max-w-sm mb-6">
                Create your first event for {company.name}
              </p>
              <Link
                href={`/${slug}/events/new`}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#3182ce] text-white rounded-xl font-medium text-sm hover:bg-[#2c5cb8] transition-colors"
              >
                <Plus className="w-4 h-4" />
                Create Event
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-200">
            {events.map((event) => (
              <div key={event.id} className="p-4 flex items-center gap-4 hover:bg-gray-50 transition-colors">
                <Link href={`/${slug}/events/${event.id}`} className="w-14 h-14 bg-[#3182ce]/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-7 h-7 text-[#3182ce]" />
                </Link>
                <div className="flex-1 min-w-0">
                  <Link href={`/${slug}/events/${event.id}`} className="font-medium text-gray-900 hover:text-[#3182ce] transition-colors block truncate">
                    {event.title}
                  </Link>
                  <p className="text-sm text-gray-500">{event.location || "No location"}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm text-gray-500">
                    {event.start_date ? new Date(event.start_date).toLocaleDateString() : "TBA"}
                  </p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    event.status === 'Upcoming' || event.status === 'Ongoing' || event.publish_status === 'published' 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {event.status || "draft"}
                  </span>
                </div>
                <div className="relative">
                  <button
                    onClick={() => setShowMenu(showMenu === event.id ? null : event.id)}
                    className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                  >
                    <MoreVertical className="w-5 h-5 text-gray-400" />
                  </button>
                  {showMenu === event.id && (
                    <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-xl shadow-lg border border-gray-200 py-1 z-10">
                      <button
                        onClick={() => handleDeleteEvent(event.id)}
                        disabled={deletingId === event.id}
                        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                      >
                        {deletingId === event.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}