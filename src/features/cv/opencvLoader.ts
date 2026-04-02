declare global {
  interface Window {
    cv: {
      Mat?: unknown
      onRuntimeInitialized?: () => void
    }
  }
}

const OPENCV_URL = 'https://docs.opencv.org/4.x/opencv.js'

let loadPromise: Promise<boolean> | null = null

export const loadOpenCv = (): Promise<boolean> => {
  if (typeof window === 'undefined') return Promise.resolve(false)
  if (window.cv?.Mat) return Promise.resolve(true)
  if (loadPromise) return loadPromise

  loadPromise = new Promise((resolve) => {
    const script = document.createElement('script')
    script.async = true
    script.src = OPENCV_URL
    script.onerror = () => resolve(false)
    script.onload = () => {
      if (window.cv?.Mat) {
        resolve(true)
        return
      }
      window.cv.onRuntimeInitialized = () => resolve(true)
      setTimeout(() => resolve(false), 3000)
    }
    document.body.appendChild(script)
  })

  return loadPromise
}

