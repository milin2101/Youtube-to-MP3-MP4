import React from "react";

const About = () => {
  return (
    <div className="min-h-screen bg-white text-slate-900 pt-24 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-6 text-violet-600">
          About RapidDown
        </h1>
        <p className="text-slate-600 text-lg mb-4">
          RapidDown is a premium tool designed to make downloading YouTube
          content seamless and beautiful.
        </p>
        <p className="text-slate-500">
          This project was built using React, Vite, Tailwind CSS, and Lucide
          React icons.
        </p>

        <div className="mt-8 p-6 bg-slate-50 border border-slate-100 rounded-xl">
          <h2 className="text-xl font-bold mb-4">How it works</h2>
          <ul className="list-disc list-inside space-y-2 text-slate-600">
            <li>Paste a YouTube Link</li>
            <li>Preview the video details</li>
            <li>Choose your format (MP3 or MP4)</li>
            <li>Download instantly</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default About;
