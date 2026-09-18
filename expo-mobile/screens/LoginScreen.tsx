// screens/LoginScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Zap,
  Fingerprint,
  CreditCard,
  Smartphone,
  Check,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react-native';
import { Theme } from '../theme';
import { api } from '../api';
import { XChargeLogoNative, XChargeMarkNative } from '../XChargeLogoNative';

interface LoginScreenProps {
  navigation?: any;
  onNavigate?: (screen: 'login' | 'signup' | 'otp' | 'otp_success', params?: any) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ navigation, onNavigate }) => {
  const insets = useSafeAreaInsets();
  const [accountType, setAccountType] = useState<'personal' | 'fleet'>('personal');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [trustDevice, setTrustDevice] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const navigate = (screen: 'login' | 'signup' | 'otp' | 'otp_success', params?: any) => {
    if (onNavigate) {
      onNavigate(screen, params);
    } else if (navigation) {
      const screenMap: Record<string, string> = {
        login: 'Login',
        signup: 'SignUp',
        otp: 'OtpVerification',
        otp_success: 'OtpSuccess',
      };
      navigation.navigate(screenMap[screen] || screen, params);
    }
  };

  const handleSendCode = async () => {
    if (!phoneNumber.trim()) {
      Alert.alert('Required', 'Please enter your mobile phone number to receive a verification code.');
      return;
    }

    setIsLoading(true);
    try {
      const fullPhone = phoneNumber.startsWith('+') ? phoneNumber : `+233${phoneNumber.replace(/^0+/, '').replace(/\s+/g, '')}`;
      const result = await api.sendOtp(fullPhone);

      setIsLoading(false);
      if (result.success) {
        navigate('otp', {
          phoneNumber: fullPhone,
          devCode: result.devCode,
          accountType,
        });
      } else {
        Alert.alert('SMS Dispatch Error', result.error || 'Failed to send SMS code. Please try again.');
      }
    } catch (err: any) {
      setIsLoading(false);
      Alert.alert('Connection Notice', err.message || 'Unable to reach SMS gateway.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: Theme.colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.container,
          {
            paddingTop: Math.max(insets.top, 24),
            paddingBottom: Math.max(insets.bottom + 16, 24),
          },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Top Header & Status */}
        <View style={styles.topBar}>
          <View style={styles.badge}>
            <View style={styles.statusDot} />
            <Text style={styles.badgeText}>XCHARGE NETWORK</Text>
          </View>
        </View>

        {/* Brand Logo & Headline */}
        <View style={styles.brandContainer}>
          <View style={styles.logoMarkContainer}>
            <XChargeMarkNative size={44} />
          </View>
          <XChargeLogoNative width={210} height={60} showSubtitle={true} style={{ marginBottom: 14 }} />
          <Text style={styles.heading}>Driver Authentication</Text>
          <Text style={styles.subheading}>
            Enter your registered mobile number to receive a secure one-time verification code via Moolre SMS.
          </Text>
        </View>

        {/* Account Segmented Switcher */}
        <View style={styles.segmentedContainer}>
          <TouchableOpacity
            style={[styles.segmentBtn, accountType === 'personal' && styles.segmentBtnActive]}
            onPress={() => setAccountType('personal')}
            activeOpacity={0.8}
          >
            <Text style={[styles.segmentText, accountType === 'personal' && styles.segmentTextActive]}>
              Personal Driver
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.segmentBtn, accountType === 'fleet' && styles.segmentBtnActive]}
            onPress={() => setAccountType('fleet')}
            activeOpacity={0.8}
          >
            <Text style={[styles.segmentText, accountType === 'fleet' && styles.segmentTextActive]}>
              Fleet Operator
            </Text>
          </TouchableOpacity>
        </View>

        {/* Phone Credentials Input */}
        <View style={styles.inputSection}>
          <View style={styles.inputHeader}>
            <Text style={styles.fieldLabel}>MOBILE TELEMETRY NODE</Text>
            <Text style={styles.fieldStatus}>ACTIVE</Text>
          </View>
          <View style={styles.phoneInputRow}>
            <View style={styles.countryCodeBox}>
              <Text style={styles.flagEmoji}>🇬🇭</Text>
              <Text style={styles.countryCodeText}>+233</Text>
            </View>
            <TextInput
              style={styles.phoneInput}
              placeholder="24 123 4567"
              placeholderTextColor={Theme.colors.textMuted}
              keyboardType="phone-pad"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              autoComplete="tel"
            />
          </View>
          <Text style={styles.inputHelperText}>
            SMS and WhatsApp OTP supported on MTN, Telecel, and AT Ghana
          </Text>
        </View>

        {/* Trust Device Checkbox */}
        <TouchableOpacity
          style={styles.checkboxRow}
          activeOpacity={0.8}
          onPress={() => setTrustDevice(!trustDevice)}
        >
          <View style={[styles.checkboxBox, trustDevice && styles.checkboxActive]}>
            {trustDevice && <Check size={12} color={Theme.colors.onPrimary} strokeWidth={3.5} />}
          </View>
          <View style={styles.checkboxLabelContainer}>
            <Text style={styles.checkboxTitle}>Trust this device for 30 days</Text>
            <Text style={styles.checkboxSubtitle}>
              Bypasses secondary terminal challenge on FL-08 stations
            </Text>
          </View>
        </TouchableOpacity>

        {/* Primary CTA */}
        <TouchableOpacity
          style={[styles.primaryBtn, isLoading && { opacity: 0.8 }]}
          onPress={handleSendCode}
          disabled={isLoading}
          activeOpacity={0.85}
        >
          {isLoading ? (
            <ActivityIndicator color={Theme.colors.onPrimary} size="small" />
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={styles.primaryBtnText}>Send Verification Code</Text>
              <ArrowRight size={18} color={Theme.colors.onPrimary} strokeWidth={2.5} />
            </View>
          )}
        </TouchableOpacity>

        {/* Quick Access Divider */}
        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>OR QUICK ACCESS</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Quick Access Buttons */}
        <View style={styles.quickAccessRow}>
          <TouchableOpacity
            style={styles.quickBtn}
            activeOpacity={0.75}
            onPress={() => {
              setPhoneNumber('248901204');
              Alert.alert('Demo Account Loaded', 'Kofi Mensah (+233 24 890 1204) loaded for testing.');
            }}
          >
            <Fingerprint size={20} color={Theme.colors.primary} />
            <Text style={styles.quickLabel}>Biometric</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickBtn}
            activeOpacity={0.75}
            onPress={() => {
              Alert.alert('RFID Reader Ready', 'Tap RFID tag on charger terminal NFC scanner to authenticate.');
            }}
          >
            <CreditCard size={20} color={Theme.colors.primary} />
            <Text style={styles.quickLabel}>RFID Card</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickBtn}
            activeOpacity={0.75}
            onPress={() => {
              setPhoneNumber('551234567');
              Alert.alert('MoMo Quick Sync', 'Telecel/MTN instant driver node ready.');
            }}
          >
            <Smartphone size={20} color={Theme.colors.primary} />
            <Text style={styles.quickLabel}>MoMo Sync</Text>
          </TouchableOpacity>
        </View>

        {/* Footer Links */}
        <View style={styles.footerContainer}>
          <Text style={styles.footerText}>
            Do not have an account?{' '}
            <Text style={styles.footerLink} onPress={() => navigate('signup')}>
              Sign Up
            </Text>
          </Text>
          <TouchableOpacity onPress={() => navigate('signup')}>
            <Text style={styles.footerSecLink}>Fleet Manager Portal Login ↗</Text>
          </TouchableOpacity>
          <Text style={styles.complianceText}>OCPI 2.2.1 SECURE TELEMETRY GATEWAY</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    backgroundColor: Theme.colors.background,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.surfaceContainerLowest,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Theme.borderRadius.full,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Theme.colors.success,
    marginRight: 6,
  },
  badgeText: {
    color: Theme.colors.textSecondary,
    fontSize: 11,
    letterSpacing: 1.2,
    fontWeight: '600',
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoMarkContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 240, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0, 240, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  logoGlyph: {
    color: Theme.colors.primary,
    fontSize: 32,
    fontWeight: '800',
  },
  logoTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Theme.colors.textPrimary,
    letterSpacing: 3,
    marginBottom: 12,
  },
  heading: {
    fontSize: 22,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
    marginBottom: 8,
  },
  subheading: {
    fontSize: 13,
    color: Theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 19,
    paddingHorizontal: 12,
  },
  segmentedContainer: {
    flexDirection: 'row',
    backgroundColor: Theme.colors.surfaceContainerLowest,
    borderRadius: Theme.borderRadius.md,
    padding: 4,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: Theme.borderRadius.sm,
  },
  segmentBtnActive: {
    backgroundColor: Theme.colors.primary,
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '600',
    color: Theme.colors.textSecondary,
  },
  segmentTextActive: {
    color: Theme.colors.onPrimary,
    fontWeight: '700',
  },
  inputSection: {
    marginBottom: 16,
  },
  inputHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Theme.colors.textSecondary,
    letterSpacing: 1,
  },
  fieldStatus: {
    fontSize: 11,
    fontWeight: '700',
    color: Theme.colors.success,
    letterSpacing: 1,
  },
  phoneInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  countryCodeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.borderRadius.md,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    paddingHorizontal: 12,
    minHeight: 52,
    gap: 6,
  },
  flagEmoji: {
    fontSize: 16,
  },
  countryCodeText: {
    color: Theme.colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
  },
  phoneInput: {
    flex: 1,
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.borderRadius.md,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    paddingHorizontal: 16,
    color: Theme.colors.textPrimary,
    fontSize: 16,
    minHeight: 52,
  },
  inputHelperText: {
    fontSize: 11,
    color: Theme.colors.textMuted,
    marginTop: 6,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Theme.colors.surface,
    padding: 12,
    borderRadius: Theme.borderRadius.md,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    marginBottom: 20,
    gap: 12,
  },
  checkboxBox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    backgroundColor: Theme.colors.surfaceContainerLowest,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  checkboxActive: {
    backgroundColor: Theme.colors.primary,
    borderColor: Theme.colors.primary,
  },
  checkmark: {
    color: Theme.colors.onPrimary,
    fontSize: 12,
    fontWeight: '800',
  },
  checkboxLabelContainer: {
    flex: 1,
  },
  checkboxTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Theme.colors.textPrimary,
    marginBottom: 2,
  },
  checkboxSubtitle: {
    fontSize: 11,
    color: Theme.colors.textMuted,
    lineHeight: 15,
  },
  primaryBtn: {
    backgroundColor: Theme.colors.primary,
    minHeight: 52,
    borderRadius: Theme.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  primaryBtnText: {
    color: Theme.colors.onPrimary,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Theme.colors.border,
  },
  dividerText: {
    fontSize: 10,
    color: Theme.colors.textMuted,
    letterSpacing: 1.5,
    fontWeight: '600',
  },
  quickAccessRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  quickBtn: {
    flex: 1,
    backgroundColor: Theme.colors.surface,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    borderRadius: Theme.borderRadius.md,
    paddingVertical: 14,
    alignItems: 'center',
    gap: 6,
  },
  quickIcon: {
    fontSize: 18,
    color: Theme.colors.primary,
  },
  quickLabel: {
    fontSize: 12,
    color: Theme.colors.textSecondary,
    fontWeight: '600',
  },
  footerContainer: {
    alignItems: 'center',
    gap: 10,
  },
  footerText: {
    fontSize: 13,
    color: Theme.colors.textSecondary,
  },
  footerLink: {
    color: Theme.colors.primary,
    fontWeight: '700',
  },
  footerSecLink: {
    fontSize: 12,
    color: Theme.colors.textMuted,
    textDecorationLine: 'underline',
  },
  complianceText: {
    fontSize: 10,
    color: Theme.colors.textMuted,
    letterSpacing: 1.2,
    marginTop: 8,
  },
});
