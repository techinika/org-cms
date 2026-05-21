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
  Search,
  Users,
} from "lucide-react";
import { Event, EventSchedule } from "@/types/company";
import { getEventById, getEventSchedules, createEventSchedule, updateEventSchedule, deleteEventSchedule } from "@/lib/supabase";
import { checkAuthClient, getAuthRedirectUrl } from "@/lib/auth-client";
import Navbar from "@/components/parts/Navbar";
import Breadcrumb from "@/components/parts/Breadcrumb";
import { useToast } from "@/components/ui/Toast";
import { supabase } from "@/lib/supabase";

interface EventSpeaker {
  id: string;
  speaker_id: string;
  speaker?: {
    id: string;
    name: string;
    title: string | null;
    asset?: {
      url: string;
    };
  };
}

interface Props {
  params: Promise<{ slug: string; "event-id": string }>;
}

function getDayLabel(event: Event, dayIndex: number): string {
  if (!event.start_date) return `Day ${dayIndex}`;
  const start = new Date(event.start_date);
  const dayDate = new Date(start);
  dayDate.setDate(dayDate.getDate() + dayIndex - 1);
  return dayDate.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function getEventDays(event: Event): number {
  if (!event.start_date) return 1;
  if (!event.end_date) return 1;
  const start = new Date(event.start_date);
  const end = new Date(event.end_date);
  const diff = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  return Math.max(1, diff);
}

function formatEventDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatSessionTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

function toDatetimeLocal(dateStr: string): string {
  const d = new Date(dateStr);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function EventAgendaPage({ params }: Props) {
  const { slug, "event-id": eventId } = use(params);
  const { showToast } = useToast();
  const [event, setEvent] = useState<Event | null>(null);
  const [schedules, setSchedules] = useState<EventSchedule[]>([]);
  const [eventSpeakers, setEventSpeakers] = useState<EventSpeaker[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<EventSchedule | null>(null);
  const [form, setForm] = useState({
    day_index: 1,
    session_title: "",
    session_description: "",
    session_start: "",
    session_end: "",
    location: "",
    speaker_id: "",
    speaker_relation: "",
    order_index: 0,
  });
  const [speakerSearch, setSpeakerSearch] = useState("");
  const [showSpeakerDropdown, setShowSpeakerDropdown] = useState(false);
  const [saving, setSaving] = useState(false);

  async function checkAuth() {
    const authResult = await checkAuthClient();
    if (!authResult.authenticated || !authResult.user) {
      window.location.assign(getAuthRedirectUrl());
      return;
    }
    fetchData();
  }

  useEffect(() => {
    checkAuth();
  }, [slug, eventId]);

  async function fetchData() {
    setIsLoading(true);
    setError(null);
    try {
      const { data: eventData } = await getEventById(eventId);
      if (eventData) setEvent(eventData);

      const { data: schedulesData } = await getEventSchedules(eventId);
      setSchedules(schedulesData || []);

      const { data: eventSpeakersRaw } = await supabase
        .from("event_speakers")
        .select("id, speaker_id")
        .eq("event_id", eventId);
      const speakerIds = (eventSpeakersRaw || []).map((es: { id: string; speaker_id: string }) => es.speaker_id);
      if (speakerIds.length > 0) {
        const { data: speakersData } = await supabase
          .from("speakers")
          .select("id, name, title, asset:assets!image_ref(url)")
          .in("id", speakerIds);
        type SpeakerRow = { id: string; name: string; title: string | null; asset: { url: string }[] | null };
        type SpeakerMapped = { id: string; name: string; title: string | null; asset: { url: string } | null };
        const speakerMap = new Map<string, SpeakerMapped>((speakersData || []).map((s: SpeakerRow) => [
          s.id,
          { id: s.id, name: s.name, title: s.title, asset: Array.isArray(s.asset) ? s.asset[0] : s.asset },
        ]));
        setEventSpeakers(
          ((eventSpeakersRaw || []) as { id: string; speaker_id: string }[]).map((es) => ({
            id: es.id,
            speaker_id: es.speaker_id,
            speaker: speakerMap.get(es.speaker_id),
          })) as EventSpeaker[]
        );
      } else {
        setEventSpeakers([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load agenda data");
    } finally {
      setIsLoading(false);
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const sessionStart = form.session_start ? new Date(form.session_start).toISOString() : undefined;
    const sessionEnd = form.session_end ? new Date(form.session_end).toISOString() : undefined;

    const data = {
      event_id: eventId,
      day_index: form.day_index,
      session_title: form.session_title,
      session_description: form.session_description || undefined,
      session_start: sessionStart,
      session_end: sessionEnd,
      location: form.location || undefined,
      speakers: form.speaker_id ? [form.speaker_id] : undefined,
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
    const defaultStart = event?.start_date ? toDatetimeLocal(event.start_date) : "";
    setForm({
      day_index: 1,
      session_title: "",
      session_description: "",
      session_start: defaultStart,
      session_end: "",
      location: "",
      speaker_id: "",
      speaker_relation: "",
      order_index: 0,
    });
    setSpeakerSearch("");
  };

  const openEdit = (s: EventSchedule) => {
    setEditingSchedule(s);
    const startVal = s.session_start ? toDatetimeLocal(s.session_start) : "";
    const endVal = s.session_end ? toDatetimeLocal(s.session_end) : "";
    setForm({
      day_index: s.day_index || 1,
      session_title: s.session_title,
      session_description: s.session_description || "",
      session_start: startVal,
      session_end: endVal,
      location: s.location || "",
      speaker_id: s.speakers?.[0] || "",
      speaker_relation: s.speaker_relation || "",
      order_index: s.order_index || 0,
    });
    const selectedSpeaker = eventSpeakers.find((es) => es.speaker_id === s.speakers?.[0]);
    setSpeakerSearch(selectedSpeaker?.speaker?.name || "");
    setShowForm(true);
  };

  const eventDays = event ? getEventDays(event) : 1;
  const isSingleDay = eventDays <= 1;

  const groupedSchedules = schedules.reduce((acc, s) => {
    const day = s.day_index || 1;
    if (!acc[day]) acc[day] = [];
    acc[day].push(s);
    return acc;
  }, {} as Record<number, EventSchedule[]>);

  const eventMinDatetime = event?.start_date ? toDatetimeLocal(event.start_date) : "";
  const eventMaxDatetime = event?.end_date ? toDatetimeLocal(event.end_date) : "";

  const filteredSpeakers = eventSpeakers.filter((es) =>
    es.speaker?.name?.toLowerCase().includes(speakerSearch.toLowerCase())
  );

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
      <Navbar />
      
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
            {event?.start_date && (
              <p className="text-sm text-gray-400 mt-1">
                Event runs {formatEventDate(event.start_date)}
                {event.end_date && ` – ${formatEventDate(event.end_date)}`}
              </p>
            )}
          </div>
        ) : (
          Object.entries(groupedSchedules).map(([day, sessions]) => (
            <div key={day} className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                {isSingleDay ? "Sessions" : getDayLabel(event, parseInt(day))}
              </h3>
              <div className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-200">
                {sessions.map((s) => {
                  const matchedSpeaker = s.speakers?.[0]
                    ? eventSpeakers.find((es) => es.speaker_id === s.speakers![0])
                    : undefined;
                  return (
                    <div key={s.id} className="p-4 flex items-center gap-4">
                      <GripVertical className="w-5 h-5 text-gray-300 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{s.session_title}</p>
                        <p className="text-sm text-gray-500 truncate">
                          {s.session_start && formatSessionTime(s.session_start)}
                          {s.session_end && ` – ${formatSessionTime(s.session_end)}`}
                          {s.location && ` • ${s.location}`}
                        </p>
                        {matchedSpeaker && (
                          <p className="text-xs text-gray-400 mt-0.5">
                            {matchedSpeaker.speaker?.name}
                            {s.speaker_relation && ` (${s.speaker_relation})`}
                          </p>
                        )}
                      </div>
                      <button onClick={() => openEdit(s)} className="text-[#3182ce] hover:underline text-sm flex-shrink-0">Edit</button>
                      <button onClick={() => handleDelete(s.id)} className="p-2 text-gray-400 hover:text-red-600 flex-shrink-0">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  );
                })}
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
                    <label className="block text-sm font-medium mb-1">{isSingleDay ? "Day" : "Day"}</label>
                    <select
                      value={form.day_index}
                      onChange={(e) => setForm({ ...form, day_index: parseInt(e.target.value) })}
                      className="w-full px-4 py-2.5 border rounded-xl"
                    >
                      {Array.from({ length: eventDays }, (_, i) => i + 1).map((d) => (
                        <option key={d} value={d}>
                          {isSingleDay ? `Day ${d}` : getDayLabel(event, d)}
                        </option>
                      ))}
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
                  <label className="block text-sm font-medium mb-1">Session Description</label>
                  <textarea
                    value={form.session_description}
                    onChange={(e) => setForm({ ...form, session_description: e.target.value })}
                    className="w-full px-4 py-2.5 border rounded-xl"
                    rows={2}
                    placeholder="Brief description..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Start Date & Time</label>
                    <input
                      type="datetime-local"
                      value={form.session_start}
                      onChange={(e) => setForm({ ...form, session_start: e.target.value })}
                      min={eventMinDatetime}
                      max={eventMaxDatetime}
                      className="w-full px-4 py-2.5 border rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">End Date & Time</label>
                    <input
                      type="datetime-local"
                      value={form.session_end}
                      onChange={(e) => setForm({ ...form, session_end: e.target.value })}
                      min={eventMinDatetime}
                      max={eventMaxDatetime}
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
                  <label className="block text-sm font-medium mb-1">Speaker</label>
                  <div className="relative">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search event speakers..."
                        value={speakerSearch}
                        onChange={(e) => {
                          setSpeakerSearch(e.target.value);
                          setForm({ ...form, speaker_id: "" });
                          setShowSpeakerDropdown(true);
                        }}
                        onFocus={() => setShowSpeakerDropdown(true)}
                        className="w-full pl-10 pr-4 py-2.5 border rounded-xl"
                      />
                    </div>
                    {showSpeakerDropdown && (
                      <>
                        <div className="absolute z-10 top-full mt-1 left-0 right-0 bg-white border rounded-xl shadow-lg max-h-48 overflow-y-auto">
                          {filteredSpeakers.length === 0 ? (
                            <p className="text-sm text-gray-400 text-center py-3">No speakers found</p>
                          ) : (
                            filteredSpeakers.map((es) => (
                              <button
                                key={es.id}
                                type="button"
                                onClick={() => {
                                  setForm({ ...form, speaker_id: es.speaker_id });
                                  setSpeakerSearch(es.speaker?.name || "");
                                  setShowSpeakerDropdown(false);
                                }}
                                className={`w-full px-3 py-2.5 text-left text-sm hover:bg-gray-50 flex items-center gap-3 ${
                                  form.speaker_id === es.speaker_id ? "bg-[#3182ce]/5" : ""
                                }`}
                              >
                                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                                  {es.speaker?.asset?.url ? (
                                    <img src={es.speaker.asset.url} alt="" className="w-8 h-8 object-cover" />
                                  ) : (
                                    <Users className="w-4 h-4 text-gray-400" />
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <p className="font-medium truncate">{es.speaker?.name}</p>
                                  {es.speaker?.title && (
                                    <p className="text-xs text-gray-500 truncate">{es.speaker.title}</p>
                                  )}
                                </div>
                              </button>
                            ))
                          )}
                        </div>
                        <div className="fixed inset-0 z-[-1]" onClick={() => setShowSpeakerDropdown(false)} />
                      </>
                    )}
                  </div>
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
