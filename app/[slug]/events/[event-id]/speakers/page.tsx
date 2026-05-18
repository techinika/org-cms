"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import {
  Users,
  Loader2,
  ArrowLeft,
  Plus,
  Trash2,
  GripVertical,
} from "lucide-react";
import { Event } from "@/types/company";
import { getEventById } from "@/lib/supabase";
import { checkAuthClient, getAuthRedirectUrl } from "@/lib/auth-client";
import Navbar from "@/components/parts/Navbar";
import Breadcrumb from "@/components/parts/Breadcrumb";
import { useToast } from "@/components/ui/Toast";
import { supabase } from "@/lib/supabase";

interface EventSpeaker {
  id: string;
  event_id: string;
  speaker_id: string;
  role: string | null;
  speaking_order: number | null;
  note: string | null;
  speaker?: {
    name: string;
    title: string | null;
    photo_url: string | null;
  };
}

interface Speaker {
  id: string;
  name: string;
  title: string | null;
  company_id: string | null;
  org_name: string | null;
  bio: string | null;
  photo_url: string | null;
  company?: {
    id: string;
    name: string;
  };
}

interface Props {
  params: Promise<{ slug: string; "event-id": string }>;
}

export default function EventSpeakersPage({ params }: Props) {
  const { slug, "event-id": eventId } = use(params);
  const { showToast } = useToast();
  const [event, setEvent] = useState<Event | null>(null);
  const [speakers, setSpeakers] = useState<EventSpeaker[]>([]);
  const [availableSpeakers, setAvailableSpeakers] = useState<Speaker[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedSpeaker, setSelectedSpeaker] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showCreateNew, setShowCreateNew] = useState(false);
  const [newSpeaker, setNewSpeaker] = useState({ name: "", title: "", company_id: "", org_name: "", bio: "", photo_url: "" });

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

    const { data: eventSpeakers } = await supabase
      .from("event_speakers")
      .select("*, speaker:speakers(*, company:featured_startups(*))")
      .eq("event_id", eventId)
      .order("speaking_order", { ascending: true });
    setSpeakers(eventSpeakers || []);

    const { data: allSpeakers } = await supabase
      .from("speakers")
      .select("*, company:featured_startups(*)")
      .order("name");
    setAvailableSpeakers(allSpeakers || []);

    setIsLoading(false);
  };

  const handleAddSpeaker = async () => {
    if (!selectedSpeaker) return;
    setSaving(true);
    
    const { error } = await supabase.from("event_speakers").insert({
      event_id: eventId,
      speaker_id: selectedSpeaker,
      speaking_order: speakers.length + 1,
    });

    setSaving(false);
    if (error) {
      showToast("Failed to add speaker", "error");
    } else {
      showToast("Speaker added", "success");
      setShowAddModal(false);
      setSelectedSpeaker(null);
      fetchData();
    }
  };

  const handleCreateSpeaker = async () => {
    if (!newSpeaker.name) return;
    setSaving(true);
    
    const { data: created, error } = await supabase.from("speakers").insert({
      name: newSpeaker.name,
      title: newSpeaker.title || null,
      company_id: newSpeaker.company_id || null,
      org_name: newSpeaker.org_name || null,
      bio: newSpeaker.bio || null,
      photo_url: newSpeaker.photo_url || null,
    }).select().single();

    if (error) {
      showToast("Failed to create speaker", "error");
    } else if (created) {
      await supabase.from("event_speakers").insert({
        event_id: eventId,
        speaker_id: created.id,
        speaking_order: speakers.length + 1,
      });
      showToast("Speaker created and added", "success");
      setShowAddModal(false);
      setNewSpeaker({ name: "", title: "", company_id: "", org_name: "", bio: "", photo_url: "" });
      setShowCreateNew(false);
      fetchData();
    }
    setSaving(false);
  };

  const handleRemoveSpeaker = async (speakerId: string) => {
    setSaving(true);
    const { error } = await supabase
      .from("event_speakers")
      .delete()
      .eq("event_id", eventId)
      .eq("speaker_id", speakerId);

    if (error) {
      showToast("Failed to remove speaker", "error");
    } else {
      showToast("Speaker removed", "success");
      fetchData();
    }
    setSaving(false);
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
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumb items={[
          { label: "Events", href: `/${slug}/events` },
          { label: event?.title || "Event", href: `/${slug}/events/${eventId}` },
          { label: "Speakers", href: `/${slug}/events/${eventId}/speakers` },
        ]} />

        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Speakers</h1>
                <p className="text-sm text-gray-500">{event.title}</p>
              </div>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#3182ce] text-white rounded-xl font-medium text-sm hover:bg-[#2c5cb8] transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Speaker
            </button>
          </div>
        </div>

        {speakers.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-purple-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No speakers added</h2>
            <p className="text-gray-500 max-w-sm mx-auto">Add speakers to your event to showcase them on the event page.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-200">
            {speakers.map((es) => (
              <div key={es.id} className="p-4 flex items-center gap-4">
                <GripVertical className="w-5 h-5 text-gray-300" />
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                  {es.speaker?.photo_url ? (
                    <img src={es.speaker.photo_url} className="w-12 h-12 rounded-full object-cover" />
                  ) : (
                    <Users className="w-6 h-6 text-gray-400" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{es.speaker?.name}</p>
                  <p className="text-sm text-gray-500">{es.speaker?.title}</p>
                </div>
                <button
                  onClick={() => handleRemoveSpeaker(es.speaker_id)}
                  disabled={saving}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => { setShowAddModal(false); setShowCreateNew(false); }} />
          <div className="relative bg-white rounded-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold mb-4">{showCreateNew ? "Create New Speaker" : "Add Speaker"}</h2>
            
            {!showCreateNew ? (
              <>
                <div className="mb-4">
                  <button
                    onClick={() => setShowCreateNew(true)}
                    className="w-full p-3 rounded-xl border-2 border-dashed border-gray-300 text-gray-500 hover:border-[#3182ce] hover:text-[#3182ce] flex items-center justify-center gap-2"
                  >
                    <Plus className="w-5 h-5" />
                    Create New Speaker
                  </button>
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {availableSpeakers
                    .filter((s) => !speakers.some((es) => es.speaker_id === s.id))
                    .map((speaker) => (
                      <button
                        key={speaker.id}
                        onClick={() => setSelectedSpeaker(speaker.id)}
                        className={`w-full p-3 rounded-xl text-left flex items-center gap-3 border ${
                          selectedSpeaker === speaker.id
                            ? "border-[#3182ce] bg-[#3182ce]/5"
                            : "border-gray-200 hover:border-[#3182ce]/50"
                        }`}
                      >
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden">
                          {speaker.photo_url ? (
                            <img src={speaker.photo_url} className="w-10 h-10 object-cover" />
                          ) : (
                            <Users className="w-5 h-5 text-gray-400" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{speaker.name}</p>
                          <p className="text-xs text-gray-500">{speaker.title}</p>
                        </div>
                      </button>
                    ))}
                </div>
              </>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Name *</label>
                  <input
                    value={newSpeaker.name}
                    onChange={(e) => setNewSpeaker({ ...newSpeaker, name: e.target.value })}
                    className="w-full px-4 py-2.5 border rounded-xl"
                    placeholder="Full name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Title</label>
                  <input
                    value={newSpeaker.title}
                    onChange={(e) => setNewSpeaker({ ...newSpeaker, title: e.target.value })}
                    className="w-full px-4 py-2.5 border rounded-xl"
                    placeholder="e.g. CEO, Tech Conf"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Company (from Featured Startups)</label>
                  <select
                    value={newSpeaker.company_id || ""}
                    onChange={(e) => setNewSpeaker({ ...newSpeaker, company_id: e.target.value || "", org_name: "" })}
                    className="w-full px-4 py-2.5 border rounded-xl bg-white"
                  >
                    <option value="">Select a company...</option>
                    {availableSpeakers
                      .filter((s) => s.company_id)
                      .map((s) => (
                        <option key={s.company_id!} value={s.company_id!}>{s.company?.name}</option>
                      ))}
                  </select>
                </div>
                <div className="text-center text-sm text-gray-500">OR</div>
                <div>
                  <label className="block text-sm font-medium mb-1">Organization Name (if not in list)</label>
                  <input
                    value={newSpeaker.org_name}
                    onChange={(e) => setNewSpeaker({ ...newSpeaker, org_name: e.target.value, company_id: "" })}
                    className="w-full px-4 py-2.5 border rounded-xl"
                    placeholder="Organization name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Photo URL</label>
                  <input
                    value={newSpeaker.photo_url}
                    onChange={(e) => setNewSpeaker({ ...newSpeaker, photo_url: e.target.value })}
                    className="w-full px-4 py-2.5 border rounded-xl"
                    placeholder="https://..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Bio</label>
                  <textarea
                    value={newSpeaker.bio}
                    onChange={(e) => setNewSpeaker({ ...newSpeaker, bio: e.target.value })}
                    className="w-full px-4 py-2.5 border rounded-xl"
                    rows={3}
                    placeholder="Short bio..."
                  />
                </div>
              </div>
            )}
            <div className="flex gap-3 mt-6">
              {showCreateNew && (
                <button
                  onClick={() => setShowCreateNew(false)}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200"
                >
                  Back
                </button>
              )}
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={showCreateNew ? handleCreateSpeaker : handleAddSpeaker}
                disabled={saving || (showCreateNew ? !newSpeaker.name : !selectedSpeaker)}
                className="flex-1 px-4 py-2 bg-[#3182ce] text-white rounded-xl hover:bg-[#2c5cb8] disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : showCreateNew ? "Create & Add" : "Add"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}