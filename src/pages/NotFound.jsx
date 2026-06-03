import { useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";

export default function NotFound() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-[#0F3D2E] flex flex-col items-center justify-center text-white px-4 text-center">
      <img src={logo} alt="APSTS" className="w-16 h-16 rounded-full mb-6 border-2 border-white/30" />
      <h1 className="text-7xl font-bold text-orange-400 mb-2">404</h1>
      <h2 className="text-2xl font-semibold mb-3">Page Not Found</h2>
      <p className="text-gray-300 mb-8 max-w-md">
        The page you are looking for does not exist or has been moved.
      </p>
      <div className="flex gap-3">
        <button
          onClick={() => navigate(-1)}
          className="px-6 py-2.5 border border-white/30 rounded-xl hover:bg-white/10 transition"
        >
          Go Back
        </button>
        <button
          onClick={() => navigate("/")}
          className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 rounded-xl font-semibold transition"
        >
          Go Home
        </button>
      </div>
    </div>
  );
}
