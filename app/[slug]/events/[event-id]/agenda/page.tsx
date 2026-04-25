"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import {
  CalendarDays,
  Loader2,
  ArrowLeft,
  Plus,
  Trash2,
  GripVertical,
} from "lucide-react";
import { Event, EventSchedule } from "@/types/company";
import { getEventById, getEventSchedules, createEventSchedule, updateEventSchedule, deleteEventSchedule } from "@/lib/supabase";
import { checkAuthClient, getAuthRedirectUrl } from "@/lib/auth-client";
import Navbar from "@/components/parts/Navbar";
import Breadcrumb from "@/components/parts/Breadcrumb";
import { useToast } from "@/components/ui/Toast";

interface Props {
  params: Promise<{ slug: string; "event-id": string }>;
}

export default function EventAgendaPage({ params }: Props) {
  const { slug, "event-id": eventId } = use(params);
  const { showToast } = useToast();
  const [event, setEvent] = useState<Event | null>(null);
  const [schedules, setSchedules] = useState<EventSchedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<{ name: string; email: string; avatar?: string } | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<EventSchedule | null>(null);
  const [form, setForm] = useState({ 
    day_index: 1, 
    session_title: "", 
    session_description: "", 
    session_date: "",
    session_start_time: "", 
    session_end_time: "", 
    location: "", 
    speakers: "",
    speaker_relation: "",
    order_index: 0
  });
  const [saving, setSaving] = useState(false);

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

    const { data: schedulesData } = await getEventSchedules(eventId);
    setSchedules(schedulesData || []);
    setIsLoading(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const eventStartDate = event?.start_date ? new Date(event.start_date) : new Date();
    
    let sessionStartDate: Date | undefined;
    let sessionEndDate: Date | undefined;
    
    if (form.session_date && form.session_start_time) {
      const startParts = form.session_date.split("-");
      const startTimeParts = form.session_start_time.split(":");
      sessionStartDate = new Date(
        parseInt(startParts[0]),
        parseInt(startParts[1]) - 1,
        parseInt(startParts[2]),
        parseInt(startTimeParts[0]),
        parseInt(startTimeParts[1])
      );
    }
    
    if (form.session_date && form.session_end_time) {
      const endParts = form.session_date.split("-");
      const endTimeParts = form.session_end_time.split(":");
      sessionEndDate = new Date(
        parseInt(endParts[0]),
        parseInt(endParts[1]) - 1,
        parseInt(endParts[2]),
        parseInt(endTimeParts[0]),
        parseInt(endTimeParts[1])
      );
    }

    const data = {
      event_id: eventId,
      day_index: form.day_index,
      session_title: form.session_title,
      session_description: form.session_description || undefined,
      session_start: sessionStartDate?.toISOString() || undefined,
      session_end: sessionEndDate?.toISOString() || undefined,
      location: form.location || undefined,
      speakers: form.speakers ? [form.speakers] : undefined,
      speaker_relation: form.speaker_relation || undefined,
      order_index: form.order_index || 0,
    };

    let error;
    if (editingSchedule) {
      ({ error } = await updateEventSchedule(editingSchedule.id, data));
    } else {
      ({ error } = await createEventSchedule(data));
    }

    setSaving(false);
    if (error) {
      showToast("Failed to save session", "error");
    } else {
      showToast(editingSchedule ? "Session updated" : "Session created", "success");
      resetForm();
      fetchData();
    }
  };

  const handleDelete = async (id: string) => {
    setSaving(true);
    const { error } = await deleteEventSchedule(id);
    if (error) {
      showToast("Failed to delete", "error");
    } else {
      showToast("Session deleted", "success");
      fetchData();
    }
    setSaving(false);
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingSchedule(null);
    const defaultDate = event?.start_date ? event.start_date.split("T")[0] : "";
    setForm({ 
      day_index: 1, 
      session_title: "", 
      session_description: "", 
      session_date: defaultDate,
      session_start_time: "", 
      session_end_time: "", 
      location: "", 
      speakers: "",
      speaker_relation: "",
      order_index: 0
    });
  };

  const openEdit = (s: EventSchedule) => {
    setEditingSchedule(s);
    const startDate = s.session_start ? s.session_start.split("T")[0] : event?.start_date?.split("T")[0] || "";
    const startTime = s.session_start ? s.session_start.split("T")[1]?.slice(0, 5) : "";
    const endTime = s.session_end ? s.session_end.split("T")[1]?.slice(0, 5) : "";
    setForm({
      day_index: s.day_index || 1,
      session_title: s.session_title,
      session_description: s.session_description || "",
      session_date: startDate,
      session_start_time: startTime,
      session_end_time: endTime,
      location: s.location || "",
      speakers: s.speakers?.[0] || "",
      speaker_relation: s.speaker_relation || "",
      order_index: s.order_index || 0,
    });
    setShowForm(true);
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
          { label: "Agenda", href: `/${slug}/events/${eventId}/agenda` },
        ]} />

        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <CalendarDays className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Agenda</h1>
                <p className="text-sm text-gray-500">{event.title}</p>
              </div>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#3182ce] text-white rounded-xl font-medium text-sm hover:bg-[#2c5cb8] transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Session
            </button>
          </div>
        </div>

        {Object.keys(groupedSchedules).length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <CalendarDays className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No sessions added</h2>
            <p className="text-gray-500">Add sessions to build your event agenda.</p>
          </div>
        ) : (
          Object.entries(groupedSchedules).map(([day, sessions]) => (
            <div key={day} className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Day {day}</h3>
              <div className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-200">
                {sessions.map((s) => (
                  <div key={s.id} className="p-4 flex items-center gap-4">
                    <GripVertical className="w-5 h-5 text-gray-300" />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{s.session_title}</p>
                      <p className="text-sm text-gray-500">
                        {s.session_start?.split("T")[1]?.slice(0, 5)} - {s.session_end?.split("T")[1]?.slice(0, 5)} {s.location && `• ${s.location}`}
                      </p>
                    </div>
                    <button onClick={() => openEdit(s)} className="text-[#3182ce] hover:underline text-sm">Edit</button>
                    <button onClick={() => handleDelete(s.id)} className="p-2 text-gray-400 hover:text-red-600">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}

        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50" onClick={resetForm} />
            <div className="relative bg-white rounded-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
              <h2 className="text-lg font-semibold mb-4">{editingSchedule ? "Edit Session" : "Add Session"}</h2>
              <form onSubmit={handleSave} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Day</label>
                    <select
                      value={form.day_index}
                      onChange={(e) => setForm({ ...form, day_index: parseInt(e.target.value) })}
                      className="w-full px-4 py-2.5 border rounded-xl"
                    >
                      {[1, 2, 3, 4, 5].map((d) => <option key={d} value={d}>Day {d}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Order</label>
                    <input
                      type="number"
                      value={form.order_index}
                      onChange={(e) => setForm({ ...form, order_index: parseInt(e.target.value) })}
                      className="w-full px-4 py-2.5 border rounded-xl"
                      placeholder="0"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Session Title *</label>
                  <input
                    value={form.session_title}
                    onChange={(e) => setForm({ ...form, session_title: e.target.value })}
                    className="w-full px-4 py-2.5 border rounded-xl"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Date</label>
                  <input
                    type="date"
                    value={form.session_date}
                    onChange={(e) => setForm({ ...form, session_date: e.target.value })}
                    className="w-full px-4 py-2.5 border rounded-xl"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Start Time</label>
                    <input
                      type="time"
                      value={form.session_start_time}
                      onChange={(e) => setForm({ ...form, session_start_time: e.target.value })}
                      className="w-full px-4 py-2.5 border rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">End Time</label>
                    <input
                      type="time"
                      value={form.session_end_time}
                      onChange={(e) => setForm({ ...form, session_end_time: e.target.value })}
                      className="w-full px-4 py-2.5 border rounded-xl"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Location / Room</label>
                  <input
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    className="w-full px-4 py-2.5 border rounded-xl"
                    placeholder="e.g. Main Hall"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Speaker ID</label>
                  <input
                    value={form.speakers}
                    onChange={(e) => setForm({ ...form, speakers: e.target.value })}
                    className="w-full px-4 py-2.5 border rounded-xl"
                    placeholder="Speaker UUID"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Speaker Relation</label>
                  <input
                    value={form.speaker_relation}
                    onChange={(e) => setForm({ ...form, speaker_relation: e.target.value })}
                    className="w-full px-4 py-2.5 border rounded-xl"
                    placeholder="e.g. Keynote Speaker"
                  />
                </div>
                
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={resetForm} className="flex-1 px-4 py-2 bg-gray-100 rounded-xl">Cancel</button>
                  <button type="submit" disabled={saving} className="flex-1 px-4 py-2 bg-[#3182ce] text-white rounded-xl disabled:opacity-50">
                    {saving ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Save"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}