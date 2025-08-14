// src/app/learn/page.js
"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function LearnPage() {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, status } = useSession();

  const [questions, setQuestions] = useState([]);
  const [progress, setProgress] = useState({});
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isQuestionsLoading, setIsQuestionsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [categories, setCategories] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;
  const observer = useRef();
  const progressSaveTimeout = useRef(null);

  // Redirect unauthenticated users
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Fetch questions and filters with retry logic
  const fetchData = useCallback(
    async (pageNum, reset = false) => {
      if (status !== "authenticated" || retryCount >= maxRetries) return;

      setIsQuestionsLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        if (selectedCategory) params.set("category", selectedCategory);
        if (selectedSection) params.set("section", selectedSection);
        if (selectedDifficulty) params.set("difficulty", selectedDifficulty);
        if (searchTerm) params.set("search", searchTerm);
        params.set("page", pageNum);
        params.set("limit", "10");
        const url = `/api/dashboard/data?${params.toString()}`;
        console.log("Fetching from:", url);

        const res = await fetch(url, {
          headers: {
            Authorization: `Bearer ${session?.accessToken || ""}`,
          },
        });

        console.log("Response status:", res.status, "URL:", url);
        if (!res.ok) {
          throw new Error(`Failed to fetch questions: ${res.status} ${res.statusText}`);
        }

        const {
          initialQuestions,
          initialProgress,
          categories: fetchedCategories,
          totalPages,
          currentPage,
        } = await res.json();

        const uniqueQuestions = initialQuestions.filter(
          (q, index, arr) => arr.findIndex((item) => item._id === q._id) === index
        );

        setQuestions((prev) => (reset ? uniqueQuestions : [...prev, ...uniqueQuestions]));
        setProgress(initialProgress || {});
        setCategories(fetchedCategories || []);
        setTotalPages(totalPages || 1);
        setHasMore(pageNum < totalPages);

        if (reset && fetchedCategories.length > 0 && !selectedCategory) {
          setSelectedCategory(fetchedCategories[0]);
          const categoryQuestions = uniqueQuestions.filter((q) => q.category === fetchedCategories[0]);
          const firstSection = [...new Set(categoryQuestions.map((q) => q.section).filter(Boolean))][0] || "";
          setSelectedSection(firstSection);
          setSelectedDifficulty("Easy");
        }
      } catch (error) {
        console.error("Fetch error details:", error);
        setError(
          retryCount + 1 >= maxRetries
            ? "Maximum retries reached. Please check your connection or contact support."
            : `Failed to load questions: ${error.message}. Retrying... (${retryCount + 1}/${maxRetries})`
        );
        if (retryCount + 1 < maxRetries) {
          setRetryCount((prev) => prev + 1);
        }
      } finally {
        setIsLoading(false);
        setIsQuestionsLoading(false);
      }
    },
    [
      status,
      session,
      selectedCategory,
      selectedSection,
      selectedDifficulty,
      searchTerm,
      retryCount,
    ]
  );

  // Initial fetch
  useEffect(() => {
    fetchData(1, true);
  }, [fetchData]);

  // Infinite scroll observer
  const lastQuestionRef = useCallback(
    (node) => {
      if (isQuestionsLoading || !hasMore || retryCount >= maxRetries) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
          setPage((prev) => prev + 1);
        }
      });
      if (node) observer.current.observe(node);
    },
    [isQuestionsLoading, hasMore, retryCount]
  );

  // Fetch next page
  useEffect(() => {
    if (page > 1) {
      fetchData(page);
    }
  }, [page, fetchData]);

  // Reset questions and page when filters change
  useEffect(() => {
    setQuestions([]);
    setPage(1);
    fetchData(1, true);
  }, [
    selectedCategory,
    selectedSection,
    selectedDifficulty,
    searchTerm,
    fetchData,
  ]);

  // Save progress with debounced timeout
  useEffect(() => {
    if (!session?.user?.id || Object.keys(progress).length === 0) return;

    if (progressSaveTimeout.current) {
      clearTimeout(progressSaveTimeout.current);
    }

    progressSaveTimeout.current = setTimeout(async () => {
      setIsSaving(true);
      try {
        console.log("Saving progress for user:", session?.user?.id);
        const response = await fetch("/api/save-progress", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.accessToken || ""}`,
          },
          body: JSON.stringify({ progress }),
        });

        const result = await response.json();
        if (!result.success) {
          throw new Error(result.error || "Failed to save progress");
        }
      } catch (error) {
        console.error("Save progress error:", error);
        setError("Failed to save progress");
      } finally {
        setIsSaving(false);
      }
    }, 1000);

    return () => {
      if (progressSaveTimeout.current) clearTimeout(progressSaveTimeout.current);
    };
  }, [progress, session]);

  const resetFilters = () => {
    setSelectedCategory("");
    setSelectedSection("");
    setSelectedDifficulty("");
    setSearchTerm("");
    setQuestions([]);
    setPage(1);
  };

  const getDifficultyConfig = (difficulty) => ({
    Easy: { color: "text-emerald-600 bg-emerald-100", icon: "🟢" },
    Medium: { color: "text-amber-600 bg-amber-100", icon: "🟡" },
    Hard: { color: "text-rose-600 bg-rose-100", icon: "🔴" },
  }[difficulty] || { color: "text-gray-600 bg-gray-100", icon: "⚪" });

  const getCategoryConfig = (category) => ({
    "Basic JavaScript": { gradient: "from-blue-600 to-cyan-600", bg: "bg-gradient-to-r from-blue-600 to-cyan-600" },
    "Advanced JavaScript": { gradient: "from-purple-600 to-pink-600", bg: "bg-gradient-to-r from-purple-600 to-pink-600" },
    "React JS": { gradient: "from-emerald-600 to-teal-600", bg: "bg-gradient-to-r from-emerald-600 to-teal-600" },
  }[category] || { gradient: "from-gray-600 to-gray-700", bg: "bg-gradient-to-r from-gray-600 to-gray-700" });

  const safeQuestions = Array.isArray(questions) ? questions : [];
  const safeProgress = progress || {};
  const sections = useMemo(
    () => [...new Set(safeQuestions.map((q) => q.section).filter(Boolean))],
    [safeQuestions]
  );
  const difficulties = useMemo(() => ["Easy", "Medium", "Hard"], []);

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin w-12 h-12 border-4 border-blue-400 border-t-transparent rounded-full mx-auto mb-4"></div>
          <div className="text-xl">Loading your learn page...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 text-white flex flex-col">
      <Header error={error} isSaving={isSaving} />
      {error && (
        <div className="bg-red-500/20 border border-red-500/50 px-4 py-3 mx-4 mt-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-red-400">⚠️</span>
              <span className="text-red-100">{error}</span>
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
        </div>
      )}
      <div className="container mx-auto px-4 my-8 flex-1">
        {/* Filters */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 mb-8 border border-white/20">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold">Filters</h3>
            <div className="flex gap-3">
              <button
                onClick={resetFilters}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg transition-colors"
              >
                Reset Filters
              </button>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="lg:hidden px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors"
              >
                {showFilters ? "Hide" : "Show"} Filters
              </button>
            </div>
          </div>
          <div className={`${showFilters ? "block" : "hidden"} lg:block space-y-4`}>
            <div>
              <input
                type="text"
                placeholder="Search questions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              <select
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
                className="px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              >
                <option value="">All Sections</option>
                {sections.map((sec) => (
                  <option key={sec} value={sec}>
                    {sec}
                  </option>
                ))}
              </select>
              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className="px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              >
                <option value="">All Difficulties</option>
                {difficulties.map((diff) => (
                  <option key={diff} value={diff}>
                    {diff}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Questions */}
        <div className="space-y-6 relative">
          <h3 className="text-2xl font-semibold mb-4">Questions ({safeQuestions.length})</h3>
          {isQuestionsLoading && page === 1 && (
            <div className="text-center py-4">
              <div className="animate-spin w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full mx-auto"></div>
              <p className="text-gray-300 mt-2">Loading questions...</p>
            </div>
          )}
          <AnimatePresence>
            {safeQuestions.length > 0 ? (
              safeQuestions.map((question, index) => {
                const isLast = index === safeQuestions.length - 1;
                const diffConfig = getDifficultyConfig(question.difficulty);
                const categoryConfig = getCategoryConfig(question.category);
                const isCompleted = safeProgress[question._id]?.isCompleted;
                const showAnswer = safeProgress[question._id]?.showAnswer;

                return (
                  <motion.div
                    key={question._id}
                    ref={isLast ? lastQuestionRef : null}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.1 }}
                    className={`bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 ${
                      isCompleted ? "ring-2 ring-green-400" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${categoryConfig.bg} text-white`}>
                            {question.category}
                          </span>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${diffConfig.color}`}>
                            {diffConfig.icon} {question.difficulty}
                          </span>
                          {question.section && (
                            <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-600 text-white">
                              {question.section}
                            </span>
                          )}
                        </div>
                        <h4 className="text-lg font-semibold mb-2">{question.question}</h4>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() =>
                            setProgress((prev) => ({
                              ...prev,
                              [question._id]: {
                                ...prev[question._id],
                                showAnswer: !prev[question._id]?.showAnswer,
                                updatedAt: new Date().toISOString(),
                              },
                            }))
                          }
                          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors"
                        >
                          {showAnswer ? "Hide Answer" : "Show Answer"}
                        </button>
                        <button
                          onClick={() =>
                            setProgress((prev) => ({
                              ...prev,
                              [question._id]: {
                                ...prev[question._id],
                                isCompleted: !prev[question._id]?.isCompleted,
                                completedAt: !prev[question._id]?.isCompleted ? new Date().toISOString() : null,
                                updatedAt: new Date().toISOString(),
                              },
                            }))
                          }
                          className={`px-4 py-2 rounded-lg transition-colors ${
                            isCompleted ? "bg-green-500 hover:bg-green-600" : "bg-gray-600 hover:bg-gray-700"
                          }`}
                        >
                          {isCompleted ? "✓ Completed" : "Mark Complete"}
                        </button>
                      </div>
                    </div>
                    <AnimatePresence>
                      {showAnswer && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                          className="mt-4 p-4 bg-gray-800/50 rounded-lg border-l-4 border-blue-400"
                        >
                          <h5 className="font-semibold text-blue-400 mb-2">Answer:</h5>
                          <div className="text-gray-300 whitespace-pre-wrap">{question.answer}</div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })
            ) : (
              !isQuestionsLoading && (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🔍</div>
                  <h3 className="text-xl font-semibold mb-2">No questions found</h3>
                  <p className="text-gray-400">Try adjusting your filters or search term</p>
                </div>
              )
            )}
            {isQuestionsLoading && page > 1 && (
              Array.from({ length: 2 }).map((_, index) => (
                <motion.div
                  key={`skeleton-${index}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 animate-pulse"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-20 h-6 bg-gray-700 rounded-full"></div>
                        <div className="w-16 h-6 bg-gray-700 rounded-full"></div>
                        <div className="w-16 h-6 bg-gray-700 rounded-full"></div>
                      </div>
                      <div className="w-3/4 h-6 bg-gray-700 rounded mb-2"></div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-24 h-10 bg-gray-700 rounded"></div>
                      <div className="w-24 h-10 bg-gray-700 rounded"></div>
                    </div>
                  </div>
                  <div className="w-full h-24 bg-gray-700 rounded"></div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
          {hasMore && !isQuestionsLoading && (
            <div className="text-center py-4">
              <p className="text-gray-300">Scroll to load more...</p>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}