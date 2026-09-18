// screens/SignUpScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Theme } from '../theme';
import { api } from '../api';

const EV_MODELS = [
  { id: 'tesla', name: 'Tesla Model 3 / Y', spec: 'CCS2 / NACS' },
  { id: 'byd', name: 'BYD Atto 3', spec: 'GB/T / CCS2' },
  { id: 'hyundai', name: 'Hyundai Ioniq 5', spec: '800V Ultra-DC' },
  { id: 'other', name: 'Other EV', spec: 'Manual Config' },
];

const PAYMENT_GATEWAYS = [
  { id: 'momo', name: 'MTN MoMo', badge: '0% Surge Fee' },
  { id: 'telecel', name: 'Telecel Cash', badge: 'Active Auto' },
  { id: 'at', name: 'AT Money', badge: 'Instant OTP' },
  { id: 'card', name: 'Bank Card', badge: 'Visa / MC' },
];

interface SignUpScreenProps {
  onNavigate: (screen: 'login' | 'signup' | 'otp' | 'otp_success', params?: any) => void;
}

export const SignUpScreen: React.FC<SignUpScreenProps> = ({ onNavigate }) => {
  const insets = useSafeAreaInsets();
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [selectedEv, setSelectedEv] = useState('tesla');
  const [selectedGateway, setSelectedGateway] = useState('momo');
  const [agreed, setAgreed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleContinue = async () => {
    if (!phoneNumber.trim()) {
      Alert.alert('Phone Required', 'Please enter your mobile phone number for OTP verification.');
      return;
    }
    if (!fullName.trim()) {
      Alert.alert('Name Required', 'Please enter your full name.');
      return;
    }
    if (!agreed) {
      Alert.alert('Terms Agreement', 'Please accept the Terms of Service to continue.');
      return;
    }

    setIsLoading(true);
    try {
      const fullPhone = phoneNumber.startsWith('+') ? phoneNumber : `+233${phoneNumber.replace(/^0+/, '').replace(/\s+/g, '')}`;
      const result = await api.sendOtp(fullPhone);

      setIsLoading(false);
      if (result.success) {
        onNavigate('otp', {
          phoneNumber: fullPhone,
          fullName,
          email,
          selectedEv,
          selectedGateway,
          devCode: result.devCode,
        });
      } else {
        Alert.alert('SMS Error', result.error || 'Failed to dispatch verification SMS.');
      }
    } catch (err: any) {
      setIsLoading(false);
      Alert.alert('Network Issue', err.message || 'Error reaching authentication server.');
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: Theme.colors.background }}>
      <ScrollView
        contentContainerStyle={[
          styles.container,
          {
            paddingTop: Math.max(insets.top, 20),
            paddingBottom: Math.max(insets.bottom + 20, 28),
          },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Step Indicator Header */}
        <View style={styles.stepHeader}>
          <TouchableOpacity style={styles.backBtn} onPress={() => onNavigate('login')}>
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
          <View style={styles.stepTextContainer}>
            <Text style={styles.stepCounter}>STEP 1 OF 3</Text>
            <Text style={styles.stepTitle}>Account Setup</Text>
          </View>
          <View style={styles.onlineDot} />
        </View>

        {/* Progress Bar */}
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: '33%' }]} />
        </View>

        {/* Title */}
        <View style={styles.titleSection}>
          <Text style={styles.mainTitle}>Create Driver Account</Text>
          <Text style={styles.mainSubtitle}>
            Register your EV profile to access superchargers, track live battery telemetry, and pay via MoMo.
          </Text>
        </View>

        {/* Input: Full Name */}
        <View style={styles.formGroup}>
          <Text style={styles.inputLabel}>DRIVER FULL NAME</Text>
          <TextInput
            style={styles.inputField}
            placeholder="e.g. Kwame Mensah"
            placeholderTextColor={Theme.colors.textMuted}
            value={fullName}
            onChangeText={setFullName}
          />
        </View>

        {/* Input: Phone */}
        <View style={styles.formGroup}>
          <View style={styles.rowBetween}>
            <Text style={styles.inputLabel}>MOBILE NUMBER</Text>
            <Text style={styles.accentLabel}>Moolre SMS OTP</Text>
          </View>
          <View style={styles.phoneRow}>
            <View style={styles.countryCodeBadge}>
              <Text style={{ fontSize: 16 }}>🇬🇭</Text>
              <Text style={styles.codeText}>+233</Text>
            </View>
            <TextInput
              style={[styles.inputField, { flex: 1 }]}
              placeholder="24 123 4567"
              placeholderTextColor={Theme.colors.textMuted}
              keyboardType="phone-pad"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
            />
          </View>
        </View>

        {/* Input: Email */}
        <View style={styles.formGroup}>
          <View style={styles.rowBetween}>
            <Text style={styles.inputLabel}>EMAIL ADDRESS</Text>
            <Text style={styles.optionalLabel}>Optional</Text>
          </View>
          <TextInput
            style={styles.inputField}
            placeholder="kwame@example.com"
            placeholderTextColor={Theme.colors.textMuted}
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
        </View>

        {/* EV Model Selection */}
        <View style={styles.formGroup}>
          <Text style={styles.inputLabel}>PRIMARY EV MODEL / VIN PROFILE</Text>
          <View style={styles.grid2Col}>
            {EV_MODELS.map((item) => {
              const active = selectedEv === item.id;
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.selectionCard, active && styles.selectionCardActive]}
                  onPress={() => setSelectedEv(item.id)}
                  activeOpacity={0.8}
                >
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>{item.name}</Text>
                    <View style={[styles.radioDot, active && styles.radioDotActive]}>
                      {active && <View style={styles.innerDot} />}
                    </View>
                  </View>
                  <Text style={styles.cardSub}>{item.spec}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Fast Settlement Gateway */}
        <View style={styles.formGroup}>
          <View style={styles.rowBetween}>
            <Text style={styles.inputLabel}>FAST SETTLEMENT GATEWAY</Text>
            <Text style={styles.accentLabel}>Instant Sync</Text>
          </View>
          <View style={styles.grid2Col}>
            {PAYMENT_GATEWAYS.map((gw) => {
              const active = selectedGateway === gw.id;
              return (
                <TouchableOpacity
                  key={gw.id}
                  style={[styles.selectionCard, active && styles.selectionCardActive]}
                  onPress={() => setSelectedGateway(gw.id)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.cardTitle}>{gw.name}</Text>
                  <Text style={styles.cardSub}>{gw.badge}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Terms Checkbox */}
        <TouchableOpacity
          style={styles.termsRow}
          activeOpacity={0.8}
          onPress={() => setAgreed(!agreed)}
        >
          <View style={[styles.checkSquare, agreed && styles.checkSquareActive]}>
            {agreed && <Text style={styles.checkmark}>✓</Text>}
          </View>
          <Text style={styles.termsText}>
            I agree to XCharge <Text style={styles.termsHighlight}>Terms of Service</Text> and the{' '}
            <Text style={styles.termsHighlight}>OCPI Privacy Policy</Text> for secure autonomous roaming.
          </Text>
        </TouchableOpacity>

        {/* CTA */}
        <TouchableOpacity
          style={[styles.primaryBtn, isLoading && { opacity: 0.8 }]}
          onPress={handleContinue}
          disabled={isLoading}
          activeOpacity={0.85}
        >
          {isLoading ? (
            <ActivityIndicator color={Theme.colors.onPrimary} size="small" />
          ) : (
            <Text style={styles.primaryBtnText}>Continue to Phone Verification →</Text>
          )}
        </TouchableOpacity>

        {/* Bottom Login Link */}
        <View style={styles.footerRow}>
          <Text style={styles.footerText}>
            Already have an account?{' '}
            <Text style={styles.footerLink} onPress={() => onNavigate('login')}>
              Log In
            </Text>
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    backgroundColor: Theme.colors.background,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backArrow: {
    color: Theme.colors.textPrimary,
    fontSize: 18,
  },
  stepTextContainer: {
    alignItems: 'center',
  },
  stepCounter: {
    fontSize: 10,
    fontWeight: '700',
    color: Theme.colors.primary,
    letterSpacing: 1.5,
  },
  stepTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Theme.colors.textPrimary,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Theme.colors.success,
  },
  progressBarBg: {
    height: 3,
    backgroundColor: Theme.colors.surfaceBright,
    borderRadius: 2,
    marginBottom: 20,
  },
  progressBarFill: {
    height: 3,
    backgroundColor: Theme.colors.primary,
    borderRadius: 2,
  },
  titleSection: {
    marginBottom: 24,
  },
  mainTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
    marginBottom: 8,
  },
  mainSubtitle: {
    fontSize: 13,
    color: Theme.colors.textSecondary,
    lineHeight: 18,
  },
  formGroup: {
    marginBottom: 18,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Theme.colors.textSecondary,
    letterSpacing: 1,
    marginBottom: 6,
  },
  accentLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Theme.colors.primary,
  },
  optionalLabel: {
    fontSize: 11,
    color: Theme.colors.textMuted,
  },
  inputField: {
    backgroundColor: Theme.colors.surface,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    borderRadius: Theme.borderRadius.md,
    minHeight: 50,
    paddingHorizontal: 16,
    color: Theme.colors.textPrimary,
    fontSize: 15,
  },
  phoneRow: {
    flexDirection: 'row',
    gap: 8,
  },
  countryCodeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.surface,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    borderRadius: Theme.borderRadius.md,
    paddingHorizontal: 12,
    gap: 6,
  },
  codeText: {
    color: Theme.colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  grid2Col: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  selectionCard: {
    width: '48.5%',
    backgroundColor: Theme.colors.surface,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    borderRadius: Theme.borderRadius.md,
    padding: 12,
  },
  selectionCardActive: {
    borderColor: Theme.colors.primary,
    backgroundColor: 'rgba(0, 240, 255, 0.05)',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
  },
  cardSub: {
    fontSize: 11,
    color: Theme.colors.textSecondary,
  },
  radioDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioDotActive: {
    borderColor: Theme.colors.primary,
  },
  innerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Theme.colors.primary,
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginVertical: 14,
  },
  checkSquare: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    backgroundColor: Theme.colors.surfaceContainerLowest,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  checkSquareActive: {
    backgroundColor: Theme.colors.primary,
    borderColor: Theme.colors.primary,
  },
  checkmark: {
    color: Theme.colors.onPrimary,
    fontSize: 11,
    fontWeight: '800',
  },
  termsText: {
    flex: 1,
    fontSize: 11,
    color: Theme.colors.textSecondary,
    lineHeight: 16,
  },
  termsHighlight: {
    color: Theme.colors.textPrimary,
    fontWeight: '600',
  },
  primaryBtn: {
    backgroundColor: Theme.colors.primary,
    minHeight: 52,
    borderRadius: Theme.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  primaryBtnText: {
    color: Theme.colors.onPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  footerRow: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: 13,
    color: Theme.colors.textSecondary,
  },
  footerLink: {
    color: Theme.colors.primary,
    fontWeight: '700',
  },
});
