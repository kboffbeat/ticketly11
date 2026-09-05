import { storage } from '@/lib/storage';
import type { AuthSession, User, UserRole } from '@/types';

const SESSION_KEY = 'ticketly_session';
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function uid() {
  return Math.random().toString(36).slice(2, 11) + Date.now().toString(36);
}

// Simple hash for demo (NOT for production). Persistent across terminals in localStorage.
function hash(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return 'h_' + Math.abs(h).toString(36);
}

function delay<T>(value: T, ms = 200): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

export const authService = {
  async register(email: string, password: string, name: string, role: UserRole): Promise<AuthSession> {
    const users = storage.get('users');
    if (users.find((u) => u.email.toLowerCase() === email.toLowerCase())) {
      throw new Error('An account with this email already exists.');
    }
    const user: User = {
      id: uid(),
      email,
      name,
      role,
      createdAt: new Date().toISOString(),
    };
    storage.update('users', (list) => [...list, user]);
    // Store password hash on a side map keyed by user id
    const pw = JSON.parse(localStorage.getItem('ticketly_pw') || '{}');
    pw[user.id] = hash(password);
    localStorage.setItem('ticketly_pw', JSON.stringify(pw));

    const session = this._createSession(user);
    return delay(session);
  },

  async login(email: string, password: string): Promise<AuthSession> {
    const users = storage.get('users');
    const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!user) throw new Error('No account found with this email.');
    const pw = JSON.parse(localStorage.getItem('ticketly_pw') || '{}');
    if (pw[user.id] !== hash(password)) throw new Error('Incorrect password.');
    const session = this._createSession(user);
    return delay(session);
  },

  logout() {
    localStorage.removeItem(SESSION_KEY);
  },

  getSession(): AuthSession | null {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (!raw) return null;
      const session: AuthSession = JSON.parse(raw);
      if (new Date(session.expiresAt) < new Date()) {
        localStorage.removeItem(SESSION_KEY);
        return null;
      }
      return session;
    } catch {
      return null;
    }
  },

  _createSession(user: User): AuthSession {
    const session: AuthSession = {
      user,
      token: uid() + uid(),
      expiresAt: new Date(Date.now() + SESSION_TTL_MS).toISOString(),
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return session;
  },
};
