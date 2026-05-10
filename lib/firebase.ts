import { initializeApp, getApps } from 'firebase/app'
import { getMessaging, getToken, onMessage, type MessagePayload } from 'firebase/messaging'

const firebaseConfig = {
  apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]

function hasFirebaseMessagingConfig() {
  return Boolean(
    firebaseConfig.apiKey &&
    firebaseConfig.projectId &&
    firebaseConfig.messagingSenderId &&
    firebaseConfig.appId &&
    process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY
  )
}

export async function requestNotificationPermission(): Promise<string | null> {
  if (typeof window === 'undefined') return null
  if (!hasFirebaseMessagingConfig() || !('Notification' in window)) return null
  try {
    const messaging = getMessaging(app)
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') return null
    const token = await getToken(messaging, {
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
    })
    return token
  } catch {
    console.warn('FCM not available')
    return null
  }
}

export function onForegroundMessage(callback: (payload: MessagePayload) => void) {
  if (typeof window === 'undefined') return
  if (!hasFirebaseMessagingConfig()) return
  const messaging = getMessaging(app)
  return onMessage(messaging, callback)
}

export { app }
