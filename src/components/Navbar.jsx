import { Link } from "react-router-dom";
import { Zap, Home as HomeIcon, Info } from "lucide-react";

export default function Navbar() {
  return (
    <div className="fixed top-6 left-0 right-0 z-50 px-4 md:px-0 flex justify-center">
      <nav className="max-w-fit md:min-w-[400px] glass rounded-2xl px-6 py-3 border border-white/10 flex items-center gap-8 shadow-2xl">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-lg flex items-center justify-center shadow-lg shadow-purple-500/20 group-hover:scale-110 transition-transform">
            <Zap size={18} className="text-white fill-white" />
          </div>
          <span className="font-extrabold text-lg text-white tracking-tight hidden sm:block">
            RapidDown
          </span>
        </Link>
        
        <div className="h-4 w-px bg-white/10 hidden sm:block"></div>
        
        <div className="flex items-center gap-6">
          <Link
            to="/"
            className="text-slate-300 hover:text-white flex items-center gap-2 text-sm font-semibold transition-all hover:scale-105"
          >
            <HomeIcon size={16} />
            <span className="hidden sm:inline">Home</span>
          </Link>
          <Link
            to="/about"
            className="text-slate-300 hover:text-white flex items-center gap-2 text-sm font-semibold transition-all hover:scale-105"
          >
            <Info size={16} />
            <span className="hidden sm:inline">About</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
