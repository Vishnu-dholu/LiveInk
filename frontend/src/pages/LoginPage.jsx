import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { HomeIcon, MoonIcon, SunIcon } from "lucide-react";
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FcGoogle } from "react-icons/fc";
import { FaGithub } from "react-icons/fa";
import { FiEye, FiEyeOff } from "react-icons/fi";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isDarkMode, setIsDarkMode] = useState(
    localStorage.getItem("theme") === "dark"
  );
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDarkMode]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage("");

    try {
      const response = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password, rememberMe }),
      });

      const data = await response.json();

      if (response.ok) {
        if (rememberMe) {
          localStorage.setItem("token", data.token);
        } else {
          sessionStorage.setItem("token", data.token);
        }
        navigate("/create-room");
      } else {
        setErrorMessage(data.error || "Login failed");
      }
    } catch (err) {
      console.error(err);
      setErrorMessage("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-tr from-blue-200 via-slate-300 to-gray-200 dark:from-gray-900 dark:via-gray-800 dark:to-gray-700 transition-colors duration-500 flex items-center justify-center px-6 overflow-hidden">
      <div className="absolute top-4 left-4 flex items-center gap-2">
        <Button
          variant="ghost"
          onClick={() => setIsDarkMode(!isDarkMode)}
          className="text-gray-700 dark:text-gray-200 hover:text-yellow-400 transition-all"
        >
          {isDarkMode ? (
            <SunIcon className="w-5 h-5" />
          ) : (
            <MoonIcon className="w-5 h-5" />
          )}
        </Button>

        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="text-gray-700 dark:text-gray-200 hover:text-blue-500 transition-all"
        >
          <HomeIcon className="w-5 h-5" />
        </Button>
      </div>

      <div className="w-full max-w-md p-8 rounded-2xl shadow-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
        <h2 className="text-3xl font-bold text-center mb-2">Login</h2>
        <p className="text-sm text-center text-gray-600 dark:text-yellow-300 mb-6">
          Login to continue
        </p>

        {errorMessage && (
          <div className="text-red-500 text-center mb-4 font-medium">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="mb-5">
            <Label htmlFor="email" className="block mb-2 font-medium">
              Email
            </Label>
            <input
              type="email"
              id="email"
              className="w-full p-3 rounded-lg bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="mb-8 relative">
            <Label htmlFor="password" className="block mb-2 font-medium">
              Password
            </Label>
            <input
              type={showPassword ? "text" : "password"}
              id="password"
              className="w-full p-3 rounded-lg bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-11 transform -translate-y-1/2 text-gray-600 dark:text-gray-300"
            >
              {showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
            </button>
          </div>

          <div className="mb-4 flex items-center">
            <input
              type="checkbox"
              id="remember"
              checked={rememberMe}
              onChange={() => setRememberMe(!rememberMe)}
              className="mr-2 w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
            />
            <Label htmlFor="remember" className="text-sm">
              Remember me
            </Label>
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-xl shadow transition-transform transform hover:scale-105"
          >
            {isLoading ? "Logging in..." : "Login"}
          </Button>
        </form>
        <div className="flex flex-col gap-3 mt-6">
          <a href="http://localhost:5000/auth/google">
            <Button
              variant="outline"
              className="w-full flex items-center justify-center gap-2 bg-white dark:bg-gray-100 text-gray-900 font-semibold hover:bg-gray-200 transition"
            >
              <FcGoogle className="w-5 h-5" />
              Continue with Google
            </Button>
          </a>

          <a href="http://localhost:5000/auth/github">
            <Button
              variant="outline"
              className="w-full flex items-center justify-center gap-2 bg-gray-900 text-white font-semibold hover:bg-gray-800 transition"
            >
              <FaGithub className="w-5 h-5" />
              Continue with Github
            </Button>
          </a>
        </div>

        <p className="text-center mt-6 text-sm text-gray-700 dark:text-gray-300">
          Don’t have an account?
          <Link
            to="/signup"
            className="text-blue-600 dark:text-blue-400 underline ml-1"
          >
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
