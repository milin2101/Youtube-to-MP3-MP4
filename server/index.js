import express from "express";
import cors from "cors";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { spawn } from "child_process";
import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "ffmpeg-static";
import fs from "fs";

// Set up paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ytDlpPath = join(__dirname, "yt-dlp.exe");

ffmpeg.setFfmpegPath(ffmpegPath);

const app = express();
const PORT = 4000;

app.use(cors());
app.use(express.json());

// Endpoint to get video details
app.get("/api/info", async (req, res) => {
  console.log("Received info request for:", req.query.url);
  try {
    const videoURL = req.query.url;
    // Basic validation
    if (
      !videoURL ||
      (!videoURL.includes("youtube.com") && !videoURL.includes("youtu.be"))
    ) {
      return res.status(400).json({ error: "Invalid YouTube URL" });
    }

    console.log("Spawning yt-dlp for info...");
    const ytDlpProcess = spawn(ytDlpPath, ["-j", videoURL]);

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
          suggestion: "The server might be blocked by YouTube or the URL is invalid."
        });
      }

      try {
        const info = JSON.parse(outputData);
        console.log("Successfully fetched info via yt-dlp for:", info.title);

        // Map yt-dlp format to what frontend expects
        // yt-dlp thumbnails are usually an array, we take the last (highest res usually) or find specific
        const thumbnail =
          info.thumbnail ||
          (info.thumbnails && info.thumbnails.length > 0
            ? info.thumbnails[info.thumbnails.length - 1].url
            : "");

        res.json({
          title: info.title,
          thumbnail: thumbnail,
          duration: info.duration,
          formats: info.formats, // Pass through formats if needed
          link_mp4: `http://localhost:${PORT}/api/download?url=${encodeURIComponent(
            videoURL
          )}&format=mp4`,
          link_mp3: `http://localhost:${PORT}/api/download?url=${encodeURIComponent(
            videoURL
          )}&format=mp3`,
        });
      } catch (parseError) {
        console.error("JSON Parse Error:", parseError);
        res.status(500).json({ error: "Failed to parse video details." });
      }
    });
  } catch (error) {
    console.error("Error details:", error);
    res.status(500).json({
      error: "Failed to fetch video details: " + error.message,
    });
  }
});

// Endpoint to download video/audio
app.get("/api/download", async (req, res) => {
  console.log("Received download request:", req.query);
  const { url, format } = req.query;

  try {
    // 1. Get info for filename using yt-dlp (ytdl-core is blocked)
    let safeTitle = "video_download";
    try {
      console.log("Fetching title via yt-dlp...");
      const titleProcess = spawn(ytDlpPath, ["--get-title", url]);
      let titleData = "";
      for await (const chunk of titleProcess.stdout) {
        titleData += chunk;
      }
      const title = titleData.toString().replace(/[^\w\s]/gi, "");
      safeTitle = title.trim() || "video_download";
      console.log("Title fetched:", safeTitle);
    } catch (e) {
      console.error("Failed to get title via yt-dlp, using default:", e);
    }

    console.log(`Starting download processing for: ${safeTitle} (${format})`);

    // 2. Prepare temp file path - use unique ID to avoid collisions
    const timestamp = Date.now();
    const tempFileName = `temp_${timestamp}.${format}`;
    const tempFilePath = join(__dirname, tempFileName);

    let ytArgs = [];
    if (format === "mp3") {
      // Audio conversion: -x --audio-format mp3
      ytArgs = [
        url,
        "--ffmpeg-location",
        ffmpegPath,
        "-x",
        "--audio-format",
        "mp3",
        "-o",
        tempFilePath,
      ];
    } else {
      // Video: Download best MP4 (merging if needed)
      ytArgs = [
        url,
        "--ffmpeg-location",
        ffmpegPath,
        "-f",
        "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best",
        "-o",
        tempFilePath,
      ];
    }

    console.log(`Spawning yt-dlp to file: ${tempFileName}`);

    const ytDlpProcess = spawn(ytDlpPath, ytArgs);

    ytDlpProcess.stderr.on("data", (d) =>
      console.log(`yt-dlp stderr: ${d.toString()}`)
    );

    ytDlpProcess.on("close", (code) => {
      if (code === 0) {
        console.log("yt-dlp finished. Checking file...");

        // Verify file exists
        if (!fs.existsSync(tempFilePath)) {
          console.error("Temp file DOES NOT EXIST:", tempFilePath);
          if (!res.headersSent)
            return res
              .status(500)
              .send("Server Error: File missing after download. Check server logs.");
        }

        console.log("File exists. Sending to client...");

        // 3. Send the file using res.download
        res.download(tempFilePath, `${safeTitle}.${format}`, (err) => {
          if (err) {
            console.error("Error sending file (res.download):", err);
            if (!res.headersSent)
              res.status(500).send("File Send Error: " + err.message);
          } else {
            console.log("File sent successfully.");
          }

          // 4. Cleanup
          fs.unlink(tempFilePath, (unlinkErr) => {
            if (unlinkErr)
              console.error("Error deleting temp file:", unlinkErr);
            else console.log("Temp file deleted:", tempFileName);
          });
        });
      } else {
        console.error(`yt-dlp exited with error code ${code}`);
        if (!res.headersSent) {
          res.status(500).send(`Download Failed: yt-dlp exited with code ${code}. Check server console for details.`);
        }
        // Try to cleanup if partial file exists
        if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
      }
    });
  } catch (err) {
    console.error("Download Endpoint critical error:", err);
    if (!res.headersSent) res.status(500).send("Server Error: " + err.message);
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
