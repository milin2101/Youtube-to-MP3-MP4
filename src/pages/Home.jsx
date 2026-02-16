import React from "react";
import Downloader from "../components/Downloader";

const Home = () => {
  return (
    <main className="relative min-h-screen bg-[#020617] text-white">
      {/* Background Blobs */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-indigo-600/20 rounded-full mix-blend-screen filter blur-[120px] animate-blob"></div>
        <div className="absolute top-[20%] right-[-10%] w-[550px] h-[550px] bg-purple-600/20 rounded-full mix-blend-screen filter blur-[120px] animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-[-10%] left-[20%] w-[500px] h-[500px] bg-pink-600/20 rounded-full mix-blend-screen filter blur-[120px] animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10 pt-32 pb-20">
        <div className="max-w-4xl mx-auto px-6 text-center mb-16 animate-fade-in-up">
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white to-slate-400">
            Convert. Simple. <span className="text-indigo-400">Fast.</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto font-medium leading-relaxed">
            The ultimate tool to transform your favorite YouTube content into premium MP3 and MP4 files with studio-quality audio.
          </p>
        </div>
        
        <Downloader />
      </div>
    </main>
  );
};

export default Home;
