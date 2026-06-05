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
    <div className="fixed inset-0 bg-[#0f0c29]/95 backdrop-blur-xl z-50 flex flex-col items-center justify-center">
      {/* Status */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2">
        <p className="text-white text-sm font-medium px-4 py-2 bg-white/10 rounded-full backdrop-blur-sm">
          {callStatus === "connecting" && "Connecting..."}
          {callStatus === "ringing" && "Ringing..."}
          {callStatus === "connected" && "Connected"}
          {callStatus === "error" && "Connection failed"}
        </p>
      </div>

      {/* Videos */}
      <div className="flex gap-6 items-center">
        {/* Remote Video */}
        <div className="relative">
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-[640px] h-[480px] bg-black/50 rounded-2xl object-cover border border-white/10"
          />
          <p className="absolute bottom-4 left-4 text-white text-sm bg-black/50 px-3 py-1 rounded-lg backdrop-blur-sm">
            {callData.initiator
              ? callData.to?.name
              : callData.callerName || "Caller"}
          </p>
        </div>

        {/* Local Video (PiP) */}
        <div className="absolute bottom-24 right-8">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-48 h-36 bg-black/50 rounded-xl object-cover border-2 border-violet-500/50 shadow-xl"
          />
          <p className="absolute bottom-2 left-2 text-white text-xs bg-black/50 px-2 py-0.5 rounded-md">
            You
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="mt-8 flex gap-4">
        <button
          onClick={handleEndCall}
          className="px-8 py-3 bg-gradient-to-r from-red-500 to-rose-600 text-white font-semibold rounded-xl hover:from-red-400 hover:to-rose-500 transition-all shadow-lg shadow-red-500/30 cursor-pointer flex items-center gap-2"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z"
            />
          </svg>
          End Call
        </button>
      </div>
    </div>
  );
}
