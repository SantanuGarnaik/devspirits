// "use client";

// import React, { useState, useEffect, useMemo, useCallback } from "react";
// import { useRouter } from "next/navigation";
// import { motion, AnimatePresence } from "framer-motion";
// import { PieChart } from "react-minimal-pie-chart";
// import { useSession } from "next-auth/react";
// import { Menu, Transition } from "@headlessui/react";
// import { ChevronDownIcon } from "@heroicons/react/20/solid";

// export default function DashboardPage() {
//   const router = useRouter();
//   const { data: session, status } = useSession();

//   const [questions, setQuestions] = useState([]);
//   const [progress, setProgress] = useState({});
//   const [selectedCategory, setSelectedCategory] = useState("");
//   const [selectedSection, setSelectedSection] = useState("");
//   const [selectedDifficulty, setSelectedDifficulty] = useState("");
//   const [searchTerm, setSearchTerm] = useState("");
//   const [showFilters, setShowFilters] = useState(false);
//   const [filtersApplied, setFiltersApplied] = useState(false);
//   const [isInitialized, setIsInitialized] = useState(false);
//   const [isSaving, setIsSaving] = useState(false);
//   const [isLoading, setIsLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [userStats, setUserStats] = useState(null);

//   // Debounced progress saving
//   const [progressSaveTimeout, setProgressSaveTimeout] = useState(null);

//   // Redirect unauthenticated users
//   useEffect(() => {
//     if (status === "unauthenticated") {
//       router.push("/login");
//     }
//   }, [status, router]);

//   // Fetch initial data
//   useEffect(() => {
//     const fetchData = async () => {
//       if (status !== "authenticated") {
//         return;
//       }

//       setIsLoading(true);
//       setError(null);

//       try {
//         const res = await fetch("/api/dashboard/data", {
//           headers: {
//             Authorization: `Bearer ${session.accessToken}`,
//           },
//         });

//         if (!res.ok) {
//           throw new Error(
//             `Failed to fetch dashboard data: ${res.status} ${res.statusText}`
//           );
//         }

//         const { initialQuestions, initialProgress, userStats } =
//           await res.json();

//         // Remove duplicates and ensure _id is string
//         const uniqueQuestions = initialQuestions.filter(
//           (q, index, arr) =>
//             arr.findIndex((item) => item._id === q._id) === index
//         );

//         setQuestions(uniqueQuestions);
//         setProgress(initialProgress || {});
//         setUserStats(userStats);

//         console.log("Data loaded successfully:", {
//           questionsCount: uniqueQuestions.length,
//           progressKeys: Object.keys(initialProgress || {}).length,
//         });
//       } catch (error) {
//         console.error("Error fetching data:", error);
//         setError("Failed to load data. Please refresh the page.");
//       } finally {
//         setIsLoading(false);
//       }
//     };

//     fetchData();
//   }, [session, status]);

//   // Debounced progress saving
//   const saveProgressToServer = useCallback(
//     async (progressData) => {
//       console.log(
//         "Attempting to save progress:",
//         progressData,
//         "session:",
//         session
//       );

//       if (!session?.user?.email || Object.keys(progressData).length === 0)
//         return;

//       // Clear existing timeout
//       if (progressSaveTimeout) {
//         clearTimeout(progressSaveTimeout);
//       }

//       // Set new timeout for saving
//       const timeoutId = setTimeout(async () => {
//         setIsSaving(true);
//         try {
//           const response = await fetch("/api/save-progress", {
//             method: "POST",
//             headers: {
//               "Content-Type": "application/json",
//               Authorization: `Bearer ${session.accessToken}`,
//             },
//             body: JSON.stringify({ progress: progressData }),
//           });
//           console.log(
//             "Saving progress to server with data:",
//             progressData,
//             "session:",
//             session,
//             "response:",
//             response
//           );

//           const result = await response.json();
//           if (!result.success) {
//             throw new Error(result.message);
//           }

//           // Update user stats if returned
//           if (result.stats) {
//             setUserStats((prev) => ({
//               ...prev,
//               ...result.stats,
//             }));
//           }

//           console.log("Progress saved successfully");
//         } catch (error) {
//           console.error("Error saving progress:", error);
//           setError("Failed to save progress");
//         } finally {
//           setIsSaving(false);
//         }
//       }, 1000); // Save after 1 second of inactivity

//       setProgressSaveTimeout(timeoutId);

//       return () => {
//         if (timeoutId) clearTimeout(timeoutId);
//       };
//     },
//     [session, progressSaveTimeout]
//   );

//   // Save progress when it changes
//   useEffect(() => {
//     saveProgressToServer(progress);
//   }, [progress, saveProgressToServer]);

//   // Initialize filters when questions load
//   useEffect(() => {
//     if (!isInitialized && questions.length > 0) {
//       const firstCategory =
//         [...new Set(questions.map((q) => q.category))][0] || "Basic JavaScript";
//       setSelectedCategory(firstCategory);

//       const categoryQuestions = questions.filter(
//         (q) => q.category === firstCategory
//       );
//       const firstSection =
//         [
//           ...new Set(categoryQuestions.map((q) => q.section).filter(Boolean)),
//         ][0] || "";
//       setSelectedSection(firstSection);
//       setSelectedDifficulty("Easy");
//       setFiltersApplied(true);
//       setIsInitialized(true);
//     }
//   }, [questions, isInitialized]);

