// src/components/auth/LoginForm.jsx
// Login form: email, password, social buttons, forgot password, mode toggle.

import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Lock, ArrowRight, Loader2 } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../../stores/authStore";
import AuthInput from "./AuthInput";
import AuthDivider from "./AuthDivider";
import SocialButton from "./SocialButton";

export default function LoginForm({ onSwitchToRegister }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});

  const { login, loginWithGoogle, loginWithGitHub, workspaces, isLoading } =
    useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const validate = () => {
    const e = {};
    if (!email.trim()) e.email = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      e.email = "Enter a valid email address.";
    if (!password) e.password = "Password is required.";
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    setErrors({});

    const result = await login(email, password);
    if (result.success) {
      // Check if we need to redirect back to a specific route (e.g. invitation page)
      const locationState = location.state;
      if (locationState && locationState.from) {
        navigate(locationState.from);
        return;
      }

      const { workspaces: freshWorkspaces } = useAuthStore.getState();
      if (freshWorkspaces && freshWorkspaces.length > 0) {
        navigate("/select-workspace");
      } else {
        navigate("/onboarding");
      }
    } else {
      setErrors({ form: result.error });
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Header */}
      <div>
        <h1 className="text-[34px] md:text-[36px] font-bold leading-[1.1] tracking-[-1px] text-[var(--text-primary)] mb-[8px]">
          Sign in to DevCollab
        </h1>
        <p className="text-[15px] md:text-[16px] leading-[1.5] text-[var(--text-secondary)]">
          Enter your email and password to access your workspace.
        </p>
      </div>

      {/* Social */}
      <div className="flex gap-[16px]">
        <SocialButton provider="google" onClick={() => loginWithGoogle(location.state?.from)} />
        <SocialButton provider="github" onClick={() => loginWithGitHub(location.state?.from)} />
      </div>

      <AuthDivider />

      {/* Form error */}
      {errors.form && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          role="alert"
          className="text-[12px] text-[#f87171] bg-[#2a1111] border border-[#3a1a1a] rounded-xl px-4 py-3"
        >
          {errors.form}
        </motion.p>
      )}

      {/* Fields */}
      <form
        id="login-form"
        onSubmit={handleSubmit}
        noValidate
        className="flex flex-col gap-4"
      >
        <AuthInput
          id="login-email"
          label="Email Address"
          type="email"
          icon={Mail}
          placeholder="you@example.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setErrors((prev) => ({ ...prev, email: undefined }));
          }}
          autoComplete="email"
          error={errors.email}
          disabled={isLoading}
        />

        <div className="flex flex-col gap-1">
          <AuthInput
            id="login-password"
            label="Password"
            type="password"
            icon={Lock}
            placeholder="••••••••"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setErrors((prev) => ({ ...prev, password: undefined }));
            }}
            autoComplete="current-password"
            error={errors.password}
            disabled={isLoading}
          />
          <div className="flex justify-end">
            <button
              type="button"
              className="text-[14px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors mt-[8px]"
            >
              Forgot password?
            </button>
          </div>
        </div>

        {/* Submit */}
        <motion.button
          type="submit"
          id="login-submit"
          disabled={isLoading}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          className="
 mt-1 w-full h-[60px] rounded-[18px]
 flex items-center justify-center gap-2
 bg-white text-black dark:bg-white dark:text-black
 
 text-[16px] font-bold
 hover:opacity-90 active:translate-y-[1px]
 transition-all duration-150 shadow-sm
 disabled:opacity-60 disabled:cursor-not-allowed
 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40
 "
        >
          {isLoading ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <>
              <span>Sign In</span>
              <motion.span
                initial={{ x: 0 }}
                whileHover={{ x: 3 }}
                transition={{ duration: 0.15 }}
              >
                <ArrowRight size={16} strokeWidth={2.5} />
              </motion.span>
            </>
          )}
        </motion.button>
      </form>

      {/* Mode toggle */}
      <p className="text-center text-[14px] text-[var(--text-secondary)] mt-2">
        Don't have an account?{" "}
        <button
          id="switch-to-register"
          type="button"
          onClick={onSwitchToRegister}
          className="text-[var(--text-primary)] font-bold hover:underline focus-visible:outline-none"
        >
          Register
        </button>
      </p>
    </div>
  );
}
