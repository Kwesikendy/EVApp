// screens/OtpSuccessScreen.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Theme } from '../theme';

interface OtpSuccessScreenProps {
  onEnterDashboard: () => void;
  user?: any;
}

export const OtpSuccessScreen: React.FC<OtpSuccessScreenProps> = ({ onEnterDashboard, user }) => {
  const insets = useSafeAreaInsets();
  const walletAmount = user?.walletBalance !== undefined ? `GH₵ ${Number(user.walletBalance).toFixed(2)} Ready` : 'GH₵ 240.00 Ready';

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
            <Text style={styles.checkIcon}>✓</Text>
          </View>
        </View>
        <Text style={styles.heroTitle}>Identity Verified</Text>
        <Text style={styles.heroSub}>
          Welcome back, {user?.displayName || 'Driver'}. Establishing real-time telemetry link to Accra Grid Hub.
        </Text>
      </View>

      {/* Sync Checklist */}
      <View style={styles.checklistCard}>
        <View style={styles.checkItem}>
          <Text style={styles.checkDot}>✓</Text>
          <Text style={styles.checkLabel}>OCPI 2.2.1 Protocol</Text>
          <Text style={styles.checkStatus}>Verified</Text>
        </View>
        <View style={styles.checkItem}>
          <Text style={styles.checkDot}>✓</Text>
          <Text style={styles.checkLabel}>MoMo Wallet Link</Text>
          <Text style={styles.checkStatus}>{walletAmount}</Text>
        </View>
        <View style={styles.checkItem}>
          <Text style={styles.checkDot}>✓</Text>
          <Text style={styles.checkLabel}>Nearby Fast Stall Cache</Text>
          <Text style={styles.checkStatus}>Synced</Text>
        </View>
      </View>

      {/* Bottom CTA */}
      <TouchableOpacity
        style={styles.ctaBtn}
        onPress={onEnterDashboard}
        activeOpacity={0.85}
      >
        <Text style={styles.ctaText}>Enter Dashboard Now →</Text>
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
    borderColor: 'rgba(0,240,255,0.4)',
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
    borderColor: 'rgba(0,240,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: 'rgba(0,240,255,0.03)',
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
