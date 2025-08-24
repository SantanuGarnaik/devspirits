"use client";

import React, { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Menu, Transition } from "@headlessui/react";
import { ChevronDownIcon, Bars3Icon, XMarkIcon } from "@heroicons/react/20/solid";

export default function Header({ error = false, isSaving = false }) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session } = useSession();
  const userName = session?.user?.name || "User";
  const userImage = session?.user?.image || "https://placehold.co/40x40";
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/login" });
  };

  return (
    <header className="bg-white/10 backdrop-blur-md border-b border-white/20 sticky top-0 z-999">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        {/* Logo and Subtitle (Clickable to Dashboard) */}
        <div
          className="flex-1 max-w-[200px] cursor-pointer"
          onClick={() => router.push("/dashboard")}
        >
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
            DevSpirits
          </h1>
          <p className="text-xs text-gray-300">Crack Interviews with Precision</p>
        </div>

        {/* Status Indicators and User Menu */}
        <div className="flex items-center gap-4">
          {error && (
            <div className="flex items-center gap-2 text-sm text-red-400">
              <span>⚠️</span>
              <span>Error occurred</span>
            </div>
          )}
          {isSaving && (
            <div className="flex items-center gap-2 text-sm text-blue-400">
              <div className="animate-spin w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full"></div>
              <span>Saving...</span>
            </div>
          )}
          <Menu as="div" className="relative">
            <Menu.Button
              className="flex items-center gap-2 bg-gray-800/50 rounded-full p-2 hover:bg-gray-700 transition-colors"
              aria-label={`Open profile menu for ${userName}`}
            >
              <img
                src={userImage}
                alt={`${userName}'s profile`}
                className="w-10 h-10 rounded-full object-cover"
              />
              <span className="text-white font-medium hidden md:inline">
                {userName}
              </span>
              <ChevronDownIcon className="w-5 h-5 text-gray-400" />
            </Menu.Button>
            <Transition
              as={React.Fragment}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items className="absolute z-50 right-0 mt-2 w-48 origin-top-right bg-gray-800/90 backdrop-blur-md border border-gray-700 rounded-md shadow-lg ring-1 ring-black/5 focus:outline-none">
                <div className="py-1">
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={handleLogout}
                        className={`${
                          active ? "bg-gray-700" : ""
                        } w-full text-left px-4 py-1 text-sm text-white flex items-center gap-2`}
                      >
                        Logout
                      </button>
                    )}
                  </Menu.Item>
                </div>
              </Menu.Items>
            </Transition>
          </Menu>
        </div>
      </div>
    </header>
  );
}
