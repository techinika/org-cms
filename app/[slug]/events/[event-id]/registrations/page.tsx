"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import {
  ClipboardList,
  Loader2,
  Users,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  QrCode,
  Camera,
  Download,
  CheckCheck,
  LogIn,
  X,
} from "lucide-react";
import { Event } from "@/types/company";
import { getEventById, getEventTickets, updateEventRegistration } from "@/lib/supabase";
import { checkAuthClient, getAuthRedirectUrl } from "@/lib/auth-client";
import Navbar from "@/components/parts/Navbar";
import Breadcrumb from "@/components/parts/Breadcrumb";
import { supabase } from "@/lib/supabase";
import { QRCodeSVG as QRCode } from "qrcode.react";
import { Html5Qrcode } from "html5-qrcode";
import { useToast } from "@/components/ui/Toast";

interface Registration {
  id: string;
  event_id: string;
  user_id: string;
  ticket_id: string | null;
  status: string;
  checked_in: boolean | null;
  created_at: string;
  user?: {
    name: string;
    email: string;
    avatar_url?: string;
  };
  ticket?: {
    name: string;
    price: number;
  };
}

interface Props {
  params: Promise<{ slug: string; "event-id": string }>;
}

export default function EventRegistrationsPage({ params }: Props) {
  const { slug, "event-id": eventId } = use(params);
  const { showToast } = useToast();
  const [event, setEvent] = useState<Event | null>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [tickets, setTickets] = useState<{ id: string; name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showQrModal, setShowQrModal] = useState(false);
  const [selectedReg, setSelectedReg] = useState<Registration | null>(null);
  const [showScanner, setShowScanner] = useState(false);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    checkAuth();
  }, [slug, eventId]);

  const checkAuth = async () => {
    const authResult = await checkAuthClient();
if (!authResult.authenticated || !authResult.user) {
      window.location.href = getAuthRedirectUrl();
      return;
    }
    fetchData();
  };

  const fetchData = async () => {
    setIsLoading(true);
    const { data: eventData } = await getEventById(eventId);
    if (eventData) setEvent(eventData);

    const { data: regData } = await supabase
      .from("event_registrations")
      .select("*, ticket:event_tickets(*)")
      .eq("event_id", eventId)
      .order("created_at", { ascending: false });
    setRegistrations(regData || []);

    const { data: ticketData } = await getEventTickets(eventId);
    setTickets(ticketData?.map((t: any) => ({ id: t.id, name: t.name })) || []);

    setIsLoading(false);
  };

  const updateStatus = async (regId: string, newStatus: string) => {
    const { error } = await updateEventRegistration(regId, { status: newStatus });
    if (error) {
      showToast("Failed to update status", "error");
    } else {
      showToast("Status updated", "success");
      fetchData();
    }
  };

  const toggleCheckIn = async (reg: Registration) => {
    const { error } = await updateEventRegistration(reg.id, { checked_in: !reg.checked_in });
    if (error) {
      showToast("Failed to update check-in", "error");
    } else {
      showToast(reg.checked_in ? "Guest checked out" : "Guest checked in", "success");
      fetchData();
    }
  };

  const handleScan = async (regId: string) => {
    const { error } = await updateEventRegistration(regId, { checked_in: true });
    if (error) {
      showToast("Failed to check in", "error");
    } else {
      showToast("Guest checked in successfully", "success");
      setShowScanner(false);
      setScanResult(null);
      fetchData();
    }
  };

  const startScanner = async () => {
    setShowScanner(true);
    setScanning(true);

    setTimeout(() => {
      const qrRegionId = "qr-reader";
      const html5Qrcode = new Html5Qrcode(qrRegionId);

      html5Qrcode.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        async (decodedText: string) => {
          html5Qrcode.stop();
          setScanning(false);
          setScanResult(decodedText);

          try {
            const regId = decodedText.split("-").pop();
            if (regId) {
              await handleScan(regId);
            }
          } catch {
            showToast("Invalid QR code", "error");
          }
        },
        (errorMessage: string) => {
        }
      ).catch(() => {
        showToast("Camera access denied or not available", "error");
        setScanning(false);
      });
    }, 100);
  };

  const filteredRegs = registrations.filter((r) => {
    if (statusFilter !== "all" && r.status !== statusFilter) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return r.user?.email?.toLowerCase().includes(query) || r.user?.name?.toLowerCase().includes(query);
    }
    return true;
  });

  const stats = {
    total: registrations.length,
    confirmed: registrations.filter((r) => r.status === "confirmed").length,
    checkedIn: registrations.filter((r) => r.checked_in).length,
    pending: registrations.filter((r) => r.status === "pending_approval" || r.status === "pending_payment").length,
    cancelled: registrations.filter((r) => r.status === "cancelled").length,
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

  const isPublished = event.publish_status === "published";

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumb items={[
          { label: "Events", href: `/${slug}/events` },
          { label: event.title, href: `/${slug}/events/${eventId}` },
          { label: "RSVPs & Check-in", href: `/${slug}/events/${eventId}/registrations` },
        ]} />

        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                <ClipboardList className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">RSVPs & Check-in</h1>
                <p className="text-sm text-gray-500">{event.title}</p>
              </div>
            </div>
            {isPublished && (
              <button
                onClick={startScanner}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#3182ce] text-white rounded-xl font-medium text-sm hover:bg-[#2c5cb8] transition-colors"
              >
                <Camera className="w-4 h-4" />
                Scan QR Code
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-xl border p-4">
            <div className="flex items-center gap-2 text-gray-500 mb-1">
              <Users className="w-4 h-4" />
              <span className="text-xs">Total</span>
            </div>
            <p className="text-2xl font-bold">{stats.total}</p>
          </div>
          <div className="bg-green-50 rounded-xl border border-green-200 p-4">
            <div className="flex items-center gap-2 text-green-600 mb-1">
              <CheckCircle className="w-4 h-4" />
              <span className="text-xs">Confirmed</span>
            </div>
            <p className="text-2xl font-bold">{stats.confirmed}</p>
          </div>
          <div className="bg-blue-50 rounded-xl border border-blue-200 p-4">
            <div className="flex items-center gap-2 text-blue-600 mb-1">
              <CheckCheck className="w-4 h-4" />
              <span className="text-xs">Checked In</span>
            </div>
            <p className="text-2xl font-bold">{stats.checkedIn}</p>
          </div>
          <div className="bg-yellow-50 rounded-xl border border-yellow-200 p-4">
            <div className="flex items-center gap-2 text-yellow-600 mb-1">
              <Clock className="w-4 h-4" />
              <span className="text-xs">Pending</span>
            </div>
            <p className="text-2xl font-bold">{stats.pending}</p>
          </div>
          <div className="bg-red-50 rounded-xl border border-red-200 p-4">
            <div className="flex items-center gap-2 text-red-600 mb-1">
              <XCircle className="w-4 h-4" />
              <span className="text-xs">Cancelled</span>
            </div>
            <p className="text-2xl font-bold">{stats.cancelled}</p>
          </div>
        </div>

        <div className="flex gap-4 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#3182ce]/20 focus:border-[#3182ce] outline-none transition-all"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-base"
          >
            <option value="all">All Status</option>
            <option value="confirmed">Confirmed</option>
            <option value="pending_payment">Pending Payment</option>
            <option value="pending_approval">Pending Approval</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {!isPublished && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-4">
            <p className="text-sm text-yellow-800">Publish the event to enable check-in functionality.</p>
          </div>
        )}

        {filteredRegs.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
            <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <ClipboardList className="w-8 h-8 text-indigo-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No registrations yet</h2>
            <p className="text-gray-500">Registrations will appear here when people register for your event.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-200">
            {filteredRegs.map((reg) => (
              <div key={reg.id} className="p-4 flex items-center gap-4">
                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                  <Users className="w-5 h-5 text-gray-400" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{reg.user?.name || "Unknown"}</p>
                  <p className="text-sm text-gray-500">{reg.user?.email}</p>
                  {reg.ticket && (
                    <p className="text-xs text-gray-400 mt-1">{reg.ticket.name} {reg.ticket.price > 0 && `• $${reg.ticket.price}`}</p>
                  )}
                </div>
                <span className={`text-xs px-2 py-1 rounded-full capitalize ${
                  reg.status === "confirmed" ? "bg-green-100 text-green-700" :
                  reg.status === "cancelled" ? "bg-red-100 text-red-700" :
                  "bg-yellow-100 text-yellow-700"
                }`}>
                  {reg.status.replace("_", " ")}
                </span>
                {isPublished && (
                  <button
                    onClick={() => toggleCheckIn(reg)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      reg.checked_in
                        ? "bg-green-100 text-green-700 hover:bg-green-200"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {reg.checked_in ? (
                      <span className="flex items-center gap-1"><CheckCheck className="w-3.5 h-3.5" /> Checked In</span>
                    ) : (
                      <span className="flex items-center gap-1"><LogIn className="w-3.5 h-3.5" /> Check In</span>
                    )}
                  </button>
                )}
                <button
                  onClick={() => { setSelectedReg(reg); setShowQrModal(true); }}
                  className="p-2 text-gray-400 hover:text-[#3182ce] hover:bg-blue-50 rounded-xl transition-colors"
                  title="View QR Code"
                >
                  <QrCode className="w-4 h-4" />
                </button>
                <select
                  value={reg.status}
                  onChange={(e) => updateStatus(reg.id, e.target.value)}
                  className="text-sm border rounded-lg px-2 py-1"
                >
                  <option value="pending_payment">Pending Payment</option>
                  <option value="pending_approval">Pending Approval</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            ))}
          </div>
        )}
      </div>

      {showQrModal && selectedReg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowQrModal(false)} />
          <div className="relative bg-white rounded-2xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Registration QR Code</h3>
              <button onClick={() => setShowQrModal(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="text-center">
              <p className="font-medium text-gray-900 mb-1">{selectedReg.user?.name}</p>
              <p className="text-sm text-gray-500 mb-4">{selectedReg.user?.email}</p>
              <div className="bg-white p-4 rounded-xl inline-block mb-4">
                <QRCode
                  value={`reg-${selectedReg.id}`}
                  size={200}
                  level="H"
                />
              </div>
              <p className="text-xs text-gray-400 mb-4">Scan this code at check-in</p>
              <button
                onClick={() => {
                  const canvas = document.querySelector("#qr-modal canvas") as HTMLCanvasElement;
                  if (canvas) {
                    const url = canvas.toDataURL();
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `qr-${selectedReg.id}.png`;
                    a.click();
                  }
                }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-xl text-sm hover:bg-gray-200"
              >
                <Download className="w-4 h-4" />
                Download QR Code
              </button>
            </div>
          </div>
        </div>
      )}

      {showScanner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowScanner(false)} />
          <div className="relative bg-white rounded-2xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Scan QR Code</h3>
              <button onClick={() => setShowScanner(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-4">Point camera at QR code to check in guest</p>
              <div id="qr-reader" className="mx-auto mb-4" />
              {scanning && (
                <div className="flex items-center justify-center gap-2 text-gray-500">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Scanning...
                </div>
              )}
              {scanResult && (
                <p className="text-sm text-green-600">QR Code detected!</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
