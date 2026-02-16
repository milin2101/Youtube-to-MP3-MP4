import React from "react";
import { Shield, Zap, Heart, Star, Globe, Smartphone } from "lucide-react";

export default function About() {
  const features = [
    {
      icon: <Zap className="text-indigo-400" size={24} />,
      title: "Lightning Fast",
      description: "Convert and download your favorite videos in seconds with our optimized server technology."
    },
    {
      icon: <Shield className="text-indigo-400" size={24} />,
      title: "Secure & Clean",
      description: "No ads, no malware, no tracking. Your privacy and security are our top priorities."
    },
    {
      icon: <Globe className="text-indigo-400" size={24} />,
      title: "Universal",
      description: "Works on any device. Desktop, tablet, or smartphone - experience RapidDown everywhere."
    },
    {
      icon: <Star className="text-indigo-400" size={24} />,
      title: "Premium Quality",
      description: "Extract audio and video in the highest possible quality available for the content."
    }
  ];

  return (
    <div className="relative min-h-screen bg-[#020617] text-white pt-40 pb-20">
      {/* Background Blobs */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-5%] right-[-5%] w-[500px] h-[500px] bg-indigo-600/10 rounded-full mix-blend-screen filter blur-[100px] animate-blob"></div>
        <div className="absolute bottom-[-10%] left-[-5%] w-[600px] h-[600px] bg-purple-600/10 rounded-full mix-blend-screen filter blur-[120px] animate-blob animation-delay-2000"></div>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6">
        <div className="text-center mb-24 animate-fade-in-up">
           <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 bg-clip-text text-transparent bg-gradient-to-b from-white to-slate-400">
            Engineered for <span className="text-indigo-400">Simplicity.</span>
          </h1>
          <p className="text-xl text-slate-400 max-w-3xl mx-auto font-medium leading-relaxed">
            RapidDown was born from a simple idea: downloading content should be as beautiful as the content itself. We've built the world's most elegant tool for content conversion.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-32 animate-fade-in-up animation-delay-200">
          {features.map((feature, index) => (
            <div key={index} className="glass-card p-10 rounded-3xl group border border-white/5">
              <div className="w-14 h-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500">
                {feature.icon}
              </div>
              <h3 className="text-2xl font-bold text-white mb-4 tracking-tight">{feature.title}</h3>
              <p className="text-slate-400 leading-relaxed font-medium">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        <div className="glass p-12 md:p-20 rounded-[3rem] text-center border border-white/10 animate-fade-in-up animation-delay-400">
          <Heart className="text-pink-500 fill-pink-500 mx-auto mb-10 animate-pulse" size={48} />
          <h2 className="text-4xl font-bold text-white mb-8 tracking-tighter">Built by enthusiasts, for enthusiasts.</h2>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto font-medium leading-relaxed mb-12">
            We believe in an open web where you can access your favorite media offline, whenever you want. RapidDown is and will always be free to use.
          </p>
          <div className="h-px w-24 bg-indigo-500 mx-auto"></div>
        </div>
      </div>
    </div>
  );
}