//   const handleLogout = async () => {
//     try {
//       const response = await fetch("/api/logout", {
//         method: "POST",
//         credentials: "include",
//       });
//       if (response.ok) {
//         router.push("/login");
//       } else {
//         console.error("Logout failed");
//       }
//     } catch (error) {
//       console.error("Logout error:", error);
//     }
//   };

//   const safeQuestions = Array.isArray(questions) ? questions : [];
//   const safeProgress = progress || {};

//   // Memoized calculations for better performance
//   const categories = useMemo(
//     () => [...new Set(safeQuestions.map((q) => q.category))],
//     [safeQuestions]
//   );

//   const sections = useMemo(
//     () => [
//       ...new Set(
//         safeQuestions
//           .filter((q) => q.category === selectedCategory)
//           .map((q) => q.section)
//           .filter(Boolean)
//       ),
//     ],
//     [safeQuestions, selectedCategory]
//   );

//   const difficulties = useMemo(() => ["Easy", "Medium", "Hard"], []);

//   const completedCount = useMemo(
//     () => safeQuestions.filter((q) => safeProgress[q._id]?.isCompleted).length,
//     [safeQuestions, safeProgress]
//   );

//   const totalCount = safeQuestions.length;
//   const progressPercentage =
//     totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

//   const categoryProgress = useMemo(() => {
//     return categories.map((category) => {
//       const categoryQuestions = safeQuestions.filter(
//         (q) => q.category === category
//       );
//       const completed = categoryQuestions.filter(
//         (q) => safeProgress[q._id]?.isCompleted
//       ).length;
//       const total = categoryQuestions.length;
//       const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
//       return { category, completed, total, percentage };
//     });
//   }, [safeQuestions, safeProgress, categories]);

//   const filteredQuestions = useMemo(() => {
//     if (!filtersApplied) return [];
//     return safeQuestions.filter((question) => {
//       const matchesCategory = question.category === selectedCategory;
//       const matchesSection =
//         !selectedSection || question.section === selectedSection;
//       const matchesDifficulty =
//         !selectedDifficulty || question.difficulty === selectedDifficulty;
//       const matchesSearch = question.question
//         .toLowerCase()
//         .includes(searchTerm.toLowerCase());
//       return (
//         matchesCategory && matchesSection && matchesDifficulty && matchesSearch
//       );
//     });
//   }, [
//     safeQuestions,
//     selectedCategory,
//     selectedSection,
//     selectedDifficulty,
//     searchTerm,
//     filtersApplied,
//   ]);

//   const toggleCompletion = useCallback((id) => {
//     setProgress((prev) => ({
//       ...prev,
//       [id]: {
//         ...prev[id],
//         isCompleted: !prev[id]?.isCompleted,
//         completedAt: !prev[id]?.isCompleted ? new Date().toISOString() : null,
//         updatedAt: new Date().toISOString(),
//       },
//     }));
//   }, []);

//   const toggleAnswer = useCallback((id) => {
//     setProgress((prev) => ({
//       ...prev,
//       [id]: {
//         ...prev[id],
//         showAnswer: !prev[id]?.showAnswer,
//         updatedAt: new Date().toISOString(),
//       },
//     }));
//   }, []);

//   const resetProgress = async () => {
//     if (
//       !confirm(
//         "Are you sure you want to reset all progress? This cannot be undone."
//       )
//     ) {
//       return;
//     }

//     try {
//       const response = await fetch("/api/reset-progress", {
//         method: "POST",
//         headers: {
//           Authorization: `Bearer ${session.accessToken}`,
//         },
//       });

//       const result = await response.json();
//       if (result.success) {
//         setProgress({});
//         setUserStats({
//           totalQuestions: 0,
//           completedQuestions: 0,
//           completionPercentage: 0,
//         });
//         console.log("Progress reset successfully");
//       } else {
//         throw new Error(result.message);
//       }
//     } catch (error) {
//       console.error("Error resetting progress:", error);
//       setError("Failed to reset progress");
//     }
//   };

//   const resetFilters = () => {
//     const firstCategory = categories[0] || "Basic JavaScript";
//     const categoryQuestions = safeQuestions.filter(
//       (q) => q.category === firstCategory
//     );
//     const firstSection =
//       [
//         ...new Set(categoryQuestions.map((q) => q.section).filter(Boolean)),
//       ][0] || "";

//     setSelectedCategory(firstCategory);
//     setSelectedSection(firstSection);
//     setSelectedDifficulty("Easy");
//     setSearchTerm("");
//     setFiltersApplied(true);
//   };

//   const getDifficultyConfig = (difficulty) => {
//     const configs = {
//       Easy: { color: "text-emerald-600 bg-emerald-100", icon: "🟢" },
//       Medium: { color: "text-amber-600 bg-amber-100", icon: "🟡" },
//       Hard: { color: "text-rose-600 bg-rose-100", icon: "🔴" },
//     };
//     return (
//       configs[difficulty] || { color: "text-gray-600 bg-gray-100", icon: "⚪" }
//     );
//   };

