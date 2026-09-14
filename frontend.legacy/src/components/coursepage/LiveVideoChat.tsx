import React, { useEffect, useRef, useMemo } from "react";

interface LiveVideoChatProps {
  roomId: string;
  onClose: () => void;
}

interface SignalMessage {
  type: string;
  payload: any;
  roomId: string;
}

const LiveVideoChat: React.FC<LiveVideoChatProps> = ({ roomId, onClose }) => {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  // Memoize the ICE server configuration so it doesn't change on every render.
  const pcConfig = useMemo<RTCConfiguration>(() => ({
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
  }), []);

  useEffect(() => {
    // Create WebSocket connection for signaling
    const socket = new WebSocket("ws://localhost:4000");

    socket.onopen = () => {
      console.log("WebSocket connected");
      // Join the specified room
      socket.send(JSON.stringify({ type: "join", roomId }));
    };

    // Create RTCPeerConnection
    const pc = new RTCPeerConnection(pcConfig);

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && socket.readyState === WebSocket.OPEN) {
        socket.send(
          JSON.stringify({
            type: "ice-candidate",
            payload: event.candidate,
            roomId,
          })
        );
      }
    };

    // When remote stream arrives, attach it to the remote video element
    pc.ontrack = (event) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    // Get local stream and add tracks to RTCPeerConnection
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then((stream) => {
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        stream.getTracks().forEach((track) => {
          pc.addTrack(track, stream);
        });
      })
      .catch((error) => {
        console.error("Error accessing media devices.", error);
      });

    // Handle incoming signaling messages
    socket.onmessage = async (messageEvent) => {
      const data: SignalMessage = JSON.parse(messageEvent.data);
      if (data.type === "offer") {
        console.log("Received offer");
        await pc.setRemoteDescription(new RTCSessionDescription(data.payload));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.send(
          JSON.stringify({
            type: "answer",
            payload: answer,
            roomId,
          })
        );
      } else if (data.type === "answer") {
        console.log("Received answer");
        await pc.setRemoteDescription(new RTCSessionDescription(data.payload));
      } else if (data.type === "ice-candidate") {
        console.log("Received ICE candidate");
        try {
          await pc.addIceCandidate(new RTCIceCandidate(data.payload));
        } catch (e) {
          console.error("Error adding received ICE candidate", e);
        }
      }
    };

    // If this peer is the initiator, create an offer after a short delay
    setTimeout(async () => {
      if (socket.readyState === WebSocket.OPEN && pc.signalingState === "stable") {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.send(
          JSON.stringify({
            type: "offer",
            payload: offer,
            roomId,
          })
        );
      }
    }, 2000);

    // Cleanup on component unmount
    return () => {
      pc.close();
      socket.close();
    };
  }, [roomId, pcConfig]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex flex-col items-center justify-center z-50">
      <div className="flex space-x-4">
        <video ref={localVideoRef} autoPlay muted className="w-48 h-36 bg-gray-800 rounded" />
        <video ref={remoteVideoRef} autoPlay className="w-64 h-48 bg-gray-800 rounded" />
      </div>
      <button onClick={onClose} className="mt-4 px-4 py-2 bg-red-600 text-white rounded">
        End Call
      </button>
    </div>
  );
};

export default LiveVideoChat;
