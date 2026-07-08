import { useEffect, useRef, useState } from "react";
import SimplePeer from "simple-peer";

export default function VideoCall({ socket, callData, currentUser, onEndCall }) {
  const [stream, setStream] = useState(null);
  const [callStatus, setCallStatus] = useState("connecting");
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerRef = useRef(null);

  useEffect(() => {
    startMedia();

    return () => {
      cleanup();
    };
  }, []);

  const startMedia = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      setStream(mediaStream);

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
  };

  const cleanup = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
    if (peerRef.current) {
      peerRef.current.destroy();
    }
    socket.off("call-accepted");
  };

  const handleEndCall = () => {
    cleanup();
    onEndCall();
  };

  return (
    <div className="absolute inset-0 bg-black/95 z-50 flex items-center justify-center backdrop-blur-2xl animate-in fade-in duration-500">
      <div className="relative w-full h-full md:h-auto md:max-w-5xl md:aspect-video bg-[#0f0c29]/80 md:rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] border-0 md:border border-white/10">
        
        {/* Remote Video (Full Screen) */}
        <video
          ref={remoteVideoRef}
          autoPlay
          className={`w-full h-full object-cover transition-opacity duration-1000 ${callStatus === "connected" ? "opacity-100" : "opacity-0"}`}
        />
        
        {/* Connecting State */}
        {callStatus !== "connected" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-[#0f0c29] to-[#13102e]">
            <div className="w-20 h-20 rounded-full border-4 border-violet-500 border-t-transparent animate-spin mb-6"></div>
            <p className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-cyan-400 text-xl font-bold tracking-wide animate-pulse">
              {callStatus === "connecting" && "Connecting..."}
              {callStatus === "ringing" && "Ringing..."}
              {callStatus === "error" && "Connection failed"}
            </p>
          </div>
        )}

        {/* Local Video (PiP) */}
        <div className="absolute bottom-24 right-4 md:bottom-8 md:right-8 w-32 md:w-56 aspect-video bg-black rounded-xl md:rounded-2xl overflow-hidden shadow-2xl border-2 border-emerald-500/50 hover:scale-105 transition-transform duration-300 z-10">
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
        <div className="absolute bottom-6 md:bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 md:gap-6 px-6 md:px-8 py-3 md:py-4 bg-black/40 backdrop-blur-xl border border-white/10 rounded-full shadow-2xl animate-in slide-in-from-bottom-5 duration-500 z-20">
          <button
            onClick={handleEndCall}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-full font-bold tracking-wide hover:from-red-500 hover:to-rose-500 transition-all cursor-pointer shadow-[0_0_15px_rgba(225,29,72,0.5)] hover:shadow-[0_0_25px_rgba(225,29,72,0.7)] hover:-translate-y-1"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z" />
            </svg>
            End Call
          </button>
        </div>
      </div>
    </div>
  );
}
