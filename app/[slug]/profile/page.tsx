"use client";

import { useState, useEffect } from "react";
import { use } from "react";
import Link from "next/link";
import {
  Building2,
  Globe,
  MapPin,
  Mail,
  Briefcase,
  ExternalLink,
  Loader2,
  ArrowLeft,
  Save,
  Trash2,
  Tags,
  FileText,
} from "lucide-react";
import { FeaturedStartup, INDUSTRIES } from "@/types/company";
import { getCompanyBySlug, updateCompany, removeUserCompany } from "@/lib/supabase";
import { checkAuthClient, getAuthRedirectUrl } from "@/lib/auth-client";
import Navbar from "@/components/parts/Navbar";
import Breadcrumb from "@/components/parts/Breadcrumb";
import { uploadToImageKit } from "@/lib/imagekit";
import ConfirmationModal from "@/components/ui/ConfirmationModal";
import { useToast } from "@/components/ui/Toast";

export default function CompanyProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const { showToast } = useToast();
  const [company, setCompany] = useState<FeaturedStartup | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<{
    name: string;
    email: string;
    avatar?: string;
  } | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    website: "",
    email: "",
    country: "",
    location: "",
    industry: "",
    tags: "",
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
    setUser({
      name: authResult.user.name,
      email: authResult.user.email,
      avatar: authResult.user.avatar,
    });
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
    });
    setLogoPreview(data.logo_url);
    setIsLoading(false);
  };

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !company) return;
    const previewUrl = URL.createObjectURL(file);
    setLogoPreview(previewUrl);
    setIsUploading(true);
    try {
      const result = await fetch("/api/upload-image", {
        method: "POST",
        body: (() => {
          const fd = new FormData();
          fd.append("file", file);
          fd.append("folder", "companies");
          return fd;
        })(),
      }).then(r => r.json());
      
      if (result.asset_id) {
        await saveCompany({ logo_url: result.url, image_ref: result.asset_id });
        setLogoPreview(result.url);
      } else {
        throw new Error(result.error || "Upload failed");
      }
    } catch (err) {
      console.error("Failed to upload logo:", err);
      showToast("Failed to upload logo", "error");
    } finally {
      setIsUploading(false);
    }
  };

  const saveCompany = async (updates: Partial<FeaturedStartup>) => {
    if (!company) return;
    setIsSaving(true);
    const { data, error } = await updateCompany(company.id, {
      ...formData,
      ...updates,
    });
    if (error) {
      setError("Failed to save");
      showToast("Failed to save changes", "error");
    } else if (data) {
      setCompany(data);
      showToast("Changes saved successfully", "success");
    }
    setIsSaving(false);
  };

  const handleSave = () => saveCompany({});

  const handleDeleteCompany = async () => {
    if (!company || !user) return;
    setDeletingId(company.id);
    const { error } = await removeUserCompany(user.email, company.id);
    setDeletingId(null);
    setShowDeleteModal(false);
    if (error) {
      setError("Failed to remove company");
      showToast("Failed to remove company", "error");
    } else {
      showToast("Company removed from your account", "success");
      window.location.href = "/";
    }
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
        <Link href="/" className="text-[#3182ce] hover:underline">
          Go back home
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user || undefined} />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumb items={[
          { label: "Company", href: `/${slug}` },
          { label: "Edit Profile", href: `/${slug}/profile` },
        ]} />

        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="h-20"></div>

          <div className="px-8 pb-8">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 -mt-12 mb-6">
              <div className="flex items-end gap-4">
                <div className="relative group">
                  <div className="w-24 h-24 rounded-2xl bg-white border-4 border-white shadow-lg flex items-center justify-center overflow-hidden">
                    {logoPreview ? (
                      <img
                        src={logoPreview}
                        alt={company.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Building2 className="w-10 h-10 text-gray-300" />
                    )}
                  </div>
                  <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-2xl opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleLogoChange}
                    />
                    {isUploading ? (
                      <Loader2 className="w-5 h-5 text-white animate-spin" />
                    ) : (
                      <span className="text-xs text-white font-medium">
                        Change
                      </span>
                    )}
                  </label>
                </div>
                <div className="pb-2">
                  <h1 className="text-2xl font-bold text-gray-900">
                    {company.name}
                  </h1>
                  {company.industry && (
                    <p className="text-sm text-gray-500 flex items-center gap-1">
                      <Briefcase className="w-4 h-4" />
                      {company.industry}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="grid gap-6">
              {company.description && (
                <div>
                  <h2 className="text-sm font-semibold text-gray-900 mb-2">
                    About
                  </h2>
                  <p className="text-gray-600 leading-relaxed">
                    {company.description}
                  </p>
                </div>
              )}

              <div className="grid sm:grid-cols-2 gap-4">
                {company.location && (
                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                    <div className="w-10 h-10 rounded-lg bg-[#3182ce]/10 flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-[#3182ce]" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Location</p>
                      <p className="text-sm font-medium text-gray-900">
                        {company.location}
                      </p>
                    </div>
                  </div>
                )}

                {company.country && (
                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                    <div className="w-10 h-10 rounded-lg bg-[#3182ce]/10 flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-[#3182ce]" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Country</p>
                      <p className="text-sm font-medium text-gray-900">
                        {company.country}
                      </p>
                    </div>
                  </div>
                )}

                {company.website && (
                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                    <div className="w-10 h-10 rounded-lg bg-[#3182ce]/10 flex items-center justify-center">
                      <Globe className="w-5 h-5 text-[#3182ce]" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Website</p>
                      <a
                        href={company.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-[#3182ce] hover:underline flex items-center gap-1"
                      >
                        Visit Website
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                )}

                {company.email && (
                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                    <div className="w-10 h-10 rounded-lg bg-[#3182ce]/10 flex items-center justify-center">
                      <Mail className="w-5 h-5 text-[#3182ce]" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Email</p>
                      <p className="text-sm font-medium text-gray-900">
                        {company.email}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">
              Edit Company Profile
            </h2>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#3182ce] text-white rounded-xl font-medium text-sm hover:bg-[#2c5cb8] transition-colors disabled:opacity-50"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Save Changes
            </button>
          </div>

          <div className="grid gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Company Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#3182ce]/20 focus:border-[#3182ce] outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Description / Bio
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
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
                  onChange={(e) =>
                    setFormData({ ...formData, website: e.target.value })
                  }
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
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
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
                  onChange={(e) =>
                    setFormData({ ...formData, country: e.target.value })
                  }
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
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                  placeholder="e.g. Kigali, Rwanda"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#3182ce]/20 focus:border-[#3182ce] outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Industry
              </label>
              <select
                value={formData.industry}
                onChange={(e) =>
                  setFormData({ ...formData, industry: e.target.value })
                }
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#3182ce]/20 focus:border-[#3182ce] outline-none transition-all bg-white"
              >
                <option value="">Select an industry</option>
                {INDUSTRIES.map((ind) => (
                  <option key={ind} value={ind}>
                    {ind}
                  </option>
                ))}
              </select>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <h3 className="text-md font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                SEO Settings
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    <Tags className="w-4 h-4 inline mr-1" />
                    Tags
                  </label>
                  <input
                    type="text"
                    value={formData.tags}
                    onChange={(e) =>
                      setFormData({ ...formData, tags: e.target.value })
                    }
                    placeholder="Comma-separated tags"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#3182ce]/20 focus:border-[#3182ce] outline-none transition-all"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showDeleteModal && (
        <ConfirmationModal
          isOpen={showDeleteModal}
          title="Remove Company"
          message={`Are you sure you want to remove "${company.name}" from your account? The company and all its events and opportunities will remain unchanged.`}
          onConfirm={handleDeleteCompany}
          onCancel={() => setShowDeleteModal(false)}
        />
      )}
    </div>
  );
}
