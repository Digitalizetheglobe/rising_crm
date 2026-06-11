"use client";

import React, { useState } from "react";
import { Eye, EyeOff, User, Lock } from "lucide-react";
import AuthFormCard, {
  AuthLink,
  AUTH_INPUT_CLASS,
  AUTH_LABEL_CLASS,
  AUTH_SUBMIT_CLASS,
} from "../../../Components/AuthFormCard";
import { useAuth } from "../../AuthContext";

export default function LoginPage() {
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      await login(identifier.trim(), password);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthFormCard
      title="Welcome back"
      subtitle="Sign in to your Rising CRM account"
      footer={
        <>
          Don&apos;t have an account? <AuthLink href="/signup">Create one</AuthLink>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="bg-rose-50 border border-rose-100 text-rose-600 text-sm font-medium px-4 py-3 rounded-xl">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="identifier" className={AUTH_LABEL_CLASS}>
            Email or Phone Number
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-3.5 flex items-center text-slate-400">
              <User className="w-4.5 h-4.5" />
            </span>
            <input
              id="identifier"
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="Enter your email or phone number"
              className={`${AUTH_INPUT_CLASS} pl-11`}
              required
              autoComplete="username"
            />
          </div>
        </div>

        <div>
          <label htmlFor="password" className={AUTH_LABEL_CLASS}>
            Password
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-3.5 flex items-center text-slate-400">
              <Lock className="w-4.5 h-4.5" />
            </span>
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className={`${AUTH_INPUT_CLASS} pl-11 pr-11`}
              required
              autoComplete="current-password"
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

        <button type="submit" disabled={isSubmitting} className={AUTH_SUBMIT_CLASS}>
          {isSubmitting ? "Signing in..." : "Sign In"}
        </button>
      </form>
    </AuthFormCard>
  );
}
