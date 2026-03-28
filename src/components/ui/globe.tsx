'use client';

import React from 'react';

const Globe: React.FC = () => {
  return (
    <>
      <style>{`
        @keyframes earthRotate {
          0% { background-position: 0 0; }
          100% { background-position: 400px 0; }
        }
        @keyframes twinkling { 0%, 100% { opacity: 0.1; } 50% { opacity: 1; } }
        @keyframes twinkling-slow { 0%, 100% { opacity: 0.1; } 50% { opacity: 1; } }
        @keyframes twinkling-long { 0%, 100% { opacity: 0.1; } 50% { opacity: 1; } }
        @keyframes twinkling-fast { 0%, 100% { opacity: 0.1; } 50% { opacity: 1; } }
      `}</style>
      <div className="flex h-screen items-center justify-center">
        <div
          className="relative h-[250px] w-[250px] overflow-hidden rounded-full shadow-[0_18px_45px_rgba(30,64,175,0.20),-10px_-8px_28px_rgba(191,219,254,0.75)_inset,8px_8px_22px_rgba(30,64,175,0.18)_inset]"
          style={{
            backgroundImage: "url('https://pub-940ccf6255b54fa799a9b01050e6c227.r2.dev/globe.jpeg')",
            backgroundSize: 'cover',
            backgroundPosition: 'left',
            animation: 'earthRotate 30s linear infinite',
          }}
        >
          <div className="absolute left-[-20px] h-1 w-1 rounded-full bg-blue-300" style={{ animation: 'twinkling 3s infinite' }} />
          <div className="absolute left-[-40px] top-[30px] h-1 w-1 rounded-full bg-blue-300" style={{ animation: 'twinkling-slow 2s infinite' }} />
          <div className="absolute left-[350px] top-[90px] h-1 w-1 rounded-full bg-blue-300" style={{ animation: 'twinkling-long 4s infinite' }} />
          <div className="absolute left-[200px] top-[290px] h-1 w-1 rounded-full bg-blue-300" style={{ animation: 'twinkling 3s infinite' }} />
          <div className="absolute left-[50px] top-[270px] h-1 w-1 rounded-full bg-blue-300" style={{ animation: 'twinkling-fast 1.5s infinite' }} />
          <div className="absolute left-[250px] top-[-50px] h-1 w-1 rounded-full bg-blue-300" style={{ animation: 'twinkling-long 4s infinite' }} />
          <div className="absolute left-[290px] top-[60px] h-1 w-1 rounded-full bg-blue-300" style={{ animation: 'twinkling-slow 2s infinite' }} />
        </div>
      </div>
    </>
  );
};

export default Globe;
