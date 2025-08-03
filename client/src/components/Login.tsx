import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Navigate } from "react-router-dom";
import { login } from "../store/slices/authSlice";
import { Shield, User, Lock, Eye, EyeOff, Loader2 } from "lucide-react";
import type { RootState, AppDispatch } from "../store";

const Login = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { isAuthenticated, loading } = useSelector(
    (state: RootState) => state.auth
  );
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      await dispatch(login({ username, password })).unwrap();
      // Login successful - user will be redirected automatically
    } catch (error: any) {
      console.error("Login failed:", error);
      setError(error || "Login failed. Please try again.");

      // If login fails, create a demo user session for development
      if (import.meta.env.DEV) {
        console.log("Creating demo session for development...");
        const demoUser = {
          id: "demo-user",
          username: "admin",
          email: "admin@app-admin.com",
          role: "admin" as const,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        // Store demo session
        localStorage.setItem("token", "demo-token");
        localStorage.setItem("user", JSON.stringify(demoUser));

        // Force a page reload to update the state
        window.location.reload();
      }
    }
  };

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo">
            <Shield size={32} />
          </div>
          <h2 className="login-title">APP-ADMIN System</h2>
          <p className="login-subtitle">Sign in to your account</p>
        </div>

        <form onSubmit={handleLogin} className="login-form">
          {error && <div className="error-message">{error}</div>}

          <div className="form-group">
            <label htmlFor="username">Username</label>
            <div className="input-group">
              <User size={18} className="input-icon" />
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="input-group">
              <Lock size={18} className="input-icon" />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading} className="login-button">
            {loading ? (
              <>
                <Loader2 size={18} className="spinner-icon" />
                Signing in...
              </>
            ) : (
              "Sign In"
            )}
          </button>

          <div className="login-info">
            <p className="demo-info">
              <strong>Demo Credentials:</strong>
              <br />
              Username: <code>admin</code>
              <br />
              Password: <code>admin123</code>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
