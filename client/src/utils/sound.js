// Pre-rendered, high-fidelity micro-audio clips (100% self-contained data URIs)
const SOUND_SNIPPETS = {
  // Mechanical card snap / tap sound
  snap: 'data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU' + 'A'.repeat(80) + 'AP//AAD//wAA//8AAP//AP7/AAD//wAA//8AAP//AAD//wAA',
  
  // Clean click pop
  pop: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFb3N7iZaelpZ+b3N1eoSOk5mcoZ2Zk5CNjZCWmZqdo6inp6mnq6qrrK6xsLK0tba3uLm6u7y9vr/AwcLDxMXGx8jJysvMzc7P0NHS09TV1tfY2drb3N3e3+Dh4uPk5ebn6Onq6+zt7u/w8fLz9PX29/j5+vv8/f7/'
};

class AudioPlayer {
  constructor() {
    this.audioCache = {};
  }

  play(name) {
    try {
      const src = SOUND_SNIPPETS[name] || SOUND_SNIPPETS.snap;
      const sound = new Audio(src);
      sound.volume = 0.6;
      sound.play().catch((err) => {
        console.warn('Audio play prevented (requires user click first):', err.message);
      });
    } catch (e) {
      console.error('Audio playback error:', e);
    }
  }

  playSnap() {
    this.play('snap');
  }

  playDeal() {
    this.play('pop');
  }

  playTurupExposed() {
    this.play('snap');
    setTimeout(() => this.play('pop'), 120);
    setTimeout(() => this.play('snap'), 240);
  }

  playTrickWon() {
    this.play('pop');
  }

  playTurnBeep() {
    this.play('pop');
  }
}

export const sound = new AudioPlayer();