import { Button } from "@/components/ui/button";
import { Brush, Sparkle, User, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";

const HomePage = () => {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    const token =
      localStorage.getItem("token") || sessionStorage.getItem("token");

    if (token) {
      // User is already authenticated
      navigate("/create-room");
    } else {
      // User is not authenticated
      navigate("/signup");
    }
  };

  const handleGuestAccess = () => {
    // Navigate to a guest canvas
    navigate("/canvas");
  };
  return (
    <div className="relative min-h-screen bg-gradient-to-tr from-purple-600 via-indigo-700 to-blue-600 text-white flex items-center justify-center px-6 overflow-hidden">
      {/* Animated Background blobs */}
      <div className="absolute -top-20 -left-20 w-96 h-96 bg-pink-500 opacity-30 rounded-full filter blur-3xl animate-pulse"></div>
      <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-yellow-400 opacity-20 rounded-full filter blur-3xl animate-pulse"></div>

      {/* Main Content */}
      <div className="relative z-10 text-center max-w-2xl">
        <div className="flex justify-center mb-4">
          <Sparkle className="w-12 h-12 text-yellow-300 animate-bounce" />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold mb-4 drop-shadow-md">
          Collaborate Creatively
        </h1>
        <p className="text-lg md:text-xl mb-8">
          Real-time collaborative drawing canvas to sketch, create, and ideate
          with your team.
        </p>
        <div className="flex flex-col md:flex-row items-center justify-center gap-4">
          <Button
            onClick={handleGetStarted}
            className="text-lg px-6 py-3 bg-white text-indigo-700 font-semibold hover:bg-yellow-300 transition-all rounded-xl shadow-xl"
          >
            Get Started
          </Button>

          <Button
            onClick={handleGuestAccess}
            className="text-lg px-6 py-3 bg-white text-green-600 font-semibold hover:bg-pink-300 transition-all rounded-xl shadow-xl"
          >
            Continue as Guest
          </Button>
        </div>

        {/* Feature Highlights */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <FeatureCard
            icon={<Zap className="text-yellow-400 w-8 h-8 mb-2" />}
            title="Fast & Smooth"
            description="Lightning-fast rendering and real-time syncing for seamless creativity."
          />

          <FeatureCard
            icon={<User className="text-green-400 w-8 h-8 mb-2" />}
            title="Real-time Collaboration"
            description="Work together with your team instantly on the same canvas."
          />

          <FeatureCard
            icon={<Brush className="text-pink-400 w-8 h-8 mb-2" />}
            title="Creative Tools"
            description="Pen, shapes, text — all the tools you need to bring ideas to life."
          />
        </div>
      </div>
    </div>
  );
};

const FeatureCard = ({ icon, title, description }) => (
  <div className="bg-white bg-opacity-80 backdrop-blur-sm rounded-xl p-6 hover:scale-105 transition-all duration-300 shadow-lg border border-white/10">
    <div className="flex flex-col items-center text-gray-800">
      {" "}
      {/* Changed text color for better visibility */}
      {icon}
      <h3 className="text-xl font-semibold mb-1">{title}</h3>
      <p className="text-sm text-gray-700">{description}</p>{" "}
      {/* Adjusted text color */}
    </div>
  </div>
);

export default HomePage;
