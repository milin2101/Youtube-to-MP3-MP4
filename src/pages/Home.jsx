import React from "react";
import Downloader from "../components/Downloader";

const Home = () => {
  return (
    <main className="relative min-h-screen bg-[#020617] text-white">

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
