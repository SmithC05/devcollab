// src/components/auth/RegisterForm.jsx
// Register form: full name, email, password, social buttons, mode toggle.

import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Lock, ArrowRight, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import AuthInput from './AuthInput';
import AuthDivider from './AuthDivider';
import SocialButton from './SocialButton';

export default function RegisterForm({ onSwitchToLogin }) {
  const [name, setName]     = useState('');
  const [email, setEmail]   = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});

  const { register, isLoading } = useAuthStore();
  const navigate = useNavigate();

  const validate = () => {
    const e = {};
    if (!name.trim()) e.name = 'Full name is required.';
    if (!email.trim()) e.email = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Enter a valid email address.';
    if (!password) e.password = 'Password is required.';
    else if (password.length < 6) e.password = 'Password must be at least 6 characters.';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});

    const result = await register(name, email, password);
    if (result.success) {
      navigate('/onboarding');
    } else {
      setErrors({ form: result.error });
    }
  };

  const clear = (field) => setErrors(prev => ({ ...prev, [field]: undefined }));

  return (
    <div className="flex flex-col gap-5 w-full">
      {/* Header */}
      <div>
        <h1 className="text-[34px] md:text-[36px] font-bold leading-[1.1] tracking-[-1px] text-white dark:text-white mb-[8px]">
          Create your account
        </h1>
        <p className="text-[15px] md:text-[16px] leading-[1.5] text-[#A3A3A3]">
          Start collaborating with your team today.
        </p>
      </div>

      {/* Social */}
      <div className="flex gap-[16px]">
        <SocialButton provider="google" />
        <SocialButton provider="github" />
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
      <form id="register-form" onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <AuthInput
          id="register-name"
          label="Full Name"
          type="text"
          icon={User}
          placeholder="Your full name"
          value={name}
          onChange={e => { setName(e.target.value); clear('name'); }}
          autoComplete="name"
          error={errors.name}
          disabled={isLoading}
        />

        <AuthInput
          id="register-email"
          label="Email Address"
          type="email"
          icon={Mail}
          placeholder="you@example.com"
          value={email}
          onChange={e => { setEmail(e.target.value); clear('email'); }}
          autoComplete="email"
          error={errors.email}
          disabled={isLoading}
        />

        <AuthInput
          id="register-password"
          label="Password"
          type="password"
          icon={Lock}
          placeholder="••••••••"
          value={password}
          onChange={e => { setPassword(e.target.value); clear('password'); }}
          autoComplete="new-password"
          error={errors.password}
          disabled={isLoading}
        />

        {/* Submit */}
        <motion.button
          type="submit"
          id="register-submit"
          disabled={isLoading}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          className="
            mt-1 w-full h-[60px] rounded-[18px]
            flex items-center justify-center gap-2
            bg-white text-black dark:bg-white dark:text-black
            light:bg-black light:text-white
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
              <span>Create Account</span>
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
      <p className="text-center text-[14px] text-[#A3A3A3] mt-2">
        Already have an account?{' '}
        <button
          id="switch-to-login"
          type="button"
          onClick={onSwitchToLogin}
          className="text-white dark:text-white font-bold hover:underline focus-visible:outline-none"
        >
          Sign In
        </button>
      </p>
    </div>
  );
}
