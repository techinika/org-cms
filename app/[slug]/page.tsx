"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import {
  Building2,
  Calendar,
  Briefcase,
  Loader2,
  ArrowLeft,
  Eye,
  EyeOff,
  MapPin,
  Globe,
  Mail,
  Tags,
  FileText,
  Save,
  Trash2,
  MoreVertical,
  AlertTriangle,
  Users,
} from "lucide-react";
import { FeaturedStartup, Event, Opportunity, INDUSTRIES, UserCompany } from "@/types/company";
import { getCompanyBySlug, updateCompany, getCompanyEvents, getCompanyOpportunities, deleteCompany, deleteEvent, deleteOpportunity, getCompanyUsers, deleteCompanyUser, addCompanyUser } from "@/lib/supabase";
import { checkAuthClient, getAuthRedirectUrl } from "@/lib/auth-client";
import Navbar from "@/components/parts/Navbar";
import { uploadToCloudinary } from "@/lib/cloudinary";

type Tab = "profile" | "events" | "opportunities" | "users";

interface Props {
  params: Promise<{ slug: string }>;
}

export default function CompanyPage({ params }: Props) {
  const { slug } = use(params);
  const [activeTab, setActiveTab] = useState<Tab>("profile");
  const [company, setCompany] = useState<FeaturedStartup | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<{ name: string; email: string; avatar?: string } | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showUnpublishModal, setShowUnpublishModal] = useState(false);
  const [showEventMenu, setShowEventMenu] = useState<string | null>(null);
  const [showOppMenu, setShowOppMenu] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [companyUsers, setCompanyUsers] = useState<UserCompany[]>([]);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("employee");
  const [isInviting, setIsInviting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    website: "",
    email: "",
    country: "",
    location: "",
    industry: "",
    tags: "",
    seo_title: "",
    seo_description: "",
    is_published: false,
  });

  useEffect(() => {
    checkAuth();
  }, [slug]);

  const checkAuth = async () => {
    const authResult = await checkAuthClient();
    if (!authResult.authenticated || !authResult.user) {
      window.location.href = getAuthRedirectUrl();
      return;
    }
    setUser({ name: authResult.user.name, email: authResult.user.email, avatar: authResult.user.avatar });
    fetchCompany();
  };

  const fetchCompany = async () => {
    setIsLoading(true);
    const { data, error } = await getCompanyBySlug(slug);
    if (error || !data) {
      setError("Company not found");
      setIsLoading(false);
      return;
    }
    setCompany(data);
    setFormData({
      name: data.name || "",
      description: data.description || "",
      website: data.website || "",
      email: data.email || "",
      country: data.country || "",
      location: data.location || "",
      industry: data.industry || "",
      tags: data.tags || "",
      seo_title: data.seo_title || "",
      seo_description: data.seo_description || "",
      is_published: data.is_published || false,
    });
    setLogoPreview(data.logo_url);

    const [eventsData, oppData, usersData] = await Promise.all([
      getCompanyEvents(data.id),
      getCompanyOpportunities(data.id),
      getCompanyUsers(data.id),
    ]);
    setEvents(eventsData.data || []);
    setOpportunities(oppData.data || []);
    setCompanyUsers(usersData.data || []);
    setIsLoading(false);
  };

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !company) return;
    const previewUrl = URL.createObjectURL(file);
    setLogoPreview(previewUrl);
    setIsUploading(true);
    try {
      const url = await uploadToCloudinary(file, "companies");
      await saveCompany({ logo_url: url });
      setLogoPreview(url);
    } catch (err) {
      console.error("Failed to upload logo:", err);
    } finally {
      setIsUploading(false);
    }
  };

  const saveCompany = async (updates: Partial<FeaturedStartup>) => {
    if (!company) return;
    setIsSaving(true);
    const { data, error } = await updateCompany(company.id, { ...formData, ...updates });
    if (error) {
      setError("Failed to save");
    } else if (data) {
      setCompany(data);
    }
    setIsSaving(false);
  };

  const handleSave = () => saveCompany({});

  const handleUnpublish = () => {
    saveCompany({ is_published: false });
    setShowUnpublishModal(false);
  };

  const handleDeleteCompany = async () => {
    if (!company) return;
    setDeletingId(company.id);
    const { error } = await deleteCompany(company.id);
    if (!error) {
      window.location.href = "/";
    } else {
      setError("Failed to delete company");
    }
    setDeletingId(null);
    setShowDeleteModal(false);
  };

  const handleDeleteEvent = async (eventId: string) => {
    setDeletingId(eventId);
    const { error } = await deleteEvent(eventId);
    if (!error) {
      setEvents(events.filter(e => e.id !== eventId));
    }
    setDeletingId(null);
    setShowEventMenu(null);
  };

  const handleDeleteOpportunity = async (oppId: string) => {
    setDeletingId(oppId);
    const { error } = await deleteOpportunity(oppId);
    if (!error) {
      setOpportunities(opportunities.filter(o => o.id !== oppId));
    }
    setDeletingId(null);
    setShowOppMenu(null);
  };

  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !company) return;
    setIsInviting(true);
    const { data: newUser, error } = await addCompanyUser(company.id, inviteEmail, inviteRole, user?.email || "");
    if (!error && newUser) {
      setCompanyUsers([...companyUsers, newUser]);
    }
    setInviteEmail("");
    setShowInviteForm(false);
    setIsInviting(false);
  };

  const handleDeleteUser = async (userId: string) => {
    setDeletingId(userId);
    const { error } = await deleteCompanyUser(userId);
    if (!error) {
      setCompanyUsers(companyUsers.filter(u => u.id !== userId));
    }
    setDeletingId(null);
    setShowUserMenu(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#3182ce] animate-spin" />
      </div>
    );
  }

  if (error || !company) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <p className="text-gray-500 mb-4">{error || "Company not found"}</p>
        <Link href="/" className="text-[#3182ce] hover:underline">Go back home</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user || undefined} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-6">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-[#3182ce] transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Companies
          </Link>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="h-16 md:h-20 bg-gradient-to-r from-[#3182ce] to-[#63b3ed]"></div>
          
          <div className="px-4 sm:px-6 pb-6">
            <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-8 sm:-mt-10 mb-4">
              <div className="relative group">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white border-4 border-white shadow-lg flex items-center justify-center overflow-hidden">
                  {logoPreview ? (
                    <img src={logoPreview} alt={company.name} className="w-full h-full object-cover" />
                  ) : (
                    <Building2 className="w-6 h-6 sm:w-8 sm:h-8 text-gray-300" />
                  )}
                </div>
                <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-2xl opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                  <input type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
                  {isUploading ? <Loader2 className="w-5 h-5 text-white animate-spin" /> : <span className="text-xs text-white font-medium">Change</span>}
                </label>
              </div>
              
              <div className="flex-1 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="pt-2 sm:pt-0">
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{company.name}</h1>
                  <p className="text-sm text-gray-500 line-clamp-1">{company.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => formData.is_published ? setShowUnpublishModal(true) : saveCompany({ is_published: true })}
                    disabled={isSaving}
                    className={`inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl font-medium text-sm transition-colors ${
                      formData.is_published
                        ? "bg-green-100 text-green-700 hover:bg-green-200"
                        : "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                    }`}
                  >
                    {formData.is_published ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    <span className="hidden sm:inline">{formData.is_published ? "Published" : "Draft"}</span>
                  </button>
                  <button
                    onClick={() => setShowDeleteModal(true)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-gray-500 mb-4">
              <span>Created: {new Date(company.created_at).toLocaleDateString()}</span>
              {company.updated_at && <span>Updated: {new Date(company.updated_at).toLocaleDateString()}</span>}
            </div>

            <nav className="flex gap-1 border-b border-gray-200 -mx-4 sm:-mx-6 px-4 sm:px-6 overflow-x-auto">
              {(["profile", "events", "opportunities", "users"] as Tab[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors -mb-px whitespace-nowrap ${
                    activeTab === tab
                      ? "border-[#3182ce] text-[#3182ce]"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </nav>
          </div>
        </div>

        <div className="mt-6">
          {activeTab === "profile" && (
            <ProfileTab
              formData={formData}
              setFormData={setFormData}
              onSave={handleSave}
              isSaving={isSaving}
            />
          )}
          {activeTab === "events" && (
            <EventsTab
              events={events}
              companySlug={slug}
              onDelete={handleDeleteEvent}
              deletingId={deletingId}
              showMenu={showEventMenu}
              setShowMenu={setShowEventMenu}
            />
          )}
          {activeTab === "opportunities" && (
            <OpportunitiesTab
              opportunities={opportunities}
              companySlug={slug}
              onDelete={handleDeleteOpportunity}
              deletingId={deletingId}
              showMenu={showOppMenu}
              setShowMenu={setShowOppMenu}
            />
          )}
          {activeTab === "users" && (
            <UsersTab
              users={companyUsers}
              onInvite={() => setShowInviteForm(true)}
              showInviteForm={showInviteForm}
              inviteEmail={inviteEmail}
              setInviteEmail={setInviteEmail}
              inviteRole={inviteRole}
              setInviteRole={setInviteRole}
              onInviteSubmit={handleInviteUser}
              isInviting={isInviting}
              onCancelInvite={() => { setShowInviteForm(false); setInviteEmail(""); }}
              onDelete={handleDeleteUser}
              deletingId={deletingId}
              showMenu={showUserMenu}
              setShowMenu={setShowUserMenu}
            />
          )}
        </div>
      </div>

      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Delete Company</h3>
                <p className="text-sm text-gray-500">This action cannot be undone</p>
              </div>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete <strong>{company.name}</strong>? This will also delete all associated events and opportunities.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteCompany}
                disabled={deletingId === company.id}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors disabled:opacity-50"
              >
                {deletingId === company.id ? <Loader2 className="w-4 h-4 animate-spin" /> : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showUnpublishModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <EyeOff className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Unpublish Company</h3>
                <p className="text-sm text-gray-500">This will hide your company from the public</p>
              </div>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to unpublish <strong>{company.name}</strong>? Users will no longer be able to see it until you publish it again.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowUnpublishModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUnpublish}
                className="px-4 py-2 text-sm font-medium text-white bg-yellow-600 hover:bg-yellow-700 rounded-xl transition-colors"
              >
                Unpublish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ProfileTab({
  formData,
  setFormData,
  onSave,
  isSaving,
}: {
  formData: {
    name: string;
    description: string;
    website: string;
    email: string;
    country: string;
    location: string;
    industry: string;
    tags: string;
    seo_title: string;
    seo_description: string;
    is_published: boolean;
  };
  setFormData: React.Dispatch<React.SetStateAction<typeof formData>>;
  onSave: () => void;
  isSaving: boolean;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Company Profile</h2>
        <button
          onClick={onSave}
          disabled={isSaving}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#3182ce] text-white rounded-xl font-medium text-sm hover:bg-[#2c5cb8] transition-colors disabled:opacity-50"
        >
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Changes
        </button>
      </div>

      <div className="grid gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Company Name</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#3182ce]/20 focus:border-[#3182ce] outline-none transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Description / Bio</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={4}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#3182ce]/20 focus:border-[#3182ce] outline-none transition-all resize-none"
            placeholder="Tell people about your company..."
          />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              <Globe className="w-4 h-4 inline mr-1" />
              Website
            </label>
            <input
              type="url"
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              placeholder="https://example.com"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#3182ce]/20 focus:border-[#3182ce] outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              <Mail className="w-4 h-4 inline mr-1" />
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="contact@company.com"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#3182ce]/20 focus:border-[#3182ce] outline-none transition-all"
            />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              <MapPin className="w-4 h-4 inline mr-1" />
              Country
            </label>
            <input
              type="text"
              value={formData.country}
              onChange={(e) => setFormData({ ...formData, country: e.target.value })}
              placeholder="e.g. Rwanda"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#3182ce]/20 focus:border-[#3182ce] outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              <MapPin className="w-4 h-4 inline mr-1" />
              Location
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="e.g. Kigali, Rwanda"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#3182ce]/20 focus:border-[#3182ce] outline-none transition-all"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Industry</label>
          <select
            value={formData.industry}
            onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#3182ce]/20 focus:border-[#3182ce] outline-none transition-all bg-white"
          >
            <option value="">Select an industry</option>
            {INDUSTRIES.map((ind) => (
              <option key={ind} value={ind}>{ind}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            <Tags className="w-4 h-4 inline mr-1" />
            Tags
          </label>
          <input
            type="text"
            value={formData.tags}
            onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
            placeholder="Comma-separated tags"
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#3182ce]/20 focus:border-[#3182ce] outline-none transition-all"
          />
        </div>

        <div className="pt-4 border-t border-gray-200">
          <h3 className="text-md font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5" />
            SEO Settings
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">SEO Title</label>
              <input
                type="text"
                value={formData.seo_title}
                onChange={(e) => setFormData({ ...formData, seo_title: e.target.value })}
                placeholder="Custom title for search engines"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#3182ce]/20 focus:border-[#3182ce] outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">SEO Description</label>
              <textarea
                value={formData.seo_description}
                onChange={(e) => setFormData({ ...formData, seo_description: e.target.value })}
                rows={3}
                placeholder="Custom description for search engines"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#3182ce]/20 focus:border-[#3182ce] outline-none transition-all resize-none"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function EventsTab({
  events,
  companySlug,
  onDelete,
  deletingId,
  showMenu,
  setShowMenu,
}: {
  events: Event[];
  companySlug: string;
  onDelete: (id: string) => void;
  deletingId: string | null;
  showMenu: string | null;
  setShowMenu: (id: string | null) => void;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Events</h2>
        <Link href={`/${companySlug}/events/new`} className="inline-flex items-center gap-2 px-4 py-2 bg-[#3182ce] text-white rounded-xl font-medium text-sm hover:bg-[#2c5cb8] transition-colors">
          <Calendar className="w-4 h-4" />
          Create Event
        </Link>
      </div>

      {events.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-500">No events yet</p>
          <p className="text-sm text-gray-400 mt-1">Create your first event for this company</p>
        </div>
      ) : (
        <div className="space-y-4">
          {events.map((event) => (
            <div key={event.id} className="flex items-center gap-4 p-4 border border-gray-200 rounded-xl hover:border-[#3182ce]/30 transition-colors">
              <Link href={`/${companySlug}/events/${event.id}`} className="w-14 h-14 bg-[#3182ce]/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <Calendar className="w-7 h-7 text-[#3182ce]" />
              </Link>
              <div className="flex-1 min-w-0">
                <Link href={`/${companySlug}/events/${event.id}`} className="font-medium text-gray-900 hover:text-[#3182ce] transition-colors block truncate">
                  {event.title}
                </Link>
                <p className="text-sm text-gray-500">{event.location || "No location"}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-sm text-gray-500">
                  {event.start_date ? new Date(event.start_date).toLocaleDateString() : "TBA"}
                </p>
                <span className={`text-xs px-2 py-0.5 rounded-full ${event.status === 'Upcoming' || event.status === 'Ongoing' || event.publish_status === 'published' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                  {event.status || "draft"}
                </span>
              </div>
              <div className="relative">
                <button
                  onClick={() => setShowMenu(showMenu === event.id ? null : event.id)}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <MoreVertical className="w-5 h-5 text-gray-400" />
                </button>
                {showMenu === event.id && (
                  <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-xl shadow-lg border border-gray-200 py-1 z-10">
                    <button
                      onClick={() => onDelete(event.id)}
                      disabled={deletingId === event.id}
                      className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                    >
                      {deletingId === event.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function OpportunitiesTab({
  opportunities,
  companySlug,
  onDelete,
  deletingId,
  showMenu,
  setShowMenu,
}: {
  opportunities: Opportunity[];
  companySlug: string;
  onDelete: (id: string) => void;
  deletingId: string | null;
  showMenu: string | null;
  setShowMenu: (id: string | null) => void;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Opportunities</h2>
        <Link href={`/${companySlug}/opportunities/new`} className="inline-flex items-center gap-2 px-4 py-2 bg-[#3182ce] text-white rounded-xl font-medium text-sm hover:bg-[#2c5cb8] transition-colors">
          <Briefcase className="w-4 h-4" />
          Create Opportunity
        </Link>
      </div>

      {opportunities.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Briefcase className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-500">No opportunities yet</p>
          <p className="text-sm text-gray-400 mt-1">Create job openings, internships, or grants</p>
        </div>
      ) : (
        <div className="space-y-4">
          {opportunities.map((opp) => (
            <div key={opp.id} className="flex items-center gap-4 p-4 border border-gray-200 rounded-xl hover:border-[#3182ce]/30 transition-colors">
              <Link href={`/${companySlug}/opportunities/${opp.id}`} className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Briefcase className="w-7 h-7 text-purple-600" />
              </Link>
              <div className="flex-1 min-w-0">
                <Link href={`/${companySlug}/opportunities/${opp.id}`} className="font-medium text-gray-900 hover:text-[#3182ce] transition-colors block truncate">
                  {opp.title}
                </Link>
                <p className="text-sm text-gray-500">{opp.type} {opp.location && `• ${opp.location}`}</p>
              </div>
              <div className="text-right flex-shrink-0">
                {opp.expires_at && (
                  <p className="text-sm text-gray-500">Due: {new Date(opp.expires_at).toLocaleDateString()}</p>
                )}
                <span className={`text-xs px-2 py-0.5 rounded-full ${opp.status === 'Open' || opp.status === 'Closed' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                  {opp.status || "draft"}
                </span>
              </div>
              <div className="relative">
                <button
                  onClick={() => setShowMenu(showMenu === opp.id ? null : opp.id)}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <MoreVertical className="w-5 h-5 text-gray-400" />
                </button>
                {showMenu === opp.id && (
                  <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-xl shadow-lg border border-gray-200 py-1 z-10">
                    <button
                      onClick={() => onDelete(opp.id)}
                      disabled={deletingId === opp.id}
                      className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                    >
                      {deletingId === opp.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function UsersTab({
  users,
  onInvite,
  showInviteForm,
  inviteEmail,
  setInviteEmail,
  inviteRole,
  setInviteRole,
  onInviteSubmit,
  isInviting,
  onCancelInvite,
  onDelete,
  deletingId,
  showMenu,
  setShowMenu,
}: {
  users: UserCompany[];
  onInvite: () => void;
  showInviteForm: boolean;
  inviteEmail: string;
  setInviteEmail: (v: string) => void;
  inviteRole: string;
  setInviteRole: (v: string) => void;
  onInviteSubmit: (e: React.FormEvent) => void;
  isInviting: boolean;
  onCancelInvite: () => void;
  onDelete: (id: string) => void;
  deletingId: string | null;
  showMenu: string | null;
  setShowMenu: (id: string | null) => void;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Team Members</h2>
        <button
          onClick={onInvite}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#3182ce] text-white rounded-xl font-medium text-sm hover:bg-[#2c5cb8] transition-colors"
        >
          <Users className="w-4 h-4" />
          Invite User
        </button>
      </div>

      {showInviteForm && (
        <form onSubmit={onInviteSubmit} className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="Enter email address"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#3182ce]/20 focus:border-[#3182ce] outline-none transition-all"
                required
              />
            </div>
            <div className="flex gap-2">
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#3182ce]/20 focus:border-[#3182ce] outline-none transition-all bg-white"
              >
                <option value="manager">Manager</option>
                <option value="employee">Employee</option>
              </select>
              <button
                type="submit"
                disabled={isInviting}
                className="px-4 py-2 bg-[#3182ce] text-white rounded-xl font-medium text-sm hover:bg-[#2c5cb8] transition-colors disabled:opacity-50"
              >
                {isInviting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Invite"}
              </button>
              <button
                type="button"
                onClick={onCancelInvite}
                className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      )}

      {users.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-500">No team members yet</p>
          <p className="text-sm text-gray-400 mt-1">Invite team members to help manage this company</p>
        </div>
      ) : (
        <div className="space-y-4">
          {users.map((user) => (
            <div key={user.id} className="flex items-center gap-4 p-4 border border-gray-200 rounded-xl hover:border-[#3182ce]/30 transition-colors">
              <div className="w-12 h-12 bg-[#3182ce]/10 rounded-full flex items-center justify-center flex-shrink-0">
                {user.author?.name ? (
                  <span className="text-[#3182ce] font-medium">{user.author.name.charAt(0).toUpperCase()}</span>
                ) : (
                  <Users className="w-6 h-6 text-[#3182ce]" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">
                  {user.author?.name || user.author?.email || "Unknown User"}
                </p>
                <p className="text-sm text-gray-500 truncate">{user.author?.email}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className={`text-xs px-2 py-1 rounded-full ${
                  user.role === "creator" ? "bg-purple-100 text-purple-700" :
                  user.role === "manager" ? "bg-blue-100 text-blue-700" :
                  "bg-gray-100 text-gray-600"
                }`}>
                  {user.role}
                </span>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  user.status === "active" ? "bg-green-100 text-green-700" :
                  user.status === "confirmation_pending" ? "bg-yellow-100 text-yellow-700" :
                  "bg-red-100 text-red-700"
                }`}>
                  {user.status?.replace("_", " ")}
                </span>
              </div>
              {user.role !== "creator" && (
                <div className="relative">
                  <button
                    onClick={() => setShowMenu(showMenu === user.id ? null : user.id)}
                    className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                  >
                    <MoreVertical className="w-5 h-5 text-gray-400" />
                  </button>
                  {showMenu === user.id && (
                    <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-xl shadow-lg border border-gray-200 py-1 z-10">
                      <button
                        onClick={() => onDelete(user.id)}
                        disabled={deletingId === user.id}
                        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                      >
                        {deletingId === user.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
