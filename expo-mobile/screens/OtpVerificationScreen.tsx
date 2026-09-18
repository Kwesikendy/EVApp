// screens/OtpVerificationScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Theme } from '../theme';
import { api } from '../api';

interface OtpVerificationScreenProps {
  onNavigate: (screen: 'login' | 'signup' | 'otp' | 'otp_success', params?: any) => void;
  onVerified: (user: any) => void;
  routeParams?: {
    phoneNumber?: string;
    devCode?: string;
    accountType?: string;
    fullName?: string;
    selectedEv?: string;
  };
}

export const OtpVerificationScreen: React.FC<OtpVerificationScreenProps> = ({
  onNavigate,
  onVerified,
  routeParams,
}) => {
  const insets = useSafeAreaInsets();
  const phoneNumber = routeParams?.phoneNumber || '+233 24 123 4567';
  const devCode = routeParams?.devCode;

  const [digits, setDigits] = useState<string[]>([]);
  const [timer, setTimer] = useState(120);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    if (timer <= 0) return;
    const interval = setInterval(() => setTimer((t) => t - 1), 1000);
    return () => clearInterval(interval);
  }, [timer]);

  const verifyCode = async (codeToVerify: string) => {
    setIsVerifying(true);
    try {
      const res = await api.verifyOtp(phoneNumber, codeToVerify);
      setIsVerifying(false);

      if (res.success && res.user) {
        onVerified(res.user);
        onNavigate('otp_success', { user: res.user, phoneNumber });
      } else {
        Alert.alert('Verification Failed', res.error || 'Invalid passcode. Please check and try again.');
        setDigits([]);
      }
    } catch (err: any) {
      setIsVerifying(false);
      Alert.alert('Network Error', err.message || 'Could not verify code.');
    }
  };

  const handleKeyPress = (num: string) => {
    if (isVerifying) return;
    if (digits.length < 6) {
      const next = [...digits, num];
      setDigits(next);
      if (next.length === 6) {
        const fullCode = next.join('');
        verifyCode(fullCode);
      }
    }
  };

  const handleDelete = () => {
    if (isVerifying) return;
    setDigits(digits.slice(0, -1));
  };

  const handleResend = async () => {
    setIsResending(true);
    try {
      const res = await api.sendOtp(phoneNumber);
      setIsResending(false);
      if (res.success) {
        setTimer(120);
        Alert.alert('Code Transmitted', 'A new 6-digit verification code has been dispatched via Moolre SMS.');
      } else {
        Alert.alert('Resend Failed', res.error || 'Could not resend SMS.');
      }
    } catch (err: any) {
      setIsResending(false);
      Alert.alert('Resend Notice', err.message || 'Network error.');
    }
  };

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: Math.max(insets.top, 20),
          paddingBottom: Math.max(insets.bottom + 8, 16),
        },
      ]}
    >
      {/* Top Protocol Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => onNavigate('login')}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.badge}>
          <View style={styles.greenDot} />
          <Text style={styles.badgeText}>MOOLRE SMS SECURE</Text>
        </View>
      </View>

      {/* Dev helper notice if in test sandbox */}
      {devCode && (
        <View style={styles.sandboxBanner}>
          <Text style={styles.sandboxText}>
            🧪 Sandbox Test Code: <Text style={{ color: Theme.colors.primary, fontWeight: '700' }}>{devCode}</Text>
          </Text>
        </View>
      )}

      {/* Headline */}
      <View style={styles.centerHeader}>
        <Text style={styles.title}>Verification Code</Text>
        <Text style={styles.subtitle}>
          Enter the 6-digit one-time passcode transmitted via SMS to {phoneNumber}
        </Text>
      </View>

      {/* 6 Digit Display Slots */}
      <View style={styles.slotsRow}>
        {[0, 1, 2, 3, 4, 5].map((i) => {
          const filled = digits[i] !== undefined;
          const isCurrent = digits.length === i;
          return (
            <View
              key={i}
              style={[
                styles.slotBox,
                filled && styles.slotFilled,
                isCurrent && styles.slotCurrent,
              ]}
            >
              {isVerifying && digits.length === 6 ? (
                <ActivityIndicator size="small" color={Theme.colors.primary} />
              ) : (
                <Text style={styles.slotDigit}>{digits[i] || ''}</Text>
              )}
            </View>
          );
        })}
      </View>

      {/* Timer & Resend triggers */}
      <View style={styles.timerRow}>
        <Text style={styles.timerText}>Code expires in {formatTimer(timer)}</Text>
        <TouchableOpacity disabled={timer > 0 || isResending} onPress={handleResend}>
          <Text style={[styles.resendBtn, (timer > 0 || isResending) && styles.resendDisabled]}>
            {isResending ? 'Transmitting SMS...' : 'Resend via SMS'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Ergonomic Numerical Keypad */}
      <View style={styles.keypad}>
        {[['1', '2', '3'], ['4', '5', '6'], ['7', '8', '9']].map((row, rIdx) => (
          <View key={rIdx} style={styles.keypadRow}>
            {row.map((val) => (
              <TouchableOpacity
                key={val}
                style={styles.keypadBtn}
                onPress={() => handleKeyPress(val)}
                activeOpacity={0.7}
                disabled={isVerifying}
              >
                <Text style={styles.keypadNumber}>{val}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}
        <View style={styles.keypadRow}>
          <TouchableOpacity
            style={styles.keypadBtn}
            activeOpacity={0.7}
            onPress={() => {
              // Fill dev bypass code 123456
              setDigits(['1', '2', '3', '4', '5', '6']);
              verifyCode('123456');
            }}
          >
            <Text style={styles.keypadSpecial}>◎</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.keypadBtn}
            onPress={() => handleKeyPress('0')}
            activeOpacity={0.7}
            disabled={isVerifying}
          >
            <Text style={styles.keypadNumber}>0</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.keypadBtn}
            onPress={handleDelete}
            activeOpacity={0.7}
            disabled={isVerifying}
          >
            <Text style={styles.keypadSpecial}>⌫</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
    paddingHorizontal: 20,
    justifyContent: 'space-between',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backBtnText: {
    color: Theme.colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.surfaceContainerLowest,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Theme.borderRadius.full,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  greenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Theme.colors.success,
    marginRight: 6,
  },
  badgeText: {
    color: Theme.colors.textSecondary,
    fontSize: 10,
    letterSpacing: 1,
    fontWeight: '600',
  },
  sandboxBanner: {
    backgroundColor: 'rgba(0, 240, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.3)',
    borderRadius: Theme.borderRadius.sm,
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  sandboxText: {
    color: Theme.colors.textSecondary,
    fontSize: 12,
  },
  centerHeader: {
    alignItems: 'center',
    marginVertical: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 13,
    color: Theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 16,
  },
  slotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginVertical: 16,
  },
  slotBox: {
    width: 48,
    height: 56,
    borderRadius: Theme.borderRadius.md,
    backgroundColor: Theme.colors.surface,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  slotFilled: {
    borderColor: Theme.colors.primary,
    backgroundColor: 'rgba(0, 240, 255, 0.05)',
  },
  slotCurrent: {
    borderColor: Theme.colors.primary,
  },
  slotDigit: {
    fontSize: 22,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
  },
  timerRow: {
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  timerText: {
    fontSize: 12,
    color: Theme.colors.textMuted,
  },
  resendBtn: {
    fontSize: 13,
    fontWeight: '700',
    color: Theme.colors.primary,
  },
  resendDisabled: {
    color: Theme.colors.textMuted,
  },
  keypad: {
    gap: 10,
    marginTop: 10,
  },
  keypadRow: {
    flexDirection: 'row',
    gap: 10,
  },
  keypadBtn: {
    flex: 1,
    height: 58,
    borderRadius: Theme.borderRadius.md,
    backgroundColor: Theme.colors.surface,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  keypadNumber: {
    fontSize: 22,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
  },
  keypadSpecial: {
    fontSize: 18,
    color: Theme.colors.textSecondary,
  },
});
