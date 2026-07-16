export class SpeechService {
  static currentAudio = null

  static playAudio(url) {
    return new Promise((resolve, reject) => {
      if (this.currentAudio) {
        this.currentAudio.pause()
      }

      const audio = new Audio(url)
      this.currentAudio = audio

      audio.onended = () => {
        this.currentAudio = null
        resolve()
      }
      audio.onerror = (e) => {
        this.currentAudio = null
        reject(e)
      }

      audio.play().catch(reject)
    })
  }

  static stop() {
    if (this.currentAudio) {
      this.currentAudio.pause()
      this.currentAudio = null
    }
  }
}
