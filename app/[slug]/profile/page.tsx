import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { Building2, Globe, MapPin, Mail, Briefcase, ExternalLink, Loader2 } from "lucide-react";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
}

async function getCompany(slug: string) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_PROJECT_URL!,
    process.env.NEXT_PUBLIC_API_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll().map((c) => ({ name: c.name, value: c.value })),
        setAll: () => {},
      },
    }
  );

  const { data } = await supabase
    .from("featured_startups")
    .select("*")
    .eq("slug", slug)
    .single();

  return data;
}

export default async function CompanyProfilePage({ params }: Props) {
  const { slug } = await params;
  const company = await getCompany(slug);

  if (!company) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#3182ce] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="h-32 bg-gradient-to-r from-[#3182ce] to-[#63b3ed]"></div>
          
          <div className="px-8 pb-8">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 -mt-12 mb-6">
              <div className="flex items-end gap-4">
                <div className="w-24 h-24 rounded-2xl bg-white border-4 border-white shadow-lg flex items-center justify-center overflow-hidden">
                  {company.logo_url ? (
                    <img
                      src={company.logo_url}
                      alt={company.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Building2 className="w-10 h-10 text-gray-300" />
                  )}
                </div>
                <div className="pb-2">
                  <h1 className="text-2xl font-bold text-gray-900">{company.name}</h1>
                  {company.industry && (
                    <p className="text-sm text-gray-500 flex items-center gap-1">
                      <Briefcase className="w-4 h-4" />
                      {company.industry}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="grid gap-6">
              {company.description && (
                <div>
                  <h2 className="text-sm font-semibold text-gray-900 mb-2">About</h2>
                  <p className="text-gray-600 leading-relaxed">{company.description}</p>
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

        <div className="mt-6 bg-white rounded-2xl border border-gray-200 p-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Company Settings</h2>
          <p className="text-sm text-gray-500">Manage your company profile and settings here.</p>
        </div>
      </div>
    </div>
  );
}