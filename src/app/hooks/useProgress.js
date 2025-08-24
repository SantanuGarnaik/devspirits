// // hooks/useProgress.js
// import { useState, useEffect, useCallback } from 'react';
// import { useSession } from 'next-auth/react';

// export function useProgress() {
//   const { data: session } = useSession();
//   const [progress, setProgress] = useState({});
//   const [isLoading, setIsLoading] = useState(true);
//   const [isSaving, setIsSaving] = useState(false);
//   const [error, setError] = useState(null);

//   // Debounce timer for saving progress
//   const [saveTimeout, setSaveTimeout] = useState(null);

//   // Load initial progress
//   useEffect(() => {
//     if (!session?.user?.id) return;

//     const loadProgress = async () => {
//       setIsLoading(true);
//       try {
//         const response = await fetch('/api/save-progress', {
//           headers: {
//             Authorization: `Bearer ${session.accessToken}`,
//           },
//         });

//         if (response.ok) {
//           const data = await response.json();
//           if (data.success) {
//             setProgress(data.progress);
//           }
//         }
//       } catch (error) {
//         console.error('Failed to load progress:', error);
//         setError('Failed to load progress');
//       } finally {
//         setIsLoading(false);
//       }
//     };

//     loadProgress();
//   }, [session]);

//   // Debounced save function
//   const saveProgress = useCallback(async (newProgress) => {
//     if (!session?.user?.id) return;

//     // Clear existing timeout
//     if (saveTimeout) {
//       clearTimeout(saveTimeout);
//     }

//     // Set new timeout for saving
//     const timeoutId = setTimeout(async () => {
//       setIsSaving(true);
//       try {
//         const response = await fetch('/api/save-progress', {
//           method: 'POST',
//           headers: {
//             'Content-Type': 'application/json',
//             Authorization: `Bearer ${session.accessToken}`,
//           },
//           body: JSON.stringify({ progress: newProgress }),
//         });

//         const result = await response.json();
//         if (!result.success) {
//           throw new Error(result.message);
//         }
//       } catch (error) {
//         console.error('Error saving progress:', error);
//         setError('Failed to save progress');
//       } finally {
//         setIsSaving(false);
//       }
//     }, 1000); // Save after 1 second of inactivity

//     setSaveTimeout(timeoutId);

//     return () => {
//       if (timeoutId) clearTimeout(timeoutId);
//     };
//   }, [session, saveTimeout]);

//   // Update progress for a specific question
//   const updateQuestionProgress = useCallback((questionId, updates) => {
//     setProgress(prev => {
//       const newProgress = {
//         ...prev,
//         [questionId]: {
//           ...prev[questionId],
//           ...updates,
//           updatedAt: new Date().toISOString()
//         }
//       };

//       // Save to server
//       saveProgress(newProgress);

//       return newProgress;
//     });
//   }, [saveProgress]);

//   // Toggle completion status
//   const toggleCompletion = useCallback((questionId) => {
//     updateQuestionProgress(questionId, {
//       isCompleted: !progress[questionId]?.isCompleted,
//       completedAt: !progress[questionId]?.isCompleted ? new Date().toISOString() : null
//     });
//   }, [progress, updateQuestionProgress]);

//   // Toggle answer visibility
//   const toggleAnswer = useCallback((questionId) => {
//     updateQuestionProgress(questionId, {
//       showAnswer: !progress[questionId]?.showAnswer
//     });
//   }, [progress, updateQuestionProgress]);

//   // Reset all progress
//   const resetProgress = useCallback(async () => {
//     if (!session?.user?.id) return;

//     try {
//       const response = await fetch('/api/reset-progress', {
//         method: 'POST',
//         headers: {
//           Authorization: `Bearer ${session.accessToken}`,
//         },
//       });

//       if (response.ok) {
//         setProgress({});
//         setError(null);
//       } else {
//         throw new Error('Failed to reset progress');
//       }
//     } catch (error) {
//       console.error('Error resetting progress:', error);
//       setError('Failed to reset progress');
//     }
//   }, [session]);

//   // Get progress statistics
//   const getStats = useCallback((questions = []) => {
//     const totalQuestions = questions.length;
//     const completedQuestions = questions.filter(q => progress[q._id]?.isCompleted).length;
//     const completionPercentage = totalQuestions > 0
//       ? Math.round((completedQuestions / totalQuestions) * 100)
//       : 0;

//     return {
//       totalQuestions,
//       completedQuestions,
//       completionPercentage
//     };
//   }, [progress]);

//   // Get category-wise progress
//   const getCategoryStats = useCallback((questions = []) => {
//     const categories = {};

//     questions.forEach(question => {
//       const category = question.category;
//       if (!categories[category]) {
//         categories[category] = { total: 0, completed: 0 };
//       }

//       categories[category].total++;
//       if (progress[question._id]?.isCompleted) {
//         categories[category].completed++;
//       }
//     });

//     return Object.entries(categories).map(([category, stats]) => ({
//       category,
//       total: stats.total,
//       completed: stats.completed,
//       percentage: Math.round((stats.completed / stats.total) * 100)
//     }));
//   }, [progress]);