//   const getCategoryConfig = (category) => {
//     const configs = {
//       "Basic JavaScript": {
//         gradient: "from-blue-600 to-cyan-600",
//         bg: "bg-gradient-to-r from-blue-600 to-cyan-600",
//       },
//       "Advanced JavaScript": {
//         gradient: "from-purple-600 to-pink-600",
//         bg: "bg-gradient-to-r from-purple-600 to-pink-600",
//       },
//       "React JS": {
//         gradient: "from-emerald-600 to-teal-600",
//         bg: "bg-gradient-to-r from-emerald-600 to-teal-600",
//       },
//     };
//     return (
//       configs[category] || {
//         gradient: "from-gray-600 to-gray-700",
//         bg: "bg-gradient-to-r from-gray-600 to-gray-700",
//       }
//     );
//   };

//   // Loading state
//   if (status === "loading" || isLoading) {
//     return (
//       <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 flex items-center justify-center">
//         <div className="text-white text-center">
//           <div className="animate-spin w-12 h-12 border-4 border-blue-400 border-t-transparent rounded-full mx-auto mb-4"></div>
//           <div className="text-xl">Loading your dashboard...</div>
//         </div>
//       </div>
//     );
//   }

//   const userName = session?.user?.name || "User";
//   const userImage = session?.user?.image || "https://placehold.co/40x40";

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 text-white flex flex-col">
//       {/* Header */}
//       <header className="bg-white/10 backdrop-blur-md border-b border-white/20">
//         <div className="container mx-auto px-4 py-4 flex items-center justify-between">
//           <div className="text-left flex-1">
//             <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
//               DevSpirits
//             </h1>
//             <p className="text-xs text-gray-300">
//               Crack Interviews with Precision
//             </p>
//           </div>

//           {/* Status indicators */}
//           <div className="flex items-center gap-4">
//             {error && (
//               <div className="flex items-center gap-2 text-sm text-red-400">
//                 <span>⚠️</span>
//                 <span>Error occurred</span>
//               </div>
//             )}

//             {isSaving && (
//               <div className="flex items-center gap-2 text-sm text-blue-400">
//                 <div className="animate-spin w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full"></div>
//                 <span>Saving...</span>
//               </div>
//             )}

//             {/* User menu */}
//             <Menu as="div" className="relative">
//               <Menu.Button className="flex items-center gap-2 bg-gray-800/50 rounded-full p-2 hover:bg-gray-700 transition-colors">
//                 <img
//                   src={userImage}
//                   alt={`${userName}'s profile`}
//                   className="w-10 h-10 rounded-full object-cover"
//                 />
//                 <span className="text-white font-medium hidden md:inline">
//                   {userName}
//                 </span>
//                 <ChevronDownIcon className="w-5 h-5 text-gray-400" />
//               </Menu.Button>
//               <Transition
//                 as={React.Fragment}
//                 enter="transition ease-out duration-100"
//                 enterFrom="transform opacity-0 scale-95"
//                 enterTo="transform opacity-100 scale-100"
//                 leave="transition ease-in duration-75"
//                 leaveFrom="transform opacity-100 scale-100"
//                 leaveTo="transform opacity-0 scale-95"
//               >
//                 <Menu.Items className="absolute z-[9999] right-0 mt-2 w-48 origin-top-right bg-gray-800/90 backdrop-blur-md border border-gray-700 rounded-md shadow-lg ring-1 ring-black/5 focus:outline-none">
//                   <div className="py-1">
//                     <Menu.Item>
//                       {({ active }) => (
//                         <button
//                           onClick={handleLogout}
//                           className={`${
//                             active ? "bg-gray-700" : ""
//                           } w-full text-left px-4 py-1 text-sm text-white flex items-center gap-2`}
//                         >
//                           Logout
//                         </button>
//                       )}
//                     </Menu.Item>
//                   </div>
//                 </Menu.Items>
//               </Transition>
//             </Menu>
//           </div>
//         </div>
//       </header>

//       {/* Error banner */}
//       {error && (
//         <div className="bg-red-500/20 border border-red-500/50 px-4 py-3 mx-4 mt-4 rounded-lg">
//           <div className="flex items-center justify-between">
//             <div className="flex items-center gap-2">
//               <span className="text-red-400">⚠️</span>
//               <span className="text-red-100">{error}</span>
//             </div>
//             <button
//               onClick={() => setError(null)}
//               className="text-red-200 hover:text-white"
//             >
//               ✕
//             </button>
//           </div>
//         </div>
//       )}

//       <main className="container mx-auto px-4 py-8 flex-1">
//         {/* Overall Progress */}
//         {/* <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 mb-8 border border-white/20">
//           <div className="flex items-center justify-between mb-4">
//             <h2 className="text-2xl font-semibold">Overall Progress</h2>
//             <button
//               onClick={resetProgress}
//               className="px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
//             >
//               Reset Progress
//             </button>
//           </div>
//           <div className="w-full bg-gray-700 rounded-full h-4 mb-4">
//             <div
//               className="bg-gradient-to-r from-green-400 to-blue-500 h-4 rounded-full transition-all duration-500"
//               style={{ width: `${progressPercentage}%` }}
//             ></div>
//           </div>
//           <div className="text-center">
//             <span className="text-3xl font-bold">{completedCount}</span>
//             <span className="text-gray-300">
//               {" "}
//               / {totalCount} questions completed
//             </span>
//             <span className="ml-4 text-2xl font-semibold text-green-400">
//               ({progressPercentage}%)
//             </span>
//           </div>
//           {userStats?.lastUpdated && (
//             <div className="text-center mt-2 text-sm text-gray-400">
//               Last updated: {new Date(userStats.lastUpdated).toLocaleString()}
//             </div>
//           )}
//         </div> */}

