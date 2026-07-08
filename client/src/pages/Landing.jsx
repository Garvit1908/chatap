import { Link } from "react-router-dom";
import Aurora from "../components/Aurora";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0e1a] to-[#12172b] relative overflow-hidden text-white font-sans">
      {/* Aurora Background */}
      <div className="absolute inset-0 z-0 opacity-40">
        <Aurora
          colorStops={["#7c3aed", "#d946ef", "#06b6d4"]}
          blend={0.6}
          amplitude={1.2}
          speed={0.4}
        />
      </div>

      {/* Navbar */}
      <nav className="relative z-10 px-6 py-4 md:px-12 md:py-6 flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-white/5 bg-white/[0.02] backdrop-blur-md">
        <div className="text-2xl font-bold bg-gradient-to-r from-violet-400 via-fuchsia-400 to-cyan-400 bg-clip-text text-transparent drop-shadow-sm">
          TalkFlow
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto justify-center sm:justify-end">
          <Link
            to="/login"
            className="flex-1 sm:flex-none text-center px-5 py-2 text-sm font-semibold text-gray-300 hover:text-white transition-colors duration-300"
          >
            Login
          </Link>
          <Link
            to="/signup"
            className="flex-1 sm:flex-none text-center px-5 py-2 text-sm font-bold text-white bg-white/10 hover:bg-white/20 border border-white/10 rounded-full backdrop-blur-sm transition-all duration-300 shadow-[0_0_15px_rgba(255,255,255,0.05)] hover:shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:scale-105"
          >
            Sign Up
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 flex flex-col items-center justify-center px-6 pt-20 pb-16 md:pt-32 md:pb-24 text-center max-w-5xl mx-auto">
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 leading-tight drop-shadow-lg">
          Connect Instantly.<br />
          <span className="bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
            Anywhere.
          </span>
        </h1>
        <p className="text-lg md:text-xl text-gray-400 mb-10 max-w-2xl leading-relaxed">
          Experience premium real-time messaging and HD video calls. Built with modern glassmorphism and powered by advanced AI assistants.
        </p>
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto px-6 sm:px-0">
          <Link
            to="/signup"
            className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-bold rounded-full hover:from-violet-500 hover:to-fuchsia-500 transition-all duration-300 shadow-[0_8px_25px_rgba(124,58,237,0.4)] hover:shadow-[0_12px_35px_rgba(124,58,237,0.6)] hover:-translate-y-1"
          >
            Get Started — It's Free
          </Link>
          <Link
            to="/login"
            className="w-full sm:w-auto px-8 py-4 bg-white/5 border border-white/10 text-white font-semibold rounded-full hover:bg-white/10 backdrop-blur-sm transition-all duration-300 shadow-[0_8px_25px_rgba(0,0,0,0.2)] hover:-translate-y-1"
          >
            Login to your account
          </Link>
        </div>
      </main>

      {/* Features Section */}
      <section className="relative z-10 px-6 py-16 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] hover:bg-white/[0.05] transition-all duration-300 hover:-translate-y-2 group">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" /></svg>
            </div>
            <h3 className="text-xl font-bold text-gray-100 mb-3 tracking-wide">Real-time Messaging</h3>
            <p className="text-gray-400 text-sm leading-relaxed">Lightning fast instant messaging powered by WebSockets. Never miss a moment with read receipts and typing indicators.</p>
          </div>

          <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] hover:bg-white/[0.05] transition-all duration-300 hover:-translate-y-2 group">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
            </div>
            <h3 className="text-xl font-bold text-gray-100 mb-3 tracking-wide">HD Video Calls</h3>
            <p className="text-gray-400 text-sm leading-relaxed">Crystal clear peer-to-peer video calling built right into the browser. Connect face-to-face securely and instantly.</p>
          </div>

          <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] hover:bg-white/[0.05] transition-all duration-300 hover:-translate-y-2 group">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
            </div>
            <h3 className="text-xl font-bold text-gray-100 mb-3 tracking-wide">Secure & Private</h3>
            <p className="text-gray-400 text-sm leading-relaxed">Enterprise-grade JWT authentication and secure WebRTC connections ensure your conversations remain private.</p>
          </div>

        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 py-8 mt-12 text-center text-gray-500 text-sm bg-black/20">
        <p>&copy; {new Date().getFullYear()} TalkFlow. All rights reserved.</p>
      </footer>
    </div>
  );
}
