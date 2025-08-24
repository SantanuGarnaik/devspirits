// src/app/dashboard/page.js
"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { PieChart } from "react-minimal-pie-chart";
import { useSession } from "next-auth/react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useProgress } from "../hooks/useProgress";

// Custom Modal Component
const Modal = ({ isOpen, onClose, children }) => (
  <AnimatePresence>
    {isOpen && (
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />
        <motion.div
          className="relative z-10 w-full max-w-md"
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          onClick={(e) => e.stopPropagation()}
        >
          {children}
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

// Enhanced Reset Confirmation Modal
const ResetConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  isResetting,
}) => (
  <Modal isOpen={isOpen} onClose={onClose}>
    <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 border border-gray-600/50 shadow-2xl">
      <div className="text-center mb-6">
        <div className="w-16 h-16 mx-auto mb-4 bg-red-500/20 rounded-full flex items-center justify-center">
          <svg
            className="w-8 h-8 text-red-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-white mb-2">
          Reset All Progress
        </h3>
        <p className="text-gray-300 leading-relaxed">
          This action will permanently delete all your progress across all
          categories. You'll lose all completed questions and statistics.
        </p>
      </div>

      <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-5 h-5 rounded-full bg-red-500/30 flex items-center justify-center mt-0.5">
            <div className="w-2 h-2 bg-red-400 rounded-full"></div>
          </div>
          <div className="text-sm text-red-200">
            <strong>Warning:</strong> This action cannot be undone. All your
            learning progress will be lost forever.
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={onClose}
          disabled={isResetting}
          className="flex-1 px-4 py-3 bg-gray-600 hover:bg-gray-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-all duration-200 hover:shadow-lg"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={isResetting}
          className="flex-1 px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 disabled:from-red-700 disabled:to-red-800 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-all duration-200 hover:shadow-lg flex items-center justify-center gap-2"
        >
          {isResetting ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              Resetting...
            </>
          ) : (
            "Yes, Reset All"
          )}
        </button>
      </div>
    </div>
  </Modal>
);

