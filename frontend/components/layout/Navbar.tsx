'use client';

import Link from 'next/link';
import { useAuthStore } from '@/lib/store/authStore';
import { useState } from 'react';

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuthStore();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="bg-primary-900 text-white shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 hover:opacity-80 transition">
            <span className="text-2xl">🏡</span>
            <span className="text-xl font-bold">GreenRent</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/properties" className="hover:text-primary-200 transition">
              Properties
            </Link>
            <Link href="/how-it-works" className="hover:text-primary-200 transition">
              How It Works
            </Link>
            {isAuthenticated ? (
              <>
                <Link href="/dashboard" className="hover:text-primary-200 transition">
                  Dashboard
                </Link>
                <Link href="/wallet" className="hover:text-primary-200 transition">
                  My Wallet
                </Link>
                <div className="relative group">
                  <button className="flex items-center space-x-2 hover:text-primary-200 transition">
                    <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center">
                      {user?.firstName?.[0]}{user?.lastName?.[0]}
                    </div>
                    <span>{user?.firstName}</span>
                  </button>
                  <div className="absolute right-0 mt-2 w-48 bg-white text-gray-800 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                    <Link href="/profile" className="block px-4 py-2 hover:bg-gray-100 rounded-t-lg">
                      Profile
                    </Link>
                    <Link href="/bookings" className="block px-4 py-2 hover:bg-gray-100">
                      My Bookings
                    </Link>
                    <button
                      onClick={logout}
                      className="w-full text-left px-4 py-2 hover:bg-gray-100 rounded-b-lg text-red-600"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <Link href="/auth/login" className="hover:text-primary-200 transition">
                  Login
                </Link>
                <Link
                  href="/auth/register"
                  className="bg-primary-500 hover:bg-primary-600 px-4 py-2 rounded-lg font-semibold transition"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-primary-800">
            <Link href="/properties" className="block py-2 hover:text-primary-200">
              Properties
            </Link>
            <Link href="/how-it-works" className="block py-2 hover:text-primary-200">
              How It Works
            </Link>
            {isAuthenticated ? (
              <>
                <Link href="/dashboard" className="block py-2 hover:text-primary-200">
                  Dashboard
                </Link>
                <Link href="/wallet" className="block py-2 hover:text-primary-200">
                  My Wallet
                </Link>
                <Link href="/profile" className="block py-2 hover:text-primary-200">
                  Profile
                </Link>
                <Link href="/bookings" className="block py-2 hover:text-primary-200">
                  My Bookings
                </Link>
                <button
                  onClick={logout}
                  className="block w-full text-left py-2 text-red-400 hover:text-red-300"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link href="/auth/login" className="block py-2 hover:text-primary-200">
                  Login
                </Link>
                <Link href="/auth/register" className="block py-2 hover:text-primary-200">
                  Sign Up
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
