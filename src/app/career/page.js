"use client";
import React, { useState, useEffect, useRef } from "react";
import { TrendingUp, Lightbulb, Award } from "lucide-react";

const CareerReadinessPipeline = () => {
  const [scores, setScores] = useState({
    communication: 5,
    portfolio: 3,
    resume: 7,
    techSkills: 6,
    experience: 4,
  });

  const [showTips, setShowTips] = useState({});
  const [overallScore, setOverallScore] = useState(0);
  const canvasRef = useRef(null);
  const finalCanvasRef = useRef(null);
  const animationRef = useRef(null);
  const finalAnimationRef = useRef(null);
  const particlesRef = useRef([]);
  const finalParticlesRef = useRef([]);

  const categories = {
    communication: {
      name: "Communication",
      icon: "💬",
      color: "#3b82f6",
      tips: [
        "Practice public speaking and presentation skills",
        "Join professional networking events",
        "Improve written communication through blogging",
        "Take communication courses or workshops",
      ],
    },
    portfolio: {
      name: "Portfolio/Proof",
      icon: "🎨",
      color: "#8b5cf6",
      tips: [
        "Create a professional portfolio website",
        "Showcase your best projects with detailed case studies",
        "Add testimonials and recommendations",
        "Keep your work samples up-to-date and relevant",
      ],
    },
    resume: {
      name: "Resume",
      icon: "📄",
      color: "#06b6d4",
      tips: [
        "Tailor your resume for each job application",
        "Use action verbs and quantify achievements",
        "Get professional resume review and feedback",
        "Optimize for ATS (Applicant Tracking Systems)",
      ],
    },
    techSkills: {
      name: "Tech Skills",
      icon: "⚡",
      color: "#10b981",
      tips: [
        "Learn in-demand technologies in your field",
        "Complete online courses and certifications",
        "Practice coding challenges and technical interviews",
        "Build projects using modern frameworks and tools",
      ],
    },
    experience: {
      name: "Experience",
      icon: "🏆",
      color: "#f59e0b",
      tips: [
        "Seek internships or entry-level opportunities",
        "Contribute to open-source projects",
        "Take on freelance or volunteer projects",
        "Build side projects to demonstrate skills",
      ],
    },
  };

  // Calculate overall score
  useEffect(() => {
    const total = Object.values(scores).reduce((sum, score) => sum + score, 0);
    setOverallScore(Math.round(total / 5));
  }, [scores]);

  // Utility to determine screen size
  const getScreenSize = () => {
    const width = window.innerWidth;
    if (width < 640) return "sm";
    if (width < 1024) return "md";
    return "lg";
  };

  // Debounce utility for resize events
  const debounce = (func, wait) => {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = set105out(() => func.apply(null, args), wait);
    };
  };

  // Individual pipes animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
    };

    resizeCanvas();

    const initParticles = () => {
      particlesRef.current = [];
      const categoryKeys = Object.keys(scores);
      const screenSize = getScreenSize();
      const particleMultiplier =
        screenSize === "sm" ? 0.5 : screenSize === "md" ? 0.75 : 1;

      categoryKeys.forEach((category, index) => {
        const score = scores[category];
        if (score > 0) {
          const particleCount = Math.max(
            1,
            Math.floor((score / 2) * particleMultiplier)
          );
          for (let i = 0; i < particleCount; i++) {
            particlesRef.current.push({
              x: 40 + Math.random() * 20,
              y:
                50 +
                index * (screenSize === "sm" ? 50 : 60) +
                Math.random() * 20 -
                10,
              section: index,
              speed: Math.max(0.5, score / 15) * (1 + Math.random() * 0.5),
              size:
                screenSize === "sm" ? 1 + Math.random() : 2 + Math.random() * 2,
              color: Object.values(categories)[index].color,
              delay: Math.random() * 1000,
              opacity: 0.8 + Math.random() * 0.2,
              startTime: Date.now(),
            });
          }
        }
      });
    };

    const animate = () => {
      if (!canvas || !ctx) return;
      const rect = canvas.getBoundingClientRect();
      const canvasWidth = rect.width;
      const canvasHeight = rect.height;
      const screenSize = getScreenSize();

      ctx.clearRect(0, 0, canvasWidth, canvasHeight);

      const categoryKeys = Object.keys(scores);
      const currentTime = Date.now();

      categoryKeys.forEach((category, index) => {
        const score = scores[category];
        const y = 50 + index * (screenSize === "sm" ? 50 : 60);
        const pipeWidth = Math.max(
          screenSize === "sm" ? 6 : 8,
          score * (screenSize === "sm" ? 2 : 2.5)
        );
        const categoryColor = Object.values(categories)[index].color;

        ctx.globalAlpha = 0.3;
        ctx.fillStyle =
          score >= 6 ? categoryColor : score >= 4 ? "#f59e0b" : "#ef4444";
        ctx.fillRect(
          30,
          y - pipeWidth / 2,
          Math.min(250, canvasWidth - 60),
          pipeWidth
        );

        ctx.globalAlpha = 0.8;
        ctx.strokeStyle = categoryColor;
        ctx.lineWidth = 2;
        ctx.strokeRect(
          30,
          y - pipeWidth / 2,
          Math.min(250, canvasWidth - 60),
          pipeWidth
        );

        if (score < 6 && score > 0) {
          ctx.globalAlpha = 0.7;
          ctx.fillStyle = "#ff6b6b";
          const bottleneckWidth = pipeWidth * 0.5;
          const pipeLength = Math.min(250, canvasWidth - 60);
          ctx.fillRect(
            30 + pipeLength * 0.3,
            y - bottleneckWidth / 2,
            10,
            bottleneckWidth
          );
          ctx.fillRect(
            30 + pipeLength * 0.7,
            y - bottleneckWidth / 2,
            10,
            bottleneckWidth
          );
        }

        ctx.globalAlpha = 1;
      });

      particlesRef.current.forEach((particle) => {
        if (currentTime < particle.startTime + particle.delay) return;
        const sectionScore = Object.values(scores)[particle.section];
        const y = 50 + particle.section * (screenSize === "sm" ? 50 : 60);
        const pipeWidth = Math.max(
          screenSize === "sm" ? 6 : 8,
          sectionScore * (screenSize === "sm" ? 2 : 2.5)
        );
        const pipeLength = Math.min(250, canvasWidth - 60);

        particle.x += particle.speed;

        if (
          sectionScore < 6 &&
          ((particle.x > 30 + pipeLength * 0.3 &&
            particle.x < 30 + pipeLength * 0.3 + 10) ||
            (particle.x > 30 + pipeLength * 0.7 &&
              particle.x < 30 + pipeLength * 0.7 + 10))
        ) {
          particle.speed *= 0.95;
          particle.y += (y - particle.y) * 0.1;
        }

        const minY = y - pipeWidth / 2 + particle.size;
        const maxY = y + pipeWidth / 2 - particle.size;
        particle.y = Math.max(minY, Math.min(maxY, particle.y));

        if (particle.x > 30 + pipeLength) {
          particle.x = 30 + Math.random() * 20;
          particle.y =
            50 +
            particle.section * (screenSize === "sm" ? 50 : 60) +
            Math.random() * 20 -
            10;
          particle.speed =
            Math.max(0.5, sectionScore / 15) * (1 + Math.random() * 0.5);
        }

        ctx.globalAlpha = particle.opacity;
        ctx.fillStyle = particle.color;
        ctx.shadowColor = particle.color;
        ctx.shadowBlur = screenSize === "sm" ? 4 : 8;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      ctx.globalAlpha = 1;
      animationRef.current = requestAnimationFrame(animate);
    };

    initParticles();
    animate();

    const handleResize = debounce(() => {
      resizeCanvas();
      initParticles();
    }, 100);

    window.addEventListener("resize", handleResize);

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      window.removeEventListener("resize", handleResize);
    };
  }, [scores]);

  // Final output pipe animation
  useEffect(() => {
    const canvas = finalCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
    };

    resizeCanvas();

    const initFinalParticles = () => {
      finalParticlesRef.current = [];
      const maxScore =
        Math.max(...Object.values(scores).filter((score) => score > 0)) || 1;
      const screenSize = getScreenSize();
      const particleCount = Math.max(
        2,
        Math.floor((maxScore / 1.5) * (screenSize === "sm" ? 0.5 : 1))
      );

      for (let i = 0; i < particleCount; i++) {
        finalParticlesRef.current.push({
          x: 40 + Math.random() * 20,
          y:
            (canvas?.getBoundingClientRect().height || 200) / 2 +
            Math.random() * 20 -
            10,
          speed: Math.max(0.8, maxScore / 10) * (0.8 + Math.random() * 0.4),
          size: screenSize === "sm" ? 1 + Math.random() : 2 + Math.random() * 2,
          color: "#60a5fa",
          opacity: 0.8 + Math.random() * 0.2,
        });
      }
    };

    const animateFinal = () => {
      if (!canvas || !ctx) return;
      const rect = canvas.getBoundingClientRect();
      const canvasWidth = rect.width;
      const canvasHeight = rect.height;
      const screenSize = getScreenSize();

      ctx.clearRect(0, 0, canvasWidth, canvasHeight);

      const categoryKeys = Object.keys(scores);
      const sectionWidth = Math.max(40, Math.min(80, (canvasWidth - 100) / 5));
      const pipeY = canvasHeight / 2;
      const basePipeHeight = Math.min(50, canvasHeight * 0.25);

      const minScore =
        Math.min(...Object.values(scores).filter((score) => score > 0)) || 1;
      const maxInputScore = Math.max(...Object.values(scores)) || 1;

      ctx.fillStyle = "#60a5fa";
      ctx.strokeStyle = "#60a5fa";
      ctx.lineWidth = 2;

      const inputArrowCount = Math.max(1, Math.floor(maxInputScore / 2));
      const inputY = pipeY;
      const startX = Math.max(10, canvasWidth * 0.02);

      for (
        let i = 0;
        i < Math.min(inputArrowCount, screenSize === "sm" ? 3 : 5);
        i++
      ) {
        const y = inputY - 10 + i * 6;
        ctx.beginPath();
        ctx.moveTo(startX, y);
        ctx.lineTo(startX + 20, y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(startX + 20, y);
        ctx.lineTo(startX + 15, y - 2);
        ctx.lineTo(startX + 15, y + 2);
        ctx.closePath();
        ctx.fill();
      }

      ctx.font = `bold ${Math.max(8, canvasWidth / 50)}px Arial`;
      ctx.textAlign = "left";
      ctx.fillText(`Input ${maxInputScore}`, startX, inputY - 20);

      categoryKeys.forEach((category, index) => {
        const score = scores[category];
        const x = startX + 30 + index * sectionWidth;
        const sectionHeight = Math.max(12, (score / 10) * basePipeHeight);
        const categoryInfo = Object.values(categories)[index];

        let sectionColor =
          score >= 7
            ? "#22c55e"
            : score >= 5
            ? "#fbbf24"
            : score > 0
            ? "#ef4444"
            : "#6b7280";

        ctx.globalAlpha = 0.8;
        ctx.fillStyle = sectionColor;
        ctx.fillRect(
          x,
          pipeY - sectionHeight / 2,
          sectionWidth - 4,
          sectionHeight
        );

        ctx.globalAlpha = 1;
        ctx.strokeStyle = sectionColor;
        ctx.lineWidth = 1.5;
        ctx.strokeRect(
          x,
          pipeY - sectionHeight / 2,
          sectionWidth - 4,
          sectionHeight
        );

        ctx.fillStyle = "white";
        ctx.font = `bold ${Math.max(10, canvasWidth / 60)}px Arial`;
        ctx.textAlign = "center";
        ctx.fillText(
          score.toString(),
          x + sectionWidth / 2,
          pipeY - sectionHeight / 2 - 8
        );

        ctx.font = `${Math.max(6, canvasWidth / 100)}px Arial`;
        const words = categoryInfo.name.split(/[\s\/]/);
        const displayWords = screenSize === "sm" ? [words[0]] : words;
        displayWords.forEach((word, wordIndex) => {
          ctx.fillText(
            word.trim(),
            x + sectionWidth / 2,
            pipeY + sectionHeight / 2 + 10 + wordIndex * 8
          );
        });

        if (score > 0 && score === minScore && minScore < maxInputScore) {
          ctx.fillStyle = "#ff4444";
          ctx.font = `bold ${Math.max(12, canvasWidth / 50)}px Arial`;
          ctx.fillText(
            "⚠️",
            x + sectionWidth / 2,
            pipeY - sectionHeight / 2 - 20
          );
          ctx.fillStyle = "#ff6b6b";
          ctx.globalAlpha = 0.8;
          const narrowHeight = sectionHeight * 0.4;
          ctx.fillRect(
            x + sectionWidth - 10,
            pipeY - narrowHeight / 2,
            6,
            narrowHeight
          );
        }

        if (index < categoryKeys.length - 1) {
          const nextScore = Object.values(scores)[index + 1];
          const flowHeight =
            Math.min(sectionHeight, (nextScore / 10) * basePipeHeight) * 0.8;
          ctx.strokeStyle = "#60a5fa";
          ctx.lineWidth = Math.max(1.5, flowHeight / 8);
          ctx.globalAlpha = 0.6;
          const connectionX = x + sectionWidth - 4;
          const nextX = x + sectionWidth;
          ctx.beginPath();
          ctx.moveTo(connectionX, pipeY - flowHeight / 2);
          ctx.lineTo(nextX, pipeY - flowHeight / 2);
          ctx.lineTo(nextX, pipeY + flowHeight / 2);
          ctx.lineTo(connectionX, pipeY + flowHeight / 2);
          ctx.closePath();
          ctx.fill();
        }
      });

      const outputArrowCount = Math.max(1, Math.floor(minScore / 2));
      const outputX = canvasWidth - Math.max(30, canvasWidth * 0.06);
      ctx.fillStyle =
        minScore >= 7 ? "#22c55e" : minScore >= 5 ? "#fbbf24" : "#ef4444";
      ctx.strokeStyle =
        minScore >= 7 ? "#22c55e" : minScore >= 5 ? "#fbbf24" : "#ef4444";
      ctx.lineWidth = 1.5;
      ctx.globalAlpha = 1;

      for (
        let i = 0;
        i < Math.min(outputArrowCount, screenSize === "sm" ? 3 : 5);
        i++
      ) {
        const y = inputY - 10 + i * 6;
        ctx.beginPath();
        ctx.moveTo(outputX, y);
        ctx.lineTo(outputX + 20, y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(outputX + 20, y);
        ctx.lineTo(outputX + 15, y - 2);
        ctx.lineTo(outputX + 15, y + 2);
        ctx.closePath();
        ctx.fill();
      }

      ctx.font = `bold ${Math.max(8, canvasWidth / 50)}px Arial`;
      ctx.textAlign = "right";
      ctx.fillText(`Output ${minScore}`, canvasWidth - 10, inputY - 20);

      finalParticlesRef.current.forEach((particle) => {
        particle.x += particle.speed;

        if (particle.x > canvasWidth - Math.max(40, canvasWidth * 0.08)) {
          particle.x = startX + 20 + Math.random() * 20;
          particle.y = pipeY + Math.random() * 20 - 10;
          particle.speed =
            Math.max(0.8, minScore / 10) * (0.8 + Math.random() * 0.4);
        }

        categoryKeys.forEach((category, index) => {
          const score = scores[category];
          const sectionX = startX + 30 + index * sectionWidth;
          if (
            particle.x > sectionX &&
            particle.x < sectionX + sectionWidth - 4
          ) {
            if (score === minScore && score < maxInputScore) {
              particle.speed *= 0.92;
              particle.y += (pipeY - particle.y) * 0.08;
            } else if (score < 7) {
              particle.speed *= 0.96;
            }
          }
        });

        ctx.globalAlpha = particle.opacity;
        ctx.fillStyle = particle.color;
        ctx.shadowColor = particle.color;
        ctx.shadowBlur = screenSize === "sm" ? 4 : 8;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      ctx.globalAlpha = 1;
      finalAnimationRef.current = requestAnimationFrame(animateFinal);
    };

    initFinalParticles();
    animateFinal();

    const handleResize = debounce(() => {
      resizeCanvas();
      initFinalParticles();
    }, 100);

    window.addEventListener("resize", handleResize);

    return () => {
      if (finalAnimationRef.current)
        cancelAnimationFrame(finalAnimationRef.current);
      window.removeEventListener("resize", handleResize);
    };
  }, [scores, overallScore]);

  const updateScore = (category, value) => {
    setScores((prev) => ({ ...prev, [category]: parseInt(value) || 0 }));
  };

  const toggleTips = (category) => {
    setShowTips((prev) => ({ ...prev, [category]: !prev[category] }));
  };

  const getScoreColor = (score) => {
    if (score >= 8) return "text-green-400";
    if (score >= 6) return "text-yellow-400";
    return "text-red-400";
  };

  const getOpportunityLevel = () => {
    if (overallScore >= 8)
      return {
        level: "Excellent",
        percentage: "90-100%",
        color: "text-green-400",
        bg: "bg-green-500/20",
      };
    if (overallScore >= 6)
      return {
        level: "Good",
        percentage: "70-89%",
        color: "text-yellow-400",
        bg: "bg-yellow-500/20",
      };
    if (overallScore >= 4)
      return {
        level: "Fair",
        percentage: "50-69%",
        color: "text-orange-400",
        bg: "bg-orange-500/20",
      };
    return {
      level: "Needs Improvement",
      percentage: "0-49%",
      color: "text-red-400",
      bg: "bg-red-500/20",
    };
  };

  const opportunityLevel = getOpportunityLevel();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 sm:p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8 md:mb-10">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent mb-2 sm:mb-3">
            Career Readiness Pipeline
          </h1>
          <p className="text-gray-300 text-sm sm:text-base md:text-lg max-w-2xl mx-auto">
            Visualize your skills flowing into career opportunities
          </p>
        </div>

        {/* Overall Score */}
        <div className="bg-black/50 backdrop-blur-lg rounded-2xl border border-purple-500/30 p-4 sm:p-6 mb-6 sm:mb-8 shadow-lg">
          <div className="flex items-center justify-center mb-4 sm:mb-6">
            <div className="relative">
              <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full border-4 border-purple-500/40 flex items-center justify-center bg-gradient-to-r from-purple-600/30 to-blue-600/30">
                <span
                  className={`text-lg sm:text-xl md:text-2xl font-bold ${opportunityLevel.color}`}
                >
                  {overallScore}/10
                </span>
              </div>
            </div>
          </div>
          <div className="text-center">
            <h2
              className={`text-lg sm:text-xl md:text-2xl font-semibold ${opportunityLevel.color}`}
            >
              {opportunityLevel.level}
            </h2>
            <p className="text-gray-300 text-sm sm:text-base mt-1">
              Career Readiness:{" "}
              <span className={`font-medium ${opportunityLevel.color}`}>
                {opportunityLevel.percentage}
              </span>
            </p>
          </div>
        </div>

        {/* Individual Skills Pipeline */}
        <div className="bg-black/50 backdrop-blur-lg rounded-2xl border border-purple-500/30 p-4 sm:p-6 mb-6 sm:mb-8 shadow-lg">
          <h3 className="text-lg sm:text-xl md:text-2xl font-semibold text-white mb-4 sm:mb-6 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 mr-2 text-purple-400" />
            Skill Pipelines
          </h3>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-6">
            <div className="lg:col-span-3 order-2 lg:order-1 relative">
              <canvas
                ref={canvasRef}
                className="w-full h-64 sm:h-80 md:h-[400px] rounded-xl bg-gradient-to-r from-slate-800/50 to-slate-900/50 border border-purple-400/20"
                aria-label="Individual skills pipeline visualization"
              />
              <div className="absolute left-2 top-2 sm:top-3 md:top-4 space-y-10 sm:space-y-12 md:space-y-14 pointer-events-none">
                {Object.entries(categories).map(([key, category]) => (
                  <div key={key} className="flex items-center space-x-2">
                    <span className="text-sm sm:text-base md:text-lg">
                      {category.icon}
                    </span>
                    <div className="text-white font-medium bg-black/70 px-2 py-1 rounded-lg text-xs sm:text-sm">
                      <span className="hidden sm:inline">{category.name}</span>
                      <span className="sm:hidden">
                        {category.name.split(" ")[0]}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-2 order-1 lg:order-2 space-y-3">
              {Object.entries(categories).map(([key, category]) => (
                <div
                  key={key}
                  className="bg-black/60 backdrop-blur rounded-xl p-3 sm:p-4 border border-purple-400/30 transition-all duration-200 hover:shadow-md"
                >
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-base sm:text-lg">
                      {category.icon}
                    </span>
                    <div className="flex-1">
                      <h4 className="text-white font-semibold text-sm sm:text-base">
                        {category.name}
                      </h4>
                      <div className="flex items-center space-x-2 mt-1">
                        <input
                          type="range"
                          min="0"
                          max="10"
                          value={scores[key]}
                          onChange={(e) => updateScore(key, e.target.value)}
                          className="flex-1 accent-purple-500 h-5 cursor-pointer"
                          aria-label={`Score for ${category.name}`}
                          aria-valuenow={scores[key]}
                          aria-valuemin={0}
                          aria-valuemax={10}
                        />
                        <span
                          className={`font-bold ${getScoreColor(
                            scores[key]
                          )} text-sm sm:text-base min-w-[40px]`}
                        >
                          {scores[key]}/10
                        </span>
                      </div>
                    </div>
                  </div>

                  {scores[key] < 6 && scores[key] > 0 && (
                    <button
                      onClick={() => toggleTips(key)}
                      className="bg-yellow-500/80 hover:bg-yellow-500 text-black px-3 py-1 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 flex items-center space-x-1"
                      aria-expanded={showTips[key]}
                      aria-controls={`tips-${key}`}
                    >
                      <Lightbulb className="w-4 h-4" />
                      <span>Tips</span>
                    </button>
                  )}

                  {showTips[key] && scores[key] < 6 && (
                    <div
                      id={`tips-${key}`}
                      className="mt-2 bg-yellow-900/30 border border-yellow-500/20 rounded-lg p-2 sm:p-3 transition-all duration-200"
                    >
                      <ul className="space-y-1">
                        {category.tips.slice(0, 2).map((tip, tipIndex) => (
                          <li
                            key={tipIndex}
                            className="text-yellow-200 text-xs sm:text-sm flex items-start"
                          >
                            <span className="text-yellow-400 mr-1 flex-shrink-0">
                              •
                            </span>
                            <span>{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Final Output Pipeline */}
        <div className="bg-black/50 backdrop-blur-lg rounded-2xl border border-cyan-500/30 p-4 sm:p-6 mb-6 sm:mb-8 shadow-lg">
          <h3 className="text-lg sm:text-xl md:text-2xl font-semibold text-center mb-4 sm:mb-6 flex items-center justify-center">
            <Award className="w-5 h-5 sm:w-6 sm:h-6 mr-2 text-cyan-400" />
            <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              Career Opportunities Flow
            </span>
          </h3>

          <div className="relative">
            <canvas
              ref={finalCanvasRef}
              className="w-full h-40 sm:h-48 md:h-56 rounded-xl bg-gradient-to-r from-cyan-900/30 to-blue-900/30 border border-cyan-400/20"
              aria-label="Career opportunities pipeline visualization"
            />
          </div>

          <div className="mt-3 sm:mt-4 text-center">
            <div className="bg-gradient-to-r from-cyan-600/20 to-blue-600/20 rounded-xl p-3 sm:p-4 border border-cyan-400/20">
              <p className="text-gray-300 text-sm sm:text-base font-medium mb-2">
                Bottleneck Analysis:
              </p>
              <p className="text-gray-400 text-xs sm:text-sm">
                {(() => {
                  const minScore = Math.min(
                    ...Object.values(scores).filter((score) => score > 0)
                  );
                  const maxScore = Math.max(
                    ...Object.values(scores).filter((score) => score > 0)
                  );
                  if (minScore === 0 || !isFinite(minScore))
                    return "💤 No flow! All sections need activation.";
                  if (minScore < maxScore) {
                    const bottleneckCategory = Object.keys(scores).find(
                      (key) => scores[key] === minScore
                    );
                    const categoryName =
                      categories[bottleneckCategory]?.name || "Unknown";
                    return `🔴 ${categoryName} (${minScore}/10) is limiting your output to ${minScore} opportunities! Input: ${maxScore} → Output: ${minScore}`;
                  }
                  return `🚀 All sections balanced at ${minScore}/10. No bottlenecks detected.`;
                })()}
              </p>
            </div>
          </div>
        </div>

        {/* System Legend */}
        <div className="bg-black/50 backdrop-blur-lg rounded-2xl border border-purple-500/30 p-4 sm:p-5 shadow-lg">
          <h4 className="text-white font-semibold text-center text-sm sm:text-base md:text-lg mb-3">
            Pipeline Guide
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
            <div>
              <h5 className="text-purple-400 font-semibold mb-2">
                Individual Pipes:
              </h5>
              <div className="space-y-1 text-gray-300">
                <div>• Colored dots represent skill flow</div>
                <div>• Pipe width indicates skill strength</div>
                <div>• Red sections highlight bottlenecks</div>
              </div>
            </div>
            <div>
              <h5 className="text-cyan-400 font-semibold mb-2">
                Final Output:
              </h5>
              <div className="space-y-1 text-gray-300">
                <div>• Blue particles show opportunities</div>
                <div>• Flow speed reflects readiness level</div>
                <div>• Arrows indicate input/output rate</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CareerReadinessPipeline;
