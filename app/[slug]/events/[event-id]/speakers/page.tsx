"use client";

import { useState, useEffect, use, useRef } from "react";
import Link from "next/link";
import {
  Users,
  Loader2,
  Plus,
  Trash2,
  Pencil,
  GripVertical,
  Upload,
  Search,
} from "lucide-react";
import { Event, FeaturedStartup } from "@/types/company";
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
    id: string;
    name: string;
    title: string | null;
    bio: string | null;
    image_ref: string | null;
    company_id: string | null;
    org_name: string | null;
    company?: {
      id: string;
      name: string;
      logo_url: string | null;
    };
    asset?: {
      url: string;
    };
  };
}

interface Speaker {
  id: string;
  name: string;
  title: string | null;
  company_id: string | null;
  org_name: string | null;
  bio: string | null;
  image_ref: string | null;
  company?: {
    id: string;
    name: string;
    logo_url: string | null;
  };
  asset?: {
    url: string;
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
  const [companies, setCompanies] = useState<FeaturedStartup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedSpeaker, setSelectedSpeaker] = useState<string | null>(null);
  const [showCreateNew, setShowCreateNew] = useState(false);
  const [existingSearch, setExistingSearch] = useState("");
  const [newSpeaker, setNewSpeaker] = useState({ name: "", title: "", company_id: "", org_name: "", bio: "", image_ref: "" });
  const [previewUrl, setPreviewUrl] = useState("");

