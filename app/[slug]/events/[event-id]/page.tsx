"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import {
  Calendar,
  Loader2,
  ArrowLeft,
  MapPin,
  Globe,
  Clock,
  Save,
  Trash2,
  Eye,
  Ticket,
  Plus,
  Users,
  GripVertical,
  Edit2,
} from "lucide-react";
import { Event, EventSchedule, EventTicket, EVENT_FORMATS } from "@/types/company";
import { getEventById, updateEvent, deleteEvent, getEventSchedules, createEventSchedule, updateEventSchedule, deleteEventSchedule, getEventTickets, createEventTicket, updateEventTicket, deleteEventTicket } from "@/lib/supabase";
import { checkAuthClient, getAuthRedirectUrl } from "@/lib/auth-client";
import Navbar from "@/components/parts/Navbar";

interface Props {
  params: Promise<{ slug: string; "event-id": string }>;
}

export default function EventPage({ params }: Props) {
  const { slug, "event-id": eventId } = use(params);
  const [event, setEvent] = useState<Event | null>(null);
  const [schedules, setSchedules] = useState<EventSchedule[]>([]);
  const [tickets, setTickets] = useState<EventTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<{ name: string; email: string; avatar?: string } | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<"details" | "schedule" | "tickets">("details");
  
  // Schedule form state
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<EventSchedule | null>(null);
  const [scheduleForm, setScheduleForm] = useState({
    day_index: 1,
    session_title: "",
    session_description: "",
    session_start: "",
    session_end: "",
    location: "",
    speakers: "",
  });

  // Ticket form state
  const [showTicketForm, setShowTicketForm] = useState(false);
  const [editingTicket, setEditingTicket] = useState<EventTicket | null>(null);
  const [ticketForm, setTicketForm] = useState({
    name: "",
    description: "",
    price: 0,
    currency: "USD",
    quantity: 10,
    is_active: true,
  });

  const [formData, setFormData] = useState({
    title: "",
    location: "",
    format: "",
    status: "",
    start_date: "",
    end_date: "",
    seo_description: "",
    full_description: "",
    tags: "",
    external_link: "",
  });

  const fetchEvent = async () => {
    setIsLoading(true);
    const [eventData, schedulesData, ticketsData] = await Promise.all([
      getEventById(eventId),
      getEventSchedules(eventId),
      getEventTickets(eventId),
    ]);

    if (eventData.error || !eventData.data) {
      setError("Event not found");
      setIsLoading(false);
      return;
    }

    setEvent(eventData.data);
    setSchedules(schedulesData.data || []);
    setTickets(ticketsData.data || []);
    
    const data = eventData.data;
    setFormData({
      title: data.title || "",
      location: data.location || "",
      format: data.format || "",
      status: data.status || "",
      start_date: data.start_date ? data.start_date.split("T")[0] : "",
      end_date: data.end_date ? data.end_date.split("T")[0] : "",
      seo_description: data.seo_description || "",
      full_description: data.full_description || "",
      tags: data.tags || "",
      external_link: data.external_link || "",
    });
    setIsLoading(false);
  };

  const checkAuth = async () => {
    const authResult = await checkAuthClient();
    if (!authResult.authenticated || !authResult.user) {
      window.location.href = getAuthRedirectUrl();
      return;
    }
    setUser({ name: authResult.user.name, email: authResult.user.email, avatar: authResult.user.avatar });
    fetchEvent();
  };

  useEffect(() => {
    checkAuth();
  }, [slug, eventId]);

  const saveEvent = async () => {
    if (!event) return;
    setIsSaving(true);
    const { data, error } = await updateEvent(eventId, {
      ...formData,
      start_date: formData.start_date ? new Date(formData.start_date).toISOString() : null,
      end_date: formData.end_date ? new Date(formData.end_date).toISOString() : null,
    } as Partial<Event>);
    if (error) {
      setError("Failed to save");
    } else if (data) {
      setEvent(data);
    }
    setIsSaving(false);
  };

  const handleDelete = async () => {
    setDeletingId(eventId);
    const { error } = await deleteEvent(eventId);
    if (!error) {
      window.location.href = `/${slug}?tab=events`;
    } else {
      setError("Failed to delete event");
    }
    setDeletingId(null);
    setShowDeleteModal(false);
  };

  // Schedule handlers
  const handleSaveSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    const scheduleData = {
      event_id: eventId,
      day_index: scheduleForm.day_index,
      session_title: scheduleForm.session_title,
      session_description: scheduleForm.session_description || undefined,
      session_start: scheduleForm.session_start ? new Date(`2000-01-01T${scheduleForm.session_start}`).toISOString() : undefined,
      session_end: scheduleForm.session_end ? new Date(`2000-01-01T${scheduleForm.session_end}`).toISOString() : undefined,
      location: scheduleForm.location || undefined,
      speakers: scheduleForm.speakers ? scheduleForm.speakers.split(",").map(s => s.trim()).filter(Boolean) : undefined,
    };

    if (editingSchedule) {
      const { data, error } = await updateEventSchedule(editingSchedule.id, scheduleData);
      if (!error && data) {
        setSchedules(schedules.map(s => s.id === editingSchedule.id ? data : s));
      }
    } else {
      const { data, error } = await createEventSchedule(scheduleData);
      if (!error && data) {
        setSchedules([...schedules, data]);
      }
    }

    setShowScheduleForm(false);
    setEditingSchedule(null);
    setScheduleForm({ day_index: 1, session_title: "", session_description: "", session_start: "", session_end: "", location: "", speakers: "" });
    setIsSaving(false);
  };

  const handleDeleteSchedule = async (id: string) => {
    setDeletingId(id);
    const { error } = await deleteEventSchedule(id);
    if (!error) {
      setSchedules(schedules.filter(s => s.id !== id));
    }
    setDeletingId(null);
  };

  const openEditSchedule = (schedule: EventSchedule) => {
    setEditingSchedule(schedule);
    setScheduleForm({
      day_index: schedule.day_index,
      session_title: schedule.session_title,
      session_description: schedule.session_description || "",
      session_start: schedule.session_start ? schedule.session_start.split("T")[1]?.slice(0, 5) : "",
      session_end: schedule.session_end ? schedule.session_end.split("T")[1]?.slice(0, 5) : "",
      location: schedule.location || "",
      speakers: schedule.speakers?.join(", ") || "",
    });
    setShowScheduleForm(true);
  };

  // Ticket handlers
  const handleSaveTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const ticketData = {
      event_id: eventId,
      name: ticketForm.name,
      description: ticketForm.description || null,
      price: ticketForm.price,
      currency: ticketForm.currency,
      quantity: ticketForm.quantity,
      is_active: ticketForm.is_active,
      sales_start_at: null,
      sales_end_at: null,
    };

    if (editingTicket) {
      const { data, error } = await updateEventTicket(editingTicket.id, ticketData);
      if (!error && data) {
        setTickets(tickets.map(t => t.id === editingTicket.id ? data : t));
      }
    } else {
      const { data, error } = await createEventTicket(ticketData);
      if (!error && data) {
        setTickets([...tickets, data]);
      }
    }

    setShowTicketForm(false);
    setEditingTicket(null);
    setTicketForm({ name: "", description: "", price: 0, currency: "USD", quantity: 10, is_active: true });
    setIsSaving(false);
  };

  const handleDeleteTicket = async (id: string) => {
    setDeletingId(id);
    const { error } = await deleteEventTicket(id);
    if (!error) {
      setTickets(tickets.filter(t => t.id !== id));
    }
    setDeletingId(null);
  };

  const openEditTicket = (ticket: EventTicket) => {
    setEditingTicket(ticket);
    setTicketForm({
      name: ticket.name,
      description: ticket.description || "",
      price: ticket.price,
      currency: ticket.currency,
      quantity: ticket.quantity || 10,
      is_active: ticket.is_active,
    });
    setShowTicketForm(true);
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
        <Link href={`/${slug}?tab=events`} className="text-[#3182ce] hover:underline">Go back</Link>
      </div>
    );
  }

  const groupedSchedules = schedules.reduce((acc, s) => {
    const day = s.day_index || 1;
    if (!acc[day]) acc[day] = [];
    acc[day].push(s);
    return acc;
  }, {} as Record<number, EventSchedule[]>);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user || undefined} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-6">
          <Link href={`/${slug}?tab=events`} className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-[#3182ce] transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Events
          </Link>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[#3182ce]/10 rounded-xl flex items-center justify-center">
                <Calendar className="w-6 h-6 text-[#3182ce]" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{event.title}</h1>
                <p className="text-sm text-gray-500">{event.format} • {event.location || "No location"}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${
                event.status === 'Upcoming' || event.status === 'Ongoing' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
              }`}>
                {event.status}
              </span>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-2 text-gray-500 mb-1">
                  <Eye className="w-4 h-4" />
                  <span className="text-xs">Views</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">{event.views}</p>
              </div>
              <div className="p-4 bg-[#3182ce]/10 rounded-xl">
                <div className="flex items-center gap-2 text-[#3182ce] mb-1">
                  <Calendar className="w-4 h-4" />
                  <span className="text-xs">Start Date</span>
                </div>
                <p className="text-lg font-bold text-gray-900">
                  {event.start_date ? new Date(event.start_date).toLocaleDateString() : "TBA"}
                </p>
              </div>
              <div className="p-4 bg-purple-50 rounded-xl">
                <div className="flex items-center gap-2 text-purple-600 mb-1">
                  <Clock className="w-4 h-4" />
                  <span className="text-xs">Format</span>
                </div>
                <p className="text-lg font-bold text-gray-900">{event.format}</p>
              </div>
              <div className="p-4 bg-green-50 rounded-xl">
                <div className="flex items-center gap-2 text-green-600 mb-1">
                  <Ticket className="w-4 h-4" />
                  <span className="text-xs">Status</span>
                </div>
                <p className="text-lg font-bold text-gray-900">{event.status}</p>
              </div>
            </div>

            {/* Section Tabs */}
            <div className="flex gap-2 mb-6 border-b border-gray-200">
              <button
                onClick={() => setActiveSection("details")}
                className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                  activeSection === "details"
                    ? "border-[#3182ce] text-[#3182ce]"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                Event Details
              </button>
              <button
                onClick={() => setActiveSection("schedule")}
                className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                  activeSection === "schedule"
                    ? "border-[#3182ce] text-[#3182ce]"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                Schedule ({schedules.length})
              </button>
              <button
                onClick={() => setActiveSection("tickets")}
                className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                  activeSection === "tickets"
                    ? "border-[#3182ce] text-[#3182ce]"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                Tickets ({tickets.length})
              </button>
            </div>

            {/* Details Section */}
            {activeSection === "details" && (
              <div className="pt-2">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Edit Event</h2>
                  <button
                    onClick={saveEvent}
                    disabled={isSaving}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-[#3182ce] text-white rounded-xl font-medium text-sm hover:bg-[#2c5cb8] transition-colors disabled:opacity-50"
                  >
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save Changes
                  </button>
                </div>

                <div className="grid gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Event Title</label>
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
                        <option value="">Select format</option>
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
                        <option value="">Select status</option>
                        <option value="Upcoming">Upcoming</option>
                        <option value="Ongoing">Ongoing</option>
                        <option value="Completed">Completed</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
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

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Start Date</label>
                      <input
                        type="date"
                        value={formData.start_date}
                        onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#3182ce]/20 focus:border-[#3182ce] outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">End Date</label>
                      <input
                        type="date"
                        value={formData.end_date}
                        onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#3182ce]/20 focus:border-[#3182ce] outline-none"
                      />
                    </div>
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
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Tags</label>
                    <input
                      type="text"
                      value={formData.tags}
                      onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                      placeholder="Comma-separated tags"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#3182ce]/20 focus:border-[#3182ce] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">SEO Description</label>
                    <textarea
                      value={formData.seo_description}
                      onChange={(e) => setFormData({ ...formData, seo_description: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#3182ce]/20 focus:border-[#3182ce] outline-none resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Description</label>
                    <textarea
                      value={formData.full_description}
                      onChange={(e) => setFormData({ ...formData, full_description: e.target.value })}
                      rows={4}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#3182ce]/20 focus:border-[#3182ce] outline-none resize-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Schedule Section */}
            {activeSection === "schedule" && (
              <div className="pt-2">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Event Schedule</h2>
                  <button
                    onClick={() => { setShowScheduleForm(true); setEditingSchedule(null); setScheduleForm({ day_index: 1, session_title: "", session_description: "", session_start: "", session_end: "", location: "", speakers: "" }); }}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-[#3182ce] text-white rounded-xl font-medium text-sm hover:bg-[#2c5cb8] transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add Session
                  </button>
                </div>

                {showScheduleForm && (
                  <form onSubmit={handleSaveSchedule} className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
                    <h3 className="font-medium text-gray-900 mb-4">{editingSchedule ? "Edit Session" : "Add Session"}</h3>
                    <div className="grid gap-4">
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">Day</label>
                          <select
                            value={scheduleForm.day_index}
                            onChange={(e) => setScheduleForm({ ...scheduleForm, day_index: parseInt(e.target.value) })}
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#3182ce]/20 focus:border-[#3182ce] outline-none bg-white"
                          >
                            <option value={1}>Day 1</option>
                            <option value={2}>Day 2</option>
                            <option value={3}>Day 3</option>
                            <option value={4}>Day 4</option>
                            <option value={5}>Day 5</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">Session Title</label>
                          <input
                            type="text"
                            value={scheduleForm.session_title}
                            onChange={(e) => setScheduleForm({ ...scheduleForm, session_title: e.target.value })}
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#3182ce]/20 focus:border-[#3182ce] outline-none"
                            required
                          />
                        </div>
                      </div>
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">Start Time</label>
                          <input
                            type="time"
                            value={scheduleForm.session_start}
                            onChange={(e) => setScheduleForm({ ...scheduleForm, session_start: e.target.value })}
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#3182ce]/20 focus:border-[#3182ce] outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">End Time</label>
                          <input
                            type="time"
                            value={scheduleForm.session_end}
                            onChange={(e) => setScheduleForm({ ...scheduleForm, session_end: e.target.value })}
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#3182ce]/20 focus:border-[#3182ce] outline-none"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Location/Room</label>
                        <input
                          type="text"
                          value={scheduleForm.location}
                          onChange={(e) => setScheduleForm({ ...scheduleForm, location: e.target.value })}
                          placeholder="e.g. Main Hall, Room A"
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#3182ce]/20 focus:border-[#3182ce] outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          <Users className="w-4 h-4 inline mr-1" /> Speakers
                        </label>
                        <input
                          type="text"
                          value={scheduleForm.speakers}
                          onChange={(e) => setScheduleForm({ ...scheduleForm, speakers: e.target.value })}
                          placeholder="Comma-separated speaker names"
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#3182ce]/20 focus:border-[#3182ce] outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
                        <textarea
                          value={scheduleForm.session_description}
                          onChange={(e) => setScheduleForm({ ...scheduleForm, session_description: e.target.value })}
                          rows={2}
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#3182ce]/20 focus:border-[#3182ce] outline-none resize-none"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="submit"
                          disabled={isSaving}
                          className="px-4 py-2 bg-[#3182ce] text-white rounded-xl font-medium text-sm hover:bg-[#2c5cb8] transition-colors disabled:opacity-50"
                        >
                          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : editingSchedule ? "Update Session" : "Add Session"}
                        </button>
                        <button
                          type="button"
                          onClick={() => { setShowScheduleForm(false); setEditingSchedule(null); }}
                          className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-xl transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </form>
                )}

                {schedules.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Clock className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500">No schedule sessions yet</p>
                    <p className="text-sm text-gray-400 mt-1">Add sessions to build your event schedule</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {Object.entries(groupedSchedules).map(([day, daySchedules]) => (
                      <div key={day}>
                        <h3 className="font-semibold text-gray-900 mb-3">Day {day}</h3>
                        <div className="space-y-3">
                          {daySchedules.map((schedule) => (
                            <div key={schedule.id} className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
                              <GripVertical className="w-5 h-5 text-gray-300 mt-1" />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-sm font-medium text-[#3182ce]">
                                    {schedule.session_start ? schedule.session_start.split("T")[1]?.slice(0, 5) : ""}
                                    {schedule.session_end && ` - ${schedule.session_end.split("T")[1]?.slice(0, 5)}`}
                                  </span>
                                  {schedule.location && (
                                    <span className="text-xs text-gray-500">• {schedule.location}</span>
                                  )}
                                </div>
                                <p className="font-medium text-gray-900">{schedule.session_title}</p>
                                {schedule.session_description && (
                                  <p className="text-sm text-gray-500 mt-1">{schedule.session_description}</p>
                                )}
                                {schedule.speakers && schedule.speakers.length > 0 && (
                                  <div className="flex items-center gap-2 mt-2">
                                    <Users className="w-4 h-4 text-gray-400" />
                                    <span className="text-sm text-gray-500">{schedule.speakers.join(", ")}</span>
                                  </div>
                                )}
                              </div>
                              <div className="flex gap-1">
                                <button
                                  onClick={() => openEditSchedule(schedule)}
                                  className="p-2 text-gray-400 hover:text-[#3182ce] hover:bg-blue-50 rounded-lg transition-colors"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteSchedule(schedule.id)}
                                  disabled={deletingId === schedule.id}
                                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                  {deletingId === schedule.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tickets Section */}
            {activeSection === "tickets" && (
              <div className="pt-2">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Tickets</h2>
                  <button
                    onClick={() => { setShowTicketForm(true); setEditingTicket(null); setTicketForm({ name: "", description: "", price: 0, currency: "USD", quantity: 10, is_active: true }); }}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-[#3182ce] text-white rounded-xl font-medium text-sm hover:bg-[#2c5cb8] transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add Ticket
                  </button>
                </div>

                {showTicketForm && (
                  <form onSubmit={handleSaveTicket} className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
                    <h3 className="font-medium text-gray-900 mb-4">{editingTicket ? "Edit Ticket" : "Add Ticket"}</h3>
                    <div className="grid gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Ticket Name</label>
                        <input
                          type="text"
                          value={ticketForm.name}
                          onChange={(e) => setTicketForm({ ...ticketForm, name: e.target.value })}
                          placeholder="e.g. General Admission, VIP"
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#3182ce]/20 focus:border-[#3182ce] outline-none"
                          required
                        />
                      </div>
                      <div className="grid sm:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">Price</label>
                          <input
                            type="number"
                            value={ticketForm.price}
                            onChange={(e) => setTicketForm({ ...ticketForm, price: parseFloat(e.target.value) })}
                            min="0"
                            step="0.01"
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#3182ce]/20 focus:border-[#3182ce] outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">Currency</label>
                          <select
                            value={ticketForm.currency}
                            onChange={(e) => setTicketForm({ ...ticketForm, currency: e.target.value })}
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#3182ce]/20 focus:border-[#3182ce] outline-none bg-white"
                          >
                            <option value="USD">USD</option>
                            <option value="EUR">EUR</option>
                            <option value="GBP">GBP</option>
                            <option value="RWF">RWF</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1.5">Quantity</label>
                          <input
                            type="number"
                            value={ticketForm.quantity}
                            onChange={(e) => setTicketForm({ ...ticketForm, quantity: parseInt(e.target.value) })}
                            min="1"
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#3182ce]/20 focus:border-[#3182ce] outline-none"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
                        <textarea
                          value={ticketForm.description}
                          onChange={(e) => setTicketForm({ ...ticketForm, description: e.target.value })}
                          rows={2}
                          placeholder="What's included with this ticket"
                          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#3182ce]/20 focus:border-[#3182ce] outline-none resize-none"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="is_active"
                          checked={ticketForm.is_active}
                          onChange={(e) => setTicketForm({ ...ticketForm, is_active: e.target.checked })}
                          className="w-4 h-4 text-[#3182ce] rounded focus:ring-[#3182ce]/20"
                        />
                        <label htmlFor="is_active" className="text-sm text-gray-700">Active (available for purchase)</label>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="submit"
                          disabled={isSaving}
                          className="px-4 py-2 bg-[#3182ce] text-white rounded-xl font-medium text-sm hover:bg-[#2c5cb8] transition-colors disabled:opacity-50"
                        >
                          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : editingTicket ? "Update Ticket" : "Add Ticket"}
                        </button>
                        <button
                          type="button"
                          onClick={() => { setShowTicketForm(false); setEditingTicket(null); }}
                          className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-xl transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </form>
                )}

                {tickets.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Ticket className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500">No tickets yet</p>
                    <p className="text-sm text-gray-400 mt-1">Create ticket types for your event</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {tickets.map((ticket) => (
                      <div key={ticket.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
                        <div className="w-12 h-12 bg-[#3182ce]/10 rounded-xl flex items-center justify-center">
                          <Ticket className="w-6 h-6 text-[#3182ce]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-gray-900">{ticket.name}</p>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${ticket.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                              {ticket.is_active ? "Active" : "Inactive"}
                            </span>
                          </div>
                          {ticket.description && (
                            <p className="text-sm text-gray-500">{ticket.description}</p>
                          )}
                          <p className="text-sm text-gray-500">
                            {ticket.price === 0 ? "Free" : `${ticket.currency} ${ticket.price}`} 
                            {ticket.quantity && ` • ${ticket.quantity} available`}
                          </p>
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => openEditTicket(ticket)}
                            className="p-2 text-gray-400 hover:text-[#3182ce] hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteTicket(ticket.id)}
                            disabled={deletingId === ticket.id}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            {deletingId === ticket.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Delete Event</h3>
                <p className="text-sm text-gray-500">This action cannot be undone</p>
              </div>
            </div>
            <p className="text-gray-600 mb-6">Are you sure you want to delete <strong>{event.title}</strong>?</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowDeleteModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-xl">Cancel</button>
              <button onClick={handleDelete} disabled={deletingId === eventId} className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-xl disabled:opacity-50">
                {deletingId === eventId ? <Loader2 className="w-4 h-4 animate-spin" /> : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
