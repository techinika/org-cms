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
} from "lucide-react";
import { FeaturedStartup, Event, Opportunity, INDUSTRIES } from "@/types/company";
import { getCompanyBySlug, updateCompany, getCompanyEvents, getCompanyOpportunities } from "@/lib/supabase";
import { checkAuthClient, getAuthRedirectUrl } from "@/lib/auth-client";
import Navbar from "@/components/parts/Navbar";
import { uploadToCloudinary } from "@/lib/cloudinary";

type Tab = "profile" | "events" | "opportunities";

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

    const [eventsData, oppData] = await Promise.all([
      getCompanyEvents(data.id),
      getCompanyOpportunities(data.id),
    ]);
    setEvents(eventsData.data || []);
    setOpportunities(oppData.data || []);
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

  const togglePublish = () => {
    saveCompany({ is_published: !formData.is_published });
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
          <div className="h-24 bg-gradient-to-r from-[#3182ce] to-[#63b3ed]"></div>
          
          <div className="px-6 pb-6">
            <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-10 mb-4">
              <div className="relative group">
                <div className="w-20 h-20 rounded-2xl bg-white border-4 border-white shadow-lg flex items-center justify-center overflow-hidden">
                  {logoPreview ? (
                    <img src={logoPreview} alt={company.name} className="w-full h-full object-cover" />
                  ) : (
                    <Building2 className="w-8 h-8 text-gray-300" />
                  )}
                </div>
                <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-2xl opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                  <input type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
                  {isUploading ? <Loader2 className="w-5 h-5 text-white animate-spin" /> : <span className="text-xs text-white font-medium">Change</span>}
                </label>
              </div>
              
              <div className="flex-1 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{company.name}</h1>
                  <p className="text-sm text-gray-500 line-clamp-1">{company.description}</p>
                </div>
                <button
                  onClick={togglePublish}
                  disabled={isSaving}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-colors ${
                    formData.is_published
                      ? "bg-green-100 text-green-700 hover:bg-green-200"
                      : "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                  }`}
                >
                  {formData.is_published ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  {formData.is_published ? "Published" : "Draft"}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs text-gray-500 mb-6">
              <span>Created: {new Date(company.created_at).toLocaleDateString()}</span>
              {company.updated_at && <span>Updated: {new Date(company.updated_at).toLocaleDateString()}</span>}
            </div>

            <nav className="flex gap-2 border-b border-gray-200 -mx-6 px-6">
              {(["profile", "events", "opportunities"] as Tab[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors -mb-px ${
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
          {activeTab === "events" && <EventsTab events={events} companyId={company.id} />}
          {activeTab === "opportunities" && <OpportunitiesTab opportunities={opportunities} companyId={company.id} />}
        </div>
      </div>
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

function EventsTab({ events, companyId }: { events: Event[]; companyId: string }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Events</h2>
        <button className="inline-flex items-center gap-2 px-4 py-2 bg-[#3182ce] text-white rounded-xl font-medium text-sm hover:bg-[#2c5cb8] transition-colors">
          <Calendar className="w-4 h-4" />
          Create Event
        </button>
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
              <div className="w-14 h-14 bg-[#3182ce]/10 rounded-xl flex items-center justify-center">
                <Calendar className="w-7 h-7 text-[#3182ce]" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-gray-900">{event.title}</h3>
                <p className="text-sm text-gray-500">{event.location || "No location"}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">
                  {event.start_date ? new Date(event.start_date).toLocaleDateString() : "TBA"}
                </p>
                <span className={`text-xs px-2 py-0.5 rounded-full ${event.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                  {event.status || "draft"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function OpportunitiesTab({ opportunities, companyId }: { opportunities: Opportunity[]; companyId: string }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Opportunities</h2>
        <button className="inline-flex items-center gap-2 px-4 py-2 bg-[#3182ce] text-white rounded-xl font-medium text-sm hover:bg-[#2c5cb8] transition-colors">
          <Briefcase className="w-4 h-4" />
          Create Opportunity
        </button>
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
              <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center">
                <Briefcase className="w-7 h-7 text-purple-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-gray-900">{opp.title}</h3>
                <p className="text-sm text-gray-500">{opp.type} {opp.location && `• ${opp.location}`}</p>
              </div>
              <div className="text-right">
                {opp.deadline && (
                  <p className="text-sm text-gray-500">Due: {new Date(opp.deadline).toLocaleDateString()}</p>
                )}
                <span className={`text-xs px-2 py-0.5 rounded-full ${opp.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                  {opp.status || "draft"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}