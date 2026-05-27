"use client";

import { useState, useEffect } from "react";
import { use } from "react";
import Link from "next/link";
import { FeaturedStartup, Event } from "@/types/company";
import { getCompanyBySlug, getCompanyEvents, deleteEvent } from "@/lib/supabase";
import { checkAuthClient, getAuthRedirectUrl } from "@/lib/auth-client";
import Navbar from "@/components/parts/Navbar";
import Breadcrumb from "@/components/parts/Breadcrumb";
import { EventCard, EventEmptyState } from "@/components/events/EventCard";
import { Loader2, ArrowLeft, Plus } from "lucide-react";
import ConfirmationModal from "@/components/ui/ConfirmationModal";
import { useToast } from "@/components/ui/Toast";

export default function CompanyEventsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { showToast } = useToast();
  const [company, setCompany] = useState<FeaturedStartup | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showMenu, setShowMenu] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ open: boolean; event: Event | null }>({ open: false, event: null });

  const checkAuth = async () => {
    const authResult = await checkAuthClient();
    if (!authResult.authenticated || !authResult.user) {
      window.location.replace(getAuthRedirectUrl());
      return;
    }
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

  useEffect(() => {
    checkAuth();
  }, [slug]);

  const handleDeleteEvent = async (eventId: string) => {
    setDeletingId(eventId);
    const { error } = await deleteEvent(eventId);
    if (!error) {
      setEvents(events.filter(e => e.id !== eventId));
      showToast("Event deleted successfully", "success");
    } else {
      showToast("Failed to delete event", "error");
    }
    setDeletingId(null);
    setShowMenu(null);
  };

  const handleConfirmDelete = async () => {
    if (!confirmDelete.event) return;
    setDeletingId(confirmDelete.event.id);
    const { error } = await deleteEvent(confirmDelete.event.id);
    setDeletingId(null);
    setConfirmDelete({ open: false, event: null });
    if (!error) {
      setEvents(events.filter(e => e.id !== confirmDelete.event!.id));
      showToast("Event deleted successfully", "success");
    } else {
      showToast("Failed to delete event", "error");
    }
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
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumb items={[
          { label: "Company", href: `/${slug}` },
          { label: "Events", href: `/${slug}/events` },
        ]} />

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
          <EventEmptyState companyName={company.name} createHref={`/${slug}/events/new`} />
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-200">
            {events.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                slug={slug}
                onConfirmDelete={(e) => setConfirmDelete({ open: true, event: e })}
                deletingId={deletingId}
                showMenu={showMenu}
                onToggleMenu={setShowMenu}
              />
            ))}
          </div>
        )}
      </div>

      <ConfirmationModal
        isOpen={confirmDelete.open}
        title="Delete Event"
        message={`Are you sure you want to delete "${confirmDelete.event?.title}"? This action cannot be undone.`}
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmDelete({ open: false, event: null })}
      />
    </div>
  );
}