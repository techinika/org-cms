"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import {
  Building2,
  Loader2,
  ArrowLeft,
  Plus,
  Trash2,
  Pencil,
} from "lucide-react";
import { Event, FeaturedStartup } from "@/types/company";
import { getEventById } from "@/lib/supabase";
import { checkAuthClient, getAuthRedirectUrl } from "@/lib/auth-client";
import Navbar from "@/components/parts/Navbar";
import Breadcrumb from "@/components/parts/Breadcrumb";
import { useToast } from "@/components/ui/Toast";
import { supabase } from "@/lib/supabase";
import CompanyLogo from "@/components/ui/CompanyLogo";

interface EventCompany {
  id: number;
  event_id: string;
  company_id: string;
  relationship: string;
  note: string | null;
  company?: FeaturedStartup;
}

interface Props {
  params: Promise<{ slug: string; "event-id": string }>;
}

export default function EventPartnersPage({ params }: Props) {
  const { slug, "event-id": eventId } = use(params);
  const { showToast } = useToast();
  const [event, setEvent] = useState<Event | null>(null);
  const [partners, setPartners] = useState<EventCompany[]>([]);
  const [companies, setCompanies] = useState<FeaturedStartup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);
  const [relationship, setRelationship] = useState<string>("partner");
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateNew, setShowCreateNew] = useState(false);
  const [newCompany, setNewCompany] = useState({ name: "", description: "", logo_url: "" });

  const [showEditModal, setShowEditModal] = useState(false);
  const [editingPartner, setEditingPartner] = useState<EventCompany | null>(null);
  const [editRelationship, setEditRelationship] = useState("partner");

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

    const { data: partnersData } = await supabase
      .from("event_companies")
      .select("*, company:featured_startups(*)")
      .eq("event_id", eventId);
    
    if (partnersData) {
      for (const p of partnersData) {
        if (p.company?.image_ref) {
          const { data: asset } = await supabase.from("assets").select("url").eq("id", p.company.image_ref).single();
          if (asset) {
            p.company.logo_url = asset.url;
          }
        }
      }
    }
    setPartners(partnersData || []);

    const { data: allCompanies } = await supabase
      .from("featured_startups")
      .select("*")
      .order("name");
    if (allCompanies) {
      for (const company of allCompanies) {
        if (company.image_ref) {
          const { data: asset } = await supabase.from("assets").select("url").eq("id", company.image_ref).single();
          if (asset) {
            company.logo_url = asset.url;
          }
        }
      }
    }
    setCompanies(allCompanies || []);
    setIsLoading(false);
  };

  const handleAddPartner = async () => {
    if (!selectedCompany) return;
    setSaving(true);
    
    const { error } = await supabase.from("event_companies").insert({
      event_id: eventId,
      company_id: selectedCompany,
      relationship,
    });

    setSaving(false);
    if (error) {
      showToast("Failed to add partner", "error");
    } else {
      showToast("Partner added", "success");
      setShowAddModal(false);
      setSelectedCompany(null);
      setRelationship("partner");
      fetchData();
    }
  };

  const handleCreateCompany = async () => {
    if (!newCompany.name) return;
    setSaving(true);
    
    const { data: created, error } = await supabase.from("featured_startups").insert({
      name: newCompany.name,
      description: newCompany.description || "Partner for event",
      logo_url: newCompany.logo_url || null,
      slug: newCompany.name.toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-" + Date.now().toString(36),
      claimed: false,
    }).select().single();

    if (error) {
      showToast("Failed to create company", "error");
    } else if (created) {
      await supabase.from("event_companies").insert({
        event_id: eventId,
        company_id: created.id,
        relationship,
      });
      showToast("Company created and added", "success");
      setShowAddModal(false);
      setNewCompany({ name: "", description: "", logo_url: "" });
      setShowCreateNew(false);
      fetchData();
    }
    setSaving(false);
  };

  const handleRemovePartner = async (id: number) => {
    setSaving(true);
    const { error } = await supabase.from("event_companies").delete().eq("id", id);

    if (error) {
      showToast("Failed to remove", "error");
    } else {
      showToast("Partner removed", "success");
      fetchData();
    }
    setSaving(false);
  };

  const openEdit = (p: EventCompany) => {
    setEditingPartner(p);
    setEditRelationship(p.relationship || "partner");
    setShowEditModal(true);
  };

  const handleEditPartner = async () => {
    if (!editingPartner) return;
    setSaving(true);
    const { error } = await supabase.from("event_companies").update({ relationship: editRelationship }).eq("id", editingPartner.id);
    setSaving(false);
    if (error) {
      showToast("Failed to update partner", "error");
    } else {
      showToast("Partner updated", "success");
      setShowEditModal(false);
      setEditingPartner(null);
      fetchData();
    }
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
          { label: "Partners", href: `/${slug}/events/${eventId}/partners` },
        ]} />

        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <Building2 className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Partners & Sponsors</h1>
                <p className="text-sm text-gray-500">{event.title}</p>
              </div>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#3182ce] text-white rounded-xl font-medium text-sm hover:bg-[#2c5cb8] transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Partner
            </button>
          </div>
        </div>

        {partners.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
            <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Building2 className="w-8 h-8 text-orange-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No partners added</h2>
            <p className="text-gray-500">Add partners and sponsors to showcase them on the event page.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-200">
            {partners.map((p) => (
              <div key={p.id} className="p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center overflow-hidden">
                  {p.company && <CompanyLogo company={p.company} size="md" />}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{p.company?.name}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${
                    p.relationship === "sponsor" ? "bg-purple-100 text-purple-700" :
                    p.relationship === "organizer" ? "bg-blue-100 text-blue-700" :
                    p.relationship === "supporter" ? "bg-teal-100 text-teal-700" :
                    "bg-orange-100 text-orange-700"
                  }`}>{p.relationship}</span>
                </div>
                <button
                  onClick={() => openEdit(p)}
                  className="p-2 text-gray-400 hover:text-[#3182ce] hover:bg-blue-50 rounded-xl transition-colors"
                >
                  <Pencil className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleRemovePartner(p.id)}
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
            <h2 className="text-lg font-semibold mb-4">{showCreateNew ? "Create Company" : "Add Partner"}</h2>
            
            {!showCreateNew ? (
              <>
                <div className="mb-4">
                  <input
                    type="text"
                    placeholder="Search companies..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="input-base"
                  />
                </div>
                <div className="mb-4">
                  <button
                    onClick={() => setShowCreateNew(true)}
                    className="w-full p-3 rounded-xl border-2 border-dashed border-gray-300 text-gray-500 hover:border-[#3182ce] hover:text-[#3182ce] flex items-center justify-center gap-2"
                  >
                    <Plus className="w-5 h-5" />
                    Create New Company
                  </button>
                </div>
                <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">Relationship Type</label>
                  <div className="grid grid-cols-4 gap-2">
                    {(["partner", "sponsor", "organizer", "supporter"] as const).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setRelationship(type)}
                        className={`px-3 py-2 rounded-xl text-sm font-medium capitalize border ${
                          relationship === type
                            ? "bg-[#3182ce]/5 text-[#3182ce] border-[#3182ce]"
                            : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {companies
                    .filter((c) => !partners.some((p) => p.company_id === c.id))
                    .filter((c) => c.name.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map((company) => (
                      <button
                        key={company.id}
                        onClick={() => setSelectedCompany(company.id)}
                        className={`w-full p-3 rounded-xl text-left flex items-center gap-3 border ${
                          selectedCompany === company.id ? "border-[#3182ce] bg-[#3182ce]/5" : "border-gray-200"
                        }`}
                      >
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center overflow-hidden">
                          {company && <CompanyLogo company={company} size="sm" />}
                        </div>
                        <span className="font-medium">{company.name}</span>
                      </button>
                    ))}
                </div>
              </>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Company Name *</label>
                  <input
                    value={newCompany.name}
                    onChange={(e) => setNewCompany({ ...newCompany, name: e.target.value })}
                    className="input-base"
                    placeholder="Company name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Relationship Type</label>
                  <div className="grid grid-cols-4 gap-2">
                    {(["partner", "sponsor", "organizer", "supporter"] as const).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setRelationship(type)}
                        className={`px-3 py-2 rounded-xl text-sm font-medium capitalize border ${
                          relationship === type
                            ? "bg-[#3182ce]/5 text-[#3182ce] border-[#3182ce]"
                            : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Logo URL</label>
                  <input
                    value={newCompany.logo_url}
                    onChange={(e) => setNewCompany({ ...newCompany, logo_url: e.target.value })}
                    className="input-base"
                    placeholder="https://..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea
                    value={newCompany.description}
                    onChange={(e) => setNewCompany({ ...newCompany, description: e.target.value })}
                    className="input-base resize-none"
                    rows={3}
                    placeholder="Short description..."
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
                onClick={showCreateNew ? handleCreateCompany : handleAddPartner}
                disabled={saving || (showCreateNew ? !newCompany.name : !selectedCompany)}
                className="flex-1 px-4 py-2 bg-[#3182ce] text-white rounded-xl hover:bg-[#2c5cb8] disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : showCreateNew ? "Create & Add" : "Add"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showEditModal && editingPartner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowEditModal(false)} />
          <div className="relative bg-white rounded-2xl w-full max-w-lg p-6">
            <h2 className="text-lg font-semibold mb-4">Edit Partner</h2>
            <p className="text-sm text-gray-500 mb-4">{editingPartner.company?.name}</p>

            <label className="block text-sm font-medium mb-2">Relationship Type</label>
            <div className="grid grid-cols-4 gap-2 mb-6">
              {(["partner", "sponsor", "organizer", "supporter"] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setEditRelationship(type)}
                  className={`px-3 py-2 rounded-xl text-sm font-medium capitalize border ${
                    editRelationship === type
                      ? "bg-[#3182ce]/5 text-[#3182ce] border-[#3182ce]"
                      : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowEditModal(false)}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleEditPartner}
                disabled={saving}
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