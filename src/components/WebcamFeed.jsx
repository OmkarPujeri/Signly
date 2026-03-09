import { forwardRef, useState } from 'react';

const WebcamFeed = forwardRef(({ isLoading, error }, ref) => {
  // Extract the refs passed down
  const { videoRef, canvasRef } = ref;
  const [videoReady, setVideoReady] = useState(false);

  return (
    <div className={`relative w-full aspect-video rounded-2xl overflow-hidden shadow-2xl border-4 border-white/10 transition-colors duration-300 ${videoReady ? 'bg-black' : 'bg-[#F5F0E8]'}`}>
      {/* INITIALIZING AI Spinner - Hide when video is ready */}
      {(!videoReady || (isLoading && !error)) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-30 bg-[#F5F0E8]">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-accent-green border-t-transparent mb-4"></div>
          <p className="text-xs font-black uppercase tracking-widest text-dark-muted">Initializing AI...</p>
        </div>
      )}
      
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-900/20 z-30 p-6 text-center">
          <p className="text-red-500 font-black uppercase tracking-widest text-xs bg-white px-4 py-2 rounded-xl shadow-lg border-2 border-red-500/20">{error}</p>
        </div>
      )}

      <video
        ref={videoRef}
        onLoadedData={() => setVideoReady(true)}
        className="absolute inset-0 w-full h-full object-cover transform -scale-x-100"
        style={{ display: videoReady ? 'block' : 'none' }}
        playsInline
        muted
      />
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full object-cover z-10 pointer-events-none transform -scale-x-100"
        style={{ display: videoReady ? 'block' : 'none' }}
      />
    </div>
  );
});

WebcamFeed.displayName = 'WebcamFeed';
export default WebcamFeed;
