import express from "express";
import cors from "cors";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { spawn } from "child_process";
import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "ffmpeg-static";
import fs from "fs";
import os from "os";
import dotenv from "dotenv";

dotenv.config();

// Set up paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Detect OS for yt-dlp path
const isWindows = os.platform() === "win32";
// On Render (Linux), we expect yt-dlp to be in the server directory (downloaded via postinstall) or in PATH
const ytDlpPath = isWindows
  ? join(__dirname, "yt-dlp.exe")
  : (fs.existsSync(join(__dirname, "yt-dlp")) ? join(__dirname, "yt-dlp") : "yt-dlp");

ffmpeg.setFfmpegPath(ffmpegPath);

const app = express();
const PORT = process.env.PORT || 4000;
const API_URL = process.env.API_URL || `http://localhost:${PORT}`;

// Performance flags and JS runtime for maximum speed
const GLOBAL_YT_ARGS = [
  "--no-warnings",
  "--no-playlist",
  "--no-check-certificate",
  "--force-ipv4",
  "--no-check-formats",
  "--no-mtime",
  "--user-agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
  "--referer", "https://www.youtube.com/",
  "--extractor-args", "youtube:player_client=web,mweb,tv,ios,android",
  "--add-header", "Accept:text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
  "--add-header", "Accept-Language:en-US,en;q=0.9",
];

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "*",
    methods: ["GET", "POST"],
    credentials: true,
  }),
);
app.use(express.json());

// Serve the built React frontend (only if dist exists, i.e. production)
const distPath = join(__dirname, '..', 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
}

// Endpoint to get video details
app.get("/api/info", async (req, res) => {
  console.log("Received info request for:", req.query.url);
  try {
    const videoURL = req.query.url;
    if (
      !videoURL ||
      (!videoURL.includes("youtube.com") && !videoURL.includes("youtu.be"))
    ) {
      return res.status(400).json({ error: "Invalid YouTube URL" });
    }

    console.log("Spawning yt-dlp for info...");
    const ytDlpProcess = spawn(ytDlpPath, [...GLOBAL_YT_ARGS, "-j", videoURL]);

    let outputData = "";
    let errorData = "";

    ytDlpProcess.stdout.on("data", (chunk) => {
      outputData += chunk;
    });

    ytDlpProcess.stderr.on("data", (chunk) => {
      errorData += chunk;
    });

    ytDlpProcess.on("close", (code) => {
      if (code !== 0) {
        console.error("yt-dlp error:", errorData);
        return res.status(500).json({
          error: "Failed to fetch video details.",
          details: errorData.trim(),
        });
      }

      try {
        const info = JSON.parse(outputData);
        console.log("Successfully fetched info via yt-dlp for:", info.title);

        const thumbnail =
          info.thumbnail ||
          (info.thumbnails && info.thumbnails.length > 0
            ? info.thumbnails[info.thumbnails.length - 1].url
            : "");

        res.json({
          title: info.title,
          thumbnail: thumbnail,
          duration: info.duration,
          link_mp4: `${API_URL}/api/download?url=${encodeURIComponent(
            videoURL,
          )}&format=mp4&title=${encodeURIComponent(info.title)}`,
          link_mp3: `${API_URL}/api/download?url=${encodeURIComponent(
            videoURL,
          )}&format=mp3&title=${encodeURIComponent(info.title)}`,
        });
      } catch (parseError) {
        res.status(500).json({ error: "Failed to parse video details." });
      }
    });
  } catch (error) {
    res.status(500).json({
      error: "Failed to fetch video details: " + error.message,
    });
  }
});

// Endpoint to get trending videos
app.get("/api/trending", async (req, res) => {
  console.log("Fetching trending videos...");
  try {
    const query = "ytsearch4:trending music";
    const ytDlpProcess = spawn(ytDlpPath, [
      ...GLOBAL_YT_ARGS,
      "--dump-json",
      "--flat-playlist",
      "--playlist-end",
      "4",
      query,
    ]);

    let outputData = "";

    ytDlpProcess.stdout.on("data", (chunk) => {
      outputData += chunk;
    });

    ytDlpProcess.on("close", (code) => {
      if (code !== 0) {
        return res
          .status(500)
          .json({ error: "Failed to fetch trending videos" });
      }

      try {
        const lines = outputData.trim().split("\n");
        const trendingVideos = lines.map((line) => {
          const info = JSON.parse(line);
          return {
            title: info.title,
            url: `https://www.youtube.com/watch?v=${info.id}`,
            thumbnail: `https://i.ytimg.com/vi/${info.id}/hqdefault.jpg`,
            duration: new Date(info.duration * 1000)
              .toISOString()
              .substr(14, 5),
          };
        });

        res.json(trendingVideos);
      } catch (parseError) {
        res.status(500).json({ error: "Failed to parse trending videos" });
      }
    });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Endpoint to download video/audio (Turbo STREAMING)
app.get("/api/download", async (req, res) => {
  const { url, format, title } = req.query;
  const safeTitle =
    (title || "download").replace(/[^\w\s]/gi, "").trim() || "download";

  console.log(`Streaming ${format} for: ${safeTitle}`);

  // Set headers for file download
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${safeTitle}.${format}"`,
  );
  res.setHeader("Content-Type", format === "mp3" ? "audio/mpeg" : "video/mp4");

  let ytArgs = [...GLOBAL_YT_ARGS];

  if (format === "mp3") {
    ytArgs.push(
      url,
      "--ffmpeg-location",
      ffmpegPath,
      "-x",
      "--audio-format",
      "mp3",
      "--audio-quality",
      "0",
      "-o",
      "-",
    );
  } else {
    // Picking a single best format to allow direct streaming without merging (merging is slow)
    ytArgs.push(
      url,
      "--ffmpeg-location",
      ffmpegPath,
      "-f",
      "best[ext=mp4]/best",
      "-o",
      "-",
    );
  }

  const ytDlpProcess = spawn(ytDlpPath, ytArgs);

  // Pipe directly to response
  ytDlpProcess.stdout.pipe(res);

  ytDlpProcess.on("close", (code) => {
    console.log(`Download finished with code ${code}`);
  });

  // CRITICAL: Fix EPERM error on Windows by checking if process is still alive
  req.on("close", () => {
    if (ytDlpProcess.exitCode === null) {
      try {
        ytDlpProcess.kill();
      } catch (e) {
        // Ignore kill errors
      }
    }
  });
});

// Catch-all: serve React app for any non-API route (Express v5 syntax)
const indexHtml = join(distPath, 'index.html');
if (fs.existsSync(indexHtml)) {
  app.get('/(.*)', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(indexHtml);
    }
  });
}

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});
