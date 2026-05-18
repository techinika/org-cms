"use client";

import { useState, useEffect } from "react";
import { use } from "react";
import Link from "next/link";
import {
  Building2,
  Loader2,
  ArrowLeft,
  CheckCircle,
  XCircle,
  Users,
  Clock,
  UserCheck,
} from "lucide-react";
import { FeaturedStartup, UserCompany } from "@/types/company";
import { getCompanyBySlug, getCompanyUsers, updateCompanyUser } from "@/lib/supabase";
import { supabase } from "@/lib/supabase";
import { checkAuthClient, getAuthRedirectUrl } from "@/lib/auth-client";
import Navbar from "@/components/parts/Navbar";
import Breadcrumb from "@/components/parts/Breadcrumb";
import ConfirmationModal from "@/components/ui/ConfirmationModal";
import { useToast } from "@/components/ui/Toast";
import AuthorAvatar from "@/components/ui/AuthorAvatar";

const ROLES = ["manager", "events_manager", "opportunities_manager"] as const;

export default function CompanyUsersPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const { showToast } = useToast();
  const [company, setCompany] = useState<FeaturedStartup | null>(null);
  const [users, setUsers] = useState<UserCompany[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserCompany, setCurrentUserCompany] = useState<UserCompany | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<{
    open: boolean;
    type: "accept" | "reject";
    userCompanyId: string | null;
    userName: string | null;
    role?: string;
  }>({ open: false, type: "accept", userCompanyId: null, userName: null, role: "manager" });
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedRole, setSelectedRole] = useState<typeof ROLES[number]>("manager");

  useEffect(() => {
    checkAuth();
  }, [slug]);

  const checkAuth = async () => {
    const authResult = await checkAuthClient();
    if (!authResult.authenticated || !authResult.user) {
      window.location.href = getAuthRedirectUrl();
      return;
    }
    setCurrentUserId(authResult.user.id);
    await fetchData(authResult.user.id);
  };

  const fetchData = async (userId?: string) => {
    setIsLoading(true);
    const { data: companyData, error: companyError } = await getCompanyBySlug(slug);
    if (companyError || !companyData) {
      setError("Company not found");
      setIsLoading(false);
      return;
    }
    setCompany(companyData);

    const { data: usersData, error: usersError } = await getCompanyUsers(companyData.id);
    if (usersError) {
      setError("Failed to fetch users");
    } else {
      setUsers(usersData || []);
      const myAssociation = usersData?.find(u => u.user_id === userId);
      setCurrentUserCompany(myAssociation || null);
    }
    setIsLoading(false);
  };

  const handleAction = (userCompany: UserCompany, action: "accept" | "reject") => {
    setConfirmAction({
      open: true,
      type: action,
      userCompanyId: userCompany.id,
      userName: userCompany.author?.name || "this user",
      role: action === "accept" ? "manager" : undefined,
    });
    setSelectedRole("manager");
  };

  const processAction = async () => {
    if (!confirmAction.userCompanyId) return;
    setIsProcessing(true);

    try {
      if (confirmAction.type === "accept") {
        const { error } = await updateCompanyUser(confirmAction.userCompanyId, {
          status: "accepted",
          role: selectedRole,
        });
        if (error) throw error;
        showToast("User accepted successfully", "success");
      } else {
        const { error } = await updateCompanyUser(confirmAction.userCompanyId, {
          status: "rejected",
        });
        if (error) throw error;
        showToast("User rejected", "success");
      }
      setConfirmAction({ open: false, type: "accept", userCompanyId: null, userName: null });
      await fetchData();
    } catch (err) {
      console.error("Failed to process action:", err);
      showToast("Failed to process request", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const canManage = currentUserCompany?.role === "manager" && (currentUserCompany?.status === "accepted" || currentUserCompany?.status === "active");

  const pendingUsers = users.filter(u => u.status === "confirmation_pending");
  const acceptedUsers = users.filter(u => u.status === "accepted" || u.status === "active");

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
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumb items={[
          { label: "Company", href: `/${slug}` },
          { label: "Company Users", href: `/${slug}/users` },
        ]} />

        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#3182ce]/10 flex items-center justify-center">
              <Users className="w-6 h-6 text-[#3182ce]" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Company Users</h1>
              <p className="text-sm text-gray-500">{company.name}</p>
            </div>
          </div>
        </div>

        {pendingUsers.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-orange-500" />
              Pending Requests ({pendingUsers.length})
            </h2>
            <div className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-200">
              {pendingUsers.map((uc) => (
                <div key={uc.id} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <AuthorAvatar imageRef={uc.author?.image_ref} name={uc.author?.name} />
                    <div>
                      <p className="font-medium text-gray-900">{uc.author?.name || "Unknown"}</p>
                    </div>
                  </div>
                  {canManage && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleAction(uc, "accept")}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-green-700 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
                      >
                        <UserCheck className="w-4 h-4" />
                        Accept
                      </button>
                      <button
                        onClick={() => handleAction(uc, "reject")}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                      >
                        <XCircle className="w-4 h-4" />
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            Team Members ({acceptedUsers.length})
          </h2>
          {acceptedUsers.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No team members yet</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-200">
              {acceptedUsers.map((uc) => (
                <div key={uc.id} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <AuthorAvatar imageRef={uc.author?.image_ref} name={uc.author?.name} />
                    <div>
                      <p className="font-medium text-gray-900">
                        {uc.author?.name || "Unknown"}
                        {uc.user_id === currentUserId && (
                          <span className="ml-2 text-xs text-[#3182ce] bg-[#3182ce]/10 px-2 py-0.5 rounded-full">
                            You
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm px-3 py-1 bg-gray-100 text-gray-700 rounded-full capitalize">
                    {uc.role?.replace("_", " ") || "member"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <ConfirmationModal
        isOpen={confirmAction.open}
        title={confirmAction.type === "accept" ? "Accept User" : "Reject User"}
        message={
          confirmAction.type === "accept"
            ? `Are you sure you want to accept "${confirmAction.userName}"? Select a role for this user:`
            : `Are you sure you want to reject "${confirmAction.userName}"?`
        }
        confirmLabel={confirmAction.type === "accept" ? "Accept" : "Reject"}
        onConfirm={processAction}
        onCancel={() => setConfirmAction({ open: false, type: "accept", userCompanyId: null, userName: null })}
      />

      {confirmAction.open && confirmAction.type === "accept" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setConfirmAction({ open: false, type: "accept", userCompanyId: null, userName: null })} />
          <div className="relative bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Accept User</h3>
            <p className="text-sm text-gray-600 mb-4">
              Select a role for <strong>{confirmAction.userName}</strong>:
            </p>
            <div className="space-y-2 mb-6">
              {ROLES.map((role) => (
                <label
                  key={role}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedRole === role
                      ? "border-[#3182ce] bg-[#3182ce]/5"
                      : "border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <input
                    type="radio"
                    name="role"
                    value={role}
                    checked={selectedRole === role}
                    onChange={() => setSelectedRole(role)}
                    className="w-4 h-4 text-[#3182ce]"
                  />
                  <span className="text-sm capitalize">{role.replace("_", " ")}</span>
                </label>
              ))}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmAction({ open: false, type: "accept", userCompanyId: null, userName: null })}
                className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={processAction}
                disabled={isProcessing}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isProcessing && <Loader2 className="w-4 h-4 animate-spin" />}
                Accept
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}