  const [showEditModal, setShowEditModal] = useState(false);
  const [editingSpeaker, setEditingSpeaker] = useState<EventSpeaker | null>(null);
  const [editForm, setEditForm] = useState({ name: "", title: "", company_id: "", org_name: "", bio: "", image_ref: "" });
  const [editPreviewUrl, setEditPreviewUrl] = useState("");

  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);
  const [companySearch, setCompanySearch] = useState("");
  const [editCompanySearch, setEditCompanySearch] = useState("");

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
      .select("*, speaker:speakers(*, company:featured_startups(*), asset:assets!image_ref(url))")
      .eq("event_id", eventId)
      .order("speaking_order", { ascending: true });
    setSpeakers(eventSpeakers || []);

    const { data: allSpeakers } = await supabase
      .from("speakers")
      .select("*, company:featured_startups(*), asset:assets!image_ref(url)")
      .order("name");
    setAvailableSpeakers(allSpeakers || []);

    const { data: allCompanies } = await supabase
      .from("featured_startups")
      .select("id, name, logo_url")
      .order("name");
    setCompanies((allCompanies || []) as FeaturedStartup[]);

    setIsLoading(false);
  };

  const uploadPhoto = async (file: File): Promise<{ asset_id: string; url: string } | null> => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "speakers");

      const res = await fetch("/api/upload-image", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      return data;
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to upload photo", "error");
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleAddPhoto = async (file: File) => {
    const result = await uploadPhoto(file);
    if (result) {
      setNewSpeaker({ ...newSpeaker, image_ref: result.asset_id });
      setPreviewUrl(result.url);
    }
  };

  const handleEditPhoto = async (file: File) => {
    const result = await uploadPhoto(file);
    if (result) {
      setEditForm({ ...editForm, image_ref: result.asset_id });
      setEditPreviewUrl(result.url);
    }
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
      image_ref: newSpeaker.image_ref || null,
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
      setNewSpeaker({ name: "", title: "", company_id: "", org_name: "", bio: "", image_ref: "" });
      setPreviewUrl("");
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

  const openEdit = (es: EventSpeaker) => {
    setEditingSpeaker(es);
    setEditForm({
      name: es.speaker?.name || "",
      title: es.speaker?.title || "",
      company_id: es.speaker?.company_id || "",
      org_name: es.speaker?.org_name || "",
      bio: es.speaker?.bio || "",
      image_ref: es.speaker?.image_ref || "",
    });
    setEditPreviewUrl(es.speaker?.asset?.url || "");
    if (es.speaker?.company?.name) {
      setEditCompanySearch(es.speaker.company.name);
    } else {
      setEditCompanySearch("");
    }
    setShowEditModal(true);
  };

  const handleEditSpeaker = async () => {
    if (!editingSpeaker?.speaker?.id || !editForm.name) return;
    setSaving(true);
    const { error } = await supabase.from("speakers").update({
      name: editForm.name,
      title: editForm.title || null,
      company_id: editForm.company_id || null,
      org_name: editForm.org_name || null,
      bio: editForm.bio || null,
      image_ref: editForm.image_ref || null,
    }).eq("id", editingSpeaker.speaker.id);
    setSaving(false);
    if (error) {
      showToast("Failed to update speaker", "error");
    } else {
      showToast("Speaker updated", "success");
      setShowEditModal(false);
      setEditingSpeaker(null);
      fetchData();
    }
  };

  const filteredExisting = availableSpeakers
    .filter((s) => !speakers.some((es) => es.speaker_id === s.id))
    .filter((s) =>
      s.name.toLowerCase().includes(existingSearch.toLowerCase()) ||
      s.company?.name?.toLowerCase().includes(existingSearch.toLowerCase())
    );

  const filteredCompanies = companies.filter((c) =>
    c.name.toLowerCase().includes(companySearch.toLowerCase())
  );

  const filteredEditCompanies = companies.filter((c) =>
    c.name.toLowerCase().includes(editCompanySearch.toLowerCase())
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
                <GripVertical className="w-5 h-5 text-gray-300 flex-shrink-0" />
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                  {es.speaker?.asset?.url ? (
                    <img src={es.speaker.asset.url} alt={es.speaker.name} className="w-12 h-12 rounded-full object-cover" />
                  ) : (
                    <Users className="w-6 h-6 text-gray-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{es.speaker?.name}</p>
                  <p className="text-sm text-gray-500 truncate">
                    {es.speaker?.title}
                    {es.speaker?.company?.name && ` at ${es.speaker.company.name}`}
                    {es.speaker?.org_name && ` at ${es.speaker.org_name}`}
                  </p>
                </div>
                <button
                  onClick={() => openEdit(es)}
                  className="p-2 text-gray-400 hover:text-[#3182ce] hover:bg-blue-50 rounded-xl transition-colors flex-shrink-0"
                >
                  <Pencil className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleRemoveSpeaker(es.speaker_id)}
                  disabled={saving}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors flex-shrink-0"
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
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search speakers or companies..."
                      value={existingSearch}
                      onChange={(e) => setExistingSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#3182ce]/20 focus:border-[#3182ce] outline-none transition-all"
                    />
                  </div>
                </div>
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
                  {filteredExisting.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-4">No matching speakers found</p>
                  ) : (
                    filteredExisting.map((speaker) => (
                      <button
                        key={speaker.id}
                        onClick={() => setSelectedSpeaker(speaker.id)}
                        className={`w-full p-3 rounded-xl text-left flex items-center gap-3 border ${
                          selectedSpeaker === speaker.id
                            ? "border-[#3182ce] bg-[#3182ce]/5"
                            : "border-gray-200 hover:border-[#3182ce]/50"
                        }`}
                      >
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                          {speaker.asset?.url ? (
                            <img src={speaker.asset.url} alt={speaker.name} className="w-10 h-10 object-cover" />
                          ) : (
                            <Users className="w-5 h-5 text-gray-400" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium truncate">{speaker.name}</p>
                          <p className="text-xs text-gray-500 truncate">
                            {speaker.title}
                            {speaker.company?.name && ` • ${speaker.company.name}`}
                          </p>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </>
            ) : (
              <CreateSpeakerForm
                newSpeaker={newSpeaker}
                setNewSpeaker={setNewSpeaker}
                previewUrl={previewUrl}
                companies={filteredCompanies}
                companySearch={companySearch}
                setCompanySearch={setCompanySearch}
                onUpload={handleAddPhoto}
                uploading={uploading}
                fileInputRef={fileInputRef}
                onRemovePhoto={() => { setNewSpeaker({ ...newSpeaker, image_ref: "" }); setPreviewUrl(""); }}
              />
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

      {showEditModal && editingSpeaker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowEditModal(false)} />
          <div className="relative bg-white rounded-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold mb-4">Edit Speaker</h2>

            <CreateSpeakerForm
              newSpeaker={editForm}
              setNewSpeaker={setEditForm}
              previewUrl={editPreviewUrl}
              companies={filteredEditCompanies}
              companySearch={editCompanySearch}
              setCompanySearch={setEditCompanySearch}
              onUpload={handleEditPhoto}
              uploading={uploading}
              fileInputRef={editFileInputRef}
              onRemovePhoto={() => { setEditForm({ ...editForm, image_ref: "" }); setEditPreviewUrl(""); }}
            />

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowEditModal(false)}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleEditSpeaker}
                disabled={saving || !editForm.name}
                className="flex-1 px-4 py-2 bg-[#3182ce] text-white rounded-xl hover:bg-[#2c5cb8] disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CreateSpeakerForm({
  newSpeaker,
  setNewSpeaker,
  previewUrl,
  companies,
  companySearch,
  setCompanySearch,
  onUpload,
  uploading,
  fileInputRef,
  onRemovePhoto,
}: {
  newSpeaker: { name: string; title: string; company_id: string; org_name: string; bio: string; image_ref: string };
  setNewSpeaker: (v: { name: string; title: string; company_id: string; org_name: string; bio: string; image_ref: string }) => void;
  previewUrl: string;
  companies: FeaturedStartup[];
  companySearch: string;
  setCompanySearch: (v: string) => void;
  onUpload: (file: File) => void;
  uploading: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onRemovePhoto: () => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Name *</label>
        <input
          value={newSpeaker.name}
          onChange={(e) => setNewSpeaker({ ...newSpeaker, name: e.target.value })}
          className="w-full px-4 py-2.5 input-base"
          placeholder="Full name"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Title</label>
        <input
          value={newSpeaker.title}
          onChange={(e) => setNewSpeaker({ ...newSpeaker, title: e.target.value })}
          className="w-full px-4 py-2.5 input-base"
          placeholder="e.g. CEO, Tech Conf"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Company</label>
        <input
          type="text"
          placeholder="Search companies..."
          value={companySearch}
          onChange={(e) => setCompanySearch(e.target.value)}
          className="w-full px-4 py-2.5 input-base mb-2"
        />
        <div className="max-h-32 overflow-y-auto border rounded-xl">
          {companies.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-2">No companies found</p>
          ) : (
            companies.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  setNewSpeaker({ ...newSpeaker, company_id: c.id, org_name: "" });
                  setCompanySearch(c.name);
                }}
                className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 ${
                  newSpeaker.company_id === c.id ? "bg-[#3182ce]/5 text-[#3182ce]" : ""
                }`}
              >
                {c.logo_url && (
                  <img src={c.logo_url} alt="" className="w-5 h-5 rounded object-cover" />
                )}
                {c.name}
              </button>
            ))
          )}
        </div>
      </div>
      <div className="text-center text-sm text-gray-500">OR</div>
      <div>
        <label className="block text-sm font-medium mb-1">Organization Name (if not in list)</label>
        <input
          value={newSpeaker.org_name}
          onChange={(e) => setNewSpeaker({ ...newSpeaker, org_name: e.target.value, company_id: "" })}
          className="w-full px-4 py-2.5 input-base"
          placeholder="Organization name"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Photo</label>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
            {previewUrl ? (
              <img src={previewUrl} alt="" className="w-16 h-16 object-cover" />
            ) : (
              <Users className="w-6 h-6 text-gray-400" />
            )}
          </div>
          <div className="flex-1">
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onUpload(file);
              }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="inline-flex items-center gap-2 px-4 py-2 border rounded-xl text-sm hover:bg-gray-50 disabled:opacity-50"
            >
              {uploading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              {uploading ? "Uploading..." : "Upload Photo"}
            </button>
            {previewUrl && (
              <button
                type="button"
                onClick={onRemovePhoto}
                className="ml-2 text-sm text-red-600 hover:underline"
              >
                Remove
              </button>
            )}
          </div>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Bio</label>
        <textarea
          value={newSpeaker.bio}
          onChange={(e) => setNewSpeaker({ ...newSpeaker, bio: e.target.value })}
          className="w-full px-4 py-2.5 input-base resize-none"
          rows={3}
          placeholder="Short bio..."
        />
      </div>
    </div>
  );
}
