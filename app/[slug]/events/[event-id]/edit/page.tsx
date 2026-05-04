"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import {
  Calendar,
  Loader2,
  ArrowLeft,
  MapPin,
  Globe,
  Save,
} from "lucide-react";
import { Event, EVENT_FORMATS } from "@/types/company";
import { getEventById, updateEvent } from "@/lib/supabase";
import { checkAuthClient, getAuthRedirectUrl } from "@/lib/auth-client";
import Navbar from "@/components/parts/Navbar";
import Breadcrumb from "@/components/parts/Breadcrumb";
import { useToast } from "@/components/ui/Toast";
import RichTextEditor from "@/components/parts/RichTextEditor";

interface Props {
  params: Promise<{ slug: string; "event-id": string }>;
}

export default function EditEventPage({ params }: Props) {
  const { slug, "event-id": eventId } = use(params);
  const { showToast } = useToast();
  const [event, setEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<{ name: string; email: string; avatar?: string } | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    location: "",
    format: "Conference",
    status: "Upcoming",
    publish_status: "draft",
    start_date: "",
    start_time: "",
    end_date: "",
    end_time: "",
    seo_description: "",
    full_description: "",
    tags: "",
    external_link: "",
  });

  const [dateError, setDateError] = useState<string | null>(null);

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
    setFormData({
      title: data.title || "",
      location: data.location || "",
      format: data.format || "Conference",
      status: data.status || "Upcoming",
      publish_status: data.publish_status || "draft",
      start_date: data.start_date ? data.start_date.split("T")[0] : "",
      start_time: data.start_date ? data.start_date.split("T")[1]?.slice(0, 5) || "" : "",
      end_date: data.end_date ? data.end_date.split("T")[0] : "",
      end_time: data.end_date ? data.end_date.split("T")[1]?.slice(0, 5) || "" : "",
      seo_description: data.seo_description || "",
      full_description: data.full_description || "",
      tags: data.tags || "",
      external_link: data.external_link || "",
    });
    setIsLoading(false);
  };

  const handleSave = async () => {
    if (!event) return;

    setDateError(null);
    if (formData.start_date && formData.end_date) {
      const start = new Date(formData.start_date + (formData.start_time ? "T" + formData.start_time : "T00:00"));
      const end = new Date(formData.end_date + (formData.end_time ? "T" + formData.end_time : "T00:00"));
      if (end < start) {
        setDateError("End date/time cannot be before start date/time");
        return;
      }
    }

    setIsSaving(true);

    const startDateTime = formData.start_date
      ? new Date(formData.start_date + (formData.start_time ? "T" + formData.start_time : "T00:00")).toISOString()
      : null;
    const endDateTime = formData.end_date
      ? new Date(formData.end_date + (formData.end_time ? "T" + formData.end_time : "T00:00")).toISOString()
      : null;

    const { data, error } = await updateEvent(eventId, {
      title: formData.title,
      location: formData.location || null,
      format: formData.format as Event["format"],
      status: formData.status as Event["status"],
      publish_status: formData.publish_status,
      start_date: startDateTime,
      end_date: endDateTime,
      seo_description: formData.seo_description || null,
      full_description: formData.full_description || null,
      tags: formData.tags || null,
      external_link: formData.external_link || null,
    });
    if (error) {
      setError("Failed to save");
      showToast("Failed to save changes", "error");
    } else if (data) {
      setEvent(data);
      showToast("Changes saved successfully", "success");
    }
    setIsSaving(false);
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
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Breadcrumb items={[
          { label: "Events", href: `/${slug}/events` },
          { label: event?.title || "Event", href: `/${slug}/events/${eventId}` },
          { label: "Edit Event", href: `/${slug}/events/${eventId}/edit` },
        ]} />

        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-[#3182ce]/10 rounded-xl flex items-center justify-center">
              <Calendar className="w-6 h-6 text-[#3182ce]" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Edit Event</h1>
              <p className="text-sm text-gray-500">Update event details</p>
            </div>
          </div>

          <div className="grid gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Event Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#3182ce]/20 focus:border-[#3182ce] outline-none"
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Format</label>
                <select
                  value={formData.format}
                  onChange={(e) => setFormData({ ...formData, format: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#3182ce]/20 focus:border-[#3182ce] outline-none bg-white"
                >
                  {EVENT_FORMATS.map((f) => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#3182ce]/20 focus:border-[#3182ce] outline-none bg-white"
                >
                  <option value="Upcoming">Upcoming</option>
                  <option value="Featured">Featured</option>
                  <option value="Happening">Happening</option>
                  <option value="Past">Past</option>
                </select>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Start Date & Time</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#3182ce]/20 focus:border-[#3182ce] outline-none"
                  />
                  <input
                    type="time"
                    value={formData.start_time}
                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#3182ce]/20 focus:border-[#3182ce] outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">End Date & Time</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => {
                      const newEndDate = e.target.value;
                      if (formData.start_date && newEndDate && newEndDate < formData.start_date) {
                        setDateError("End date cannot be before start date");
                      } else {
                        setDateError(null);
                      }
                      setFormData({ ...formData, end_date: newEndDate });
                    }}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#3182ce]/20 focus:border-[#3182ce] outline-none"
                  />
                  <input
                    type="time"
                    value={formData.end_time}
                    onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#3182ce]/20 focus:border-[#3182ce] outline-none"
                  />
                </div>
                {dateError && (
                  <p className="text-sm text-red-600 mt-1">{dateError}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                <MapPin className="w-4 h-4 inline mr-1" /> Location
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#3182ce]/20 focus:border-[#3182ce] outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                <Globe className="w-4 h-4 inline mr-1" /> External Link
              </label>
              <input
                type="url"
                value={formData.external_link}
                onChange={(e) => setFormData({ ...formData, external_link: e.target.value })}
                placeholder="https://..."
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#3182ce]/20 focus:border-[#3182ce] outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Description</label>
              <RichTextEditor
                content={formData.full_description}
                onChange={(html) => setFormData({ ...formData, full_description: html })}
              />
            </div>

            <div className="pt-4">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#3182ce] text-white rounded-xl font-medium hover:bg-[#2c5cb8] transition-colors disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}