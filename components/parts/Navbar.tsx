"use client";

import { Building2, User, ChevronDown, LogOut, Settings } from "lucide-react";

interface NavbarProps {
  user?: {
    name: string;
    email: string;
    avatar?: string;
  };
}

export default function Navbar({ user }: NavbarProps) {
  const defaultUser = {
    name: "John Doe",
    email: "john@example.com",
    avatar: null,
  };

  const currentUser = user || defaultUser;

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 bg-[#3182ce] rounded-lg">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Org CMS</h1>
              <p className="text-xs text-gray-500">Company Management</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button className="text-sm text-gray-600 hover:text-[#3182ce] transition-colors font-medium">
              Dashboard
            </button>
            <a
              href="/companies"
              className="text-sm text-gray-600 hover:text-[#3182ce] transition-colors font-medium"
            >
              Companies
            </a>
            <button className="text-sm text-gray-600 hover:text-[#3182ce] transition-colors font-medium">
              Settings
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-gray-900">
                {currentUser.name}
              </p>
              <p className="text-xs text-gray-500">{currentUser.email}</p>
            </div>
            <div className="relative group">
              <button className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="w-9 h-9 rounded-full bg-[#3182ce] flex items-center justify-center">
                  {currentUser.avatar ? (
                    <img
                      src={currentUser.avatar}
                      alt={currentUser.name}
                      className="w-9 h-9 rounded-full object-cover"
                    />
                  ) : (
                    <User className="w-5 h-5 text-white" />
                  )}
                </div>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </button>

              <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  Settings
                </button>
                <button className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2">
                  <LogOut className="w-4 h-4" />
                  Sign out
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}