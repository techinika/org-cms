"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import {
  Calendar,
  Loader2,
  MapPin,
  Globe,
  Ticket,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { Event, EventTicket, EventMetaDetails, isEventFree } from "@/types/company";
import { getEventById, getEventTickets, getEventMetaDetails, supabase } from "@/lib/supabase";
import Navbar from "@/components/parts/Navbar";
import Breadcrumb from "@/components/parts/Breadcrumb";

interface Props {
  params: Promise<{ slug: string; "event-id": string }>;
}

export default function EventRegisterPage({ params }: Props) {
  const { slug, "event-id": eventId } = use(params);
  const [event, setEvent] = useState<Event | null>(null);
  const [tickets, setTickets] = useState<EventTicket[]>([]);
  const [meta, setMeta] = useState<EventMetaDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [registering, setRegistering] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    notes: "",
    ticket_id: "",
  });
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    checkAuth();
  }, [slug, eventId]);

  const checkAuth = async () => {
    const { checkAuthClient, getAuthRedirectUrl } = await import("@/lib/auth-client");
    const authResult = await checkAuthClient();
    if (!authResult.authenticated || !authResult.user) {
      window.location.href = getAuthRedirectUrl();
      return;
    }
    setUserId(authResult.user.id);
    fetchData();
  };

  const fetchData = async () => {
    setIsLoading(true);
    const { data: eventData } = await getEventById(eventId);
    if (eventData) setEvent(eventData);

    if (eventData) {
      const { data: ticketsData } = await getEventTickets(eventId);
      setTickets(ticketsData || []);

      const { data: metaData } = await getEventMetaDetails(eventId);
      setMeta(metaData);
    }

    setIsLoading(false);
  };

  const isFree = (): boolean => {
    if (tickets.length > 0) {
      return tickets.every(t => t.price === 0);
    }
    return meta?.is_free ?? true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email) {
      setSubmitError("Name and email are required");
      return;
    }

    setRegistering(true);
    setSubmitError(null);

    try {
      const { error } = await supabase.from("event_registrations").insert({
        event_id: eventId,
        user_id: userId || null,
        ticket_id: formData.ticket_id || null,
        status: meta?.requires_approval ? "pending_approval" : "confirmed",
        answers: {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          notes: formData.notes,
        },
      });

      if (error) throw error;
      setSubmitted(true);
    } catch (err: any) {
      setSubmitError(err.message || "Registration failed");
    } finally {
      setRegistering(false);
    }
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

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Registration Successful!</h1>
            <p className="text-gray-600 mb-6">You have successfully registered for {event.title}.</p>
            <Link
              href={`/${slug}/events/${eventId}`}
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#3182ce] text-white rounded-xl font-medium hover:bg-[#2c5cb8]"
            >
              Back to Event
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isExternal = event.external_link && event.external_link !== "register";
  const isPlatform = event.external_link === "register";

  if (isExternal && event.external_link) {
    if (typeof window !== "undefined") {
      window.open(event.external_link, "_blank");
    }
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumb items={[
          { label: "Events", href: `/${slug}/events` },
          { label: event.title, href: `/${slug}/events/${eventId}` },
          { label: "Register", href: `/${slug}/events/${eventId}/register` },
        ]} />

        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-[#3182ce]/10 rounded-xl flex items-center justify-center">
              <Calendar className="w-6 h-6 text-[#3182ce]" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Register for {event.title}</h1>
              <p className="text-sm text-gray-500">
                {event.location} • {event.format}
              </p>
            </div>
          </div>

          {event.start_date && (
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
              <Calendar className="w-4 h-4" />
              {new Date(event.start_date).toLocaleDateString()} 
              {event.end_date && ` - ${new Date(event.end_date).toLocaleDateString()}`}
            </div>
          )}

          {isFree() && (
            <div className="flex items-center gap-2 text-sm text-green-600 mb-4">
              <Ticket className="w-4 h-4" />
              This is a free event
            </div>
          )}
        </div>

        {submitError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm flex items-start gap-2">
            <AlertCircle className="w-5 h-5 mt-0.5" />
            {submitError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 p-6 space-y-6">
          <h2 className="text-lg font-semibold text-gray-900">Registration Form</h2>

          {tickets.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Select Ticket</label>
              <div className="space-y-3">
                {tickets.filter(t => t.is_active).map((ticket) => (
                  <label
                    key={ticket.id}
                    className={`block p-4 border rounded-xl cursor-pointer transition-colors ${
                      formData.ticket_id === ticket.id
                        ? "border-[#3182ce] bg-[#3182ce]/5"
                        : "border-gray-200 hover:border-[#3182ce]/50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="ticket"
                      value={ticket.id}
                      checked={formData.ticket_id === ticket.id}
                      onChange={() => setFormData({ ...formData, ticket_id: ticket.id })}
                      className="sr-only"
                    />
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{ticket.name}</p>
                        {ticket.description && (
                          <p className="text-sm text-gray-500">{ticket.description}</p>
                        )}
                      </div>
                      <div className="text-right">
                        {ticket.price === 0 ? (
                          <span className="text-lg font-bold text-green-600">Free</span>
                        ) : (
                          <span className="text-lg font-bold text-gray-900">
                            {ticket.currency} {ticket.price}
                          </span>
                        )}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#3182ce]/20 focus:border-[#3182ce] outline-none"
              placeholder="John Doe"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#3182ce]/20 focus:border-[#3182ce] outline-none"
              placeholder="john@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone (Optional)</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#3182ce]/20 focus:border-[#3182ce] outline-none"
              placeholder="+1234567890"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes (Optional)</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#3182ce]/20 focus:border-[#3182ce] outline-none resize-none"
              placeholder="Any additional information..."
            />
          </div>

          <button
            type="submit"
            disabled={registering}
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#3182ce] text-white rounded-xl font-medium hover:bg-[#2c5cb8] transition-colors disabled:opacity-50"
          >
            {registering ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Ticket className="w-5 h-5" />
                Register Now
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
