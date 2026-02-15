import React, { useState } from "react";
import { Search, Music, Video, Loader2, AlertCircle } from "lucide-react";
import axios from "axios";

const Downloader = () => {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [videoData, setVideoData] = useState(null);
  const [error, setError] = useState("");

  const suggestedVideos = [
    {
      title: "Tauba Tauba | Bad Newz | Vicky Kaushal | Karan Aujla",
      url: "https://www.youtube.com/watch?v=lZ_qY6Q_l8E",
      thumbnail: "https://img.youtube.com/vi/lZ_qY6Q_l8E/hqdefault.jpg",
      duration: "3:27",
    },
    {
      title: "Dekhha Tenu | Mr. & Mrs. Mahi | Rajkummar | Janhvi",
      url: "https://www.youtube.com/watch?v=yZqj0b-Mh5w",
      thumbnail: "https://img.youtube.com/vi/yZqj0b-Mh5w/hqdefault.jpg",
      duration: "4:42",
    },
    {
      title: "Aaj Ki Raat | Stree 2 | Tamannaah Bhatia | Sachin-Jigar",
      url: "https://www.youtube.com/watch?v=0r31fC0k7Jc",
      thumbnail: "https://img.youtube.com/vi/0r31fC0k7Jc/hqdefault.jpg",
      duration: "3:49",
    },
    {
      title: "Taras | Munjya | Sharvari | Sachin-Jigar",
      url: "https://www.youtube.com/watch?v=gH7k06JgI20",
      thumbnail: "https://img.youtube.com/vi/gH7k06JgI20/hqdefault.jpg",
      duration: "2:43",
    },
  ];

  const handleFetch = async (urlOverride) => {
    const fetchUrl = typeof urlOverride === "string" ? urlOverride : url;
    if (!fetchUrl) return;

    setLoading(true);
    setError("");
    setVideoData(null);

    try {
      // Connect to local backend
      const response = await axios.get(
        `http://localhost:4000/api/info?url=${encodeURIComponent(fetchUrl)}`
      );
      setVideoData(response.data);
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.error ||
          err.message ||
          "Error fetching video. Server might be offline."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestedClick = (suggestedUrl) => {
    setUrl(suggestedUrl);
    handleFetch(suggestedUrl);
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 pt-24 relative overflow-hidden bg-white selection:bg-purple-100 selection:text-purple-900">
      {/* Premium Light Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-purple-200/60 rounded-full mix-blend-multiply filter blur-[100px] animate-blob opacity-70"></div>
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-blue-200/60 rounded-full mix-blend-multiply filter blur-[100px] animate-blob animation-delay-2000 opacity-70"></div>
        <div className="absolute -bottom-32 left-1/3 w-[500px] h-[500px] bg-pink-200/60 rounded-full mix-blend-multiply filter blur-[100px] animate-blob animation-delay-4000 opacity-70"></div>
      </div>

      <div className="w-full max-w-5xl z-10">
        {/* Header */}
        <div className="text-center mb-12 animate-fade-in-up">
          <h1 className="text-6xl md:text-7xl font-black text-slate-900 tracking-tight mb-4 drop-shadow-sm">
            Download{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-fuchsia-600">
              Anything.
            </span>
          </h1>
          <p className="text-lg text-slate-500 font-medium tracking-wide max-w-2xl mx-auto">
            Transform your favorite YouTube videos into high-quality MP3 and MP4
            files instantly with our premium downloader.
          </p>
        </div>

        {/* Main Interface Card */}
        <div className="bg-white/80 backdrop-blur-2xl rounded-[2.5rem] p-1 shadow-[0_20px_50px_rgba(0,0,0,0.05)] animate-fade-in-up animation-delay-2000 mb-20 border border-white/50 ring-1 ring-slate-100">
          <div className="relative rounded-[2.4rem] p-8 md:p-12 overflow-hidden">
            <div className="flex flex-col gap-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                  <div className="p-2 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-lg text-white">
                    <Video size={20} className="fill-current" />
                  </div>
                  YT Downloader
                </h2>
                <div className="flex gap-2">
                  <span className="h-3 w-3 rounded-full bg-slate-200"></span>
                  <span className="h-3 w-3 rounded-full bg-slate-200"></span>
                </div>
              </div>

              {/* Search Input */}
              <div className="relative group/input">
                <div className="absolute -inset-1 bg-gradient-to-r from-violet-200 to-pink-200 rounded-3xl opacity-20 group-hover/input:opacity-50 blur transition duration-500"></div>
                <div className="relative">
                  <input
                    type="text"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="Paste your YouTube link here..."
                    className="w-full bg-white border border-slate-200/60 rounded-2xl py-6 pl-16 pr-40 text-slate-800 placeholder-slate-400 outline-none focus:ring-4 focus:ring-violet-100 focus:border-violet-300 transition-all text-xl font-medium shadow-sm"
                    onKeyDown={(e) => e.key === "Enter" && handleFetch()}
                  />
                  <div className="absolute left-6 top-1/2 -translate-y-1/2 p-2 bg-slate-50 rounded-xl text-slate-400 group-focus-within/input:text-violet-500 group-focus-within/input:bg-violet-50 transition-colors">
                    <Search size={22} />
                  </div>

                  <button
                    onClick={() => handleFetch()}
                    disabled={loading}
                    className="absolute right-3 top-3 bottom-3 bg-slate-900 hover:bg-slate-800 text-white px-8 rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl active:scale-95 flex items-center gap-2"
                  >
                    {loading ? (
                      <Loader2 className="animate-spin" size={20} />
                    ) : (
                      "Fetch"
                    )}
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="p-4 rounded-2xl bg-red-50 border border-red-100 text-red-600 flex items-center gap-3 animate-fade-in">
                  <div className="p-2 bg-white rounded-xl shadow-sm">
                    <AlertCircle size={20} />
                  </div>
                  <span className="font-medium">{error}</span>
                </div>
              )}

              {/* Results */}
              {videoData && (
                <div className="mt-6">
                  <div className="bg-slate-50/80 rounded-[1.5rem] p-6 border border-slate-100 flex flex-col md:flex-row gap-8 items-start animate-fade-in">
                    <div className="relative w-full md:w-80 aspect-video rounded-2xl overflow-hidden shadow-xl shadow-slate-200/50 group/thumb shrink-0 ring-4 ring-white">
                      <img
                        src={videoData.thumbnail}
                        alt="Thumbnail"
                        className="w-full h-full object-cover transition-transform duration-700 group-hover/thumb:scale-105"
                      />
                    </div>

                    <div className="flex-1 w-full pt-2">
                      <h3 className="text-2xl font-bold text-slate-900 mb-2 leading-snug">
                        {videoData.title}
                      </h3>
                      <p className="text-slate-500 mb-8 font-medium flex items-center gap-2">
                        <span className="bg-slate-200 px-2 py-1 rounded-md text-slate-600 text-xs font-bold uppercase tracking-wider">
                          HD
                        </span>
                        <span>
                          Duration: {Math.floor(videoData.duration / 60)}:
                          {(videoData.duration % 60)
                            .toString()
                            .padStart(2, "0")}
                        </span>
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <a
                          href={videoData.link_mp3}
                          download
                          className="group/btn relative overflow-hidden rounded-xl bg-white border border-slate-200 text-slate-700 hover:text-violet-700 hover:border-violet-200 p-4 transition-all flex items-center justify-center gap-3 shadow-sm hover:shadow-md"
                        >
                          <div className="p-2 bg-violet-50 rounded-lg group-hover/btn:bg-violet-100 transition-colors">
                            <Music size={20} className="text-violet-600" />
                          </div>
                          <span className="font-bold">Download MP3</span>
                        </a>
                        <a
                          href={videoData.link_mp4}
                          download
                          className="group/btn relative overflow-hidden rounded-xl bg-white border border-slate-200 text-slate-700 hover:text-pink-700 hover:border-pink-200 p-4 transition-all flex items-center justify-center gap-3 shadow-sm hover:shadow-md"
                        >
                          <div className="p-2 bg-pink-50 rounded-lg group-hover/btn:bg-pink-100 transition-colors">
                            <Video size={20} className="text-pink-600" />
                          </div>
                          <span className="font-bold">Download MP4</span>
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Trending Section */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-slate-800 mb-8 flex items-center gap-4">
            <span>Trending Now</span>
            <div className="h-px flex-1 bg-slate-100"></div>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {suggestedVideos.map((video, index) => (
              <div
                key={index}
                onClick={() => handleSuggestedClick(video.url)}
                className="group cursor-pointer"
              >
                <div className="bg-white border border-slate-100 rounded-2xl p-3 h-full hover:-translate-y-2 transition-transform duration-300 shadow-sm hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:border-violet-100">
                  <div className="aspect-video w-full rounded-xl overflow-hidden mb-4 relative">
                    <img
                      src={video.thumbnail}
                      alt={video.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-slate-900/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[1px]">
                      <div className="bg-white p-3 rounded-full shadow-lg transform scale-50 group-hover:scale-100 transition-transform">
                        <Loader2
                          className="text-violet-600 animate-spin-slow"
                          size={20}
                        />
                      </div>
                    </div>
                    <span className="absolute bottom-2 right-2 bg-white/90 backdrop-blur px-2 py-0.5 rounded-md text-xs text-slate-900 font-bold shadow-sm">
                      {video.duration}
                    </span>
                  </div>
                  <h3 className="text-slate-700 font-bold text-sm line-clamp-2 leading-relaxed group-hover:text-violet-600 transition-colors px-1 mb-1">
                    {video.title}
                  </h3>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Downloader;
