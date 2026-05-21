"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Upload,
  Building2,
  Loader2,
  Search,
  CheckCircle,
} from "lucide-react";
import { FeaturedStartup } from "@/types/company";
import { supabase, searchCompanies } from "@/lib/supabase";
import CompanyLogo from "../ui/CompanyLogo";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (company: FeaturedStartup) => void;
  userId?: string;
  userCompanyIds?: string[];
  userPendingCompanyIds?: string[];
}

export default function CreateCompanyModal({
  isOpen,
  onClose,
  onCreated,
  userId,
  userCompanyIds = [],
  userPendingCompanyIds = [],
}: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<FeaturedStartup[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    logo_url: "",
    image_ref: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedCompany, setSelectedCompany] = useState<FeaturedStartup | null>(null);
  const [claiming, setClaiming] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setFormData({ name: "", description: "", logo_url: "", image_ref: "" });
      setLogoPreview(null);
      setSearchQuery("");
      setSearchResults([]);
      setSelectedCompany(null);
      setErrors({});
    }
  }, [isOpen]);

  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchQuery.length >= 2) {
      searchTimeoutRef.current = setTimeout(async () => {
        setIsSearching(true);
        try {
          const { data } = await searchCompanies(searchQuery);
          setSearchResults(data || []);
        } catch (error) {
          console.error("Search failed:", error);
        } finally {
          setIsSearching(false);
        }
      }, 300);
    } else {
      setSearchResults([]);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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
        setFormData((prev) => ({ ...prev, logo_url: result.url, image_ref: result.asset_id }));
      } else {
        throw new Error(result.error || "Upload failed");
      }
    } catch (error) {
      console.error("Failed to upload logo:", error);
      setErrors((prev) => ({ ...prev, logo: "Failed to upload logo" }));
    } finally {
      setIsUploading(false);
    }
  };

  const handleClaimCompany = async () => {
    if (!selectedCompany || !userId) return;

    setClaiming(true);
    try {
      const { error: claimError } = await supabase.from("user_company").insert({
        user_id: userId,
        company_id: selectedCompany.id,
        role: "manager",
        status: "confirmation_pending",
        added_by: userId,
      });

      if (claimError) throw claimError;

      if (!selectedCompany.claimed) {
        await supabase
          .from("featured_startups")
          .update({ claimed: true })
          .eq("id", selectedCompany.id);
      }

      onCreated(selectedCompany);
      onClose();
    } catch (error) {
      console.error("Failed to request to join company:", error);
      setErrors((prev) => ({
        ...prev,
        submit: "Failed to request to join. Please try again.",
      }));
    } finally {
      setClaiming(false);
    }
  };

  const handleCancelRequest = async () => {
    if (!selectedCompany || !userId) return;

    setClaiming(true);
    try {
      const { data: requestData, error: findError } = await supabase
        .from("user_company")
        .select("id")
        .eq("user_id", userId)
        .eq("company_id", selectedCompany.id)
        .eq("status", "confirmation_pending")
        .single();

      if (findError || !requestData) {
        throw new Error("Request not found");
      }

      const { error: cancelError } = await supabase
        .from("user_company")
        .delete()
        .eq("id", requestData.id);

      if (cancelError) throw cancelError;

      onCreated(selectedCompany);
      onClose();
    } catch (error) {
      console.error("Failed to cancel request:", error);
      setErrors((prev) => ({
        ...prev,
        submit: "Failed to cancel request. Please try again.",
      }));
    } finally {
      setClaiming(false);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) {
      newErrors.name = "Company name is required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

const slugify = (text: string) =>
    text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

  const generateSlug = (name: string, id: string) => {
    const timestamp = Date.now().toString(36);
    return `${slugify(name)}-${timestamp}`;
  };

  const handleCreateNewCompany = async () => {
    if (!validateForm() || !userId) return;

    setIsLoading(true);
    try {
      const tempSlug = generateSlug(formData.name, Math.random().toString(36));
      const { data, error } = await supabase
        .from("featured_startups")
        .insert({
          name: formData.name,
          description: formData.description || "",
          slug: tempSlug,
          logo_url: formData.logo_url || null,
          image_ref: formData.image_ref || null,
          lang: "english",
          is_featured: true,
          status: "published",
          claimed: true,
          roles: ["Hiring", "Partner"],
        })
        .select()
        .single();

      if (error) throw error;

      const { error: userCompanyError } = await supabase.from("user_company").insert({
        user_id: userId,
        company_id: data.id,
        role: "creator",
        status: "accepted",
        added_by: userId,
      });

      if (userCompanyError) throw userCompanyError;

      onCreated(data);
      onClose();
    } catch (error) {
      console.error("Failed to create company:", error);
      setErrors((prev) => ({ ...prev, submit: "Failed to create company" }));
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#3182ce] rounded-xl flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-lg text-gray-900">
                Add Company
              </h3>
              <p className="text-xs text-gray-500">Create or claim a company</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Company Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                autoFocus
                className={`w-full pl-12 pr-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-[#3182ce]/20 focus:border-[#3182ce] outline-none transition-all ${
                  errors.name ? "border-red-500" : "border-gray-200"
                }`}
                placeholder="Search or enter company name..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSelectedCompany(null);
                  if (searchResults.length === 0) {
                    setFormData((prev) => ({ ...prev, name: e.target.value }));
                  }
                  if (errors.name) setErrors({ ...errors, name: "" });
                }}
              />
              {isSearching && (
                <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 animate-spin" />
              )}
            </div>
            {errors.name && (
              <p className="text-xs text-red-500 mt-1">{errors.name}</p>
            )}

            {searchResults.length > 0 && !selectedCompany && (
              <div className="mt-2 border border-gray-200 rounded-xl max-h-48 overflow-y-auto">
                {searchResults.map((company) => (
                  <button
                    key={company.id}
                    onClick={() => {
                      setSelectedCompany(company);
                      setSearchQuery(company.name);
                    }}
                    className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 border-b border-gray-100 last:border-0"
                  >
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center overflow-hidden">
                      <CompanyLogo company={company} size="sm" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-medium text-gray-900">
                        {company.name}
                      </p>
                      {company.description && (
                        <p className="text-xs text-gray-500 truncate max-w-[200px]">
                          {company.description}
                        </p>
                      )}
                    </div>
                    {company.claimed && !userPendingCompanyIds.includes(company.id) && !userCompanyIds.includes(company.id) && (
                      <span className="ml-auto text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                        Claimed
                      </span>
                    )}
                    {userPendingCompanyIds.includes(company.id) && (
                      <span className="ml-auto text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded-full">
                        Pending Request
                      </span>
                    )}
                    {userCompanyIds.includes(company.id) && (
                      <span className="ml-auto text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                        Member
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {selectedCompany && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center overflow-hidden">
                  <CompanyLogo company={selectedCompany} size="md" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">
                    {selectedCompany.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {userCompanyIds.includes(selectedCompany.id) ? "You are a member" : selectedCompany.claimed ? "Claimed" : "Available"}
                  </p>
                </div>
              </div>
              {selectedCompany.description && (
                <p className="text-sm text-gray-600 mb-3">
                  {selectedCompany.description}
                </p>
              )}
              {userCompanyIds.includes(selectedCompany.id) ? (
                <div className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-gray-200 text-gray-600 font-medium rounded-lg">
                  <CheckCircle className="w-4 h-4" />
                  Already Part of Company
                </div>
              ) : userPendingCompanyIds.includes(selectedCompany.id) ? (
                <button
                  onClick={handleCancelRequest}
                  disabled={claiming}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {claiming ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Cancel Request
                    </>
                  )}
                </button>
              ) : selectedCompany.claimed ? (
                <button
                  onClick={handleClaimCompany}
                  disabled={claiming}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {claiming ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Request to Join
                    </>
                  )}
                </button>
              ) : (
                <button
                  onClick={handleClaimCompany}
                  disabled={claiming}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {claiming ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Claim This Company
                    </>
                  )}
                </button>
              )}
            </div>
          )}

          {!selectedCompany && searchQuery.length >= 2 && !isSearching && searchResults.length === 0 && (
            <div className="text-center py-4 bg-gray-50 rounded-xl">
              <p className="text-sm text-gray-500 mb-3">
                No companies found with this name
              </p>

              <div className="space-y-4 px-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Description
                  </label>
                  <textarea
                    className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-[#3182ce]/20 focus:border-[#3182ce] outline-none transition-all resize-none ${
                      errors.description ? "border-red-500" : "border-gray-200"
                    }`}
                    placeholder="Brief description of your company (optional)..."
                    rows={3}
                    value={formData.description}
                    onChange={(e) => {
                      setFormData({ ...formData, description: e.target.value });
                      if (errors.description)
                        setErrors({ ...errors, description: "" });
                    }}
                  />
                  {errors.description && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.description}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Logo
                  </label>
                  <div className="flex items-center gap-4">
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="w-16 h-16 rounded-xl border-2 border-dashed border-gray-300 hover:border-[#3182ce] hover:bg-blue-50 transition-all cursor-pointer flex items-center justify-center overflow-hidden bg-gray-50"
                    >
                      {logoPreview ? (
                        <img
                          src={logoPreview}
                          alt="Logo preview"
                          className="w-full h-full object-cover"
                        />
                      ) : isUploading ? (
                        <Loader2 className="w-6 h-6 text-[#3182ce] animate-spin" />
                      ) : (
                        <Upload className="w-6 h-6 text-gray-400" />
                      )}
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleLogoChange}
                    />
                    <span className="text-xs text-gray-500">
                      Optional: Upload a logo
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleCreateNewCompany}
                  disabled={isLoading || isUploading || !userId}
                  className="w-full px-5 py-2.5 text-sm font-medium text-white bg-[#3182ce] hover:bg-[#2c5cb8] rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Create New Company
                </button>
              </div>
            </div>
          )}

          {errors.submit && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-sm text-red-600">{errors.submit}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}