import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import { useToast } from '../contexts/ToastContext';

// Clave pública generada para VAPID
// Nota: Debe coincidir con la que pusimos en Supabase Edge Functions.
const VAPID_PUBLIC_KEY = 'BNVaRuZNBaay8ogvUFTilreNR_lVOkjaIKkRGLNVEvFDXpFuJFv5FEUG3U98TyXiEtE5cMubxyptzF_trXneVXE';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function usePushNotifications() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true);
      checkSubscription();
    }
  }, []);

  const checkSubscription = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(!!subscription);
    } catch (err) {
      console.error('Error checking subscription', err);
    }
  };

  const subscribeToPush = async () => {
    if (!user) {
      addToast('Debes iniciar sesión para recibir notificaciones', 'error');
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      
      // Suscribirse al Push Manager del navegador
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      });

      const subJSON = subscription.toJSON();

      if (!subJSON.endpoint || !subJSON.keys?.p256dh || !subJSON.keys?.auth) {
        throw new Error('La suscripción generada es inválida');
      }

      // Guardar en Supabase
      const { error } = await supabase.from('push_subscriptions').upsert({
        user_id: user.id,
        endpoint: subJSON.endpoint,
        p256dh: subJSON.keys.p256dh,
        auth: subJSON.keys.auth
      }, { onConflict: 'endpoint' });

      if (error) throw error;

      setIsSubscribed(true);
      addToast('¡Notificaciones activadas!', 'success');
    } catch (err: any) {
      console.error('Error subscribing to push:', err);
      addToast('Error al activar notificaciones. Puede que hayas denegado el permiso.', 'error');
    }
  };

  return {
    isSupported,
    isSubscribed,
    subscribeToPush
  };
}
