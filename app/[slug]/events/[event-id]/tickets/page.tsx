"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import {
  Ticket,
  Loader2,
  ArrowLeft,
  Plus,
  Trash2,
  Pencil,
  DollarSign,
  Calendar,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { Event, EventTicket } from "@/types/company";
import { getEventById, getEventTickets, workerFetch } from "@/lib/worker";
import { checkAuthClient, getAuthRedirectUrl } from "@/lib/auth-client";
import Navbar from "@/components/parts/Navbar";
import Breadcrumb from "@/components/parts/Breadcrumb";
import { useToast } from "@/components/ui/Toast";

interface Props {
  params: Promise<{ slug: string; "event-id": string }>;
}

export default function EventTicketsPage({ params }: Props) {
  const { slug, "event-id": eventId } = use(params);
  const { showToast } = useToast();
  const [event, setEvent] = useState<Event | null>(null);
  const [tickets, setTickets] = useState<EventTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingTicket, setEditingTicket] = useState<EventTicket | null>(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: 0,
    currency: "USD",
    quantity: "",
    sales_start: "",
    sales_end: "",
    is_active: true,
  });

  const checkAuth = async () => {
    const authResult = await checkAuthClient();
    if (!authResult.authenticated || !authResult.user) {
      window.location.replace(getAuthRedirectUrl());
      return;
    }
    fetchData();
  };

  const fetchData = async () => {
    setIsLoading(true);
    const { data: eventData } = await getEventById(eventId);
    if (eventData) setEvent(eventData);

    const { data: ticketsData } = await getEventTickets(eventId);
    setTickets(ticketsData || []);
    setIsLoading(false);
  };

  useEffect(() => {
    checkAuth();
  }, [slug, eventId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const data = {
      event_id: eventId,
      name: form.name,
      description: form.description || null,
      price: form.price,
      currency: form.currency,
      quantity: form.quantity ? parseInt(form.quantity) : null,
      sales_start_at: form.sales_start ? new Date(form.sales_start).toISOString() : null,
      sales_end_at: form.sales_end ? new Date(form.sales_end).toISOString() : null,
      is_active: form.is_active,
    };

    let res;
    if (editingTicket) {
      res = await workerFetch(`/api/events/${eventId}/tickets/${editingTicket.id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
    } else {
      res = await workerFetch(`/api/events/${eventId}/tickets`, {
        method: "POST",
        body: JSON.stringify(data),
      });
    }

    setSaving(false);
    if (!res.ok) {
      showToast(`Failed to ${editingTicket ? "update" : "create"} ticket`, "error");
    } else {
      showToast(`Ticket ${editingTicket ? "updated" : "created"}`, "success");
      resetForm();
      fetchData();
    }
  };

  const handleDelete = async (id: string) => {
    setSaving(true);
    const res = await workerFetch(`/api/events/${eventId}/tickets/${id}`, { method: "DELETE" });
    if (!res.ok) {
      showToast("Failed to delete ticket", "error");
    } else {
      showToast("Ticket deleted", "success");
      fetchData();
    }
    setSaving(false);
  };

  const toggleActive = async (ticket: EventTicket) => {
    setSaving(true);
    const res = await workerFetch(`/api/events/${eventId}/tickets/${ticket.id}`, {
      method: "PATCH",
      body: JSON.stringify({ is_active: !ticket.is_active }),
    });
    if (!res.ok) {
      showToast("Failed to update ticket", "error");
    } else {
      showToast(`Ticket ${ticket.is_active ? "deactivated" : "activated"}`, "success");
      fetchData();
    }
    setSaving(false);
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingTicket(null);
    setForm({
      name: "", description: "", price: 0, currency: "USD",
      quantity: "", sales_start: "", sales_end: "", is_active: true,
    });
  };

  const openEdit = (ticket: EventTicket) => {
    setEditingTicket(ticket);
    setForm({
      name: ticket.name,
      description: ticket.description || "",
      price: ticket.price,
      currency: ticket.currency,
      quantity: ticket.quantity?.toString() || "",
      sales_start: ticket.sales_start_at ? ticket.sales_start_at.split("T")[0] : "",
      sales_end: ticket.sales_end_at ? ticket.sales_end_at.split("T")[0] : "",
      is_active: ticket.is_active,
    });
    setShowForm(true);
  };

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

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumb items={[
          { label: "Events", href: `/${slug}/events` },
          { label: event.title, href: `/${slug}/events/${eventId}` },
          { label: "Tickets", href: `/${slug}/events/${eventId}/tickets` },
        ]} />

        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center">
                <Ticket className="w-6 h-6 text-pink-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Tickets</h1>
                <p className="text-sm text-gray-500">{event.title}</p>
              </div>
            </div>
            <button
              onClick={() => { resetForm(); setShowForm(true); }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#3182ce] text-white rounded-xl font-medium text-sm hover:bg-[#2c5cb8] transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Ticket
            </button>
          </div>
        </div>

        {tickets.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
            <div className="w-16 h-16 bg-pink-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Ticket className="w-8 h-8 text-pink-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No tickets created</h2>
            <p className="text-gray-500 max-w-sm mx-auto">Create tickets to allow people to register for your event.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-200">
            {tickets.map((ticket) => (
              <div key={ticket.id} className="p-4 flex items-center gap-4">
                <div className="w-10 h-10 bg-pink-50 rounded-xl flex items-center justify-center">
                  <Ticket className="w-5 h-5 text-pink-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-900">{ticket.name}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${ticket.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {ticket.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                    <span className="flex items-center gap-1">
                      <DollarSign className="w-3.5 h-3.5" />
                      {ticket.price === 0 ? "Free" : `${ticket.price} ${ticket.currency}`}
                    </span>
                    {ticket.quantity && (
                      <span className="flex items-center gap-1">
                        <Ticket className="w-3.5 h-3.5" />
                        Qty: {ticket.quantity}
                      </span>
                    )}
                    {ticket.sales_start_at && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        Sales: {new Date(ticket.sales_start_at).toLocaleDateString()}
                        {ticket.sales_end_at && ` - ${new Date(ticket.sales_end_at).toLocaleDateString()}`}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => toggleActive(ticket)}
                    disabled={saving}
                    className="p-2 text-gray-400 hover:text-[#3182ce] rounded-xl transition-colors"
                    title={ticket.is_active ? "Deactivate" : "Activate"}
                  >
                    {ticket.is_active ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                  </button>
                  <button onClick={() => openEdit(ticket)} className="p-2 text-gray-400 hover:text-[#3182ce] rounded-xl">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(ticket.id)}
                    disabled={saving}
                    className="p-2 text-gray-400 hover:text-red-600 rounded-xl"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={resetForm} />
          <div className="relative bg-white rounded-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold mb-4">{editingTicket ? "Edit Ticket" : "Add Ticket"}</h2>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Ticket Name *</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#3182ce]/20 focus:border-[#3182ce] outline-none"
                  placeholder="e.g. General Admission"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#3182ce]/20 focus:border-[#3182ce] outline-none resize-none"
                  placeholder="Ticket description..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Price *</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="number"
                      value={form.price}
                      onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) || 0 })}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#3182ce]/20 focus:border-[#3182ce] outline-none transition-all"
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Currency</label>
                  <select
                    value={form.currency}
                    onChange={(e) => setForm({ ...form, currency: e.target.value })}
                    className="input-base"
                  >
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                    <option value="RWF">RWF</option>
                    <option value="KES">KES</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Quantity (leave empty for unlimited)</label>
                <input
                  type="number"
                  value={form.quantity}
                  onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                  className="input-base"
                  min="1"
                  placeholder="e.g. 100"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Sales Start</label>
                  <input
                    type="date"
                    value={form.sales_start}
                    onChange={(e) => setForm({ ...form, sales_start: e.target.value })}
                    className="input-base"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Sales End</label>
                  <input
                    type="date"
                    value={form.sales_end}
                    onChange={(e) => setForm({ ...form, sales_end: e.target.value })}
                    className="input-base"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={form.is_active}
                  onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                  className="w-4 h-4 text-[#3182ce] rounded border-gray-300 focus:ring-[#3182ce]"
                />
                <label htmlFor="is_active" className="text-sm text-gray-700">Active (available for purchase)</label>
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={resetForm} className="flex-1 px-4 py-2 bg-gray-100 rounded-xl hover:bg-gray-200">Cancel</button>
                <button type="submit" disabled={saving || !form.name} className="flex-1 px-4 py-2 bg-[#3182ce] text-white rounded-xl hover:bg-[#2c5cb8] disabled:opacity-50">
                  {saving ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
