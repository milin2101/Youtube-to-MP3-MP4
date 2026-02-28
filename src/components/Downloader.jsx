import React, { useState, useEffect } from "react";
import { Search, Music, Video, Loader2, AlertCircle, Sparkles, Download } from "lucide-react";
import axios from "axios";

const Downloader = () => {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [videoData, setVideoData] = useState(null);
  const [error, setError] = useState("");
  const [downloadingFormat, setDownloadingFormat] = useState(null); // 'mp3' or 'mp4'

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
      <div className="relative max-w-3xl mx-auto mb-16">
        <div className="relative flex items-center bg-slate-800 border border-slate-700 rounded-2xl p-2 shadow-lg">
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
        <div className="max-w-2xl mx-auto mb-12 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center gap-3">
          <AlertCircle size={20} />
          <span className="font-medium text-sm">{error}</span>
        </div>
      )}

      {/* Results Section */}
      {videoData && (
        <div className="max-w-4xl mx-auto mb-16">
          <div className="bg-slate-800 rounded-[2rem] overflow-hidden border border-slate-700 shadow-xl">
            <div className="flex flex-col md:flex-row">
              <div className="w-full md:w-[400px] aspect-video relative overflow-hidden group">
                <img
                  src={videoData.thumbnail}
                  alt="Thumbnail"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "https://i.ytimg.com/vi/" + url.split("v=")[1]?.split("&")[0] + "/hqdefault.jpg";
                  }}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-6">
                  <div className="bg-slate-800/80 px-3 py-1 rounded-lg text-xs font-bold text-white uppercase tracking-widest">
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

    </div>
  );
};

export default Downloader;
