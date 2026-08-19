// utils/haptics.ts
// Lightweight Mobile Haptic Vibration Utility

export type HapticType = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error'

/**
 * Trigger subtle tactile vibration on supported smartphones
 */
export function triggerHaptic(type: HapticType = 'light') {
  if (typeof window === 'undefined' || !('navigator' in window)) return
  if (!('vibrate' in navigator)) return

  try {
    switch (type) {
      case 'light':
        navigator.vibrate(10)
        break
      case 'medium':
        navigator.vibrate(25)
        break
      case 'heavy':
        navigator.vibrate(45)
        break
      case 'success':
        navigator.vibrate([15, 60, 25])
        break
      case 'warning':
        navigator.vibrate([30, 40, 30])
        break
      case 'error':
        navigator.vibrate([50, 40, 50, 40, 50])
        break
    }
  } catch (err) {
    // Graceful fallback for non-vibrating devices
  }
}
