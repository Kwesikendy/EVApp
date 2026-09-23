import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Check,
  ArrowRight,
  ShieldCheck,
  Smartphone,
  MapPin,
  Zap,
} from 'lucide-react-native';
import { Theme } from '../theme';
import { XChargeLogoNative, XChargeMarkNative } from '../XChargeLogoNative';

interface OtpSuccessScreenProps {
  navigation?: any;
  onEnterDashboard?: () => void;
  user?: any;
}

export const OtpSuccessScreen: React.FC<OtpSuccessScreenProps> = ({ navigation, onEnterDashboard, user }) => {
  const insets = useSafeAreaInsets();
  const walletAmount = user?.walletBalance !== undefined ? `GH₵ ${Number(user.walletBalance).toFixed(2)} Ready` : 'GH₵ 240.00 Ready';

  const handleProceed = () => {
    if (onEnterDashboard) {
      onEnterDashboard();
    } else if (navigation) {
      navigation.navigate('MainDashboard');
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: Math.max(insets.top, 24),
          paddingBottom: Math.max(insets.bottom + 16, 24),
        },
      ]}
    >
      {/* Top Banner */}
      <View style={styles.topStatus}>
        <Text style={styles.protocolBadge}>256-BIT TELEMETRY AUTHENTICATED</Text>
      </View>

      {/* Pulse Circle / Success Emblem */}
      <View style={styles.centerBadgeContainer}>
        <View style={styles.outerRing}>
          <View style={styles.innerRing}>
            <XChargeMarkNative size={44} />
          </View>
        </View>
        <XChargeLogoNative width={180} height={52} showSubtitle={false} style={{ marginBottom: 10 }} />
        <Text style={styles.heroTitle}>Identity Verified</Text>
        <Text style={styles.heroSub}>
          Welcome back, {user?.displayName || 'Driver'}. Establishing real-time telemetry link to ChargeLink Kumasi & Accra Grid.
        </Text>
      </View>

      {/* Sync Checklist */}
      <View style={styles.checklistCard}>
        <View style={styles.checkItem}>
          <Check size={16} color={Theme.colors.primary} strokeWidth={3} style={{ marginRight: 8 }} />
          <Text style={styles.checkLabel}>OCPI 2.2.1 Protocol</Text>
          <Text style={styles.checkStatus}>Verified</Text>
        </View>
        <View style={styles.checkItem}>
          <Check size={16} color={Theme.colors.primary} strokeWidth={3} style={{ marginRight: 8 }} />
          <Text style={styles.checkLabel}>MoMo Wallet Link</Text>
          <Text style={styles.checkStatus}>{walletAmount}</Text>
        </View>
        <View style={styles.checkItem}>
          <Check size={16} color={Theme.colors.primary} strokeWidth={3} style={{ marginRight: 8 }} />
          <Text style={styles.checkLabel}>Nearby Fast Stall Cache</Text>
          <Text style={styles.checkStatus}>Synced</Text>
        </View>
      </View>

      {/* Bottom CTA */}
      <TouchableOpacity
        style={styles.ctaBtn}
        onPress={handleProceed}
        activeOpacity={0.85}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={styles.ctaText}>Enter Dashboard Now</Text>
          <ArrowRight size={18} color={Theme.colors.onPrimary} strokeWidth={2.5} />
        </View>
      </TouchableOpacity>
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
  topStatus: {
    alignItems: 'center',
  },
  protocolBadge: {
    color: Theme.colors.primary,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.4)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Theme.borderRadius.full,
  },
  centerBadgeContainer: {
    alignItems: 'center',
  },
  outerRing: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: 'rgba(34, 197, 94, 0.05)',
  },
  innerRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: Theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkIcon: {
    color: Theme.colors.primary,
    fontSize: 32,
    fontWeight: '800',
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Theme.colors.textPrimary,
    marginBottom: 8,
  },
  heroSub: {
    fontSize: 13,
    color: Theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 20,
  },
  checklistCard: {
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.borderRadius.md,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    padding: 16,
    gap: 12,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  checkDot: {
    color: Theme.colors.primary,
    fontWeight: '800',
    marginRight: 8,
  },
  checkLabel: {
    flex: 1,
    color: Theme.colors.textPrimary,
    fontSize: 13,
  },
  checkStatus: {
    color: Theme.colors.success,
    fontSize: 12,
    fontWeight: '600',
  },
  ctaBtn: {
    backgroundColor: Theme.colors.primary,
    minHeight: 52,
    borderRadius: Theme.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ctaText: {
    color: Theme.colors.onPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
});