//   return {
//     progress,
//     isLoading,
//     isSaving,
//     error,
//     updateQuestionProgress,
//     toggleCompletion,
//     toggleAnswer,
//     resetProgress,
//     getStats,
//     getCategoryStats
//   };
// }


// hooks/useProgress.js
import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";

export function useProgress() {
  const { data: session } = useSession();
  const [progress, setProgress] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);

  // Debounce timer for saving progress
  const [saveTimeout, setSaveTimeout] = useState(null);

  // Load initial progress from database
  useEffect(() => {
    if (!session?.user?.email) {
      setIsLoading(false);
      return;
    }

    const loadProgress = async () => {
      setIsLoading(true);
      try {
        const response = await fetch("/api/save-progress", {
          headers: {
            Authorization: `Bearer ${session.accessToken || ""}`,
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        if (data.success) {
          setProgress(data.progress || {});
        } else {
          console.warn("Progress load returned success: false:", data.message);
          setProgress({});
        }
      } catch (error) {
        console.error("Failed to load progress:", error);
        setError("Failed to load progress");
        setProgress({});
      } finally {
        setIsLoading(false);
      }
    };

    loadProgress();
  }, [session]);

  // Debounced save function
  const saveProgress = useCallback(
    async (newProgress) => {
      if (!session?.user?.email) return;

      // Clear existing timeout
      if (saveTimeout) {
        clearTimeout(saveTimeout);
      }

      // Set new timeout for saving
      const timeoutId = setTimeout(async () => {
        setIsSaving(true);
        try {
          const response = await fetch("/api/save-progress", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session.accessToken || ""}`,
            },
            body: JSON.stringify({ progress: newProgress }),
          });

          const result = await response.json();
          if (!result.success) {
            throw new Error(result.message || "Failed to save progress");
          }
        } catch (error) {
          console.error("Error saving progress:", error);
          setError("Failed to save progress");
        } finally {
          setIsSaving(false);
        }
      }, 1000); // Save after 1 second of inactivity

      setSaveTimeout(timeoutId);

      return () => {
        if (timeoutId) clearTimeout(timeoutId);
      };
    },
    [session, saveTimeout]
  );

  // Update progress for a specific question
  const updateQuestionProgress = useCallback(
    (questionId, updates) => {
      setProgress((prev) => {
        const newProgress = {
          ...prev,
          [questionId]: {
            ...prev[questionId],
            ...updates,
            updatedAt: new Date().toISOString(),
          },
        };

        // Save to server
        saveProgress(newProgress);

        return newProgress;
      });
    },
    [saveProgress]
  );

  // Toggle completion status
  const toggleCompletion = useCallback(
    (questionId) => {
      updateQuestionProgress(questionId, {
        isCompleted: !progress[questionId]?.isCompleted,
        completedAt: !progress[questionId]?.isCompleted
          ? new Date().toISOString()
          : null,
      });
    },
    [progress, updateQuestionProgress]
  );

  // Toggle answer visibility
  const toggleAnswer = useCallback(
    (questionId) => {
      updateQuestionProgress(questionId, {
        showAnswer: !progress[questionId]?.showAnswer,
      });
    },
    [progress, updateQuestionProgress]
  );

  // Reset all progress
  const resetProgress = useCallback(async () => {
    if (!session?.user?.email) return;

    try {
      const response = await fetch("/api/reset-progress", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.accessToken || ""}`,
        },
      });

      if (response.ok) {
        setProgress({});
        setError(null);
      } else {
        throw new Error("Failed to reset progress");
      }
    } catch (error) {
      console.error("Error resetting progress:", error);
      setError("Failed to reset progress");
    }
  }, [session]);

  // Get progress statistics
  const getStats = useCallback(
    (questions = []) => {
      const totalQuestions = questions.length;
      const completedQuestions = questions.filter(
        (q) => progress[q._id]?.isCompleted
      ).length;
      const completionPercentage =
        totalQuestions > 0
          ? Math.round((completedQuestions / totalQuestions) * 100)
          : 0;

      return {
        totalQuestions,
        completedQuestions,
        completionPercentage,
      };
    },
    [progress]
  );

  // Get category-wise progress
  const getCategoryStats = useCallback(
    (questions = []) => {
      const categories = {};

      questions.forEach((question) => {
        const category = question.category;
        if (!categories[category]) {
          categories[category] = { total: 0, completed: 0 };
        }

        categories[category].total++;
        if (progress[question._id]?.isCompleted) {
          categories[category].completed++;
        }
      });

      return Object.entries(categories).map(([category, stats]) => ({
        category,
        total: stats.total,
        completed: stats.completed,
        percentage:
          stats.total > 0
            ? Math.round((stats.completed / stats.total) * 100)
            : 0,
      }));
    },
    [progress]
  );

  return {
    progress,
    isLoading,
    isSaving,
    error,
    updateQuestionProgress,
    toggleCompletion,
    toggleAnswer,
    resetProgress,
    getStats,
    getCategoryStats,
  };
}
