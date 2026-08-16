"use client";

import { useState, useEffect, useCallback } from "react";
import { use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Briefcase,
  Loader2,
  ArrowLeft,
  MapPin,
  Globe,
  Mail,
  Clock,
  Save,
  DollarSign,
  Pencil,
} from "lucide-react";
import {
  Opportunity,
  OPPORTUNITY_TYPES,
  WORK_MODES,
  EMPLOYMENT_TYPES,
} from "@/types/company";
import { getOpportunityById, workerFetch } from "@/lib/worker";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/parts/Navbar";
import Breadcrumb from "@/components/parts/Breadcrumb";
import RichTextEditor from "@/components/parts/RichTextEditor";
import { useToast } from "@/components/ui/Toast";

export default function EditOpportunityPage({
  params,
}: {
  params: Promise<{ slug: string; "opp-id": string }>;
}) {
  const { slug, "opp-id": oppId } = use(params);
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { showToast } = useToast();
  const [opportunity, setOpportunity] = useState<Opportunity | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    full_description: "",
    requirements: "",
    benefits: "",
    type: "",
    location: "",
    salary: "",
    application_link: "",
    contact_email: "",
    work_mode: "Hybrid",
    employment_type: "Full-Time",
    country: "",
    status: "draft",
    expires_at: "",
  });

  const fetchOpportunity = useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await getOpportunityById(oppId);
    if (error || !data) {
      setError("Opportunity not found");
      setIsLoading(false);
      return;
    }

    setOpportunity(data);
    setFormData({
      title: data.title || "",
      description: data.description || "",
      full_description: data.full_description || "",
      requirements: data.requirements || "",
      benefits: data.benefits || "",
      type: data.type || "",
      location: data.location || "",
      salary: data.salary || "",
      application_link: data.application_link || "",
      contact_email: data.contact_email || "",
      work_mode: data.work_mode || "Hybrid",
      employment_type: data.employment_type || "Full-Time",
      country: data.country || "",
      status: data.status || "draft",
      expires_at: data.expires_at ? data.expires_at.split("T")[0] : "",
    });
    setIsLoading(false);
  }, [oppId, slug]);

  useEffect(() => {
    if (!authLoading && user) {
      fetchOpportunity();
    }
  }, [authLoading, user, fetchOpportunity]);

  const saveOpportunity = async () => {
    if (!opportunity) return;
    setIsSaving(true);
    const res = await workerFetch(`/api/opportunities/${oppId}`, {
      method: "PATCH",
      body: JSON.stringify({
        ...formData,
        expires_at: formData.expires_at
          ? new Date(formData.expires_at).toISOString()
          : null,
      }),
    });
    if (!res.ok) {
      showToast("Failed to save changes", "error");
    } else {
      const data = await res.json();
      setOpportunity(data);
      showToast("Changes saved successfully", "success");
    }
    setIsSaving(false);
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#3182ce] animate-spin" />
      </div>
    );
  }

  if (error || !opportunity) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <p className="text-gray-500 mb-4">{error || "Opportunity not found"}</p>
        <Link href={`/${slug}/opportunities`} className="text-[#3182ce] hover:underline">
          Go back
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Breadcrumb
          items={[
            { label: "Opportunities", href: `/${slug}/opportunities` },
            { label: opportunity?.title || "Opportunity", href: `/${slug}/opportunities/${oppId}` },
            { label: "Edit", href: `/${slug}/opportunities/${oppId}/edit` },
          ]}
        />

        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <Briefcase className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Edit Opportunity</h1>
                <p className="text-sm text-gray-500">{opportunity.title}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href={`/${slug}/opportunities/${oppId}`}
                className="inline-flex items-center gap-2 px-4 py-2 text-gray-700 bg-gray-100 rounded-xl font-medium text-sm hover:bg-gray-200 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Link>
              <button
                onClick={saveOpportunity}
                disabled={isSaving}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#3182ce] text-white rounded-xl font-medium text-sm hover:bg-[#2c5cb8] transition-colors disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Changes
              </button>
            </div>
          </div>

          <div className="grid gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#3182ce]/20 focus:border-[#3182ce] outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Short Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#3182ce]/20 focus:border-[#3182ce] outline-none resize-none"
                placeholder="Brief summary for listings..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Description</label>
              <RichTextEditor
                content={formData.full_description}
                onChange={(html) => setFormData({ ...formData, full_description: html })}
                placeholder="Detailed description with requirements, responsibilities..."
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Requirements</label>
                <RichTextEditor
                  content={formData.requirements}
                  onChange={(html) => setFormData({ ...formData, requirements: html })}
                  placeholder="List requirements..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Benefits</label>
                <RichTextEditor
                  content={formData.benefits}
                  onChange={(html) => setFormData({ ...formData, benefits: html })}
                  placeholder="List benefits..."
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#3182ce]/20 focus:border-[#3182ce] outline-none bg-white"
                >
                  <option value="">Select type</option>
                  {OPPORTUNITY_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#3182ce]/20 focus:border-[#3182ce] outline-none bg-white"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Country</label>
                <input
                  type="text"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#3182ce]/20 focus:border-[#3182ce] outline-none"
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  <DollarSign className="w-4 h-4 inline mr-1" /> Salary
                </label>
                <input
                  type="text"
                  value={formData.salary}
                  onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                  placeholder="e.g. $50,000 - $80,000"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#3182ce]/20 focus:border-[#3182ce] outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  <Clock className="w-4 h-4 inline mr-1" /> Deadline
                </label>
                <input
                  type="date"
                  value={formData.expires_at}
                  onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#3182ce]/20 focus:border-[#3182ce] outline-none"
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Work Mode</label>
                <select
                  value={formData.work_mode}
                  onChange={(e) => setFormData({ ...formData, work_mode: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#3182ce]/20 focus:border-[#3182ce] outline-none bg-white"
                >
                  {WORK_MODES.map((w) => (
                    <option key={w} value={w}>{w}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Employment Type</label>
                <select
                  value={formData.employment_type}
                  onChange={(e) => setFormData({ ...formData, employment_type: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#3182ce]/20 focus:border-[#3182ce] outline-none bg-white"
                >
                  {EMPLOYMENT_TYPES.map((e) => (
                    <option key={e} value={e}>{e}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  <Globe className="w-4 h-4 inline mr-1" /> Application Link
                </label>
                <input
                  type="url"
                  value={formData.application_link}
                  onChange={(e) => setFormData({ ...formData, application_link: e.target.value })}
                  placeholder="https://... or 'apply' for internal form"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#3182ce]/20 focus:border-[#3182ce] outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  <Mail className="w-4 h-4 inline mr-1" /> Contact Email
                </label>
                <input
                  type="email"
                  value={formData.contact_email}
                  onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#3182ce]/20 focus:border-[#3182ce] outline-none"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
