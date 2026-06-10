"use client";

import React, { useState } from "react";
import { Eye, EyeOff, User, Mail, Phone, Lock, Briefcase } from "lucide-react";
import AuthFormCard, {
  AuthLink,
  AUTH_INPUT_CLASS,
  AUTH_LABEL_CLASS,
  AUTH_SUBMIT_CLASS,
} from "../../../Components/AuthFormCard";
import { useAuth } from "../../AuthContext";
import { SIGNUP_ROLE_OPTIONS } from "../../../lib/permissions";

export default function SignUpPage() {
  const { register } = useAuth();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    role: "SALES_EXECUTIVE",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const update = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsSubmitting(true);
    try {
      await register({
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        password: form.password,
        confirmPassword: form.confirmPassword,
        role: form.role,
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthFormCard
      title="Create your account"
      subtitle="Join Rising CRM and start managing your workspace"
      footer={
        <>
          Already have an account? <AuthLink href="/login">Sign in</AuthLink>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-rose-50 border border-rose-100 text-rose-600 text-sm font-medium px-4 py-3 rounded-xl">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="name" className={AUTH_LABEL_CLASS}>Full Name</label>
          <div className="relative">
            <span className="absolute inset-y-0 left-3.5 flex items-center text-slate-400">
              <User className="w-4.5 h-4.5" />
            </span>
            <input
              id="name"
              type="text"
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              placeholder="Enter your full name"
              className={`${AUTH_INPUT_CLASS} pl-11`}
              required
            />
          </div>
        </div>

        <div>
          <label htmlFor="email" className={AUTH_LABEL_CLASS}>Email Address</label>
          <div className="relative">
            <span className="absolute inset-y-0 left-3.5 flex items-center text-slate-400">
              <Mail className="w-4.5 h-4.5" />
            </span>
            <input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              placeholder="you@company.com"
              className={`${AUTH_INPUT_CLASS} pl-11`}
              required
              autoComplete="email"
            />
          </div>
        </div>

        <div>
          <label htmlFor="phone" className={AUTH_LABEL_CLASS}>Phone Number</label>
          <div className="relative">
            <span className="absolute inset-y-0 left-3.5 flex items-center text-slate-400">
              <Phone className="w-4.5 h-4.5" />
            </span>
            <input
              id="phone"
              type="tel"
              value={form.phone}
              onChange={(e) => update("phone", e.target.value)}
              placeholder="Enter your phone number"
              className={`${AUTH_INPUT_CLASS} pl-11`}
              required
              autoComplete="tel"
            />
          </div>
        </div>

        <div>
          <label htmlFor="role" className={AUTH_LABEL_CLASS}>Role</label>
          <div className="relative">
            <span className="absolute inset-y-0 left-3.5 flex items-center text-slate-400">
              <Briefcase className="w-4.5 h-4.5" />
            </span>
            <select
              id="role"
              value={form.role}
              onChange={(e) => update("role", e.target.value)}
              className={`${AUTH_INPUT_CLASS} pl-11 appearance-none cursor-pointer`}
              required
            >
              {SIGNUP_ROLE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="password" className={AUTH_LABEL_CLASS}>Password</label>
          <div className="relative">
            <span className="absolute inset-y-0 left-3.5 flex items-center text-slate-400">
              <Lock className="w-4.5 h-4.5" />
            </span>
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              value={form.password}
              onChange={(e) => update("password", e.target.value)}
              placeholder="Min. 6 characters"
              className={`${AUTH_INPUT_CLASS} pl-11 pr-11`}
              required
              minLength={6}
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
            </button>
          </div>
        </div>

        <div>
          <label htmlFor="confirmPassword" className={AUTH_LABEL_CLASS}>Confirm Password</label>
          <div className="relative">
            <span className="absolute inset-y-0 left-3.5 flex items-center text-slate-400">
              <Lock className="w-4.5 h-4.5" />
            </span>
            <input
              id="confirmPassword"
              type={showConfirm ? "text" : "password"}
              value={form.confirmPassword}
              onChange={(e) => update("confirmPassword", e.target.value)}
              placeholder="Re-enter your password"
              className={`${AUTH_INPUT_CLASS} pl-11 pr-11`}
              required
              minLength={6}
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute inset-y-0 right-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
              tabIndex={-1}
            >
              {showConfirm ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
            </button>
          </div>
        </div>

        <button type="submit" disabled={isSubmitting} className={`${AUTH_SUBMIT_CLASS} mt-2`}>
          {isSubmitting ? "Creating account..." : "Create Account"}
        </button>
      </form>
    </AuthFormCard>
  );
}