//         {/* Overall Progress (replace the original block) */}
//         <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 mb-8 border border-white/20">
//           {Object.keys(safeProgress || {}).length > 0 ? (
//             <>
//               <div className="flex items-center justify-between mb-4">
//                 <h2 className="text-2xl font-semibold">Overall Progress</h2>
//                 <button
//                   onClick={resetProgress}
//                   className="px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
//                 >
//                   Reset Progress
//                 </button>
//               </div>

//               <div className="w-full bg-gray-700 rounded-full h-4 mb-4">
//                 <div
//                   className="bg-gradient-to-r from-green-400 to-blue-500 h-4 rounded-full transition-all duration-500"
//                   style={{ width: `${progressPercentage}%` }}
//                 />
//               </div>

//               <div className="text-center">
//                 <span className="text-3xl font-bold">{completedCount}</span>
//                 <span className="text-gray-300">
//                   {" "}
//                   / {totalCount} questions completed
//                 </span>
//                 <span className="ml-4 text-2xl font-semibold text-green-400">
//                   ({progressPercentage}%)
//                 </span>
//               </div>

//               {userStats?.lastUpdated && (
//                 <div className="text-center mt-2 text-sm text-gray-400">
//                   Last updated:{" "}
//                   {new Date(userStats.lastUpdated).toLocaleString()}
//                 </div>
//               )}
//             </>
//           ) : (
//             // Placeholder state when no progress exists yet
//             <>
//               <div className="flex items-center justify-between mb-4">
//                 <h2 className="text-2xl font-semibold">Overall Progress</h2>
//                 <button
//                   onClick={resetProgress}
//                   className="px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
//                 >
//                   Reset Progress
//                 </button>
//               </div>

//               <div className="w-full bg-gray-700 rounded-full h-4 mb-4">
//                 <div
//                   className="bg-gradient-to-r from-green-400 to-blue-500 h-4 rounded-full transition-all duration-500"
//                   style={{ width: `0%` }}
//                 />
//               </div>

//               <div className="text-center">
//                 <span className="text-3xl font-bold">0</span>
//                 <span className="text-gray-300">
//                   {" "}
//                   / {totalCount} questions completed
//                 </span>
//                 <span className="ml-4 text-2xl font-semibold text-green-400">
//                   (0%)
//                 </span>
//               </div>
//             </>
//           )}
//         </div>

//         {/* Category Progress */}
//         <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 mb-8 border border-white/20">
//           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
//             {categoryProgress.map(
//               ({ category, completed, total, percentage }) => {
//                 const { bg } = getCategoryConfig(category);
//                 return (
//                   <div key={category} className="flex flex-col items-center">
//                     <h3
//                       className={`text-lg font-semibold mb-2 ${bg} px-3 py-1 rounded-full text-white`}
//                     >
//                       {category}
//                     </h3>
//                     <div className="w-32 h-32">
//                       <PieChart
//                         data={[
//                           {
//                             title: "Completed",
//                             value: completed,
//                             color: "#34D399",
//                           },
//                           {
//                             title: "Remaining",
//                             value: total - completed,
//                             color: "#4B5563",
//                           },
//                         ]}
//                         lineWidth={20}
//                         label={() => `${percentage}%`}
//                         labelStyle={{
//                           fontSize: "16px",
//                           fill: "#ffffff",
//                           fontWeight: "bold",
//                         }}
//                         labelPosition={0}
//                       />
//                     </div>
//                     <p className="mt-2 text-gray-300">
//                       {completed} / {total} questions ({percentage}%)
//                     </p>
//                   </div>
//                 );
//               }
//             )}
//           </div>
//         </div>

//         {/* Filters */}
//         <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 mb-8 border border-white/20">
//           <div className="flex items-center justify-between mb-4">
//             <h3 className="text-xl font-semibold">Filters</h3>
//             <div className="flex gap-3">
//               <button
//                 onClick={resetFilters}
//                 className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg transition-colors"
//               >
//                 Reset Filters
//               </button>
//               <button
//                 onClick={() => setShowFilters(!showFilters)}
//                 className="lg:hidden px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors"
//               >
//                 {showFilters ? "Hide" : "Show"} Filters
//               </button>
//             </div>
//           </div>

//           <div
//             className={`${showFilters ? "block" : "hidden"} lg:block space-y-4`}
//           >
//             <div>
//               <input
//                 type="text"
//                 placeholder="Search questions..."
//                 value={searchTerm}
//                 onChange={(e) => {
//                   setSearchTerm(e.target.value);
//                   setFiltersApplied(true);
//                 }}
//                 className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
//               />
//             </div>

//             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//               <select
//                 value={selectedCategory}
//                 onChange={(e) => {
//                   setSelectedCategory(e.target.value);
//                   setFiltersApplied(true);
//                 }}
//                 className="px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
//               >
//                 {categories.map((cat) => (
//                   <option key={cat} value={cat}>
//                     {cat}
//                   </option>
//                 ))}
//               </select>

