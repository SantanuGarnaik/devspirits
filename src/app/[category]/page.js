// src/app/[category]/page.js
"use client";

import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { useRouter, useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import {
  Search,
  Filter,
  RefreshCw,
  Code,
  Brain,
  Trophy,
  Zap,
  CheckCircle,
  Eye,
  EyeOff,
  X,
} from "lucide-react";
import { useProgress } from "@/app/hooks/useProgress";
import Header from "@/components/Header"; // Adjust the import path as needed
import Footer from "@/components/Footer"; // Adjust the import path as needed

const Logo = ({ className = "" }) => (
  <div className={`flex items-center gap-3 ${className}`}>
    <div className="relative">
      <div className="w-10 h-10 bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 rounded-xl flex items-center justify-center transform rotate-3">
        <Code className="w-6 h-6 text-white" />
      </div>
      <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center">
        <Zap className="w-2.5 h-2.5 text-yellow-900" />
      </div>
    </div>
    <div className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
      CodeMaster
    </div>
  </div>
);

const FilterCard = ({ children, className = "" }) => (
  <div
    className={`bg-white/5 backdrop-blur-xl rounded-2xl p-4 border border-white/10 ${className}`}
  >
    {children}
  </div>
);

const DifficultyButton = ({ difficulty, isSelected, onClick, config }) => (
  <motion.button
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
    onClick={onClick}
    className={`p-1 rounded-lg border-2 transition-all duration-300 text-xs ${
      isSelected
        ? config.color
            .replace("text-", "border-")
            .replace(" bg-", " bg-")
            .replace("/20", "/50")
            .replace("/30", "/20") + " shadow-lg"
        : "border-white/10 hover:border-white/30 bg-white/5"
    }`}
  >
    <div className="text-lg mb-0.5">{config.icon}</div>
    <div className="text-[10px] font-medium">{difficulty}</div>
  </motion.button>
);

export default function CategoryPage() {
  const router = useRouter();
  const params = useParams();
  const { data: session, status } = useSession();
  const {
    progress,
    isLoading: progressLoading,
    isSaving,
    error: progressError,
    toggleCompletion,
    toggleAnswer,
  } = useProgress();

  const [questions, setQuestions] = useState([]);
  const [selectedSection, setSelectedSection] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [isQuestionsLoading, setIsQuestionsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [allSections, setAllSections] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const maxRetries = 3;
  const observer = useRef();

  const selectedCategory = params?.category
    ? params.category.replace(/-/g, " ")
    : "";
  console.log("Params:", params);
  console.log("Selected Category:", selectedCategory);

  const fetchData = useCallback(
    async (pageNum, reset = false) => {
      console.log("FetchData called:", {
        pageNum,
        reset,
        status,
        selectedCategory,
      });
      if (retryCount >= maxRetries || !selectedCategory) {
        console.log("Fetch aborted due to conditions:", {
          retryCount,
          selectedCategory,
        });
        return;
      }

      setIsQuestionsLoading(true);
      setError(null);

      try {
        console.log("Session State:", { session, status });
        const params = new URLSearchParams({
          page: pageNum,
          limit: "10",
          category: selectedCategory,
          ...(selectedSection && { section: selectedSection }),
          ...(selectedDifficulty && { difficulty: selectedDifficulty }),
          ...(searchTerm && { search: searchTerm }),
        });
        const url = `/api/dashboard/data?${params.toString()}`;
        console.log("Fetch URL:", url);

        const res = await fetch(url, {
          headers: {
            Authorization: `Bearer ${session?.accessToken || ""}`,
          },
        });

        console.log("Response Status:", res.status);
        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(`HTTP ${res.status}: ${errorText || res.statusText}`);
        }

        const data = await res.json();
        console.log("API Response:", {
          ...data,
          initialQuestions: data.initialQuestions.length,
        });

        if (!data.initialQuestions || !Array.isArray(data.initialQuestions)) {
          throw new Error("API returned no valid questions data");
        }

        const {
          initialQuestions,
          totalPages,
          currentPage,
          userStats,
          allSections: apiAllSections,
        } = data;
        const uniqueQuestionsMap = new Map();
        initialQuestions.forEach((q) => uniqueQuestionsMap.set(q._id, q));
        const uniqueQuestions = Array.from(uniqueQuestionsMap.values());

        console.log(
          "Fetched Unique Questions:",
          uniqueQuestions.length,
          "Total Pages:",
          totalPages
        );
        setQuestions((prev) =>
          reset
            ? uniqueQuestions
            : [
                ...new Map(
                  [...prev, ...uniqueQuestions].map((q) => [q._id, q])
                ).values(),
              ]
        );
        setTotalPages(totalPages || 1);
        setHasMore(pageNum < totalPages);
        setTotalQuestions(userStats.totalQuestions || 0);

        if (reset) {
          setAllSections(apiAllSections || []);
        }
      } catch (error) {
        console.error("Fetch Error:", error.message);
        setError(
          retryCount + 1 >= maxRetries
            ? "Maximum retries reached. Please check your connection or contact support."
            : `Failed to load: ${error.message}. Retrying... (${
                retryCount + 1
              }/${maxRetries})`
        );
        if (retryCount + 1 < maxRetries) setRetryCount((prev) => prev + 1);
      } finally {
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

  useEffect(() => {
    console.log("UseEffect Trigger:", { status, selectedCategory, params });
    if (status === "unauthenticated") {
      console.log("Redirecting to login due to unauthenticated status");
      router.push("/login");
    } else if (selectedCategory) {
      fetchData(1, true);
    } else {
      console.log("No category selected, skipping fetch");
    }
  }, [status, router, selectedCategory]);

  useEffect(() => {
    setQuestions([]);
    setPage(1);
    if (selectedCategory) fetchData(1, true);
  }, [
    selectedCategory,
    selectedSection,
    selectedDifficulty,
    searchTerm,
    fetchData,
  ]);

  const lastQuestionRef = useCallback(
    (node) => {
      if (isQuestionsLoading || !hasMore || retryCount >= maxRetries) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver(
        (entries) => {
          console.log("Intersection observed:", entries[0].isIntersecting, {
            page,
            totalPages,
            hasMore,
            isInView: entries[0].isIntersecting,
          });
          if (entries[0].isIntersecting && hasMore) {
            console.log("Triggering next page:", page + 1);
            setPage((prev) => prev + 1);
          }
        },
        { rootMargin: "300px", threshold: 0.1 }
      );
      if (node) observer.current.observe(node);
    },
    [isQuestionsLoading, hasMore, retryCount, page, totalPages]
  );

  const loadMoreManually = () => {
    console.log("Load More clicked:", { page, hasMore, isQuestionsLoading });
    if (hasMore && !isQuestionsLoading) {
      setPage((prev) => {
        const nextPage = prev + 1;
        console.log("Setting page to:", nextPage);
        fetchData(nextPage, false);
        return nextPage;
      });
    }
  };

  const resetFilters = () => {
    setSelectedSection("");
    setSelectedDifficulty("");
    setSearchTerm("");
    setQuestions([]);
    setPage(1);
  };

  const getDifficultyConfig = (difficulty) =>
    ({
      Easy: {
        color: "text-emerald-400 bg-emerald-500/20 border-emerald-500/30",
        icon: "🟢",
        gradient: "from-emerald-600 to-teal-600",
      },
      Medium: {
        color: "text-amber-400 bg-amber-500/20 border-amber-500/30",
        icon: "🟡",
        gradient: "from-amber-600 to-orange-600",
      },
      Hard: {
        color: "text-rose-400 bg-rose-500/20 border-rose-500/30",
        icon: "🔴",
        gradient: "from-rose-600 to-red-600",
      },
    }[difficulty] || {
      color: "text-gray-400 bg-gray-500/20 border-gray-500/30",
      icon: "⚪",
      gradient: "from-gray-600 to-gray-700",
    });

  const safeQuestions = Array.isArray(questions) ? questions : [];
  const safeProgress = progress || {};
  const filteredQuestions = useMemo(
    () =>
      safeQuestions.filter((question) => {
        const matchesSection =
          !selectedSection || question.section === selectedSection;
        const matchesDifficulty =
          !selectedDifficulty || question.difficulty === selectedDifficulty;
        const matchesSearch =
          !searchTerm ||
          question.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
          question.answer.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesSection && matchesDifficulty && matchesSearch;
      }),
    [safeQuestions, selectedSection, selectedDifficulty, searchTerm]
  );

  if (status === "loading" || progressLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin w-12 h-12 border-4 border-blue-400 border-t-transparent rounded-full mx-auto mb-4"></div>
          <div className="text-xl">Loading your page...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 text-white flex flex-col">
      <Header error={progressError || error} isSaving={isSaving} />
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-60 right-20 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-20 left-1/3 w-80 h-80 bg-pink-500/10 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>

      {(progressError || error) && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-500/10 border border-red-500/20 backdrop-blur-xl px-6 py-4 mx-4 mt-4 rounded-2xl"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
              <span className="text-red-200">{progressError || error}</span>
            </div>
            <div className="flex items-center gap-2">
              {retryCount < maxRetries && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setRetryCount((prev) => prev + 1)}
                  className="px-3 py-1 bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors"
                >
                  Retry
                </motion.button>
              )}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setError(null);
                  setRetryCount(0);
                }}
                className="text-red-200 hover:text-white"
              >
                <X className="w-5 h-5" />
              </motion.button>
            </div>
          </div>
        </motion.div>
      )}

      <div className="container mx-auto px-4 my-8 flex-1 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <FilterCard className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
              <input
                type="text"
                placeholder="Search questions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all duration-300"
              />
            </div>
          </FilterCard>

          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Filter className="w-6 h-6 text-blue-400" />
              <h3 className="text-xl font-bold">Filters</h3>
            </div>
            <div className="flex gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={resetFilters}
                className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all duration-300 border border-white/10"
              >
                <RefreshCw className="w-4 h-4" />
                Reset All
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowFilters(!showFilters)}
                className="lg:hidden px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-xl transition-colors"
              >
                {showFilters ? "Hide" : "Show"} Filters
              </motion.button>
            </div>
          </div>

          <div
            className={`${
              showFilters ? "flex" : "hidden"
            } lg:flex flex-wrap gap-4`}
          >
            <FilterCard className="flex-1 min-w-[250px]">
              <h4 className="font-bold text-sm mb-2 flex items-center gap-2">
                <div className="w-6 h-6 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <Code className="w-4 h-4 text-blue-400" />
                </div>
                Topic Section
              </h4>
              <select
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
                className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all duration-300"
              >
                <option value="">All Sections</option>
                {allSections.map((sec) => (
                  <option key={sec} value={sec} className="bg-gray-800">
                    {sec || "No Section"}
                  </option>
                ))}
              </select>
            </FilterCard>

            <FilterCard className="flex-1 min-w-[250px]">
              <h4 className="font-bold text-xs mb-1 flex items-center gap-2">
                <div className="w-5 h-5 bg-orange-500/20 rounded-lg flex items-center justify-center">
                  <Zap className="w-3 h-3 text-orange-400" />
                </div>
                Difficulty Level
              </h4>
              <div className="grid grid-cols-3 gap-1">
                {["Easy", "Medium", "Hard"].map((diff) => (
                  <DifficultyButton
                    key={diff}
                    difficulty={diff}
                    isSelected={selectedDifficulty === diff}
                    onClick={() =>
                      setSelectedDifficulty(
                        selectedDifficulty === diff ? "" : diff
                      )
                    }
                    config={getDifficultyConfig(diff)}
                  />
                ))}
              </div>
            </FilterCard>
          </div>
        </motion.div>

        <div className="space-y-6">
          <h3 className="text-2xl font-bold flex items-center gap-3">
            <Brain className="w-6 h-6 text-purple-400" />
            Questions ({filteredQuestions.length} / {totalQuestions})
          </h3>

          <AnimatePresence>
            {filteredQuestions.length > 0 ? (
              filteredQuestions.map((question, index) => {
                const isLast = index === filteredQuestions.length - 1;
                const diffConfig = getDifficultyConfig(question.difficulty);
                const isCompleted =
                  safeProgress[question._id]?.isCompleted || false;
                const showAnswer =
                  safeProgress[question._id]?.showAnswer || false;
                const uniqueKey = `${question._id}-${index}`; // Fallback unique key

                return (
                  <motion.div
                    key={uniqueKey}
                    ref={isLast ? lastQuestionRef : null}
                    initial={{ opacity: 0, y: 30, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 0.95 }}
                    transition={{
                      delay: index * 0.1,
                      type: "spring",
                      stiffness: 100,
                      damping: 15,
                    }}
                    className={`group relative bg-white/5 backdrop-blur-xl rounded-2xl p-6 border transition-all duration-500 hover:bg-white/10 hover:scale-[1.02] ${
                      isCompleted
                        ? "border-green-500/50 shadow-lg shadow-green-500/20"
                        : "border-white/10 hover:border-white/20"
                    }`}
                  >
                    {isCompleted && (
                      <div className="absolute -top-3 -right-3 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shadow-lg shadow-green-500/50">
                        <CheckCircle className="w-5 h-5 text-white" />
                      </div>
                    )}

                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                      <div className="flex-1 space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`px-3 py-1 rounded-xl text-sm font-semibold border backdrop-blur-sm flex items-center gap-2 text-white`}
                          >
                            {question.section || "No Section"}
                          </span>
                          <span
                            className={`px-3 py-1 rounded-xl text-sm font-semibold border ${diffConfig.color} backdrop-blur-sm flex items-center gap-2`}
                          >
                            <span>{diffConfig.icon}</span>
                            {question.difficulty}
                          </span>
                        </div>
                        <h4 className="text-lg font-bold text-white group-hover:text-blue-300 transition-colors">
                          {question.question}
                        </h4>
                      </div>

                      <div className="flex flex-wrap lg:flex-col gap-2 lg:min-w-[180px]">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => toggleAnswer(question._id)}
                          className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-xl transition-all duration-300 font-semibold text-sm"
                        >
                          {showAnswer ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                          {showAnswer ? "Hide Answer" : "Show Answer"}
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => toggleCompletion(question._id)}
                          className={`flex items-center justify-center gap-2 px-4 py-2 rounded-xl transition-all duration-300 font-semibold text-sm border ${
                            isCompleted
                              ? "bg-green-500/20 hover:bg-green-500/30 border-green-500/30 text-green-300"
                              : "bg-white/10 hover:bg-white/20 border-white/20"
                          }`}
                        >
                          {isCompleted ? (
                            <CheckCircle className="w-4 h-4" />
                          ) : (
                            <Trophy className="w-4 h-4" />
                          )}
                          {isCompleted ? "Completed" : "Mark Complete"}
                        </motion.button>
                      </div>
                    </div>

                    <AnimatePresence>
                      {showAnswer && (
                        <motion.div
                          initial={{ opacity: 0, height: 0, y: -20 }}
                          animate={{ opacity: 1, height: "auto", y: 0 }}
                          exit={{ opacity: 0, height: 0, y: -20 }}
                          transition={{
                            type: "spring",
                            stiffness: 100,
                            damping: 20,
                          }}
                          className="mt-4 overflow-hidden"
                        >
                          <div className="p-4 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl border border-blue-500/20 backdrop-blur-sm">
                            <div className="flex items-center gap-2 mb-2">
                              <Brain className="w-4 h-4 text-blue-400" />
                              <h5 className="font-bold text-blue-300 text-sm">
                                Answer:
                              </h5>
                            </div>
                            <div className="text-white/90 leading-relaxed whitespace-pre-wrap text-sm">
                              {question.answer}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })
            ) : !isQuestionsLoading ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-12"
              >
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-bold mb-2 text-white/80">
                  No Questions Found
                </h3>
                <p className="text-white/60 mb-4">
                  Try adjusting your filters or search term to discover new
                  challenges
                </p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={resetFilters}
                  className="px-6 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-xl font-semibold transition-all duration-300"
                >
                  Reset All Filters
                </motion.button>
              </motion.div>
            ) : null}
            {isQuestionsLoading &&
              page > 1 &&
              Array.from({ length: 2 }).map((_, index) => (
                <motion.div
                  key={`skeleton-${index}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 animate-pulse"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-20 h-6 bg-gray-700 rounded-full"></div>
                        <div className="w-16 h-6 bg-gray-700 rounded-full"></div>
                      </div>
                      <div className="w-3/4 h-6 bg-gray-700 rounded mb-2"></div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-20 h-8 bg-gray-700 rounded"></div>
                      <div className="w-20 h-8 bg-gray-700 rounded"></div>
                    </div>
                  </div>
                  <div className="w-full h-20 bg-gray-700 rounded"></div>
                </motion.div>
              ))}
          </AnimatePresence>
          {hasMore && !isQuestionsLoading && (
            <div className="text-center py-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={loadMoreManually}
                className="mt-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg text-white"
              >
                Load More
              </motion.button>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
