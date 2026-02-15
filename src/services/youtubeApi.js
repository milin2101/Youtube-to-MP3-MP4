import axios from "axios";

// You can get a free key from RapidAPI: https://rapidapi.com/hub
// Popular options: 'youtube-mp36', 'youtube-media-downloader', etc.
// For this demo, we will use a common structure.
// REPLACE THIS WITH YOUR API KEY
const API_KEY = "YOUR_RAPID_API_KEY_HERE";
const API_HOST = "youtube-mp36.p.rapidapi.com";

export const fetchVideoDetails = async (videoId) => {
  const options = {
    method: "GET",
    url: `https://${API_HOST}/dl`,
    params: { id: videoId },
    headers: {
      "x-rapidapi-key": API_KEY,
      "x-rapidapi-host": API_HOST,
    },
  };

  try {
    const response = await axios.request(options);
    return response.data;
  } catch (error) {
    console.error("Error fetching video details:", error);
    throw error;
  }
};

export const extractVideoId = (url) => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
};
