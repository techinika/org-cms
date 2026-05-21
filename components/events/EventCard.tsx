"use client";

import { Event } from "@/types/company";
import { Calendar, Loader2, MoreVertical, Trash2, ExternalLink, CheckCircle2 } from "lucide-react";
import Link from "next/link";

interface EventCardProps {
  event: Event;
  slug: string;
  onConfirmDelete: (event: Event) => void;
  deletingId: string | null;
  showMenu: string | null;
  onToggleMenu: (eventId: string | null) => void;
}

export function EventCard({
  event,
  slug,
  onConfirmDelete,
  deletingId,
  showMenu,
  onToggleMenu,
}: EventCardProps) {
  const isExternal = event.registration_type === "external";
  const eventUrl = isExternal && event.external_link
    ? event.external_link
    : `/${slug}/events/${event.id}`;

  return (
    <div className="p-4 flex items-center gap-4 hover:bg-gray-50 transition-colors">
      <Link
        href={eventUrl}
        target={isExternal ? "_blank" : undefined}
        rel={isExternal ? "noopener noreferrer" : undefined}
        className="w-14 h-14 bg-[#3182ce]/10 rounded-xl flex items-center justify-center flex-shrink-0"
      >
        <Calendar className="w-7 h-7 text-[#3182ce]" />
      </Link>
      <div className="flex-1 min-w-0">
        <Link
          href={eventUrl}
          target={isExternal ? "_blank" : undefined}
          rel={isExternal ? "noopener noreferrer" : undefined}
          className="font-medium text-gray-900 hover:text-[#3182ce] transition-colors block truncate"
        >
          {event.title}
        </Link>
        <p className="text-sm text-gray-500">{event.location || "No location"}</p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-sm text-gray-500">
          {event.start_date ? new Date(event.start_date).toLocaleDateString() : "TBA"}
        </p>
        <div className="flex items-center gap-1.5 justify-end mt-0.5">
          <span
            className={`text-xs px-2 py-0.5 rounded-full ${
              event.status === "Upcoming" ||
              event.status === "Happening" ||
              event.publish_status === "published"
                ? "bg-green-100 text-green-700"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            {event.status || "draft"}
          </span>
          <span className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1 ${
            isExternal ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"
          }`}>
            {isExternal ? (
              <ExternalLink className="w-3 h-3" />
            ) : (
              <CheckCircle2 className="w-3 h-3" />
            )}
            {isExternal ? "External" : "Platform"}
          </span>
        </div>
      </div>
      <div className="relative">
        <button
          onClick={() => onToggleMenu(showMenu === event.id ? null : event.id)}
          className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
        >
          <MoreVertical className="w-5 h-5 text-gray-400" />
        </button>
        {showMenu === event.id && (
          <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-xl shadow-lg border border-gray-200 py-1 z-10">
            <button
              onClick={() => onConfirmDelete(event)}
              disabled={deletingId === event.id}
              className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
            >
              {deletingId === event.id ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

interface EventEmptyStateProps {
  companyName: string;
  createHref: string;
}

export function EventEmptyState({ companyName, createHref }: EventEmptyStateProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-12">
      <div className="flex flex-col items-center text-center">
        <div className="w-16 h-16 bg-[#3182ce]/10 rounded-2xl flex items-center justify-center mb-4">
          <Calendar className="w-8 h-8 text-[#3182ce]" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">No events yet</h2>
        <p className="text-gray-500 max-w-sm mb-6">Create your first event for {companyName}</p>
        <Link
          href={createHref}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#3182ce] text-white rounded-xl font-medium text-sm hover:bg-[#2c5cb8] transition-colors"
        >
          Create Event
        </Link>
      </div>
    </div>
  );
}