//               <select
//                 value={selectedSection}
//                 onChange={(e) => {
//                   setSelectedSection(e.target.value);
//                   setFiltersApplied(true);
//                 }}
//                 className="px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
//               >
//                 <option value="">All Sections</option>
//                 {sections.map((sec) => (
//                   <option key={sec} value={sec}>
//                     {sec}
//                   </option>
//                 ))}
//               </select>

//               <select
//                 value={selectedDifficulty}
//                 onChange={(e) => {
//                   setSelectedDifficulty(e.target.value);
//                   setFiltersApplied(true);
//                 }}
//                 className="px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
//               >
//                 <option value="">All Difficulties</option>
//                 {difficulties.map((diff) => (
//                   <option key={diff} value={diff}>
//                     {diff}
//                   </option>
//                 ))}
//               </select>
//             </div>
//           </div>
//         </div>

//         {/* Questions */}
//         <div className="space-y-6">
//           <h3 className="text-2xl font-semibold mb-4">
//             Questions ({filteredQuestions.length})
//           </h3>

//           <AnimatePresence>
//             {filteredQuestions.length > 0 ? (
//               filteredQuestions.map((question, index) => {
//                 const diffConfig = getDifficultyConfig(question.difficulty);
//                 const categoryConfig = getCategoryConfig(question.category);
//                 const isCompleted = safeProgress[question._id]?.isCompleted;
//                 const showAnswer = safeProgress[question._id]?.showAnswer;

//                 return (
//                   <motion.div
//                     key={question._id}
//                     initial={{ opacity: 0, y: 20 }}
//                     animate={{ opacity: 1, y: 0 }}
//                     exit={{ opacity: 0, y: -20 }}
//                     transition={{ delay: index * 0.1 }}
//                     className={`bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 ${
//                       isCompleted ? "ring-2 ring-green-400" : ""
//                     }`}
//                   >
//                     <div className="flex items-start justify-between mb-4">
//                       <div className="flex-1">
//                         <div className="flex items-center gap-3 mb-2">
//                           <span
//                             className={`px-3 py-1 rounded-full text-sm font-medium ${categoryConfig.bg} text-white`}
//                           >
//                             {question.category}
//                           </span>
//                           <span
//                             className={`px-3 py-1 rounded-full text-sm font-medium ${diffConfig.color}`}
//                           >
//                             {diffConfig.icon} {question.difficulty}
//                           </span>
//                           {question.section && (
//                             <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-600 text-white">
//                               {question.section}
//                             </span>
//                           )}
//                         </div>
//                         <h4 className="text-lg font-semibold mb-2">
//                           {question.question}
//                         </h4>
//                       </div>

//                       <div className="flex items-center gap-3">
//                         <button
//                           onClick={() => toggleAnswer(question._id)}
//                           className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors"
//                         >
//                           {showAnswer ? "Hide Answer" : "Show Answer"}
//                         </button>
//                         <button
//                           onClick={() => toggleCompletion(question._id)}
//                           className={`px-4 py-2 rounded-lg transition-colors ${
//                             isCompleted
//                               ? "bg-green-500 hover:bg-green-600"
//                               : "bg-gray-600 hover:bg-gray-700"
//                           }`}
//                         >
//                           {isCompleted ? "✓ Completed" : "Mark Complete"}
//                         </button>
//                       </div>
//                     </div>

//                     <AnimatePresence>
//                       {showAnswer && (
//                         <motion.div
//                           initial={{ opacity: 0, height: 0 }}
//                           animate={{ opacity: 1, height: "auto" }}
//                           exit={{ opacity: 0, height: 0 }}
//                           transition={{ duration: 0.3 }}
//                           className="mt-4 p-4 bg-gray-800/50 rounded-lg border-l-4 border-blue-400"
//                         >
//                           <h5 className="font-semibold text-blue-400 mb-2">
//                             Answer:
//                           </h5>
//                           <div className="text-gray-300 whitespace-pre-wrap">
//                             {question.answer}
//                           </div>
//                         </motion.div>
//                       )}
//                     </AnimatePresence>
//                   </motion.div>
//                 );
//               })
//             ) : (
//               <div className="text-center py-12">
//                 <div className="text-6xl mb-4">🔍</div>
//                 <h3 className="text-xl font-semibold mb-2">
//                   No questions found
//                 </h3>
//                 <p className="text-gray-400">
//                   Try adjusting your filters or search term
//                 </p>
//               </div>
//             )}
//           </AnimatePresence>
//         </div>
//       </main>

//       <footer className="bg-white/10 backdrop-blur-md border-t border-white/20 py-4">
//         <div className="container mx-auto px-4 text-center text-gray-300">
//           <p>
//             &copy; {new Date().getFullYear()} DevSpirits. All rights reserved.
//           </p>
//           <div className="mt-2">
//             <a href="/about" className="text-blue-400 hover:text-blue-300 mx-2">
//               About
//             </a>
//             <a
//               href="/contact"
//               className="text-blue-400 hover:text-blue-300 mx-2"
//             >
//               Contact
//             </a>
//             <a
//               href="/privacy"
//               className="text-blue-400 hover:text-blue-300 mx-2"
//             >
//               Privacy Policy
//             </a>
//           </div>
//         </div>
//       </footer>
//     </div>
//   );
// }

