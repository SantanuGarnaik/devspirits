"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, LogIn, Key, ArrowLeft, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { signIn, useSession } from "next-auth/react";

const Login = () => {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState("email");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [particlePositions, setParticlePositions] = useState([]);

  // Email validation
  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const isEmailComplete = isValidEmail(email);
  const isOtpComplete = otp.length >= 4;

  useEffect(() => {
    if (status === "authenticated" && session) {
      console.log("Session detected, redirecting to dashboard");
      router.push("/dashboard");
      router.refresh();
    }
  }, [status, session, router]);

  // Initialize particle positions on mount (client-side)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const positions = Array.from({ length: 20 }, () => ({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
      }));
      setParticlePositions(positions);
    }
  }, []);

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (isLoading || !isEmailComplete) return;
    setIsLoading(true);
    try {
      const response = await fetch("/api/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (response.ok) {
        setStep("otp");
        setError("");
      } else {
        const { message } = await response.json();
        setError(message || "Failed to send OTP");
      }
    } catch (error) {
      setError("An error occurred while sending OTP");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (isLoading || !isOtpComplete) return;
    setIsLoading(true);
    try {
      const response = await fetch("/api/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });
      if (response.ok) {
        setError("");
        router.push("/dashboard");
        router.refresh();
      } else {
        const { message } = await response.json();
        setError(message || "Invalid OTP");
      }
    } catch (error) {
      setError("An error occurred while verifying OTP");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    await signIn("google", { callbackUrl: "/dashboard" });
  };

  const handleBackToEmail = () => {
    setStep("email");
    setOtp("");
    setError("");
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900">
      {/* Animated background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-3/4 right-1/4 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-blue-600/20 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden">
        {particlePositions.map((pos, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white/20 rounded-full"
            initial={{ x: pos.x, y: pos.y, opacity: 0 }}
            animate={{
              y: [null, -100],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: Math.random() * 3 + 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="w-full max-w-md"
        >
          {/* Logo/Brand section */}
          <motion.div 
            className="text-center mb-8"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl mb-4 shadow-lg">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Welcome Back</h1>
            <p className="text-gray-400">
              {step === "email" ? "Enter your email to get started" : "Check your email for the verification code"}
            </p>
          </motion.div>

          {/* Main card */}
          <motion.div
            layout
            className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl overflow-hidden"
          >
            {/* Header with step indicator */}
            <div className="bg-gradient-to-r from-blue-500/20 to-indigo-500/20 p-6 border-b border-white/10">
              <div className="flex items-center justify-between">
                <AnimatePresence mode="wait">
                  {step === "otp" && (
                    <motion.button
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      onClick={handleBackToEmail}
                      className="p-2 hover:bg-white/10 rounded-xl transition-colors"
                    >
                      <ArrowLeft className="w-5 h-5 text-white" />
                    </motion.button>
                  )}
                </AnimatePresence>
                
                <div className="flex-1 flex justify-center">
                  <div className="flex items-center space-x-2">
                    <motion.div
                      className={`w-3 h-3 rounded-full transition-colors duration-300 ${
                        step === "email" ? "bg-blue-400" : "bg-blue-400/50"
                      }`}
                      animate={{ scale: step === "email" ? 1.2 : 1 }}
                    />
                    <div className="w-8 h-0.5 bg-white/20" />
                    <motion.div
                      className={`w-3 h-3 rounded-full transition-colors duration-300 ${
                        step === "otp" ? "bg-blue-400" : "bg-white/20"
                      }`}
                      animate={{ scale: step === "otp" ? 1.2 : 1 }}
                    />
                  </div>
                </div>
                
                <div className="w-9" /> {/* Spacer for alignment */}
              </div>
            </div>

            <div className="p-6">
              {/* Error message */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                    animate={{ opacity: 1, height: "auto", marginBottom: 24 }}
                    exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                    className="bg-red-500/20 border border-red-500/30 text-red-300 p-4 rounded-xl text-sm font-medium"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-red-400 rounded-full" />
                      {error}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence mode="wait">
                {step === "email" ? (
                  <motion.div
                    key="email-step"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-6"
                  >
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300 block">
                          Email Address
                        </label>
                        <div className="relative group">
                          <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-blue-400 transition-colors z-10" size={20} />
                          <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter your email"
                            className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200 backdrop-blur-sm"
                            onKeyDown={(e) => e.key === 'Enter' && isEmailComplete && handleSendOtp(e)}
                          />
                        </div>
                      </div>

                      <motion.button
                        onClick={handleSendOtp}
                        whileHover={isEmailComplete ? { scale: 1.02 } : {}}
                        whileTap={isEmailComplete ? { scale: 0.98 } : {}}
                        disabled={isLoading || !isEmailComplete}
                        className={`w-full flex items-center justify-center gap-3 px-6 py-4 text-white rounded-xl shadow-lg font-medium transition-all duration-200 ${
                          isEmailComplete
                            ? "bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-blue-500/25 hover:shadow-xl cursor-pointer"
                            : "bg-gray-600/50 cursor-not-allowed opacity-50"
                        }`}
                      >
                        {isLoading ? (
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            className="w-5 h-5 border-2 border-t-transparent border-white rounded-full"
                          />
                        ) : (
                          <>
                            <Mail size={20} />
                            Send Verification Code
                          </>
                        )}
                      </motion.button>
                    </div>

                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-white/10"></div>
                      </div>
                      <div className="relative flex justify-center text-sm">
                        <span className="px-4 bg-gray-800/50 text-gray-400 backdrop-blur-sm rounded-full">
                          Or continue with
                        </span>
                      </div>
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleGoogleLogin}
                      className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white/10 hover:bg-white/15 border border-white/20 text-white rounded-xl shadow-lg font-medium transition-all duration-200 backdrop-blur-sm"
                    >
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path
                          fill="currentColor"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="currentColor"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="currentColor"
                          d="M5.84 14.09c-.22-.66-.34-1.36-.34-2.09s.12-1.43.34-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                        />
                        <path
                          fill="currentColor"
                          d="M2.18 16.93l3.66-2.84c.87 2.6 3.3 4.53 6.16 4.53 1.48 0 2.73-.4 3.71-1.06l3.57 2.77C17.46 22.02 14.97 23 12 23c-4.3 0-8.01-2.47-9.82-6.07z"
                        />
                      </svg>
                      Continue with Google
                    </motion.button>
                  </motion.div>
                ) : (
                  <motion.div
                    key="otp-step"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-6"
                  >
                    <div className="text-center mb-6">
                      <div className="inline-flex items-center justify-center w-12 h-12 bg-green-500/20 rounded-full mb-3">
                        <Mail className="w-6 h-6 text-green-400" />
                      </div>
                      <p className="text-gray-300 text-sm">
                        We've sent a verification code to
                      </p>
                      <p className="text-white font-medium">{email}</p>
                    </div>

                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300 block">
                          Verification Code
                        </label>
                        <div className="relative group">
                          <Key className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-blue-400 transition-colors z-10" size={20} />
                          <input
                            type="text"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            placeholder="Enter 6-digit code"
                            className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-200 backdrop-blur-sm text-center text-lg font-mono tracking-widest"
                            maxLength={6}
                            onKeyDown={(e) => e.key === 'Enter' && isOtpComplete && handleVerifyOtp(e)}
                          />
                        </div>
                      </div>

                      <motion.button
                        onClick={handleVerifyOtp}
                        whileHover={isOtpComplete ? { scale: 1.02 } : {}}
                        whileTap={isOtpComplete ? { scale: 0.98 } : {}}
                        disabled={isLoading || !isOtpComplete}
                        className={`w-full flex items-center justify-center gap-3 px-6 py-4 text-white rounded-xl shadow-lg font-medium transition-all duration-200 ${
                          isOtpComplete
                            ? "bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-blue-500/25 hover:shadow-xl cursor-pointer"
                            : "bg-gray-600/50 cursor-not-allowed opacity-50"
                        }`}
                      >
                        {isLoading ? (
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            className="w-5 h-5 border-2 border-t-transparent border-white rounded-full"
                          />
                        ) : (
                          <>
                            <LogIn size={20} />
                            Verify & Continue
                          </>
                        )}
                      </motion.button>
                    </div>

                    <div className="text-center">
                      <p className="text-gray-400 text-sm mb-3">Didn't receive the code?</p>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          setIsLoading(true);
                          setTimeout(() => setIsLoading(false), 1000);
                        }}
                        disabled={isLoading}
                        className="text-blue-400 hover:text-blue-300 font-medium transition-colors disabled:opacity-50"
                      >
                        Resend Code
                      </motion.button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-white/5 border-t border-white/10">
              <p className="text-center text-xs text-gray-400">
                By continuing, you agree to our{" "}
                <span className="text-blue-400 hover:text-blue-300 cursor-pointer transition-colors">
                  Terms of Service
                </span>{" "}
                and{" "}
                <span className="text-blue-400 hover:text-blue-300 cursor-pointer transition-colors">
                  Privacy Policy
                </span>
              </p>
            </div>
          </motion.div>

          {/* Help section */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            className="text-center mt-8"
          >
            <p className="text-gray-400 text-sm">
              Need help?{" "}
              <span className="text-blue-400 hover:text-blue-300 cursor-pointer transition-colors font-medium">
                Contact Support
              </span>
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;