export default function DashboardPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const {
    progress,
    isLoading: progressLoading,
    isSaving,
    error: progressError,
    getStats,
    getCategoryStats,
  } = useProgress();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [categories, setCategories] = useState([]);
  const [categoryStats, setCategoryStats] = useState([]);
  const [userStats, setUserStats] = useState({
    totalQuestions: 0,
    completedQuestions: 0,
    completionPercentage: 0,
  });
  const [retryCount, setRetryCount] = useState(0);
  const [showResetModal, setShowResetModal] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const maxRetries = 3;

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  const fetchData = async () => {
    if (status !== "authenticated" || retryCount >= maxRetries) return;

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/dashboard/data", {
        headers: {
          Authorization: `Bearer ${session?.accessToken || ""}`,
        },
      });

      if (!res.ok) {
        throw new Error(
          `Failed to fetch data: ${res.status} ${res.statusText}`
        );
      }

      const {
        categories: fetchedCategories,
        categoryStats,
        userStats,
      } = await res.json();
      setCategories(fetchedCategories || []);
      setCategoryStats(categoryStats || []);
      setUserStats(
        userStats || {
          totalQuestions: 0,
          completedQuestions: 0,
          completionPercentage: 0,
        }
      );
    } catch (error) {
      setError(
        retryCount + 1 >= maxRetries
          ? "Maximum retries reached. Please check your connection or contact support."
          : `Failed to load data: ${error.message}. Retrying... (${
              retryCount + 1
            }/${maxRetries})`
      );
      if (retryCount + 1 < maxRetries) {
        setRetryCount((prev) => prev + 1);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [session, status, retryCount]);

  const resetProgress = async () => {
    setIsResetting(true);
    try {
      const response = await fetch("/api/reset-progress", {
        method: "POST",
        headers: { Authorization: `Bearer ${session?.accessToken || ""}` },
      });

      const result = await response.json();
      if (result.success) {
        setShowResetModal(false);
        await fetchData();
      } else {
        throw new Error(result.message || "Failed to reset progress");
      }
    } catch (error) {
      setError("Failed to reset progress");
    } finally {
      setIsResetting(false);
    }
  };

  const getCategoryConfig = (category) =>
    ({
      "Basic JavaScript": {
        gradient: "from-blue-600 to-cyan-600",
        bg: "bg-gradient-to-r from-blue-600 to-cyan-600",
        shadow: "shadow-blue-500/25",
        border: "border-blue-500/30",
        icon: "💎",
      },
      "Advanced JavaScript": {
        gradient: "from-purple-600 to-pink-600",
        bg: "bg-gradient-to-r from-purple-600 to-pink-600",
        shadow: "shadow-purple-500/25",
        border: "border-purple-500/30",
        icon: "⚡",
      },
      "React JS": {
        gradient: "from-emerald-600 to-teal-600",
        bg: "bg-gradient-to-r from-emerald-600 to-teal-600",
        shadow: "shadow-emerald-500/25",
        border: "border-emerald-500/30",
        icon: "⚛️",
      },
    }[category] || {
      gradient: "from-gray-600 to-gray-700",
      bg: "bg-gradient-to-r from-gray-600 to-gray-700",
      shadow: "shadow-gray-500/25",
      border: "border-gray-500/30",
      icon: "📚",
    });

  const handleCategoryClick = (category) => {
    const slug = category.toLowerCase().replace(/\s+/g, "-");
    router.push(`/${slug}`);
  };

  const completedCount = userStats.completedQuestions;
  const totalCount = userStats.totalQuestions;
  const progressPercentage = userStats.completionPercentage;

  if (status === "loading" || isLoading || progressLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin w-12 h-12 border-4 border-blue-400 border-t-transparent rounded-full mx-auto mb-4"></div>
          <div className="text-xl">Loading your dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 text-white flex flex-col">
      <Header error={progressError || error} isSaving={isSaving} />

      {(progressError || error) && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-500/20 border border-red-500/50 px-4 py-3 mx-4 mt-4 rounded-lg backdrop-blur-sm"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-red-400">⚠️</span>
              <span className="text-red-100">{progressError || error}</span>
            </div>
            <div className="flex items-center gap-2">
              {retryCount < maxRetries && (
                <button
                  onClick={() => setRetryCount((prev) => prev + 1)}
                  className="px-3 py-1 bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors"
                >
                  Retry
                </button>
              )}
              <button
                onClick={() => {
                  setError(null);
                  setRetryCount(0);
                }}
                className="text-red-200 hover:text-white"
              >
                ✕
              </button>
            </div>
          </div>
        </motion.div>
      )}

      <div className="container mx-auto px-4 py-6 flex-1">
        {/* Compact Overall Progress Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/10 backdrop-blur-md rounded-2xl p-6 mb-6 border border-white/20 shadow-xl"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-blue-500 rounded-xl flex items-center justify-center shadow-lg">
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                Overall Progress
              </h2>
            </div>
            <button
              onClick={() => setShowResetModal(true)}
              className="group px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 rounded-lg transition-all duration-200 hover:shadow-lg hover:shadow-red-500/25 transform hover:scale-105 active:scale-95 flex items-center gap-2 text-sm"
            >
              <svg
                className="w-4 h-4 group-hover:rotate-180 transition-transform duration-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Reset
            </button>
          </div>

          {/* Compact Progress Bar */}
          <div className="relative mb-4">
            <div className="w-full bg-gray-700/50 rounded-full h-4 overflow-hidden backdrop-blur-sm border border-gray-600/30">
              <motion.div
                className="bg-gradient-to-r from-green-400 via-blue-500 to-purple-600 h-full rounded-full relative overflow-hidden"
                style={{ width: `${progressPercentage}%` }}
                initial={{ width: 0 }}
                animate={{ width: `${progressPercentage}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
              >
                <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
              </motion.div>
            </div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-xs font-semibold text-white drop-shadow-lg">
              {progressPercentage}%
            </div>
          </div>

          {/* Compact Stats Display */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-green-500/20 to-emerald-600/20 rounded-xl p-4 border border-green-500/30 backdrop-blur-sm text-center">
              <div className="text-2xl font-bold text-white mb-1">
                {completedCount}
              </div>
              <div className="text-green-200 text-xs">Completed</div>
            </div>

            <div className="bg-gradient-to-br from-blue-500/20 to-cyan-600/20 rounded-xl p-4 border border-blue-500/30 backdrop-blur-sm text-center">
              <div className="text-2xl font-bold text-white mb-1">
                {totalCount}
              </div>
              <div className="text-blue-200 text-xs">Total</div>
            </div>

            <div className="bg-gradient-to-br from-purple-500/20 to-pink-600/20 rounded-xl p-4 border border-purple-500/30 backdrop-blur-sm text-center">
              <div className="text-2xl font-bold text-white mb-1">
                {progressPercentage}%
              </div>
              <div className="text-purple-200 text-xs">Progress</div>
            </div>
          </div>

          {progress && (
            <div className="text-center mt-4 text-xs text-gray-400 bg-gray-800/30 rounded-lg p-2 border border-gray-700/30">
              <div className="flex items-center justify-center gap-2">
                <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
                Last updated: {new Date().toLocaleString()}
              </div>
            </div>
          )}
        </motion.div>

        {/* Redesigned Category Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/10 backdrop-blur-md rounded-2xl p-6 mb-6 border border-white/20 shadow-xl"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
              <svg
                className="w-4 h-4 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
            </div>
            <h2 className="text-xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              Learning Categories
            </h2>
          </div>

          {categories.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categoryStats.map(
                ({ category, completed, total, percentage }, index) => {
                  const config = getCategoryConfig(category);
                  return (
                    <motion.div
                      key={category}
                      className={`relative bg-gradient-to-br from-white/5 to-white/10 rounded-xl p-5 border ${config.border} backdrop-blur-sm hover:from-white/10 hover:to-white/15 transition-all duration-300 hover:shadow-xl ${config.shadow} hover:scale-105 active:scale-95`}
                      whileHover={{ y: -3 }}
                      whileTap={{ scale: 0.98 }}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 * index }}
                    >
                      {/* Card Header with Icon and Title */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl group-hover:scale-110 transition-transform duration-300">
                            {config.icon}
                          </span>
                          <div>
                            <h3 className="font-bold text-white text-sm leading-tight">
                              {category}
                            </h3>
                            <div className="text-xs text-gray-400">
                              {completed}/{total} completed
                            </div>
                          </div>
                        </div>

                        {/* Small Circular Progress */}
                        <div className="w-12 h-12 flex-shrink-0">
                          <PieChart
                            data={[
                              {
                                title: "Completed",
                                value: completed,
                                color: "#34D399",
                              },
                              {
                                title: "Remaining",
                                value: total - completed,
                                color: "#374151",
                              },
                            ]}
                            lineWidth={25}
                            label={() => `${percentage}%`}
                            labelStyle={{
                              fontSize: "25px",
                              fill: "#ffffff",
                              fontWeight: "bold",
                            }}
                            labelPosition={0}
                          />
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-gray-300">Progress</span>
                          <span className="text-green-400 font-semibold">
                            {percentage}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-700/50 rounded-full h-2">
                          <motion.div
                            className="bg-gradient-to-r from-green-400 to-emerald-500 h-2 rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${percentage}%` }}
                            transition={{ duration: 1, delay: 0.2 * index }}
                          />
                        </div>
                      </div>

                      {/* Start Learning Button */}
                      <div className="mt-4">
                        <button
                          onClick={() => handleCategoryClick(category)}
                          className={`${config.bg} rounded-lg py-2 px-3 text-center text-xs font-medium text-white shadow-lg cursor-pointer`}
                        >
                          {completed === total ? "Review" : "Continue Learning"}{" "}
                          →
                        </button>
                      </div>

                      {/* Hover Effect Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-br from-white/0 to-white/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                    </motion.div>
                  );
                }
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-12 h-12 bg-gray-700/50 rounded-xl flex items-center justify-center mx-auto mb-3">
                <svg
                  className="w-6 h-6 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
              </div>
              <p className="text-lg text-gray-300 mb-1">
                No categories available
              </p>
              <p className="text-gray-400 text-sm">
                Check back later for new learning content
              </p>
            </div>
          )}
        </motion.div>
      </div>

      <Footer />

      {/* Enhanced Reset Confirmation Modal */}
      <ResetConfirmationModal
        isOpen={showResetModal}
        onClose={() => setShowResetModal(false)}
        onConfirm={resetProgress}
        isResetting={isResetting}
      />
    </div>
  );
}
