"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import {
  Loader2,
  ArrowLeft,
  FileText,
  Building2,
  Users,
  CalendarDays,
  HelpCircle,
  Ticket,
  Send,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import { Event, EventSchedule, EventTicket, FeaturedStartup } from "@/types/company";
import { getEventById, getEventSchedules, getEventTickets, getAssetById, workerFetch } from "@/lib/worker";
import { checkAuthClient, getAuthRedirectUrl } from "@/lib/auth-client";
import Navbar from "@/components/parts/Navbar";
import Breadcrumb from "@/components/parts/Breadcrumb";
import { useToast } from "@/components/ui/Toast";
import ConfirmationModal from "@/components/ui/ConfirmationModal";
import CompanyLogo from "@/components/ui/CompanyLogo";

interface EventSpeaker {
  id: string;
  speaker?: {
    id: string;
    name: string;
    title: string | null;
    image_ref: string | null;
    company?: {
      name: string;
      logo_url: string | null;
    };
    asset?: {
      url: string;
    };
  };
}

interface EventCompany {
  id: number;
  relationship: string;
  company?: FeaturedStartup;
}

interface Props {
  params: Promise<{ slug: string; "event-id": string }>;
}

export default function EventReviewPage({ params }: Props) {
  const { slug, "event-id": eventId } = use(params);
  const { showToast } = useToast();
  const [event, setEvent] = useState<Event | null>(null);
  const [speakers, setSpeakers] = useState<EventSpeaker[]>([]);
  const [partners, setPartners] = useState<EventCompany[]>([]);
  const [schedules, setSchedules] = useState<EventSchedule[]>([]);
  const [tickets, setTickets] = useState<EventTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [showUnpublishModal, setShowUnpublishModal] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const fetchAllData = async () => {
    setIsLoading(true);
    const { data: eventData } = await getEventById(eventId);
    if (eventData) setEvent(eventData);

    const speakersRes = await workerFetch(`/api/events/${eventId}/speakers`);
    if (speakersRes.ok) {
      setSpeakers(await speakersRes.json());
    } else {
      setSpeakers([]);
    }

    const partnersRes = await workerFetch(`/api/events/${eventId}/partners`);
    let partnersData: EventCompany[] = [];
    if (partnersRes.ok) {
      partnersData = await partnersRes.json();
    }
    
    if (partnersData) {
      for (const p of partnersData) {
        if (p.company?.image_ref) {
          const { data: asset } = await getAssetById(p.company.image_ref);
          if (asset) {
            p.company.logo_url = asset.url;
          }
        }
      }
    }
    setPartners(partnersData || []);

    const { data: schedulesData } = await getEventSchedules(eventId);
    setSchedules(schedulesData || []);

    const { data: ticketsData } = await getEventTickets(eventId);
    setTickets(ticketsData || []);

    setIsLoading(false);
  };

  const checkAuth = async () => {
    const authResult = await checkAuthClient();
    if (!authResult.authenticated || !authResult.user) {
      window.location.replace(getAuthRedirectUrl());
      return;
    }
    await fetchAllData();
  };

  useEffect(() => {
    (async () => {
      await checkAuth();
    })();
  }, [slug, eventId]);

  const validateEvent = (): string[] => {
    const errors: string[] = [];
    if (!event?.title) errors.push("Event title is required");
    if (!event?.start_date) errors.push("Start date is required");
    if (!event?.location) errors.push("Location is required");
    return errors;
  };

  const handlePublish = async () => {
    const errors = validateEvent();
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    setPublishing(true);
    const res = await workerFetch(`/api/events/${eventId}`, {
      method: "PATCH",
      body: JSON.stringify({ publish_status: "published" }),
    });
    setPublishing(false);

    if (!res.ok) {
      showToast("Failed to publish event", "error");
    } else {
      showToast("Event published successfully", "success");
      setShowPublishModal(false);
      fetchAllData();
    }
  };

  const handleUnpublish = async () => {
    setPublishing(true);
    const res = await workerFetch(`/api/events/${eventId}`, {
      method: "PATCH",
      body: JSON.stringify({ publish_status: "draft" }),
    });
    setPublishing(false);

    if (!res.ok) {
      showToast("Failed to unpublish event", "error");
    } else {
      showToast("Event moved back to draft", "success");
      setShowUnpublishModal(false);
      fetchAllData();
    }
  };

  const groupedSchedules = schedules.reduce((acc, s) => {
    const day = s.day_index || 1;
    if (!acc[day]) acc[day] = [];
    acc[day].push(s);
    return acc;
  }, {} as Record<number, EventSchedule[]>);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#3182ce] animate-spin" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <p className="text-gray-500 mb-4">Event not found</p>
        <Link href={`/${slug}/events`} className="text-[#3182ce] hover:underline">Go back to events</Link>
      </div>
    );
  }

  const isPublished = event.publish_status === "published";

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumb items={[
          { label: "Events", href: `/${slug}/events` },
          { label: event.title, href: `/${slug}/events/${eventId}` },
          { label: "Review & Publish", href: `/${slug}/events/${eventId}/review` },
        ]} />

        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Review & Publish</h1>
                <p className="text-sm text-gray-500">{event.title}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {isPublished ? (
                <>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                    <CheckCircle2 className="w-4 h-4" />
                    Published
                  </span>
                  <button
                    onClick={() => setShowUnpublishModal(true)}
                    className="px-4 py-1.5 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50 transition-colors"
                  >
                    Unpublish
                  </button>
                </>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium">
                  <AlertCircle className="w-4 h-4" />
                  Draft
                </span>
              )}
            </div>
          </div>
        </div>

        {validationErrors.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
              <div>
                <p className="font-medium text-red-900 mb-2">Please fix the following before publishing:</p>
                <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
                  {validationErrors.map((err, i) => <li key={i}>{err}</li>)}
                </ul>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-6">

          <SectionCard title="Basic Information" icon={FileText} href={`/${slug}/events/${eventId}/edit`} color="blue">
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-gray-500">Title</dt>
                <dd className="font-medium text-gray-900">{event.title || "Not set"}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Format</dt>
                <dd className="font-medium text-gray-900">{event.format}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Location</dt>
                <dd className="font-medium text-gray-900">{event.location || "Not set"}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Status</dt>
                <dd className="font-medium text-gray-900">{event.status}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Start Date</dt>
                <dd className="font-medium text-gray-900">
                  {event.start_date ? new Date(event.start_date).toLocaleDateString() : "Not set"}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">End Date</dt>
                <dd className="font-medium text-gray-900">
                  {event.end_date ? new Date(event.end_date).toLocaleDateString() : "Not set"}
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">Registration Type</dt>
                <dd className="font-medium text-gray-900">
                  {event.registration_type === "external" ? (
                    <span className="inline-flex items-center gap-1 text-blue-600">
                      <ExternalLink className="w-3.5 h-3.5" />
                      External Link
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-green-600">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Platform Registration
                    </span>
                  )}
                </dd>
              </div>
              {event.registration_type === "external" && (
                <div className="col-span-2">
                  <dt className="text-gray-500">External Link</dt>
                  <dd className="font-medium text-gray-900">
                    <a href={event.external_link || "#"} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      {event.external_link || "Not set"}
                    </a>
                  </dd>
                </div>
              )}
            </dl>
          </SectionCard>

          <SectionCard title="Partners & Sponsors" icon={Building2} href={`/${slug}/events/${eventId}/partners`} color="orange" count={partners.length}>
            {partners.length === 0 ? (
              <p className="text-sm text-gray-500">No partners or sponsors added yet.</p>
            ) : (
              <div className="flex flex-wrap gap-3">
                {partners.map((p) => (
                  <div key={p.id} className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
                    {p.company && <CompanyLogo company={p.company} size="sm" />}
                    <span className="text-sm font-medium">{p.company?.name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${
                      p.relationship === "sponsor" ? "bg-purple-100 text-purple-700" :
                      p.relationship === "organizer" ? "bg-blue-100 text-blue-700" :
                      p.relationship === "supporter" ? "bg-teal-100 text-teal-700" :
                      "bg-orange-100 text-orange-700"
                    }`}>{p.relationship}</span>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          <SectionCard title="Speakers" icon={Users} href={`/${slug}/events/${eventId}/speakers`} color="purple" count={speakers.length}>
            {speakers.length === 0 ? (
              <p className="text-sm text-gray-500">No speakers added yet.</p>
            ) : (
              <div className="flex flex-wrap gap-3">
                {speakers.map((es) => (
                  <div key={es.id} className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg">
                    {es.speaker?.asset?.url ? (
                      <img src={es.speaker.asset.url} className="w-6 h-6 rounded-full object-cover" />
                    ) : (
                      <Users className="w-4 h-4 text-gray-400" />
                    )}
                    <span className="text-sm font-medium">{es.speaker?.name}</span>
                    <span className="text-xs text-gray-400">
                      {es.speaker?.company?.name || es.speaker?.title}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          <SectionCard title="Agenda" icon={CalendarDays} href={`/${slug}/events/${eventId}/agenda`} color="green" count={schedules.length}>
            {schedules.length === 0 ? (
              <p className="text-sm text-gray-500">No sessions added yet.</p>
            ) : (
              <div className="space-y-3">
                {Object.entries(groupedSchedules).map(([day, sessions]) => (
                  <div key={day}>
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Day {day}</h4>
                    <div className="space-y-1">
                      {sessions.map((s) => (
                        <div key={s.id} className="flex items-center gap-3 text-sm">
                          <span className="text-gray-500 w-20">
                            {s.session_start?.split("T")[1]?.slice(0, 5)}
                          </span>
                          <span className="font-medium">{s.session_title}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          <SectionCard title="FAQs" icon={HelpCircle} href={`/${slug}/events/${eventId}/faqs`} color="teal" count={event.faqs ? event.faqs.length : 0}>
            {!event.faqs || event.faqs.length === 0 ? (
              <p className="text-sm text-gray-500">No FAQs added yet.</p>
            ) : (
              <div className="space-y-2">
                {(event.faqs as { question: string; answer: string }[]).map((faq, i) => (
                  <div key={i} className="text-sm">
                    <p className="font-medium text-gray-900">Q: {faq.question}</p>
                    <p className="text-gray-600 ml-4" dangerouslySetInnerHTML={{ __html: faq.answer }} />
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          <SectionCard title="Tickets" icon={Ticket} href={`/${slug}/events/${eventId}/tickets`} color="pink" count={tickets.length}>
            {tickets.length === 0 ? (
              <p className="text-sm text-gray-500">No tickets created yet.</p>
            ) : (
              <div className="space-y-2">
                {tickets.map((t) => (
                  <div key={t.id} className="flex items-center justify-between text-sm">
                    <span className="font-medium">{t.name}</span>
                    <span className="text-gray-600">
                      {t.price === 0 ? "Free" : `$${t.price}`} {t.quantity && `• Qty: ${t.quantity}`}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </div>

        <div className="mt-8 bg-white rounded-2xl border border-gray-200 p-6">
          {isPublished ? (
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">Event is Live</h3>
                <p className="text-sm text-gray-500">Manage RSVPs and check in guests</p>
              </div>
              <Link
                href={`/${slug}/events/${eventId}/registrations`}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#3182ce] text-white rounded-xl font-medium text-sm hover:bg-[#2c5cb8]"
              >
                <Ticket className="w-4 h-4" />
                Manage RSVPs & Check-in
              </Link>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">Ready to Publish?</h3>
                <p className="text-sm text-gray-500">Review all sections above before publishing</p>
              </div>
              <button
                onClick={() => {
                  setValidationErrors(validateEvent());
                  setShowPublishModal(true);
                }}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors"
              >
                <Send className="w-4 h-4" />
                Publish Event
              </button>
            </div>
          )}
        </div>
      </div>

      <ConfirmationModal
        isOpen={showPublishModal}
        title="Publish Event"
        message={`Are you sure you want to publish "${event.title}"? After publishing, the event will be visible to the public and you can manage RSVPs and check in guests.`}
        confirmLabel={publishing ? "Publishing..." : "Publish Event"}
        cancelLabel="Review More"
        variant="info"
        onConfirm={handlePublish}
        onCancel={() => setShowPublishModal(false)}
      />

      <ConfirmationModal
        isOpen={showUnpublishModal}
        title="Unpublish Event"
        message={`Are you sure you want to unpublish "${event.title}"? The event will be moved back to draft and will no longer be visible to the public.`}
        confirmLabel={publishing ? "Unpublishing..." : "Unpublish"}
        cancelLabel="Cancel"
        variant="warning"
        onConfirm={handleUnpublish}
        onCancel={() => setShowUnpublishModal(false)}
      />
    </div>
  );
}

function SectionCard({ title, icon: Icon, href, color, count, children }: {
  title: string;
  icon: React.ElementType;
  href: string;
  color: string;
  count?: number;
  children: React.ReactNode;
}) {
  const colorMap: Record<string, string> = {
    blue: "bg-blue-50 text-blue-600",
    orange: "bg-orange-50 text-orange-600",
    purple: "bg-purple-50 text-purple-600",
    green: "bg-green-50 text-green-600",
    teal: "bg-teal-50 text-teal-600",
    pink: "bg-pink-50 text-pink-600",
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorMap[color] || colorMap.blue}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{title}</h3>
            {count !== undefined && (
              <p className="text-xs text-gray-500">{count} {count === 1 ? "item" : "items"}</p>
            )}
          </div>
        </div>
        <Link href={href} className="text-sm text-[#3182ce] hover:underline">
          Edit
        </Link>
      </div>
      {children}
    </div>
  );
}
