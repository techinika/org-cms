"use client";

import { Building2, User, ChevronDown, LogOut, Settings, LayoutDashboard, Users, Bell } from "lucide-react";
import { useState } from "react";

interface NavbarProps {
  user?: {
    name: string;
    email: string;
    avatar?: string;
  };
}

export default function Navbar({ user }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);

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
            <div className="flex items-center justify-center w-10 h-10 bg-[#3182ce] rounded-xl">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Org CMS</h1>
              <p className="text-xs text-gray-500 hidden sm:block">Company Management</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <button 
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-gray-100 transition-colors"
              >
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
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
              </button>

              <div className={`absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 py-2 overflow-hidden transition-all ${isOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}>
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-900 truncate">{currentUser.name}</p>
                  <p className="text-xs text-gray-500 truncate">{currentUser.email}</p>
                </div>
                
                <div className="py-1">
                  <button className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3">
                    <LayoutDashboard className="w-4 h-4 text-gray-400" />
                    Dashboard
                  </button>
                  <button className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3">
                    <Users className="w-4 h-4 text-gray-400" />
                    All Companies
                  </button>
                  <button className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3">
                    <Bell className="w-4 h-4 text-gray-400" />
                    Notifications
                  </button>
                </div>

                <div className="border-t border-gray-100 py-1">
                  <button className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3">
                    <Settings className="w-4 h-4 text-gray-400" />
                    Settings
                  </button>
                  <button 
                    onClick={() => window.location.href = `${process.env.NEXT_PUBLIC_AUTH_URL}/status`}
                    className="w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-3"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign out
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}