"use client";

import React from "react";

export default function Footer() {
  const navLinks = [
    { href: "/about", label: "About", ariaLabel: "Go to About page" },
    { href: "/contact", label: "Contact", ariaLabel: "Go to Contact page" },
    {
      href: "/privacy",
      label: "Privacy Policy",
      ariaLabel: "Go to Privacy Policy page",
    },
  ];

  return (
    <footer className="bg-white/10 backdrop-blur-md border-t border-white/20 py-4">
      <div className="container mx-auto px-4 text-center text-gray-300">
        <p>
          &copy; {new Date().getFullYear()} DevSpirits. All rights reserved.
        </p>
        <div className="mt-2 flex justify-center space-x-4">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-blue-400 hover:text-blue-300 transition-colors"
              aria-label={link.ariaLabel}
            >
              {link.label}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}
