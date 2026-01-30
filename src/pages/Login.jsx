import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";


// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

export default function AuthApp() {
  const [currentPage, setCurrentPage] = useState("login");

  return currentPage === "login" ? (
    <Login 
      onNavigateToSignup={() => setCurrentPage("signup")}
      onNavigateToForgotPassword={() => setCurrentPage("forgot")}
    />
  ) : currentPage === "signup" ? (
    <Signup onNavigateToLogin={() => setCurrentPage("login")} />
  ) : (
    <ForgotPassword onNavigateToLogin={() => setCurrentPage("login")} />
  );
}

// ==================== LOGIN.JSX ====================
function Login({ onNavigateToSignup, onNavigateToForgotPassword }) {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  const handleSignIn = async (event) => {
    event?.preventDefault();
    setError(null);
    setFieldErrors({});

    // Validation
    const errors = {};
    if (!email.trim()) {
      errors.email = "Email is required";
    }
    if (!password.trim()) {
      errors.password = "Password is required";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password: password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.detail) {
          setError(typeof data.detail === "string" ? data.detail : "Login failed");
        } else {
          setError("Unable to sign in. Please try again.");
        }
        return;
      }

      // Store tokens
      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("refresh_token", data.refresh_token);
      localStorage.setItem("user", JSON.stringify(data.user));

      // Navigate to dashboard
      navigate("/dashboard", { replace: true });

    } catch (err) {
      console.error("Login error:", err);
      if (err.message === "Failed to fetch") {
        setError("Unable to connect to server. Please check your internet connection.");
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle Enter key
  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSignIn(e);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* LEFT PANEL */}
      <div className="relative hidden lg:flex w-1/2 flex-col bg-gradient-to-br from-[#0B1D36] to-[#020617] px-12 py-10 text-white">
        <div>
          <div className="flex items-center gap-3 mb-20">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-lg">Tender Intelligence</p>
              <p className="text-sm text-slate-400">Automated Monitoring System</p>
            </div>
          </div>

          <h1 className="text-[42px] font-bold leading-tight mb-6">
            Never miss a <br />
            <span className="text-blue-400">tender opportunity</span> <br />
            again.
          </h1>

          <p className="text-lg text-slate-400 max-w-md mb-14">
            Automated monitoring of 62+ US government websites.
            <br />
            Real-time alerts for keyword-matched opportunities.
          </p>

          <div className="grid grid-cols-2 gap-5">
            <StatCard title="62+" subtitle="Sources Monitored" />
            <StatCard title="24/7" subtitle="Auto Scanning" />
            <StatCard title="Real-time" subtitle="Notifications" />
            <StatCard title="Smart" subtitle="Keyword Matching" />
          </div>
        </div>

        <p className="absolute bottom-8 text-sm text-slate-400">
          © 2026 Tender Intelligence System. All rights reserved.
        </p>
      </div>

      {/* RIGHT PANEL */}
      <div className="flex w-full lg:w-1/2 items-center justify-center px-6">
        <div className="w-full max-w-md">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-semibold text-slate-900 mb-2">Welcome back</h2>
            <p className="text-slate-500">Sign in to your account to continue</p>
          </div>

          {loading && (
            <div className="mb-4 text-sm text-gray-500 flex items-center gap-2">
              <span className="animate-spin h-4 w-4 border-2 border-gray-300 border-t-blue-500 rounded-full"></span>
              Signing in...
            </div>
          )}

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* EMAIL */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-2">Email address</label>
            <input
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (fieldErrors.email) setFieldErrors({ ...fieldErrors, email: null });
              }}
              onKeyPress={handleKeyPress}
              className={`w-full rounded-lg border ${
                fieldErrors.email ? "border-red-300" : "border-slate-200"
              } px-4 py-3 text-slate-600 placeholder-slate-400 focus:outline-none focus:ring-2 ${
                fieldErrors.email ? "focus:ring-red-500" : "focus:ring-blue-500"
              }`}
            />
            {fieldErrors.email && <p className="text-xs text-red-600 mt-1">{fieldErrors.email}</p>}
          </div>

          {/* PASSWORD */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-slate-700">Password</label>
              <button 
                onClick={onNavigateToForgotPassword}
                className="text-sm text-blue-600 hover:underline"
              >
                Forgot password?
              </button>
            </div>

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (fieldErrors.password) setFieldErrors({ ...fieldErrors, password: null });
                }}
                onKeyPress={handleKeyPress}
                className={`w-full rounded-lg border ${
                  fieldErrors.password ? "border-red-300" : "border-slate-200"
                } px-4 py-3 text-slate-600 placeholder-slate-400 focus:outline-none focus:ring-2 ${
                  fieldErrors.password ? "focus:ring-red-500" : "focus:ring-blue-500"
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {fieldErrors.password && <p className="text-xs text-red-600 mt-1">{fieldErrors.password}</p>}
          </div>

          {/* BUTTON */}
          <button
            type="button"
            onClick={handleSignIn}
            disabled={loading}
            className={`w-full rounded-lg bg-blue-500 py-3 font-medium text-white transition mb-6 ${
              loading ? "opacity-50 cursor-not-allowed" : "hover:bg-blue-600"
            }`}
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>

          <p className="text-center text-sm text-slate-500">
            Don't have an account?{" "}
            <button onClick={onNavigateToSignup} className="text-blue-600 hover:underline font-medium">
              Sign up
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

// ==================== FORGOT PASSWORD ====================
function ForgotPassword({ onNavigateToLogin }) {
  const [step, setStep] = useState(1); // 1: email, 2: otp, 3: new password
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const sendResetOtp = async () => {
    setError(null);
    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.detail || "Unable to send reset code.");
        return;
      }

      setStep(2);
    } catch (err) {
      console.error("Error:", err);
      setError("Unable to connect to server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    setError(null);

    if (!otp || otp.length !== 6) {
      setError("Please enter a valid 6-digit OTP.");
      return;
    }

    if (!newPassword || !confirmPassword) {
      setError("Please fill in both password fields.");
      return;
    }

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (!/[A-Z]/.test(newPassword)) {
      setError("Password must contain at least one uppercase letter.");
      return;
    }

    if (!/[a-z]/.test(newPassword)) {
      setError("Password must contain at least one lowercase letter.");
      return;
    }

    if (!/[0-9]/.test(newPassword)) {
      setError("Password must contain at least one number.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          otp: otp,
          new_password: newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.detail || "Failed to reset password.");
        return;
      }

      alert("Password reset successfully! Please login with your new password.");
      onNavigateToLogin();
    } catch (err) {
      console.error("Error:", err);
      setError("Unable to connect to server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* LEFT PANEL */}
      <div className="relative hidden lg:flex w-1/2 flex-col bg-gradient-to-br from-[#0B1D36] to-[#020617] px-12 py-10 text-white">
        <div>
          <div className="flex items-center gap-3 mb-20">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-lg">Tender Intelligence</p>
              <p className="text-sm text-slate-400">Automated Monitoring System</p>
            </div>
          </div>

          <h1 className="text-[42px] font-bold leading-tight mb-6">
            Reset your <br />
            <span className="text-blue-400">password</span> <br />
            securely.
          </h1>

          <p className="text-lg text-slate-400 max-w-md mb-14">
            We'll help you regain access to your account quickly and securely through our verification process.
          </p>

          <div className="space-y-4">
            <div className={`flex items-center gap-3 ${step >= 1 ? 'text-white' : 'text-slate-500'}`}>
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-semibold ${step >= 1 ? 'bg-blue-500' : 'bg-white/10'}`}>
                {step > 1 ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : '1'}
              </div>
              <p>Enter your email address</p>
            </div>
            <div className={`flex items-center gap-3 ${step >= 2 ? 'text-white' : 'text-slate-500'}`}>
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-semibold ${step >= 2 ? 'bg-blue-500' : 'bg-white/10'}`}>
                2
              </div>
              <p>Enter OTP and new password</p>
            </div>
          </div>
        </div>

        <p className="absolute bottom-8 text-sm text-slate-400">
          © 2026 Tender Intelligence System. All rights reserved.
        </p>
      </div>

      {/* RIGHT PANEL */}
      <div className="flex w-full lg:w-1/2 items-center justify-center px-6">
        <div className="w-full max-w-md">
          {loading && (
            <div className="mb-4 text-sm text-gray-500 flex items-center gap-2">
              <span className="animate-spin h-4 w-4 border-2 border-gray-300 border-t-blue-500 rounded-full"></span>
              Processing request...
            </div>
          )}
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* STEP 1: EMAIL */}
          {step === 1 && (
            <>
              <div className="text-center mb-10">
                <h2 className="text-3xl font-semibold text-slate-900 mb-2">Forgot password?</h2>
                <p className="text-slate-500">No worries, we'll send you reset instructions</p>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-2">Email address</label>
                <input
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && sendResetOtp()}
                  className="w-full rounded-lg border border-slate-200 px-4 py-3 text-slate-600 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button 
                onClick={sendResetOtp}
                disabled={loading}
                className={`w-full rounded-lg bg-blue-500 py-3 font-medium text-white transition mb-6 ${
                  loading ? "opacity-50 cursor-not-allowed" : "hover:bg-blue-600"
                }`}
              >
                {loading ? "Sending..." : "Send reset code"}
              </button>

              <button
                onClick={onNavigateToLogin}
                className="w-full flex items-center justify-center gap-2 text-slate-600 hover:text-slate-900"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to login
              </button>
            </>
          )}

          {/* STEP 2: OTP & NEW PASSWORD */}
          {step === 2 && (
            <>
              <div className="text-center mb-10">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h2 className="text-3xl font-semibold text-slate-900 mb-2">Check your email</h2>
                <p className="text-slate-500">
                  We sent a 6-digit code to<br />
                  <span className="font-medium text-slate-700">{email}</span>
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">OTP Code</label>
                <input
                  type="text"
                  placeholder="Enter 6-digit code"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-full rounded-lg border border-slate-200 px-4 py-3 text-slate-600 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-center text-xl tracking-widest font-semibold"
                  maxLength={6}
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">New password</label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-4 py-3 text-slate-600 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                  >
                    {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <p className="text-xs text-slate-500 mt-1">Must be at least 8 characters with uppercase, lowercase, and number</p>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-2">Confirm password</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-4 py-3 text-slate-600 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button 
                onClick={handleResetPassword}
                disabled={loading}
                className={`w-full rounded-lg bg-blue-500 py-3 font-medium text-white transition mb-4 ${
                  loading ? "opacity-50 cursor-not-allowed" : "hover:bg-blue-600"
                }`}
              >
                {loading ? "Resetting..." : "Reset password"}
              </button>

              <div className="text-center mb-4">
                <p className="text-sm text-slate-500 mb-2">Didn't receive the email?</p>
                <button
                  onClick={sendResetOtp}
                  disabled={loading}
                  className="text-sm text-blue-600 hover:underline font-medium"
                >
                  Click to resend
                </button>
              </div>

              <button
                onClick={() => setStep(1)}
                className="w-full flex items-center justify-center gap-2 text-slate-600 hover:text-slate-900"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ==================== SIGNUP.JSX ====================
function Signup({ onNavigateToLogin }) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showSignupSuccess, setShowSignupSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  // Validate password strength
  const validatePassword = (pwd) => {
    const errors = [];
    if (pwd.length < 8) {
      errors.push("at least 8 characters");
    }
    if (!/[A-Z]/.test(pwd)) {
      errors.push("one uppercase letter");
    }
    if (!/[a-z]/.test(pwd)) {
      errors.push("one lowercase letter");
    }
    if (!/[0-9]/.test(pwd)) {
      errors.push("one number");
    }
    return errors;
  };

  const handleCreateAccount = async () => {
    setError(null);
    setFieldErrors({});

    // Client-side validation
    const errors = {};

    if (!fullName || !fullName.trim()) {
      errors.fullName = "Full name is required";
    }

    if (!email || !email.trim()) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = "Please enter a valid email address";
    }

    if (!password) {
      errors.password = "Password is required";
    } else {
      const passwordErrors = validatePassword(password);
      if (passwordErrors.length > 0) {
        errors.password = `Password must contain ${passwordErrors.join(", ")}`;
      }
    }

    if (!confirmPassword) {
      errors.confirmPassword = "Please confirm your password";
    } else if (password !== confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    // If there are validation errors, show them and return
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          full_name: fullName.trim(),
          email: email.trim().toLowerCase(),
          password: password,
          confirm_password: confirmPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle different error responses
        if (data.detail) {
          if (typeof data.detail === "string") {
            setError(data.detail);
          } else if (Array.isArray(data.detail)) {
            // FastAPI validation errors
            const backendErrors = {};
            data.detail.forEach((err) => {
              const field = err.loc[err.loc.length - 1];
              backendErrors[field] = err.msg;
            });
            setFieldErrors(backendErrors);
          }
        } else {
          setError("Failed to create account. Please try again.");
        }
        return;
      }

      // Success
      setShowSignupSuccess(true);
      
      // Clear form
      setFullName("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");

    } catch (err) {
      console.error("Signup error:", err);
      if (err.message === "Failed to fetch") {
        setError("Unable to connect to server. Please check your internet connection.");
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle Enter key press
  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleCreateAccount();
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* LEFT PANEL */}
      <div className="relative hidden lg:flex w-1/2 flex-col bg-gradient-to-br from-[#0B1D36] to-[#020617] px-12 py-10 text-white">
        <div>
          <div className="flex items-center gap-3 mb-20">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-lg">Tender Intelligence</p>
              <p className="text-sm text-slate-400">Automated Monitoring System</p>
            </div>
          </div>

          <h1 className="text-[42px] font-bold leading-tight mb-6">
            Start tracking <br />
            <span className="text-blue-400">opportunities</span> <br />
            today.
          </h1>

          <p className="text-lg text-slate-400 max-w-md mb-14">
            Join thousands of professionals who never miss a tender opportunity with our automated monitoring system.
          </p>

          <div className="space-y-4">
            <FeatureItem text="Monitor 62+ websites" />
            <FeatureItem text="Real-time keyword alerts" />
            <FeatureItem text="Power BI analytics integration" />
            <FeatureItem text="Custom notification settings" />
          </div>
        </div>

        <p className="absolute bottom-8 text-sm text-slate-400">
          © 2026 Tender Intelligence System. All rights reserved.
        </p>
      </div>

      {/* RIGHT PANEL */}
      <div className="flex w-full lg:w-1/2 items-center justify-center px-6 py-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-semibold text-slate-900 mb-1">Create an account</h2>
            <p className="text-sm text-slate-500">Get started with your free account</p>
          </div>

          {loading && (
            <div className="mb-4 text-sm text-gray-500 flex items-center gap-2">
              <span className="animate-spin h-4 w-4 border-2 border-gray-300 border-t-blue-500 rounded-full"></span>
              Creating your account...
            </div>
          )}
          
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* FULL NAME */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-2">Full name</label>
            <input
              type="text"
              placeholder="John Doe"
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value);
                if (fieldErrors.fullName || fieldErrors.full_name) {
                  setFieldErrors({ ...fieldErrors, fullName: null, full_name: null });
                }
              }}
              onKeyPress={handleKeyPress}
              className={`w-full rounded-lg border ${
                fieldErrors.fullName || fieldErrors.full_name ? "border-red-300" : "border-slate-200"
              } px-4 py-3 text-slate-600 placeholder-slate-400 focus:outline-none focus:ring-2 ${
                fieldErrors.fullName || fieldErrors.full_name ? "focus:ring-red-500" : "focus:ring-blue-500"
              }`}
            />
            {(fieldErrors.fullName || fieldErrors.full_name) && (
              <p className="text-xs text-red-600 mt-1">{fieldErrors.fullName || fieldErrors.full_name}</p>
            )}
          </div>

          {/* EMAIL */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-2">Email address</label>
            <input
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (fieldErrors.email) {
                  setFieldErrors({ ...fieldErrors, email: null });
                }
              }}
              onKeyPress={handleKeyPress}
              className={`w-full rounded-lg border ${
                fieldErrors.email ? "border-red-300" : "border-slate-200"
              } px-4 py-3 text-slate-600 placeholder-slate-400 focus:outline-none focus:ring-2 ${
                fieldErrors.email ? "focus:ring-red-500" : "focus:ring-blue-500"
              }`}
            />
            {fieldErrors.email && (
              <p className="text-xs text-red-600 mt-1">{fieldErrors.email}</p>
            )}
          </div>

          {/* PASSWORD */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-2">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (fieldErrors.password) {
                    setFieldErrors({ ...fieldErrors, password: null });
                  }
                }}
                onKeyPress={handleKeyPress}
                className={`w-full rounded-lg border ${
                  fieldErrors.password ? "border-red-300" : "border-slate-200"
                } px-4 py-3 text-slate-600 placeholder-slate-400 focus:outline-none focus:ring-2 ${
                  fieldErrors.password ? "focus:ring-red-500" : "focus:ring-blue-500"
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {fieldErrors.password ? (
              <p className="text-xs text-red-600 mt-1">{fieldErrors.password}</p>
            ) : (
              <p className="text-xs text-slate-500 mt-1">
                Must be at least 8 characters with uppercase, lowercase, and number
              </p>
            )}
          </div>

          {/* CONFIRM PASSWORD */}
          <div className="mb-5">
            <label className="block text-sm font-medium text-slate-700 mb-2">Confirm password</label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (fieldErrors.confirmPassword || fieldErrors.confirm_password) {
                    setFieldErrors({ ...fieldErrors, confirmPassword: null, confirm_password: null });
                  }
                }}
                onKeyPress={handleKeyPress}
                className={`w-full rounded-lg border ${
                  fieldErrors.confirmPassword || fieldErrors.confirm_password ? "border-red-300" : "border-slate-200"
                } px-4 py-3 text-slate-600 placeholder-slate-400 focus:outline-none focus:ring-2 ${
                  fieldErrors.confirmPassword || fieldErrors.confirm_password ? "focus:ring-red-500" : "focus:ring-blue-500"
                }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {(fieldErrors.confirmPassword || fieldErrors.confirm_password) && (
              <p className="text-xs text-red-600 mt-1">
                {fieldErrors.confirmPassword || fieldErrors.confirm_password}
              </p>
            )}
          </div>

          {/* BUTTON */}
          <button 
            onClick={handleCreateAccount}
            disabled={loading}
            className={`w-full rounded-lg bg-blue-500 py-3 font-medium text-white transition mb-5 ${
              loading ? "opacity-50 cursor-not-allowed" : "hover:bg-blue-600"
            }`}
          >
            {loading ? "Creating account..." : "Create account"}
          </button>

          <p className="text-center text-sm text-slate-500">
            Already have an account?{" "}
            <button
              onClick={onNavigateToLogin}
              className="text-blue-600 hover:underline font-medium"
            >
              Sign in
            </button>
          </p>
        </div>
      </div>

      {/* SIGNUP SUCCESS MODAL */}
      {showSignupSuccess && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-2xl font-semibold text-slate-900 mb-2">
              Account created successfully!
            </h3>
            <p className="text-slate-600 text-sm mb-6">
              We sent a verification link to <strong>{email}</strong>. Please verify your email to access your account.
            </p>
            <button
              onClick={() => {
                setShowSignupSuccess(false);
                onNavigateToLogin();
              }}
              className="w-full rounded-lg bg-blue-500 py-3 font-medium text-white hover:bg-blue-600 transition"
            >
              Go to Login
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ==================== SHARED COMPONENTS ====================
function StatCard({ title, subtitle }) {
  return (
    <div className="rounded-xl bg-white/5 px-6 py-5 border border-white/5">
      <p className="text-xl font-semibold">{title}</p>
      <p className="text-sm text-slate-400">{subtitle}</p>
    </div>
  );
}

function FeatureItem({ text }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center">
        <svg className="w-3 h-3 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <p className="text-slate-300">{text}</p>
    </div>
  );
}