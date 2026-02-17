import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";

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

// ─────────────────────────────────────────────
// ANIMATED 6-BOX OTP INPUT
// ─────────────────────────────────────────────
function OTPInput({ value, onChange, error, disabled = false }) {
  const refs = useRef([]);
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [focused, setFocused] = useState(null);

  // Sync external value → local digits
  useEffect(() => {
    const arr = value.split("").slice(0, 6);
    while (arr.length < 6) arr.push("");
    setDigits(arr);
  }, [value]);

  // Auto-focus first box on mount
  useEffect(() => {
    const t = setTimeout(() => refs.current[0]?.focus(), 150);
    return () => clearTimeout(t);
  }, []);

  const push = (arr) => {
    setDigits(arr);
    onChange(arr.join(""));
  };

  const handleChange = (i, e) => {
    const char = e.target.value.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[i] = char;
    push(next);
    if (char && i < 5) refs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i, e) => {
    if (e.key === "Backspace") {
      const next = [...digits];
      if (next[i]) {
        next[i] = "";
        push(next);
      } else if (i > 0) {
        next[i - 1] = "";
        push(next);
        refs.current[i - 1]?.focus();
      }
      e.preventDefault();
    } else if (e.key === "ArrowLeft" && i > 0) refs.current[i - 1]?.focus();
    else if (e.key === "ArrowRight" && i < 5) refs.current[i + 1]?.focus();
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const raw = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    const next = raw.split("");
    while (next.length < 6) next.push("");
    push(next);
    refs.current[Math.min(raw.length, 5)]?.focus();
  };

  return (
    <div className="flex gap-3 justify-center">
      {digits.map((d, i) => (
        <div key={i} className="relative">
          <input
            ref={(el) => (refs.current[i] = el)}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={d}
            disabled={disabled}
            onChange={(e) => handleChange(i, e)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onPaste={handlePaste}
            onFocus={() => setFocused(i)}
            onBlur={() => setFocused(null)}
            style={{ width: "2.75rem", height: "3.25rem", fontSize: "1.5rem" }}
            className={[
              "text-center font-bold rounded-xl border-2 outline-none transition-all duration-200 select-none",
              disabled ? "bg-gray-50 cursor-not-allowed text-gray-400" : "bg-white",
              error
                ? "border-red-400 text-red-600 bg-red-50"
                : d
                  ? "border-blue-500 text-blue-700 bg-blue-50 shadow-sm shadow-blue-100"
                  : focused === i
                    ? "border-blue-400 shadow-lg shadow-blue-100 scale-105"
                    : "border-slate-200 text-slate-700 hover:border-slate-300",
            ].join(" ")}
          />
          {/* filled dot */}
          {d && !error && (
            <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-blue-500" />
          )}
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────
// RESEND TIMER with circular SVG countdown
// ─────────────────────────────────────────────
function ResendTimer({ onResend, loading, initialSeconds = 60 }) {
  const [secs, setSecs] = useState(initialSeconds);
  const [canResend, setCanResend] = useState(false);

  // Reset whenever component mounts
  useEffect(() => {
    setSecs(initialSeconds);
    setCanResend(false);
  }, []);

  useEffect(() => {
    if (secs <= 0) { setCanResend(true); return; }
    const t = setTimeout(() => setSecs((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [secs]);

  const handleResend = () => {
    if (!canResend || loading) return;
    onResend();
    setSecs(initialSeconds);
    setCanResend(false);
  };

  const circ = 2 * Math.PI * 10; // r=10
  const offset = circ - circ * (secs / initialSeconds);

  return (
    <div className="flex items-center justify-center gap-2 mt-5">
      <span className="text-sm text-slate-500">Didn't receive it?</span>
      {canResend ? (
        <button
          onClick={handleResend}
          disabled={loading}
          className="text-sm font-semibold text-blue-600 hover:text-blue-700 underline underline-offset-2 transition-colors"
        >
          Resend code
        </button>
      ) : (
        <div className="flex items-center gap-1.5">
          {/* Circular countdown */}
          <svg width="26" height="26" viewBox="0 0 26 26" className="-rotate-90">
            <circle cx="13" cy="13" r="10" fill="none" stroke="#e2e8f0" strokeWidth="2.5" />
            <circle
              cx="13" cy="13" r="10"
              fill="none" stroke="#3b82f6" strokeWidth="2.5"
              strokeLinecap="round"
              strokeDasharray={circ}
              strokeDashoffset={offset}
              style={{ transition: "stroke-dashoffset 1s linear" }}
            />
          </svg>
          <span className="text-sm font-medium text-slate-500 tabular-nums">
            0:{String(secs).padStart(2, "0")}
          </span>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// OTP MODAL — used by Signup
// ─────────────────────────────────────────────
function OTPModal({ email, onVerify, onResend, onClose, loading }) {
  const [otp, setOtp] = useState("");
  const [error, setError] = useState(null);

  const handleVerify = async () => {
    setError(null);
    if (otp.length !== 6) { setError("Please enter the full 6-digit code."); return; }
    const err = await onVerify(otp);
    if (err) setError(err);
  };

  const handleResend = async () => {
    setError(null);
    setOtp("");
    await onResend();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-2xl">
        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
        </div>

        <h3 className="text-xl font-semibold text-slate-900 text-center mb-1">
          Verify your email
        </h3>
        <p className="text-slate-500 text-sm text-center mb-6">
          We sent a 6-digit code to<br />
          <span className="font-semibold text-slate-800">{email}</span>
        </p>

        {loading && (
          <div className="mb-4 flex items-center justify-center gap-2 text-sm text-gray-500">
            <span className="animate-spin h-4 w-4 border-2 border-gray-300 border-t-blue-500 rounded-full" />
            Verifying...
          </div>
        )}

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-2.5 rounded-lg text-sm text-center">
            {error}
          </div>
        )}

        {/* Animated OTP boxes */}
        <div className="mb-2">
          <OTPInput value={otp} onChange={setOtp} error={!!error} disabled={loading} />
        </div>

        {/* Resend timer */}
        <ResendTimer onResend={handleResend} loading={loading} />

        {/* Verify button */}
        <button
          onClick={handleVerify}
          disabled={loading || otp.length !== 6}
          className={`w-full mt-5 rounded-xl py-3 font-medium text-white transition ${
            loading || otp.length !== 6
              ? "bg-gray-300 cursor-not-allowed"
              : "bg-blue-500 hover:bg-blue-600 active:scale-[0.98]"
          }`}
        >
          {loading ? "Verifying..." : "Verify & Continue"}
        </button>

        <button
          onClick={onClose}
          className="w-full mt-3 text-sm text-slate-400 hover:text-slate-600 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// LOGIN
// ─────────────────────────────────────────────
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
    const errors = {};
    if (!email.trim()) errors.email = "Email is required";
    if (!password.trim()) errors.password = "Password is required";
    if (Object.keys(errors).length > 0) { setFieldErrors(errors); return; }
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(typeof data.detail === "string" ? data.detail : "Login failed");
        return;
      }
      localStorage.setItem("access_token", data.access_token);
      localStorage.setItem("refresh_token", data.refresh_token);
      localStorage.setItem("user", JSON.stringify(data.user));
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err.message === "Failed to fetch"
        ? "Unable to connect to server. Please check your internet connection."
        : "An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* LEFT */}
      <div className="relative hidden lg:flex w-1/2 flex-col bg-gradient-to-br from-[#0B1D36] to-[#020617] px-12 py-10 text-white">
        <BrandLogo />
        <div className="mt-20">
          <h1 className="text-[42px] font-bold leading-tight mb-6">
            Never miss a <br />
            <span className="text-blue-400">tender opportunity</span> <br />
            again.
          </h1>
          <p className="text-lg text-slate-400 max-w-md mb-14">
            Automated monitoring of 62+ US government websites.
            <br />Real-time alerts for keyword-matched opportunities.
          </p>
          <div className="grid grid-cols-2 gap-5">
            <StatCard title="62+" subtitle="Sources Monitored" />
            <StatCard title="24/7" subtitle="Auto Scanning" />
            <StatCard title="Real-time" subtitle="Notifications" />
            <StatCard title="Smart" subtitle="Keyword Matching" />
          </div>
        </div>
        <p className="absolute bottom-8 text-sm text-slate-400">© 2026 Tender Intelligence System. All rights reserved.</p>
      </div>

      {/* RIGHT */}
      <div className="flex w-full lg:w-1/2 items-center justify-center px-6">
        <div className="w-full max-w-md">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-semibold text-slate-900 mb-2">Welcome back</h2>
            <p className="text-slate-500">Sign in to your account to continue</p>
          </div>

          {loading && <LoadingRow text="Signing in..." />}
          {error && <ErrorBox msg={error} />}

          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-2">Email address</label>
            <input
              type="email" placeholder="you@company.com" value={email}
              onChange={(e) => { setEmail(e.target.value); if (fieldErrors.email) setFieldErrors({ ...fieldErrors, email: null }); }}
              onKeyPress={(e) => e.key === "Enter" && handleSignIn(e)}
              className={inputCls(!!fieldErrors.email)}
            />
            {fieldErrors.email && <FieldErr msg={fieldErrors.email} />}
          </div>

          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-slate-700">Password</label>
              <button onClick={onNavigateToForgotPassword} className="text-sm text-blue-600 hover:underline">
                Forgot password?
              </button>
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"} placeholder="password" value={password}
                onChange={(e) => { setPassword(e.target.value); if (fieldErrors.password) setFieldErrors({ ...fieldErrors, password: null }); }}
                onKeyPress={(e) => e.key === "Enter" && handleSignIn(e)}
                className={inputCls(!!fieldErrors.password)}
              />
              <EyeToggle show={showPassword} toggle={() => setShowPassword(!showPassword)} />
            </div>
            {fieldErrors.password && <FieldErr msg={fieldErrors.password} />}
          </div>

          <button
            onClick={handleSignIn} disabled={loading}
            className={`w-full rounded-lg bg-blue-500 py-3 font-medium text-white transition mb-6 ${loading ? "opacity-50 cursor-not-allowed" : "hover:bg-blue-600"}`}
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>

          <p className="text-center text-sm text-slate-500">
            Don't have an account?{" "}
            <button onClick={onNavigateToSignup} className="text-blue-600 hover:underline font-medium">Sign up</button>
          </p>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// SIGNUP
// ─────────────────────────────────────────────
function Signup({ onNavigateToLogin }) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const [passwordRules, setPasswordRules] = useState({
    length: false, upper: false, lower: false, number: false, special: false,
  });

  const checkPassword = (pwd) => {
    setPasswordRules({
      length: pwd.length >= 8,
      upper: /[A-Z]/.test(pwd),
      lower: /[a-z]/.test(pwd),
      number: /[0-9]/.test(pwd),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(pwd),
    });
  };

  const pwdStrength = Object.values(passwordRules).filter(Boolean).length;
  const strengthLabel = { 0: "", 1: "Weak", 2: "Fair", 3: "Good", 4: "Strong", 5: "Very Strong" };
  const strengthColor = {
    0: "bg-gray-200", 1: "bg-red-500", 2: "bg-orange-500",
    3: "bg-yellow-500", 4: "bg-green-500", 5: "bg-green-600",
  };
  const strengthTextColor = {
    0: "", 1: "text-red-600", 2: "text-orange-600",
    3: "text-yellow-600", 4: "text-green-600", 5: "text-green-700",
  };

  const isFormValid =
    Object.values(passwordRules).every(Boolean) &&
    password === confirmPassword &&
    fullName.trim() &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleCreateAccount = async () => {
    setError(null);
    setFieldErrors({});
    const errors = {};
    if (!fullName.trim()) errors.fullName = "Full name is required";
    if (!email.trim()) errors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "Please enter a valid email address";
    if (!password) errors.password = "Password is required";
    else if (!Object.values(passwordRules).every(Boolean)) errors.password = "Password does not meet all requirements";
    if (!confirmPassword) errors.confirmPassword = "Please confirm your password";
    else if (password !== confirmPassword) errors.confirmPassword = "Passwords do not match";
    if (Object.keys(errors).length > 0) { setFieldErrors(errors); return; }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: fullName.trim(),
          email: email.trim().toLowerCase(),
          password,
          confirm_password: confirmPassword,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        if (typeof data.detail === "string") {
          setError(data.detail);
        } else if (Array.isArray(data.detail)) {
          const be = {};
          data.detail.forEach((e) => { be[e.loc[e.loc.length - 1]] = e.msg; });
          setFieldErrors(be);
        } else {
          setError("Failed to create account. Please try again.");
        }
        return;
      }
      // Success — save email and show OTP modal
      setRegisteredEmail(email.trim().toLowerCase());
      setShowOtpModal(true);
      setFullName(""); setEmail(""); setPassword(""); setConfirmPassword("");
    } catch (err) {
      setError(err.message === "Failed to fetch"
        ? "Unable to connect to server. Please check your internet connection."
        : "An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Called by OTPModal — returns error string or null on success
  const handleVerifyOtp = async (otp) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/verify-signup-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: registeredEmail, otp }),
      });
      const data = await response.json();
      if (!response.ok) {
        return typeof data.detail === "string" ? data.detail : "Invalid OTP. Please try again.";
      }
      setShowOtpModal(false);
      setShowSuccess(true);
      return null;
    } catch {
      return "Unable to connect to server.";
    } finally {
      setLoading(false);
    }
  };

  // Called by ResendTimer inside OTPModal
  const handleResendOtp = async () => {
    try {
      await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: fullName || "User",
          email: registeredEmail,
          password: password || "Placeholder1!",
          confirm_password: password || "Placeholder1!",
        }),
      });
    } catch (_) {}
  };

  return (
    <div className="min-h-screen flex">
      {/* LEFT */}
      <div className="relative hidden lg:flex w-1/2 flex-col bg-gradient-to-br from-[#0B1D36] to-[#020617] px-12 py-10 text-white">
        <BrandLogo />
        <div className="mt-20">
          <h1 className="text-[42px] font-bold leading-tight mb-6">
            Start tracking <br />
            <span className="text-blue-400">opportunities</span> <br />
            today.
          </h1>
          <p className="text-lg text-slate-400 max-w-md mb-14">
            Join thousands of professionals who never miss a tender opportunity
            with our automated monitoring system.
          </p>
          <div className="space-y-4">
            <FeatureItem text="Monitor 62+ websites" />
            <FeatureItem text="Real-time keyword alerts" />
            <FeatureItem text="Power BI analytics integration" />
            <FeatureItem text="Custom notification settings" />
          </div>
        </div>
        <p className="absolute bottom-8 text-sm text-slate-400">© 2026 Tender Intelligence System. All rights reserved.</p>
      </div>

      {/* RIGHT */}
      <div className="flex w-full lg:w-1/2 items-center justify-center px-6 py-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-semibold text-slate-900 mb-1">Create an account</h2>
            <p className="text-sm text-slate-500">Get started with your free account</p>
          </div>

          {loading && !showOtpModal && <LoadingRow text="Creating your account..." />}
          {error && <ErrorBox msg={error} />}

          {/* FULL NAME */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-2">Full name</label>
            <input
              type="text" placeholder="John Doe" value={fullName}
              onChange={(e) => { setFullName(e.target.value); if (fieldErrors.fullName) setFieldErrors({ ...fieldErrors, fullName: null }); }}
              onKeyPress={(e) => e.key === "Enter" && handleCreateAccount()}
              className={inputCls(!!(fieldErrors.fullName || fieldErrors.full_name))}
            />
            {(fieldErrors.fullName || fieldErrors.full_name) && (
              <FieldErr msg={fieldErrors.fullName || fieldErrors.full_name} />
            )}
          </div>

          {/* EMAIL */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-2">Email address</label>
            <input
              type="email" placeholder="you@company.com" value={email}
              onChange={(e) => { setEmail(e.target.value); if (fieldErrors.email) setFieldErrors({ ...fieldErrors, email: null }); }}
              onKeyPress={(e) => e.key === "Enter" && handleCreateAccount()}
              className={inputCls(!!fieldErrors.email)}
            />
            {fieldErrors.email && <FieldErr msg={fieldErrors.email} />}
          </div>

          {/* PASSWORD */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-2">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"} placeholder="password" value={password}
                onChange={(e) => { setPassword(e.target.value); checkPassword(e.target.value); if (fieldErrors.password) setFieldErrors({ ...fieldErrors, password: null }); }}
                onKeyPress={(e) => e.key === "Enter" && handleCreateAccount()}
                className={inputCls(!!fieldErrors.password)}
              />
              <EyeToggle show={showPassword} toggle={() => setShowPassword(!showPassword)} />
            </div>

            {/* Strength bar */}
            {password && (
              <div className="mt-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-slate-600">Password strength:</span>
                  <span className={`text-xs font-semibold ${strengthTextColor[pwdStrength]}`}>
                    {strengthLabel[pwdStrength]}
                  </span>
                </div>
                <div className="flex gap-1 h-1.5 w-full">
                  {[1, 2, 3, 4, 5].map((l) => (
                    <div key={l}
                      className={`flex-1 rounded-full transition-all duration-300 ${l <= pwdStrength ? strengthColor[pwdStrength] : "bg-gray-200"}`}
                    />
                  ))}
                </div>
                <div className="mt-3 space-y-1.5">
                  <PasswordRule ok={passwordRules.length} text="At least 8 characters" />
                  <PasswordRule ok={passwordRules.upper} text="One uppercase letter" />
                  <PasswordRule ok={passwordRules.lower} text="One lowercase letter" />
                  <PasswordRule ok={passwordRules.number} text="One number" />
                  <PasswordRule ok={passwordRules.special} text="One special character" />
                </div>
              </div>
            )}
            {fieldErrors.password && <FieldErr msg={fieldErrors.password} />}
          </div>

          {/* CONFIRM PASSWORD */}
          <div className="mb-5">
            <label className="block text-sm font-medium text-slate-700 mb-2">Confirm password</label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"} placeholder="confirm password" value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); if (fieldErrors.confirmPassword) setFieldErrors({ ...fieldErrors, confirmPassword: null }); }}
                onKeyPress={(e) => e.key === "Enter" && handleCreateAccount()}
                className={inputCls(!!(fieldErrors.confirmPassword || fieldErrors.confirm_password))}
              />
              <EyeToggle show={showConfirmPassword} toggle={() => setShowConfirmPassword(!showConfirmPassword)} />
            </div>
            {(fieldErrors.confirmPassword || fieldErrors.confirm_password) && (
              <FieldErr msg={fieldErrors.confirmPassword || fieldErrors.confirm_password} />
            )}
            {confirmPassword && (
              password === confirmPassword
                ? <p className="mt-1 text-xs text-green-600 flex items-center gap-1">✔ Passwords match</p>
                : <p className="mt-1 text-xs text-red-600">Passwords do not match</p>
            )}
          </div>

          <button
            onClick={handleCreateAccount}
            disabled={loading || !isFormValid}
            className={`w-full rounded-lg py-3 font-medium text-white transition mb-5 ${
              loading || !isFormValid ? "bg-gray-400 cursor-not-allowed" : "bg-blue-500 hover:bg-blue-600"
            }`}
          >
            {loading ? "Creating account..." : "Create account"}
          </button>

          <p className="text-center text-sm text-slate-500">
            Already have an account?{" "}
            <button onClick={onNavigateToLogin} className="text-blue-600 hover:underline font-medium">Sign in</button>
          </p>
        </div>
      </div>

      {/* OTP MODAL */}
      {showOtpModal && (
        <OTPModal
          email={registeredEmail}
          onVerify={handleVerifyOtp}
          onResend={handleResendOtp}
          onClose={() => setShowOtpModal(false)}
          loading={loading}
        />
      )}

      {/* SUCCESS MODAL */}
      {showSuccess && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-2xl text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">Account created!</h3>
            <p className="text-slate-600 text-sm mb-6">
              Your email <strong>{registeredEmail}</strong> has been verified successfully.
            </p>
            <button
              onClick={() => { setShowSuccess(false); onNavigateToLogin(); }}
              className="w-full rounded-xl bg-blue-500 py-3 font-medium text-white hover:bg-blue-600 transition"
            >
              Go to Login
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// FORGOT PASSWORD
// ─────────────────────────────────────────────
function ForgotPassword({ onNavigateToLogin }) {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [otpError, setOtpError] = useState(null);

  const sendResetOtp = async () => {
    setError(null);
    if (!email || !email.includes("@")) { setError("Please enter a valid email address."); return; }
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const data = await response.json();
      if (!response.ok) { setError(data.detail || "Unable to send reset code."); return; }
      setStep(2);
    } catch {
      setError("Unable to connect to server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    setOtpError(null);
    if (otp.length !== 6) { setOtpError("Please enter the full 6-digit code."); return; }
    if (!newPassword || !confirmPassword) { setOtpError("Please fill in both password fields."); return; }
    if (newPassword.length < 8) { setOtpError("Password must be at least 8 characters."); return; }
    if (!/[A-Z]/.test(newPassword)) { setOtpError("Password must contain at least one uppercase letter."); return; }
    if (!/[a-z]/.test(newPassword)) { setOtpError("Password must contain at least one lowercase letter."); return; }
    if (!/[0-9]/.test(newPassword)) { setOtpError("Password must contain at least one number."); return; }
    if (newPassword !== confirmPassword) { setOtpError("Passwords do not match."); return; }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          otp,
          new_password: newPassword,
        }),
      });
      const data = await response.json();
      if (!response.ok) { setOtpError(data.detail || "Failed to reset password."); return; }
      setStep(3);
    } catch {
      setOtpError("Unable to connect to server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* LEFT */}
      <div className="relative hidden lg:flex w-1/2 flex-col bg-gradient-to-br from-[#0B1D36] to-[#020617] px-12 py-10 text-white">
        <BrandLogo />
        <div className="mt-20">
          <h1 className="text-[42px] font-bold leading-tight mb-6">
            Reset your <br />
            <span className="text-blue-400">password</span> <br />
            securely.
          </h1>
          <p className="text-lg text-slate-400 max-w-md mb-14">
            We'll help you regain access to your account quickly and securely
            through our verification process.
          </p>
          <div className="space-y-4">
            {[
              { label: "Enter your email address", active: step >= 1, done: step > 1 },
              { label: "Enter OTP and new password", active: step >= 2, done: step > 2 },
              { label: "Done — log in with new password", active: step >= 3, done: false },
            ].map((s, i) => (
              <div key={i} className={`flex items-center gap-3 ${s.active ? "text-white" : "text-slate-500"}`}>
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm
                  ${s.done ? "bg-green-500" : s.active ? "bg-blue-500" : "bg-white/10"}`}>
                  {s.done ? "✓" : i + 1}
                </div>
                <p>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
        <p className="absolute bottom-8 text-sm text-slate-400">© 2026 Tender Intelligence System. All rights reserved.</p>
      </div>

      {/* RIGHT */}
      <div className="flex w-full lg:w-1/2 items-center justify-center px-6">
        <div className="w-full max-w-md">

          {/* STEP 1 — Email */}
          {step === 1 && (
            <>
              <div className="text-center mb-10">
                <h2 className="text-3xl font-semibold text-slate-900 mb-2">Forgot password?</h2>
                <p className="text-slate-500">No worries, we'll send you reset instructions</p>
              </div>
              {loading && <LoadingRow text="Sending reset code..." />}
              {error && <ErrorBox msg={error} />}
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-2">Email address</label>
                <input
                  type="email" placeholder="you@company.com" value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && sendResetOtp()}
                  className="w-full rounded-lg border border-slate-200 px-4 py-3 text-slate-600 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button onClick={sendResetOtp} disabled={loading}
                className={`w-full rounded-lg bg-blue-500 py-3 font-medium text-white transition mb-6 ${loading ? "opacity-50 cursor-not-allowed" : "hover:bg-blue-600"}`}>
                {loading ? "Sending..." : "Send reset code"}
              </button>
              <BackLink onClick={onNavigateToLogin} label="Back to login" />
            </>
          )}

          {/* STEP 2 — OTP + new password */}
          {step === 2 && (
            <>
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-semibold text-slate-900 mb-2">Check your email</h2>
                <p className="text-slate-500 text-sm">
                  We sent a 6-digit code to<br />
                  <span className="font-semibold text-slate-800">{email}</span>
                </p>
              </div>

              {loading && <LoadingRow text="Resetting password..." />}
              {otpError && <ErrorBox msg={otpError} />}

              {/* Animated OTP boxes */}
              <div className="mb-2">
                <label className="block text-sm font-medium text-slate-700 mb-3 text-center">
                  Enter verification code
                </label>
                <OTPInput value={otp} onChange={setOtp} error={!!otpError} disabled={loading} />
              </div>

              {/* Resend timer */}
              <ResendTimer onResend={sendResetOtp} loading={loading} />

              <div className="mt-6 mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">New password</label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"} placeholder="••••••••" value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-4 py-3 text-slate-600 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <EyeToggle show={showNewPassword} toggle={() => setShowNewPassword(!showNewPassword)} />
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Must be at least 8 characters with uppercase, lowercase, and number
                </p>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 mb-2">Confirm password</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"} placeholder="••••••••" value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-4 py-3 text-slate-600 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <EyeToggle show={showConfirmPassword} toggle={() => setShowConfirmPassword(!showConfirmPassword)} />
                </div>
                {confirmPassword && (
                  newPassword === confirmPassword
                    ? <p className="mt-1 text-xs text-green-600">✔ Passwords match</p>
                    : <p className="mt-1 text-xs text-red-600">Passwords do not match</p>
                )}
              </div>

              <button onClick={handleResetPassword} disabled={loading}
                className={`w-full rounded-lg bg-blue-500 py-3 font-medium text-white transition mb-4 ${loading ? "opacity-50 cursor-not-allowed" : "hover:bg-blue-600"}`}>
                {loading ? "Resetting..." : "Reset password"}
              </button>
              <BackLink onClick={() => { setStep(1); setOtp(""); setOtpError(null); }} />
            </>
          )}

          {/* STEP 3 — Success */}
          {step === 3 && (
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-6">
                <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-semibold text-slate-900 mb-2">Password reset!</h2>
              <p className="text-slate-500 mb-8">
                Your password has been successfully reset. You can now sign in with your new password.
              </p>
              <button onClick={onNavigateToLogin}
                className="w-full rounded-xl bg-blue-500 py-3 font-medium text-white hover:bg-blue-600 transition">
                Back to login
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// SHARED COMPONENTS
// ─────────────────────────────────────────────
function BrandLogo() {
  return (
    <div className="flex items-center gap-3">
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
  );
}

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

function PasswordRule({ ok, text }) {
  return (
    <div className={`flex items-center gap-2 text-xs transition-all duration-300 ${ok ? "text-green-600" : "text-gray-400"}`}>
      <span className={`font-bold text-sm transition-transform duration-300 ${ok ? "scale-110" : "scale-100"}`}>
        {ok ? "✔" : "✖"}
      </span>
      <span>{text}</span>
    </div>
  );
}

function LoadingRow({ text }) {
  return (
    <div className="mb-4 text-sm text-gray-500 flex items-center gap-2">
      <span className="animate-spin h-4 w-4 border-2 border-gray-300 border-t-blue-500 rounded-full" />
      {text}
    </div>
  );
}

function ErrorBox({ msg }) {
  return (
    <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
      {msg}
    </div>
  );
}

function FieldErr({ msg }) {
  return <p className="text-xs text-red-600 mt-1">{msg}</p>;
}

function EyeToggle({ show, toggle }) {
  return (
    <button type="button" onClick={toggle}
      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
      {show ? <EyeOff size={18} /> : <Eye size={18} />}
    </button>
  );
}

function BackLink({ onClick, label = "Back" }) {
  return (
    <button onClick={onClick}
      className="w-full flex items-center justify-center gap-2 text-slate-600 hover:text-slate-900 transition-colors">
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
      </svg>
      {label}
    </button>
  );
}

function inputCls(hasError) {
  return `w-full rounded-lg border ${
    hasError ? "border-red-300 focus:ring-red-500" : "border-slate-200 focus:ring-blue-500"
  } px-4 py-3 text-slate-600 placeholder-slate-400 focus:outline-none focus:ring-2`;
}