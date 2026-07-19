"use client";

import { useState, useEffect, useCallback } from "react";
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
  Save,
  Tags,
  FileText,
  ArrowRight,
} from "lucide-react";
import { FeaturedStartup, Industry } from "@/types/company";
import { getCompanyBySlug, updateCompany, removeUserCompany, getAllIndustries, getCompanyIndustries, setCompanyIndustries } from "@/lib/worker";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/parts/Navbar";
import Breadcrumb from "@/components/parts/Breadcrumb";
import ConfirmationModal from "@/components/ui/ConfirmationModal";
import { useToast } from "@/components/ui/Toast";
import CompanyLogo from "@/components/ui/CompanyLogo";

export default function CompanyProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const { user, isLoading: authLoading } = useAuth();
  const { showToast } = useToast();
  const [company, setCompany] = useState<FeaturedStartup | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    website: "",
    email: "",
    country: "",
    location: "",
    tags: "",
  });
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [selectedIndustryIds, setSelectedIndustryIds] = useState<string[]>([]);

  const fetchCompany = useCallback(async () => {
    setIsLoading(true);
    const [{ data, error }, { data: industriesData }] = await Promise.all([
      getCompanyBySlug(slug),
      getAllIndustries(),
    ]);

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
      tags: data.tags || "",
    });
    setIndustries(industriesData || []);

    if (data.id) {
      const { data: ids } = await getCompanyIndustries(data.id);
      setSelectedIndustryIds(ids || []);
    }
    setIsLoading(false);
  }, [slug]);

  useEffect(() => {
    if (!authLoading && user) {
      fetchCompany();
    }
  }, [authLoading, user, fetchCompany]);

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !company) return;
    setIsUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "companies");
      if (user?.id) fd.append("authorId", user.id);

      const result = await fetch("/api/upload-image", {
        method: "POST",
        body: fd,
      }).then(r => r.json());

      if (result.asset_id) {
        const { data: updated } = await updateCompany(company.id, { logo_url: result.url, image_ref: result.asset_id });
        if (updated) {
          setCompany(updated);
          showToast("Logo updated successfully", "success");
        }
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

    if (!error && company.id) {
      await setCompanyIndustries(company.id, selectedIndustryIds);
    }

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

  const handleLeaveCompany = async () => {
    if (!company || !user) return;
    const { error } = await removeUserCompany(user.id, company.id);
    setShowDeleteModal(false);
    if (error) {
      setError("Failed to leave company");
      showToast("Failed to leave company", "error");
    } else {
      showToast("You have left the company", "success");
      window.location.href = "/";
    }
  };

  if (authLoading || isLoading) {
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
      <Navbar />

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
                    {isUploading ? (
                      <Loader2 className="w-8 h-8 text-gray-300 animate-spin" />
                    ) : company.image_ref ? (
                      <CompanyLogo company={company} size="lg" className="w-full h-full rounded-xl" />
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
                      disabled={isUploading}
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
                  {selectedIndustryIds.length > 0 && (
                    <p className="text-sm text-gray-500 flex items-center gap-1">
                      <Briefcase className="w-4 h-4" />
                      {industries.filter(i => selectedIndustryIds.includes(i.id)).map(i => i.name).join(", ")}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="px-4 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl transition-colors border border-red-200"
                >
                  Leave Company
                </button>
              </div>
            </div>

            <div className="grid gap-6">
              {company.description && (
                <div>
                  <h2 className="text-sm font-semibold text-gray-900 mb-2">About</h2>
                  <p className="text-gray-600 leading-relaxed">{company.description}</p>
                </div>
              )}

              {company.opportunity_tier && (
                <div className="mt-8">
                  <h2 className="text-sm font-semibold text-gray-900 mb-2">Subscription Analytics</h2>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                      <h3 className="text-xs font-medium text-gray-500 mb-2">Current Tier</h3>
                      <p className={`text-lg font-medium ${company.opportunity_tier === "advanced" ? "text-green-600" : company.opportunity_tier === "basic" ? "text-blue-600" : "text-gray-500"} capitalize`}>
                        {company.opportunity_tier} tier
                      </p>
                    </div>

                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                      <h3 className="text-xs font-medium text-gray-500 mb-2">Listings Usage</h3>
                      <div className="space-y-2">
                        {company.opportunity_tier === "basic" && (
                          <>
                            <p className="text-sm flex justify-between">
                              <span>Used:</span>
                              <span className="font-medium">{company.opportunity_listings_used || 0}</span>
                            </p>
                            <p className="text-sm flex justify-between">
                              <span>Available:</span>
                              <span className="font-medium">
                                {Math.max(0, (company.opportunity_listings_purchased || 0) - (company.opportunity_listings_used || 0))}
                              </span>
                            </p>
                            <p className="text-sm flex justify-between">
                              <span>Purchased:</span>
                              <span className="font-medium">{company.opportunity_listings_purchased || 0}</span>
                            </p>
                          </>
                        )}
                        {company.opportunity_tier === "advanced" && (
                          <p className="text-sm text-green-600">Unlimited listings</p>
                        )}
                        {company.opportunity_tier === "free" && (
                          <p className="text-sm text-red-500">Upgrade to access listings</p>
                        )}
                      </div>
                    </div>

                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                      <h3 className="text-xs font-medium text-gray-500 mb-2">Subscription Status</h3>
                      {company.subscription_expires_at ? (
                        <>
                          <p className="text-sm flex justify-between">
                            <span>Expires:</span>
                            <span className="font-medium">{new Date(company.subscription_expires_at).toLocaleDateString()}</span>
                          </p>
                          <p className="text-sm flex justify-between">
                            <span>Status:</span>
                            <span className={`font-medium ${new Date(company.subscription_expires_at) > new Date() ? "text-green-600" : "text-red-500"}`}>
                              {new Date(company.subscription_expires_at) > new Date() ? "Active" : "Expired"}
                            </span>
                          </p>
                        </>
                      ) : (
                        <p className="text-sm text-gray-500">No active subscription</p>
                      )}
                    </div>

                    {company.opportunity_tier !== "advanced" && (
                      <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 pt-6">
                        <h3 className="text-xs font-medium text-gray-500 mb-2">Upgrade Benefits</h3>
                        {company.opportunity_tier === "free" ? (
                          <>
                            <p className="text-sm mb-2">Upgrade to Basic for:</p>
                            <ul className="list-disc list-inside text-sm space-y-1">
                              <li>5 opportunity listings</li>
                              <li>Access to applications dashboard</li>
                              <li>AI applicant comparison</li>
                              <li>Email notifications</li>
                            </ul>
                          </>
                        ) : (
                          <>
                            <p className="text-sm mb-2">Upgrade to Advanced for:</p>
                            <ul className="list-disc list-inside text-sm space-y-1">
                              <li>Unlimited opportunity listings</li>
                              <li>Full access to applications dashboard</li>
                              <li>AI applicant comparison</li>
                              <li>Email notifications</li>
                              <li>Priority support</li>
                            </ul>
                          </>
                        )}
                        <div className="mt-4">
                          <Link
                            href={`/${slug}/opportunities`}
                            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#3182ce] text-white rounded-xl font-medium text-sm hover:bg-[#2c5cb8] transition-colors"
                          >
                            Upgrade Subscription
                            <ArrowRight className="w-4 h-4" />
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
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
                      <p className="text-sm font-medium text-gray-900">{company.location}</p>
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
                      <p className="text-sm font-medium text-gray-900">{company.country}</p>
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
                      <p className="text-sm font-medium text-gray-900">{company.email}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Edit Company Profile</h2>
            <button
              onClick={handleSave}
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
                  <Globe className="w-4 h-4 inline mr-1" /> Website
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
                  <Mail className="w-4 h-4 inline mr-1" /> Email
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
                  <MapPin className="w-4 h-4 inline mr-1" /> Country
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
                  <MapPin className="w-4 h-4 inline mr-1" /> Location
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
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto border border-gray-200 rounded-xl p-3">
                {industries.map((ind) => (
                  <label key={ind.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded-lg">
                    <input
                      type="checkbox"
                      checked={selectedIndustryIds.includes(ind.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedIndustryIds([...selectedIndustryIds, ind.id]);
                        } else {
                          setSelectedIndustryIds(selectedIndustryIds.filter(id => id !== ind.id));
                        }
                      }}
                      className="w-4 h-4 rounded border-gray-300 text-[#3182ce] focus:ring-[#3182ce]"
                    />
                    <span className="text-sm text-gray-700">{ind.name}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <h3 className="text-md font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                SEO Settings
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    <Tags className="w-4 h-4 inline mr-1" /> Tags
                  </label>
                  <input
                    type="text"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
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
          title="Leave Company"
          message={`Are you sure you want to leave "${company.name}"? You will lose access to manage this company and its events and opportunities.`}
          confirmLabel="Leave Company"
          onConfirm={handleLeaveCompany}
          onCancel={() => setShowDeleteModal(false)}
        />
      )}
    </div>
  );
}
