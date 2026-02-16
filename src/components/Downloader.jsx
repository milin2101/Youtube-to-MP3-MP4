import React, { useState, useEffect } from "react";
import { Search, Music, Video, Loader2, AlertCircle, TrendingUp, Sparkles, Download } from "lucide-react";
import axios from "axios";

const Downloader = () => {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [videoData, setVideoData] = useState(null);
  const [error, setError] = useState("");
  const [suggestedVideos, setSuggestedVideos] = useState([]);
  const [trendingLoading, setTrendingLoading] = useState(true);
  const [downloadingFormat, setDownloadingFormat] = useState(null); // 'mp3' or 'mp4'

  useEffect(() => {
    fetchTrending();
  }, []);

  const fetchTrending = async () => {
    try {
      setTrendingLoading(true);
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:4000";
      const response = await axios.get(`${apiUrl}/api/trending`);
      setSuggestedVideos(response.data);
    } catch (err) {
      console.error("Failed to fetch trending:", err);
      // Fallback to empty or some default if needed
    } finally {
      setTrendingLoading(false);
    }
  };

  const handleFetch = async (urlOverride) => {
    const fetchUrl = typeof urlOverride === "string" ? urlOverride : url;
    if (!fetchUrl) return;

    setLoading(true);
    setError("");
    setVideoData(null);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:4000";
      const response = await axios.get(
        `${apiUrl}/api/info?url=${encodeURIComponent(fetchUrl)}`
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

  const handleDownload = async (downloadUrl, format, title) => {
    try {
      setDownloadingFormat(format);
      const response = await axios({
        url: downloadUrl,
        method: 'GET',
        responseType: 'blob', // Important for handling direct downloads
      });

      // Create a temporary link to trigger the download
      const blob = new Blob([response.data]);
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `${title || 'download'}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(link.href);
    } catch (err) {
      console.error("Download failed:", err);
      setError("Download failed. The server might be busy or YouTube has blocked the request.");
    } finally {
      setDownloadingFormat(null);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 relative z-10">
      {/* Search Container */}
      <div className="relative max-w-3xl mx-auto mb-20 animate-fade-in-up animation-delay-200">
        <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl blur opacity-25 group-focus-within:opacity-50 transition duration-1000"></div>
        <div className="relative flex items-center bg-[#0f172a]/80 backdrop-blur-xl border border-white/10 rounded-2xl p-2 shadow-2xl">
          <div className="flex-1 relative">
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Paste YouTube video link here..."
              className="w-full bg-transparent border-none py-4 pl-12 pr-4 text-white placeholder-slate-500 outline-none text-lg font-medium"
              onKeyDown={(e) => e.key === "Enter" && handleFetch()}
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
          </div>
          <button
            onClick={() => handleFetch()}
            disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3 rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-indigo-500/20 active:scale-95 whitespace-nowrap"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : <><Sparkles size={18} /> Fetch Video</>}
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="max-w-2xl mx-auto mb-12 p-4 rounded-xl bg-red-400/10 border border-red-400/20 text-red-400 flex items-center gap-3 animate-fade-in">
          <AlertCircle size={20} />
          <span className="font-medium text-sm">{error}</span>
        </div>
      )}

      {/* Results Section */}
      {videoData && (
        <div className="max-w-4xl mx-auto mb-24 animate-fade-in">
          <div className="glass rounded-[2rem] overflow-hidden border border-white/10 shadow-3xl">
            <div className="flex flex-col md:flex-row">
              <div className="w-full md:w-[400px] aspect-video relative overflow-hidden group">
                <img
                  src={videoData.thumbnail}
                  alt="Thumbnail"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "https://i.ytimg.com/vi/" + url.split("v=")[1]?.split("&")[0] + "/hqdefault.jpg";
                  }}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-6">
                   <div className="bg-white/10 backdrop-blur-md px-3 py-1 rounded-lg text-xs font-bold text-white border border-white/10 uppercase tracking-widest">
                    {Math.floor(videoData.duration / 60)}:{(videoData.duration % 60).toString().padStart(2, "0")}
                  </div>
                </div>
              </div>

              <div className="flex-1 p-8 md:p-10 flex flex-col justify-center">
                <h3 className="text-2xl font-bold text-white mb-4 leading-snug line-clamp-2">
                  {videoData.title}
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                  <button
                    onClick={() => handleDownload(videoData.link_mp3, 'mp3', videoData.title)}
                    disabled={!!downloadingFormat}
                    className="group relative overflow-hidden rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 p-4 transition-all flex items-center justify-between disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-indigo-500/20 rounded-lg group-hover:bg-indigo-500/30 transition-colors">
                        {downloadingFormat === 'mp3' ? (
                          <Loader2 size={20} className="text-indigo-400 animate-spin" />
                        ) : (
                          <Music size={20} className="text-indigo-400" />
                        )}
                      </div>
                      <span className="font-bold text-slate-200">
                        {downloadingFormat === 'mp3' ? 'Processing...' : 'Audio MP3'}
                      </span>
                    </div>
                    {downloadingFormat !== 'mp3' && <Download size={18} className="text-slate-500 group-hover:text-white transition-colors" />}
                  </button>

                  <button
                    onClick={() => handleDownload(videoData.link_mp4, 'mp4', videoData.title)}
                    disabled={!!downloadingFormat}
                    className="group relative overflow-hidden rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 p-4 transition-all flex items-center justify-between disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-pink-500/20 rounded-lg group-hover:bg-pink-500/30 transition-colors">
                        {downloadingFormat === 'mp4' ? (
                          <Loader2 size={20} className="text-pink-400 animate-spin" />
                        ) : (
                          <Video size={20} className="text-pink-400" />
                        )}
                      </div>
                      <span className="font-bold text-slate-200">
                         {downloadingFormat === 'mp4' ? 'Processing...' : 'Video MP4'}
                      </span>
                    </div>
                    {downloadingFormat !== 'mp4' && <Download size={18} className="text-slate-500 group-hover:text-white transition-colors" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Trending Section */}
      <div className="animate-fade-in-up animation-delay-400">
        <div className="flex items-center gap-4 mb-10">
          <div className="p-2 bg-indigo-500/20 rounded-lg">
            <TrendingUp size={20} className="text-indigo-400" />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Trending Now</h2>
          <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent"></div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {trendingLoading ? (
            [...Array(4)].map((_, i) => (
              <div key={i} className="glass-card rounded-2xl p-3 animate-pulse">
                <div className="aspect-video w-full bg-white/5 rounded-xl mb-4"></div>
                <div className="h-4 bg-white/5 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-white/5 rounded w-1/2"></div>
              </div>
            ))
          ) : (
            suggestedVideos.map((video, index) => (
              <div
                key={index}
                onClick={() => handleSuggestedClick(video.url)}
                className="group cursor-pointer glass-card rounded-2xl overflow-hidden p-3"
              >
                <div className="aspect-video w-full rounded-xl overflow-hidden mb-4 relative">
                  <img
                    src={video.thumbnail}
                    alt={video.title}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = video.thumbnail.replace("i.ytimg.com", "img.youtube.com");
                    }}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center backdrop-blur-[2px]">
                     <div className="bg-white text-black p-3 rounded-full shadow-2xl transform scale-50 group-hover:scale-100 transition-transform">
                      <Download size={18} />
                     </div>
                  </div>
                  <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded text-[10px] text-white font-bold border border-white/10">
                    {video.duration}
                  </div>
                </div>
                <h3 className="text-slate-300 font-bold text-sm line-clamp-2 leading-relaxed group-hover:text-white transition-colors px-1">
                  {video.title}
                </h3>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Downloader;
