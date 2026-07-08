import Constants from 'expo-constants';
import { storage } from './storage';

const BASE = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:3001';

const getToken = async () => {
  const r = await storage.get('overit_token');
  return r?.value || null;
};

const apiFetch = async (path, options = {}) => {
  const token = await getToken();
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'Request failed');
  }

  return res.json();
};

export const signup = async ({ name, email, password }) => {
  const data = await apiFetch('/api/auth/signup', {
    method: 'POST',
    body:   JSON.stringify({ name, email, password }),
  });
  await storage.set('overit_token', data.token);
  return data;
};

export const signin = async ({ email, password }) => {
  const data = await apiFetch('/api/auth/signin', {
    method: 'POST',
    body:   JSON.stringify({ email, password }),
  });
  await storage.set('overit_token', data.token);
  return data;
};

export const getProfile = async () => apiFetch('/api/profile');

export const saveProfile = async (profile, questionnaireComplete) =>
  apiFetch('/api/profile', {
    method: 'PUT',
    body:   JSON.stringify({ profile, questionnaireComplete }),
  });

export const getMessages  = async () => apiFetch('/api/messages');

export const saveMessages = async (messages) =>
  apiFetch('/api/messages', {
    method: 'PUT',
    body:   JSON.stringify({ messages }),
  });

export const clearMessages = async () =>
  apiFetch('/api/messages', { method: 'DELETE' });

export const sendChat = async (messages, systemPrompt, profilePrompt) => {
  const data = await apiFetch('/api/chat', {
    method: 'POST',
    body:   JSON.stringify({ messages, systemPrompt, profilePrompt }),
  });
  return data.text;
};

export const extractProfile = async (excerpt) => {
  const data = await apiFetch('/api/extract-profile', {
    method: 'POST',
    body:   JSON.stringify({ excerpt }),
  });
  return data.extracted || {};
};

export const savePushToken = async (token) =>
  apiFetch('/api/push-token', {
    method: 'POST',
    body:   JSON.stringify({ token }),
  });

// ─── Sign out ───────────────────────────────────────────────────────────
export const signOut = async () => {
  await storage.delete('overit_token');
};

export const deleteAccount = async () => {
  const data = await apiFetch('/api/account', { method: 'DELETE' });
  await storage.delete('overit_token');
  return data;
};
