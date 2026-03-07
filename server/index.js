import express from "express";
import cors from "cors";
import { fileURLToPath } from "url";
import { dirname, join, delimiter } from "path";
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
// Try to use the pip-installed yt-dlp first, then fallback to local binaries/names
let ytDlpPath = "yt-dlp";
if (isWindows) {
  ytDlpPath = join(__dirname, "yt-dlp.exe");
} else if (fs.existsSync("/usr/local/bin/yt-dlp")) {
  ytDlpPath = "/usr/local/bin/yt-dlp";
} else if (fs.existsSync(join(__dirname, "yt-dlp"))) {
  ytDlpPath = join(__dirname, "yt-dlp");
}

ffmpeg.setFfmpegPath(ffmpegPath);

const app = express();
const PORT = process.env.PORT || 4000;
const API_URL = process.env.API_URL || `http://localhost:${PORT}`;

// Performance flags for maximum speed
const GLOBAL_YT_ARGS = [
  "--no-warnings",
  "--no-playlist",
  "--no-check-certificate",
  "--force-ipv4",
  "--no-mtime",
  "--remote-components", "ejs:github", // Crucial for downloading the latest JS challenge solvers (Deno script)
];

const getCookiesArg = () => {
  const serverCookies = join(__dirname, "cookies.txt");
  const rootCookies = join(__dirname, "..", "cookies.txt");

  if (fs.existsSync(serverCookies)) {
    return ["--cookies", serverCookies];
  } else if (fs.existsSync(rootCookies)) {
    return ["--cookies", rootCookies];
  }
  return [];
};

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
    const args = [...getCookiesArg(), ...GLOBAL_YT_ARGS, "-s", "-j", videoURL]; // Added -s to just simulate, don't download

    const spawnOptions = {
      env: {
        ...process.env,
        PATH: `${process.env.PATH}${delimiter}/usr/local/bin${delimiter}/usr/bin${delimiter}/bin`
      }
    };

    const ytDlpProcess = spawn(ytDlpPath, args, spawnOptions);

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

        // Parse formats
        const formats = info.formats || [];

        // Audio formats (m4a or webm/webm audio)
        const audioFormats = formats
          .filter(f => f.acodec !== 'none' && f.vcodec === 'none')
          .sort((a, b) => (b.abr || 0) - (a.abr || 0))
          .map(f => ({
            format_id: f.format_id,
            ext: f.ext,
            quality: f.abr ? `${Math.round(f.abr)}kbps` : 'Audio',
            label: `Audio (${f.ext}) - ${f.abr ? Math.round(f.abr) + 'kbps' : 'Unknown'}`
          }));

        // Video formats (we want only video tracks since yt-dlp will merge best audio)
        // Group by resolution height to avoid duplicates
        const videoResMap = new Map();
        formats
          .filter(f => f.vcodec !== 'none' && f.video_ext === 'mp4' && f.format_note !== 'storyboard')
          .forEach(f => {
            if (f.height && !videoResMap.has(f.height)) {
              // Prefer the single stream if it has both audio and video, otherwise just video stream
              const hasAudio = f.acodec !== 'none';
              // Format: format_id + bestaudio (string concatenation handled by yt-dlp logic later)
              // For the UI, we just send the generic video resolution
              videoResMap.set(f.height, {
                format_id: f.format_id,
                height: f.height,
                resolution: `${f.height}p`,
                fps: f.fps,
                hasAudio: hasAudio,
                ext: 'mp4',
                label: `Video ${f.height}p (MP4)`
              });
            }
          });

        const videoFormats = Array.from(videoResMap.values())
          .sort((a, b) => b.height - a.height);

        res.json({
          title: info.title,
          thumbnail: thumbnail,
          duration: info.duration,
          audioFormats: audioFormats,
          videoFormats: videoFormats,
          // Keeping legacy links just for backward compatibility if needed temporarily
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



// Endpoint to download video/audio (with quality selection & merging)
app.get("/api/download", async (req, res) => {
  const { url, format, title, isAudio } = req.query;
  const safeTitle =
    (title || "download").replace(/[^\w\s]/gi, "").trim() || "download";

  console.log(`Requested download for: ${safeTitle} | Format: ${format} | isAudio: ${isAudio}`);

  // Set headers for file download
  const ext = isAudio === 'true' ? 'mp3' : 'mp4';
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${safeTitle}.${ext}"`,
  );
  res.setHeader("Content-Type", isAudio === 'true' ? "audio/mpeg" : "video/mp4");

  let ytArgs = [...GLOBAL_YT_ARGS];

  // If no specific format is requested (legacy fallback)
  if (!format || format === 'mp3' || format === 'mp4') {
    if (format === "mp3" || isAudio === 'true') {
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

    const args = [...getCookiesArg(), ...ytArgs];
    const spawnOptions = { env: { ...process.env, PATH: `${process.env.PATH}${delimiter}/usr/local/bin${delimiter}/usr/bin${delimiter}/bin` } };
    const ytDlpProcess = spawn(ytDlpPath, args, spawnOptions);
    ytDlpProcess.stdout.pipe(res);
    ytDlpProcess.on("close", (code) => console.log(`Legacy Download finished with code ${code}`));
    req.on("close", () => { if (ytDlpProcess.exitCode === null) { try { ytDlpProcess.kill(); } catch (e) { } } });
    return;
  }

  // Handle specific quality requested from the UI:

  if (isAudio === 'true') {
    // For audio, we can still stream to stdout
    ytArgs.push(
      url,
      "--ffmpeg-location",
      ffmpegPath,
      "-f",
      format, // The specific audio format ID
      "-x",
      "--audio-format",
      "mp3",
      "--audio-quality",
      "0", // Best VBR
      "-o",
      "-",
    );

    const args = [...getCookiesArg(), ...ytArgs];
    const spawnOptions = { env: { ...process.env, PATH: `${process.env.PATH}${delimiter}/usr/local/bin${delimiter}/usr/bin${delimiter}/bin` } };
    const ytDlpProcess = spawn(ytDlpPath, args, spawnOptions);
    ytDlpProcess.stdout.pipe(res);
    ytDlpProcess.on("close", (code) => console.log(`Audio Download finished with code ${code}`));
    req.on("close", () => { if (ytDlpProcess.exitCode === null) { try { ytDlpProcess.kill(); } catch (e) { } } });
    return;
  }

  // --- VIDEO MERGING (Requires Temp File) ---
  // If the user selects e.g. 1080p, yt-dlp usually has to download video+audio and merge.
  // We cannot use `-o -` for merged formats reliably, so we use a temp file.

  const tmpDir = os.tmpdir();
  // Create a unique temporary file name
  const tempFileId = Math.random().toString(36).substring(2, 15);
  const tempOutputFile = join(tmpDir, `yt_${tempFileId}.${ext}`);

  console.log(`Downloading merged video to temp file: ${tempOutputFile}`);

  // Request the specific video format + best audio, and merge to mp4
  ytArgs.push(
    url,
    "--ffmpeg-location",
    ffmpegPath,
    "-f",
    `${format}+bestaudio[ext=m4a]/bestaudio/best`,
    "--merge-output-format",
    "mp4",
    "-o",
    tempOutputFile
  );

  const args = [...getCookiesArg(), ...ytArgs];
  const spawnOptions = { env: { ...process.env, PATH: `${process.env.PATH}${delimiter}/usr/local/bin${delimiter}/usr/bin${delimiter}/bin` } };
  const ytDlpProcess = spawn(ytDlpPath, args, spawnOptions);

  ytDlpProcess.stderr.on('data', (data) => {
    // Log progress optionally, or keep it quiet to prevent log spam
    // console.log(`[yt-dlp log]: ${data}`);
  });

  ytDlpProcess.on("close", (code) => {
    console.log(`Video Download+Merge finished with code ${code}`);

    if (code === 0 && fs.existsSync(tempOutputFile)) {
      // Stream the completed file to the user
      const startStream = fs.createReadStream(tempOutputFile);
      startStream.pipe(res);

      startStream.on('end', () => {
        // Delete temp file after streaming finishes
        fs.unlink(tempOutputFile, (err) => {
          if (err) console.error("Error deleting temp file:", err);
          else console.log(`Deleted temp file: ${tempOutputFile}`);
        });
      });

      startStream.on('error', (err) => {
        console.error("Error streaming temp file:", err);
        res.end();
      });

    } else {
      console.error("Failed to download or merge video");
      res.status(500).end("Failed to process high-quality video.");
    }
  });

  // If the user cancels the request before finishing download/merge
  req.on("close", () => {
    if (ytDlpProcess.exitCode === null) {
      console.log("Client disconnected, murdering yt-dlp process and cleaning up...");
      try { ytDlpProcess.kill(); } catch (e) { }
      // Give it a moment to release file locks, then delete
      setTimeout(() => {
        if (fs.existsSync(tempOutputFile)) {
          fs.unlink(tempOutputFile, () => { });
        }
      }, 2000);
    }
  });
});

// Catch-all: serve React app for any non-API route (Express v5 compatible)
app.use((req, res, next) => {
  const indexHtml = join(distPath, 'index.html');
  if (!req.path.startsWith('/api') && fs.existsSync(indexHtml)) {
    res.sendFile(indexHtml);
  } else {
    next();
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});