"use client";

import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { PieChart } from "react-minimal-pie-chart";
import { useSession } from "next-auth/react";
import { Menu, Transition } from "@headlessui/react";
import { ChevronDownIcon } from "@heroicons/react/20/solid";

export default function DashboardPage() {
  const router = useRouter();
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
  const [userStats, setUserStats] = useState(null);
  const [categories, setCategories] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isSaving, setIsSaving] = useState(false); // Ensure isSaving is defined

  // Debounced progress saving
  const [progressSaveTimeout, setProgressSaveTimeout] = useState(null);
  const observer = useRef();

  // Redirect unauthenticated users
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Fetch initial data and subsequent pages
  const fetchData = useCallback(
    async (pageNum, reset = false) => {
      if (status !== "authenticated") return;

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

        const res = await fetch(`/api/dashboard/data?${params.toString()}`, {
          headers: {
            Authorization: `Bearer ${session?.accessToken || ""}`,
          },
        });

        if (!res.ok) {
          throw new Error(
            `Failed to fetch dashboard data: ${res.status} ${res.statusText}`
          );
        }

        const {
          initialQuestions,
          initialProgress,
          userStats,
          categories: fetchedCategories,
          totalPages,
          currentPage,
        } = await res.json();

        // Remove duplicates and ensure _id is string
        const uniqueQuestions = initialQuestions.filter(
          (q, index, arr) =>
            arr.findIndex((item) => item._id === q._id) === index
        );

        setQuestions((prev) =>
          reset ? uniqueQuestions : [...prev, ...uniqueQuestions]
        );
        setProgress(initialProgress || {});
        setUserStats(userStats);
        setCategories(fetchedCategories);
        setTotalPages(totalPages);
        setHasMore(pageNum < totalPages);

        // Initialize filters on first load
        if (!selectedCategory && fetchedCategories.length > 0 && reset) {
          setSelectedCategory(fetchedCategories[0]);
          const categoryQuestions = uniqueQuestions.filter(
            (q) => q.category === fetchedCategories[0]
          );
          const firstSection =
            [
              ...new Set(
                categoryQuestions.map((q) => q.section).filter(Boolean)
              ),
            ][0] || "";
          setSelectedSection(firstSection);
          setSelectedDifficulty("Easy");
        }

        console.log("Data loaded successfully:", {
          questionsCount: uniqueQuestions.length,
          progressKeys: Object.keys(initialProgress || {}).length,
          page: currentPage,
          totalPages,
        });
      } catch (error) {
        console.error("Error fetching data:", error);
        setError("Failed to load data. Please try again.");
      } finally {
        setIsLoading(false);
        setIsQuestionsLoading(false);
      }
    },
    [
      session,
      status,
      selectedCategory,
      selectedSection,
      selectedDifficulty,
      searchTerm,
    ]
  );

  // Initial data fetch
  useEffect(() => {
    fetchData(1, true);
  }, [fetchData]);

  // Infinite scroll observer
  const lastQuestionRef = useCallback(
    (node) => {
      if (isQuestionsLoading || !hasMore) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
          setPage((prev) => prev + 1);
        }
      });
      if (node) observer.current.observe(node);
    },
    [isQuestionsLoading, hasMore]
  );

  // Fetch next page when page changes
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

  // Debounced progress saving
  const saveProgressToServer = useCallback(
    async (progressData) => {
      if (!session?.user?.email || Object.keys(progressData).length === 0)
        return;

      if (progressSaveTimeout) {
        clearTimeout(progressSaveTimeout);
      }

      const timeoutId = setTimeout(async () => {
        setIsSaving(true);
        try {
          const response = await fetch("/api/save-progress", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session?.accessToken || ""}`,
            },
            body: JSON.stringify({ progress: progressData }),
          });

          const result = await response.json();
          if (!result.success) {
            throw new Error(result.message || "Failed to save progress");
          }

          if (result.stats) {
            setUserStats((prev) => ({
              ...prev,
              ...result.stats,
            }));
          }

          console.log("Progress saved successfully");
        } catch (error) {
          console.error("Error saving progress:", error);
          setError("Failed to save progress");
        } finally {
          setIsSaving(false);
        }
      }, 1000);

      setProgressSaveTimeout(timeoutId);
      return () => {
        if (timeoutId) clearTimeout(timeoutId);
      };
    },
    [session, progressSaveTimeout]
  );

  // Save progress when it changes
  useEffect(() => {
    saveProgressToServer(progress);
  }, [progress, saveProgressToServer]);

  const handleLogout = async () => {
    try {
      const response = await fetch("/api/logout", {
        method: "POST",
        credentials: "include",
      });
      if (response.ok) {
        router.push("/login");
      } else {
        console.error("Logout failed");
      }
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const safeQuestions = Array.isArray(questions) ? questions : [];
  const safeProgress = progress || {};

  // Memoized calculations for better performance
  const sections = useMemo(
    () => [
      ...new Set(
        safeQuestions
          .filter((q) => !selectedCategory || q.category === selectedCategory)
          .map((q) => q.section)
          .filter(Boolean)
      ),
    ],
    [safeQuestions, selectedCategory]
  );

  const difficulties = useMemo(() => ["Easy", "Medium", "Hard"], []);

  const completedCount = useMemo(
    () => safeQuestions.filter((q) => safeProgress[q._id]?.isCompleted).length,
    [safeQuestions, safeProgress]
  );

  const totalCount = userStats?.totalQuestions || safeQuestions.length;
  const progressPercentage = userStats?.completionPercentage || 0;

  const categoryProgress = useMemo(() => {
    return categories.map((category) => {
      const categoryQuestions = safeQuestions.filter(
        (q) => q.category === category
      );
      const completed = categoryQuestions.filter(
        (q) => safeProgress[q._id]?.isCompleted
      ).length;
      const total = categoryQuestions.length;
      const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
      return { category, completed, total, percentage };
    });
  }, [safeQuestions, safeProgress, categories]);

  const resetProgress = async () => {
    if (
      !confirm(
        "Are you sure you want to reset all progress? This cannot be undone."
      )
    ) {
      return;
    }

    try {
      const response = await fetch("/api/reset-progress", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session?.accessToken || ""}`,
        },
      });

      const result = await response.json();
      if (result.success) {
        setProgress({});
        setUserStats({
          totalQuestions: 0,
          completedQuestions: 0,
          completionPercentage: 0,
        });
        console.log("Progress reset successfully");
      } else {
        throw new Error(result.message || "Failed to reset progress");
      }
    } catch (error) {
      console.error("Error resetting progress:", error);
      setError("Failed to reset progress");
    }
  };

  const resetFilters = () => {
    setSelectedCategory("");
    setSelectedSection("");
    setSelectedDifficulty("");
    setSearchTerm("");
    setQuestions([]);
    setPage(1);
  };

  const getDifficultyConfig = (difficulty) => {
    const configs = {
      Easy: { color: "text-emerald-600 bg-emerald-100", icon: "🟢" },
      Medium: { color: "text-amber-600 bg-amber-100", icon: "🟡" },
      Hard: { color: "text-rose-600 bg-rose-100", icon: "🔴" },
    };
    return (
      configs[difficulty] || { color: "text-gray-600 bg-gray-100", icon: "⚪" }
    );
  };

  const getCategoryConfig = (category) => {
    const configs = {
      "Basic JavaScript": {
        gradient: "from-blue-600 to-cyan-600",
        bg: "bg-gradient-to-r from-blue-600 to-cyan-600",
      },
      "Advanced JavaScript": {
        gradient: "from-purple-600 to-pink-600",
        bg: "bg-gradient-to-r from-purple-600 to-pink-600",
      },
      "React JS": {
        gradient: "from-emerald-600 to-teal-600",
        bg: "bg-gradient-to-r from-emerald-600 to-teal-600",
      },
    };
    return (
      configs[category] || {
        gradient: "from-gray-600 to-gray-700",
        bg: "bg-gradient-to-r from-gray-600 to-gray-700",
      }
    );
  };

  // Loading state for initial load
  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin w-12 h-12 border-4 border-blue-400 border-t-transparent rounded-full mx-auto mb-4"></div>
          <div className="text-xl">Loading your dashboard...</div>
        </div>
      </div>
    );
  }

  const userName = session?.user?.name || "User";
  const userImage = session?.user?.image || "https://placehold.co/40x40";

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 text-white flex flex-col">
      {/* Header */}
      <header className="bg-white/10 backdrop-blur-md border-b border-white/20">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="text-left flex-1">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              DevSpirits
            </h1>
            <p className="text-xs text-gray-300">
              Crack Interviews with Precision
            </p>
          </div>

          {/* Status indicators */}
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

            {/* User menu */}
            <Menu as="div" className="relative">
              <Menu.Button className="flex items-center gap-2 bg-gray-800/50 rounded-full p-2 hover:bg-gray-700 transition-colors">
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
                <Menu.Items className="absolute z-[9999] right-0 mt-2 w-48 origin-top-right bg-gray-800/90 backdrop-blur-md border border-gray-700 rounded-md shadow-lg ring-1 ring-black/5 focus:outline-none">
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

      {/* Error banner */}
      {error && (
        <div className="bg-red-500/20 border border-red-500/50 px-4 py-3 mx-4 mt-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-red-400">⚠️</span>
              <span className="text-red-100">{error}</span>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-200 hover:text-white"
            >
              ✕
            </button>
          </div>
        </div>
      )}
      <div className="container mx-auto px-4 my-8 flex-1">
        {/* Overall Progress */}

        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 mb-8 border border-white/20">
          {Object.keys(safeProgress).length > 0 ? (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-semibold">Overall Progress</h2>
                <button
                  onClick={resetProgress}
                  className="px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
                >
                  Reset Progress
                </button>
              </div>

              <div className="w-full bg-gray-700 rounded-full h-4 mb-4">
                <div
                  className="bg-gradient-to-r from-green-400 to-blue-500 h-4 rounded-full transition-all duration-500"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>

              <div className="text-center">
                <span className="text-3xl font-bold">{completedCount}</span>
                <span className="text-gray-300">
                  {" "}
                  / {totalCount} questions completed
                </span>
                <span className="ml-4 text-2xl font-semibold text-green-400">
                  ({progressPercentage}%)
                </span>
              </div>

              {userStats?.lastUpdated && (
                <div className="text-center mt-2 text-sm text-gray-400">
                  Last updated:{" "}
                  {new Date(userStats.lastUpdated).toLocaleString()}
                </div>
              )}
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-semibold">Overall Progress</h2>
                <button
                  onClick={resetProgress}
                  className="px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
                >
                  Reset Progress
                </button>
              </div>

              <div className="w-full bg-gray-700 rounded-full h-4 mb-4">
                <div
                  className="bg-gradient-to-r from-green-400 to-blue-500 h-4 rounded-full transition-all duration-500"
                  style={{ width: `0%` }}
                />
              </div>

              <div className="text-center">
                <span className="text-3xl font-bold">0</span>
                <span className="text-gray-300">
                  {" "}
                  / {totalCount} questions completed
                </span>
                <span className="ml-4 text-2xl font-semibold text-green-400">
                  (0%)
                </span>
              </div>
            </>
          )}
        </div>

        {/* Category Progress */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 mb-8 border border-white/20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {categoryProgress.map(
              ({ category, completed, total, percentage }) => {
                const { bg } = getCategoryConfig(category);
                return (
                  <div key={category} className="flex flex-col items-center">
                    <h3
                      className={`text-lg font-semibold mb-2 ${bg} px-3 py-1 rounded-full text-white`}
                    >
                      {category}
                    </h3>
                    <div className="w-32 h-32">
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
                            color: "#4B5563",
                          },
                        ]}
                        lineWidth={20}
                        label={() => `${percentage}%`}
                        labelStyle={{
                          fontSize: "16px",
                          fill: "#ffffff",
                          fontWeight: "bold",
                        }}
                        labelPosition={0}
                      />
                    </div>
                    <p className="mt-2 text-gray-300">
                      {completed} / {total} questions ({percentage}%)
                    </p>
                  </div>
                );
              }
            )}
          </div>
        </div>

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

          <div
            className={`${showFilters ? "block" : "hidden"} lg:block space-y-4`}
          >
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
          <h3 className="text-2xl font-semibold mb-4">
            Questions ({userStats?.totalQuestions || 0})
          </h3>

          {isQuestionsLoading && (
            <div className="text-center py-4">
              <div className="animate-spin w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full mx-auto"></div>
              <p className="text-gray-300 mt-2">Loading questions...</p>
            </div>
          )}

          <AnimatePresence>
            {questions.length > 0
              ? questions.map((question, index) => {
                  const isLast = index === questions.length - 1;
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
                            <span
                              className={`px-3 py-1 rounded-full text-sm font-medium ${categoryConfig.bg} text-white`}
                            >
                              {question.category}
                            </span>
                            <span
                              className={`px-3 py-1 rounded-full text-sm font-medium ${diffConfig.color}`}
                            >
                              {diffConfig.icon} {question.difficulty}
                            </span>
                            {question.section && (
                              <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-600 text-white">
                                {question.section}
                              </span>
                            )}
                          </div>
                          <h4 className="text-lg font-semibold mb-2">
                            {question.question}
                          </h4>
                        </div>

                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => {
                              setProgress((prev) => ({
                                ...prev,
                                [question._id]: {
                                  ...prev[question._id],
                                  showAnswer: !prev[question._id]?.showAnswer,
                                  updatedAt: new Date().toISOString(),
                                },
                              }));
                            }}
                            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors"
                          >
                            {showAnswer ? "Hide Answer" : "Show Answer"}
                          </button>
                          <button
                            onClick={() => {
                              setProgress((prev) => ({
                                ...prev,
                                [question._id]: {
                                  ...prev[question._id],
                                  isCompleted: !prev[question._id]?.isCompleted,
                                  completedAt: !prev[question._id]?.isCompleted
                                    ? new Date().toISOString()
                                    : null,
                                  updatedAt: new Date().toISOString(),
                                },
                              }));
                            }}
                            className={`px-4 py-2 rounded-lg transition-colors ${
                              isCompleted
                                ? "bg-green-500 hover:bg-green-600"
                                : "bg-gray-600 hover:bg-gray-700"
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
                            <h5 className="font-semibold text-blue-400 mb-2">
                              Answer:
                            </h5>
                            <div className="text-gray-300 whitespace-pre-wrap">
                              {question.answer}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })
              : !isQuestionsLoading && (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">🔍</div>
                    <h3 className="text-xl font-semibold mb-2">
                      No questions found
                    </h3>
                    <p className="text-gray-400">
                      Try adjusting your filters or search term
                    </p>
                  </div>
                )}
          </AnimatePresence>

          {hasMore && !isQuestionsLoading && (
            <div className="text-center py-4">
              <p className="text-gray-300">Scroll to load more...</p>
            </div>
          )}
        </div>
      </div>

      <footer className="bg-white/10 backdrop-blur-md border-t border-white/20 py-4">
        <div className="container mx-auto px-4 text-center text-gray-300">
          <p>
            &copy; {new Date().getFullYear()} DevSpirits. All rights reserved.
          </p>
          <div className="mt-2">
            <a href="/about" className="text-blue-400 hover:text-blue-300 mx-2">
              About
            </a>
            <a
              href="/contact"
              className="text-blue-400 hover:text-blue-300 mx-2"
            >
              Contact
            </a>
            <a
              href="/privacy"
              className="text-blue-400 hover:text-blue-300 mx-2"
            >
              Privacy Policy
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
