import { useEffect, useRef, useState, useCallback } from "react";
import SimplePeer from "simple-peer";

export default function VideoCall({ socket, callData, currentUser, onEndCall }) {
   const [stream, setStream] = useState(null);
   const [callStatus, setCallStatus] = useState("connecting");
   const [isMuted, setIsMuted] = useState(false);
   const localVideoRef = useRef(null);
   const remoteVideoRef = useRef(null);
   const peerRef = useRef(null);
   const streamRef = useRef(null);
 
   const cleanup = useCallback(() => {
     const activeStream = streamRef.current;
     if (activeStream) {
       activeStream.getTracks().forEach((track) => track.stop());
     }
     if (peerRef.current) {
       peerRef.current.destroy();
       peerRef.current = null;
     }
     socket.off("call-accepted");
   }, [socket]);
 
   const startMedia = useCallback(async () => {
     try {
       const mediaStream = await navigator.mediaDevices.getUserMedia({
         video: true,
         audio: true,
       });
       setStream(mediaStream);
       streamRef.current = mediaStream;
 
       if (localVideoRef.current) {
         localVideoRef.current.srcObject = mediaStream;
       }
 
       if (callData.initiator) {
         // Caller: create peer as initiator
         const peer = new SimplePeer({
           initiator: true,
           trickle: false,
           stream: mediaStream,
           config: {
             iceServers: [
               { urls: "stun:stun.l.google.com:19302" },
               { urls: "stun:stun1.l.google.com:19302" },
               { urls: "stun:stun2.l.google.com:19302" },
             ],
           },
         });
 
         peer.on("signal", (signal) => {
           socket.emit("call-user", {
             to: callData.to._id,
             signal,
             from: currentUser.id,
             name: currentUser.name,
           });
         });
 
         peer.on("stream", (remoteStream) => {
           if (remoteVideoRef.current) {
             remoteVideoRef.current.srcObject = remoteStream;
           }
           setCallStatus("connected");
         });
 
         peer.on("error", (err) => {
           console.error("Peer error:", err);
           setCallStatus("error");
         });
 
         // Listen for call acceptance
         socket.on("call-accepted", (data) => {
           peer.signal(data.signal);
           setCallStatus("connected");
         });
 
         peerRef.current = peer;
         setCallStatus("ringing");
       } else {
         // Callee: create peer and signal back
         const peer = new SimplePeer({
           initiator: false,
           trickle: false,
           stream: mediaStream,
           config: {
             iceServers: [
               { urls: "stun:stun.l.google.com:19302" },
               { urls: "stun:stun1.l.google.com:19302" },
               { urls: "stun:stun2.l.google.com:19302" },
             ],
           },
         });
 
         peer.on("signal", (signal) => {
           socket.emit("accept-call", {
             to: callData.to,
             signal,
           });
         });
 
         peer.on("stream", (remoteStream) => {
           if (remoteVideoRef.current) {
             remoteVideoRef.current.srcObject = remoteStream;
           }
           setCallStatus("connected");
         });
 
         peer.on("error", (err) => {
           console.error("Peer error:", err);
           setCallStatus("error");
         });
 
         // Signal with the incoming call data
         peer.signal(callData.incomingSignal);
         peerRef.current = peer;
       }
     } catch (err) {
       console.error("Media error:", err);
       setCallStatus("error");
     }
   }, [callData, currentUser, socket]);
 
   useEffect(() => {
     // eslint-disable-next-line react-hooks/set-state-in-effect
     startMedia();
 
     return () => {
       cleanup();
     };
   }, [startMedia, cleanup]);



  const handleEndCall = () => {
    cleanup();
    onEndCall();
  };

  const toggleMute = () => {
    if (stream && stream.getAudioTracks().length > 0) {
      const audioTrack = stream.getAudioTracks()[0];
      audioTrack.enabled = !audioTrack.enabled;
      setIsMuted(!audioTrack.enabled);
    }
  };

  return (
    <div className="absolute inset-0 bg-black/90 z-50 flex items-center justify-center backdrop-blur-2xl animate-in fade-in duration-500">
      <div className="relative w-full h-full md:h-auto md:max-w-5xl md:aspect-video bg-gradient-to-br from-[#0a0e1a]/90 to-[#12172b]/90 md:rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] border-0 md:border border-white/10">
        
        {/* Remote Video (Full Screen) */}
        <video
          ref={remoteVideoRef}
          autoPlay
          className={`w-full h-full object-cover transition-opacity duration-1000 ${callStatus === "connected" ? "opacity-100" : "opacity-0"}`}
        />
        
        {/* Connecting State */}
        {callStatus !== "connected" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-[#0a0e1a]/95 to-[#12172b]/95 backdrop-blur-md">
            <div className="w-20 h-20 rounded-full border-4 border-violet-500 border-t-transparent animate-spin mb-6"></div>
            <p className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400 text-xl font-bold tracking-wide animate-pulse">
              {callStatus === "connecting" && "Connecting..."}
              {callStatus === "ringing" && "Ringing..."}
              {callStatus === "error" && "Connection failed"}
            </p>
          </div>
        )}

        {/* Local Video (PiP) */}
        <div className="absolute bottom-24 right-4 md:bottom-8 md:right-8 w-32 md:w-56 aspect-video bg-black rounded-xl md:rounded-2xl overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.5)] border border-white/20 hover:scale-105 transition-transform duration-300 z-10 backdrop-blur-md">
          <video
            ref={localVideoRef}
            autoPlay
            muted
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/60 backdrop-blur-md rounded-md text-[10px] text-white font-medium flex items-center gap-1.5">
             <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
             You
          </div>
        </div>

        {/* Controls */}
        <div className="absolute bottom-6 md:bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 md:gap-6 px-6 md:px-8 py-3 md:py-4 bg-white/[0.05] backdrop-blur-2xl border border-white/10 rounded-full shadow-[0_8px_32px_rgba(0,0,0,0.5)] animate-in slide-in-from-bottom-5 duration-500 z-20">
          <button
            onClick={toggleMute}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-lg hover:-translate-y-1 ${
              isMuted 
                ? "bg-red-500/20 text-red-500 hover:bg-red-500/30 border border-red-500/50" 
                : "bg-white/10 text-white hover:bg-white/20 border border-white/20"
            }`}
            title={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" clipRule="evenodd" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2 2m2-2l2 2" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
              </svg>
            )}
          </button>
          
          <button
            onClick={handleEndCall}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-full font-bold tracking-wide hover:from-red-500 hover:to-rose-500 transition-all cursor-pointer shadow-[0_0_15px_rgba(225,29,72,0.5)] hover:shadow-[0_0_25px_rgba(225,29,72,0.7)] hover:-translate-y-1"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16 8l2-2m0 0l2-2m-2 2l-2 2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z" />
            </svg>
            End Call
          </button>
        </div>
      </div>
    </div>
  );
}
