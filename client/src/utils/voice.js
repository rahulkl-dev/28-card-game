// WebRTC Mesh Voice Controller (Free public STUN servers provided by Google)
const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ]
};

class VoiceChatManager {
  constructor() {
    this.localStream = null;
    this.peers = {}; // socketId -> RTCPeerConnection
    this.socket = null;
    this.roomCode = null;
    this.isMuted = false;
  }

  init(socket, roomCode) {
    this.socket = socket;
    this.roomCode = roomCode;

    // Handle inbound WebRTC signals from other players
    this.socket.on('VOICE_SIGNAL', async ({ senderSocketId, signalData }) => {
      let pc = this.peers[senderSocketId];

      if (signalData.type === 'offer') {
        pc = this.createPeerConnection(senderSocketId);
        await pc.setRemoteDescription(new RTCSessionDescription(signalData));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        this.socket.emit('VOICE_SIGNAL', {
          targetSocketId: senderSocketId,
          signalData: pc.localDescription
        });
      } else if (signalData.type === 'answer') {
        if (pc) await pc.setRemoteDescription(new RTCSessionDescription(signalData));
      } else if (signalData.candidate) {
        if (pc) await pc.addIceCandidate(new RTCIceCandidate(signalData.candidate));
      }
    });

    // When someone else joins voice, offer them a connection
    this.socket.on('PEER_JOINED_VOICE', async ({ socketId }) => {
      const pc = this.createPeerConnection(socketId);
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      this.socket.emit('VOICE_SIGNAL', {
        targetSocketId: socketId,
        signalData: pc.localDescription
      });
    });

    this.socket.on('PEER_LEFT_VOICE', ({ socketId }) => {
      if (this.peers[socketId]) {
        this.peers[socketId].close();
        delete this.peers[socketId];
      }
      const remoteAudio = document.getElementById(`audio-${socketId}`);
      if (remoteAudio) remoteAudio.remove();
    });
  }

  async startMicrophone() {
    if (this.localStream) return true;
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
        video: false
      });
      this.socket.emit('JOIN_VOICE', { code: this.roomCode });
      return true;
    } catch (err) {
      console.warn('Microphone permission denied or unavailable:', err);
      return false;
    }
  }

  createPeerConnection(targetSocketId) {
    if (this.peers[targetSocketId]) return this.peers[targetSocketId];

    const pc = new RTCPeerConnection(ICE_SERVERS);
    this.peers[targetSocketId] = pc;

    // Send mic track
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => pc.addTrack(track, this.localStream));
    }

    // Send network route candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.socket.emit('VOICE_SIGNAL', {
          targetSocketId,
          signalData: { candidate: event.candidate }
        });
      }
    };

    // Receive incoming voice audio track
    pc.ontrack = (event) => {
      let audioEl = document.getElementById(`audio-${targetSocketId}`);
      if (!audioEl) {
        audioEl = document.createElement('audio');
        audioEl.id = `audio-${targetSocketId}`;
        audioEl.autoplay = true;
        document.body.appendChild(audioEl);
      }
      audioEl.srcObject = event.streams[0];
    };

    return pc;
  }

  toggleMute() {
    if (!this.localStream) return false;
    this.isMuted = !this.isMuted;
    this.localStream.getAudioTracks().forEach(track => {
      track.enabled = !this.isMuted;
    });
    return this.isMuted;
  }

  leave() {
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }
    Object.keys(this.peers).forEach(id => {
      this.peers[id].close();
      const el = document.getElementById(`audio-${id}`);
      if (el) el.remove();
    });
    this.peers = {};
    if (this.socket && this.roomCode) {
      this.socket.emit('LEAVE_VOICE', { code: this.roomCode });
    }
  }
}

export const voiceManager = new VoiceChatManager();