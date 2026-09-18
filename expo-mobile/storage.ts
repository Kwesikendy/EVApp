import AsyncStorage from '@react-native-async-storage/async-storage';

const SESSION_KEY = '@xcharge_driver_session';
const PHONE_KEY = '@xcharge_driver_phone';

export interface StoredSession {
  phoneNumber: string;
  user: any;
  timestamp: number;
}

export const SessionStorage = {
  /**
   * Save driver profile & active session token locally
   */
  async saveSession(user: any): Promise<void> {
    try {
      if (!user) return;
      const session: StoredSession = {
        phoneNumber: user.phoneNumber || '',
        user,
        timestamp: Date.now(),
      };
      await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
      if (user.phoneNumber) {
        await AsyncStorage.setItem(PHONE_KEY, user.phoneNumber);
      }
    } catch (err) {
      console.warn('[SessionStorage] Failed to save session:', err);
    }
  },

  /**
   * Retrieve active driver session
   */
  async getSession(): Promise<StoredSession | null> {
    try {
      const raw = await AsyncStorage.getItem(SESSION_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (err) {
      console.warn('[SessionStorage] Failed to get session:', err);
      return null;
    }
  },

  /**
   * Retrieve last authenticated phone number
   */
  async getStoredPhone(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(PHONE_KEY);
    } catch {
      return null;
    }
  },

  /**
   * Sign out and clear stored session
   */
  async clearSession(): Promise<void> {
    try {
      await AsyncStorage.removeItem(SESSION_KEY);
    } catch (err) {
      console.warn('[SessionStorage] Failed to clear session:', err);
    }
  },
};
