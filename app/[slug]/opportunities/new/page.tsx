"use client";

import { useState, useEffect, use } from "react";
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
} from "lucide-react";
import {
  OPPORTUNITY_TYPES,
  WORK_MODES,
  EMPLOYMENT_TYPES,
} from "@/types/company";
import { supabase } from "@/lib/supabase";
import { checkAuthClient, getAuthRedirectUrl } from "@/lib/auth-client";
import Navbar from "@/components/parts/Navbar";
import Breadcrumb from "@/components/parts/Breadcrumb";
import RichTextEditor from "@/components/parts/RichTextEditor";

interface Props {
  params: Promise<{ slug: string }>;
}

export default function NewOpportunityPage({ params }: Props) {
  const { slug } = use(params);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<{
    name: string;
    email: string;
    avatar?: string;
  } | null>(null);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    full_description: "",
    requirements: "",
    benefits: "",
    type: "Job",
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

  const fetchCompany = async () => {
    const { data } = await supabase
      .from("featured_startups")
      .select("id")
      .eq("slug", slug)
      .single();
    if (data) {
      setCompanyId(data.id);
    }
    setIsLoading(false);
  };

  const checkAuth = async () => {
    const authResult = await checkAuthClient();
    if (!authResult.authenticated || !authResult.user) {
      window.location.href = getAuthRedirectUrl();
      return;
    }
    setUser({
      name: authResult.user.name,
      email: authResult.user.email,
      avatar: authResult.user.avatar,
    });
    await fetchCompany();
  };

  useEffect(() => {
    checkAuth();
  }, [slug]);

  const handleSubmit = async () => {
    if (!companyId || !formData.title || !formData.description) {
      setError("Please fill in required fields");
      return;
    }

    setIsSaving(true);
    const slug =
      formData.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "") +
      "-" +
      Date.now().toString(36);

    const { error: insertError } = await supabase.from("opportunities").insert({
      title: formData.title,
      slug,
      description: formData.description,
      full_description: formData.full_description || formData.description,
      requirements: formData.requirements,
      benefits: formData.benefits,
      type: formData.type,
      location: formData.location,
      salary: formData.salary || null,
      application_link: formData.application_link || null,
      contact_email: formData.contact_email || null,
      work_mode: formData.work_mode,
      employment_type: formData.employment_type,
      country: formData.country || null,
      status: formData.status,
      company_id: companyId,
      expires_at: formData.expires_at
        ? new Date(formData.expires_at).toISOString()
        : null,
      views: 0,
    });

    if (insertError) {
      setError("Failed to create opportunity");
      setIsSaving(false);
      return;
    }

    window.location.href = `/${slug}/opportunities`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#3182ce] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user || undefined} />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Breadcrumb items={[
          { label: "Opportunities", href: `/${slug}/opportunities` },
          { label: "Create Opportunity", href: `/${slug}/opportunities/new` },
        ]} />

        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <Briefcase className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                Create New Opportunity
              </h1>
              <p className="text-sm text-gray-500">
                Add a new job, internship, grant, or tender
              </p>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
              {error}
            </div>
          )}

          <div className="grid gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="e.g. Senior Software Engineer"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#3182ce]/20 focus:border-[#3182ce] outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Short Description <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={2}
                placeholder="Brief description..."
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#3182ce]/20 focus:border-[#3182ce] outline-none resize-none"
              />
            </div>

            <div className="prose max-w-none">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Full Description
              </label>
              <RichTextEditor
                content={formData.full_description}
                onChange={(html) =>
                  setFormData({ ...formData, full_description: html })
                }
                placeholder="Detailed description about the role..."
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="prose max-w-none">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Requirements
                </label>
                <RichTextEditor
                  content={formData.requirements}
                  onChange={(html) =>
                    setFormData({ ...formData, requirements: html })
                  }
                  placeholder="List requirements..."
                />
              </div>
              <div className="prose max-w-none">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Benefits
                </label>
                <RichTextEditor
                  content={formData.benefits}
                  onChange={(html) =>
                    setFormData({ ...formData, benefits: html })
                  }
                  placeholder="List benefits..."
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Type
                </label>
                <select
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({ ...formData, type: e.target.value })
                  }
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#3182ce]/20 focus:border-[#3182ce] outline-none bg-white"
                >
                  {OPPORTUNITY_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value })
                  }
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#3182ce]/20 focus:border-[#3182ce] outline-none bg-white"
                >
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
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
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                  placeholder="e.g. Kigali, Rwanda"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#3182ce]/20 focus:border-[#3182ce] outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Country
                </label>
                <input
                  type="text"
                  value={formData.country}
                  onChange={(e) =>
                    setFormData({ ...formData, country: e.target.value })
                  }
                  placeholder="e.g. Rwanda"
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
                  onChange={(e) =>
                    setFormData({ ...formData, salary: e.target.value })
                  }
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
                  onChange={(e) =>
                    setFormData({ ...formData, expires_at: e.target.value })
                  }
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#3182ce]/20 focus:border-[#3182ce] outline-none"
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Work Mode
                </label>
                <select
                  value={formData.work_mode}
                  onChange={(e) =>
                    setFormData({ ...formData, work_mode: e.target.value })
                  }
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#3182ce]/20 focus:border-[#3182ce] outline-none bg-white"
                >
                  {WORK_MODES.map((w) => (
                    <option key={w} value={w}>
                      {w}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Employment Type
                </label>
                <select
                  value={formData.employment_type}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      employment_type: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#3182ce]/20 focus:border-[#3182ce] outline-none bg-white"
                >
                  {EMPLOYMENT_TYPES.map((e) => (
                    <option key={e} value={e}>
                      {e}
                    </option>
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
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      application_link: e.target.value,
                    })
                  }
                  placeholder="https://..."
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
                  onChange={(e) =>
                    setFormData({ ...formData, contact_email: e.target.value })
                  }
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#3182ce]/20 focus:border-[#3182ce] outline-none"
                />
              </div>
            </div>

            <div className="pt-4">
              <button
                onClick={handleSubmit}
                disabled={isSaving}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#3182ce] text-white rounded-xl font-medium hover:bg-[#2c5cb8] transition-colors disabled:opacity-50"
              >
                {isSaving ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Save className="w-5 h-5" />
                )}
                Create Opportunity
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
