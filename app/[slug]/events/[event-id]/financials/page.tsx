"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import {
  DollarSign,
  Loader2,
  TrendingUp,
  Clock,
  XCircle,
  FileText,
  ArrowLeft,
  Calendar,
} from "lucide-react";
import { Event, EventInvoice, EventRegistration } from "@/types/company";
import { getEventById, getEventInvoices, getEventFinancials } from "@/lib/supabase";
import { checkAuthClient, getAuthRedirectUrl } from "@/lib/auth-client";
import Navbar from "@/components/parts/Navbar";
import Breadcrumb from "@/components/parts/Breadcrumb";

export default function EventFinancialsPage({
  params,
}: {
  params: Promise<{ slug: string; "event-id": string }>;
}) {
  const { slug, "event-id": eventId } = use(params);
  const [event, setEvent] = useState<Event | null>(null);
  const [invoices, setInvoices] = useState<(EventInvoice & { registration: EventRegistration | null })[]>([]);
  const [financials, setFinancials] = useState({ total_revenue: 0, pending: 0, paid: 0, refunded: 0, invoice_count: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    const { data: eventData, error: eventError } = await getEventById(eventId);
    if (eventError || !eventData) {
      setError("Event not found");
      setIsLoading(false);
      return;
    }
    setEvent(eventData);

    const [invoicesResult, financialsResult] = await Promise.all([
      getEventInvoices(eventId),
      getEventFinancials(eventId),
    ]);
    setInvoices(invoicesResult.data || []);
    if (!financialsResult.error) setFinancials(financialsResult);
    setIsLoading(false);
  };

  useEffect(() => {
    checkAuth();
  }, [slug, eventId]);

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
          { label: "Financials", href: `/${slug}/events/${eventId}/financials` },
        ]} />

        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Financials</h1>
                <p className="text-sm text-gray-500">{event.title}</p>
              </div>
            </div>
            <Link
              href={`/${slug}/events/${eventId}`}
              className="inline-flex items-center gap-2 px-4 py-2 text-gray-700 bg-gray-100 rounded-xl font-medium text-sm hover:bg-gray-200 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="p-4 bg-green-50 rounded-xl">
            <div className="flex items-center gap-2 text-green-600 mb-1">
              <TrendingUp className="w-4 h-4" />
              <span className="text-xs font-medium">Paid Revenue</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              ${financials.paid.toLocaleString()}
            </p>
          </div>
          <div className="p-4 bg-yellow-50 rounded-xl">
            <div className="flex items-center gap-2 text-yellow-600 mb-1">
              <Clock className="w-4 h-4" />
              <span className="text-xs font-medium">Pending</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              ${financials.pending.toLocaleString()}
            </p>
          </div>
          <div className="p-4 bg-blue-50 rounded-xl">
            <div className="flex items-center gap-2 text-blue-600 mb-1">
              <DollarSign className="w-4 h-4" />
              <span className="text-xs font-medium">Total</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              ${(financials.paid + financials.pending).toLocaleString()}
            </p>
          </div>
          <div className="p-4 bg-red-50 rounded-xl">
            <div className="flex items-center gap-2 text-red-600 mb-1">
              <XCircle className="w-4 h-4" />
              <span className="text-xs font-medium">Refunded</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              ${financials.refunded.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Invoices ({financials.invoice_count})
            </h2>
          </div>
          {invoices.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No invoices found</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {invoices.map((inv) => (
                <div key={inv.id} className="p-4 flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">
                      Registration #{inv.registration_id?.slice(0, 8)}
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(inv.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-gray-900">
                      ${Number(inv.amount).toLocaleString()} {inv.currency}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      inv.status === "paid" ? "bg-green-100 text-green-700" :
                      inv.status === "pending" ? "bg-yellow-100 text-yellow-700" :
                      inv.status === "refunded" ? "bg-red-100 text-red-700" :
                      "bg-gray-100 text-gray-600"
                    }`}>
                      {inv.status}
                    </span>
                    {inv.payment_link && (
                      <a
                        href={inv.payment_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-[#3182ce] hover:underline"
                      >
                        View
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
