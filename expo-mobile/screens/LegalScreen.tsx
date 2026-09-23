// expo-mobile/screens/LegalScreen.tsx
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Scale,
  FileText,
  Lock,
  ShieldCheck,
  AlertTriangle,
  ArrowLeft,
  Search,
  Check,
  Building2,
} from 'lucide-react-native';
import { Theme } from '../theme';
import { XChargeMarkNative } from '../XChargeLogoNative';
import {
  TERMS_OF_SERVICE,
  PRIVACY_POLICY,
  LEGAL_LAST_UPDATED,
  LEGAL_ENTITY_NAME,
  LEGAL_JURISDICTION,
  LEGAL_CONTACT_EMAIL,
  LEGAL_STATION_HQ,
  LegalSection,
} from '../legalData';

interface LegalScreenProps {
  navigation?: any;
  route?: any;
  onBack?: () => void;
  onAccept?: () => void;
  initialTab?: 'terms' | 'privacy';
  showAcceptButton?: boolean;
}

export const LegalScreen: React.FC<LegalScreenProps> = ({
  navigation,
  route,
  onBack,
  onAccept,
  initialTab = 'terms',
  showAcceptButton = false,
}) => {
  const insets = useSafeAreaInsets();
  const paramTab = route?.params?.tab || initialTab;
  const [activeTab, setActiveTab] = useState<'terms' | 'privacy'>(paramTab);
  const [searchQuery, setSearchQuery] = useState('');

  const sections = activeTab === 'terms' ? TERMS_OF_SERVICE : PRIVACY_POLICY;

  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return sections;
    const q = searchQuery.toLowerCase();
    return sections.filter((sec) => {
      const matchTitle = sec.title.toLowerCase().includes(q);
      const matchContent = sec.content.some((c) => c.toLowerCase().includes(q));
      const matchBadge = sec.badge?.toLowerCase().includes(q);
      return matchTitle || matchContent || matchBadge;
    });
  }, [sections, searchQuery]);

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (navigation && typeof navigation.goBack === 'function') {
      navigation.goBack();
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: Math.max(insets.top, 16),
          paddingBottom: Math.max(insets.bottom, 16),
        },
      ]}
    >
      <StatusBar barStyle="light-content" backgroundColor={Theme.colors.background} />

      {/* Top Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity
          onPress={handleBack}
          style={styles.backBtn}
          activeOpacity={0.7}
        >
          <ArrowLeft size={18} color={Theme.colors.textPrimary} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>

        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Legal & Compliance</Text>
          <Text style={styles.headerSub}>Republic of Ghana · Act 843</Text>
        </View>

        <View style={styles.logoMarkBox}>
          <XChargeMarkNative size={22} />
        </View>
      </View>

      {/* Segmented Switcher */}
      <View style={styles.segmentContainer}>
        <TouchableOpacity
          style={[styles.segmentBtn, activeTab === 'terms' && styles.segmentBtnActive]}
          onPress={() => setActiveTab('terms')}
          activeOpacity={0.8}
        >
          <FileText
            size={14}
            color={activeTab === 'terms' ? Theme.colors.onPrimary : Theme.colors.textSecondary}
          />
          <Text
            style={[
              styles.segmentText,
              activeTab === 'terms' && styles.segmentTextActive,
            ]}
          >
            Terms of Service
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.segmentBtn, activeTab === 'privacy' && styles.segmentBtnActive]}
          onPress={() => setActiveTab('privacy')}
          activeOpacity={0.8}
        >
          <Lock
            size={14}
            color={activeTab === 'privacy' ? Theme.colors.onPrimary : Theme.colors.textSecondary}
          />
          <Text
            style={[
              styles.segmentText,
              activeTab === 'privacy' && styles.segmentTextActive,
            ]}
          >
            Privacy Policy
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search Input Box */}
      <View style={styles.searchBox}>
        <Search size={16} color={Theme.colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search clauses (e.g. idle fee, battery)..."
          placeholderTextColor={Theme.colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Text style={{ color: Theme.colors.textSecondary, fontSize: 16 }}>×</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Main Scrollable Clauses */}
      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Compliance Banner */}
        <View style={styles.advisoryBanner}>
          <ShieldCheck size={20} color={Theme.colors.primary} style={{ marginTop: 2 }} />
          <View style={{ flex: 1 }}>
            <Text style={styles.advisoryTitle}>
              Enforceable Under the Laws of Ghana
            </Text>
            <Text style={styles.advisoryText}>
              Governing high-voltage EV power dispensing, Ghana MoMo pre-authorization escrow, idle parking fees, and the Data Protection Act (Act 843).
            </Text>
          </View>
        </View>

        {filteredSections.map((sec) => (
          <View
            key={sec.id}
            style={[
              styles.clauseCard,
              sec.isWarning && styles.clauseCardWarning,
            ]}
          >
            <View style={styles.clauseHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                {sec.isWarning && <AlertTriangle size={15} color={Theme.colors.warning} />}
                <Text style={styles.clauseTitle}>{sec.title}</Text>
              </View>

              {sec.badge && (
                <View
                  style={[
                    styles.badge,
                    sec.isWarning && styles.badgeWarning,
                  ]}
                >
                  <Text
                    style={[
                      styles.badgeText,
                      sec.isWarning && styles.badgeTextWarning,
                    ]}
                  >
                    {sec.badge}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.clauseBody}>
              {sec.content.map((p, idx) => (
                <Text
                  key={idx}
                  style={[
                    styles.clauseParagraph,
                    (p.startsWith('a)') ||
                      p.startsWith('b)') ||
                      p.startsWith('c)') ||
                      p.startsWith('d)') ||
                      p.startsWith('e)')) &&
                      styles.subPoint,
                  ]}
                >
                  {p}
                </Text>
              ))}
            </View>
          </View>
        ))}

        {/* Entity Signature Box */}
        <View style={styles.entityBox}>
          <Text style={styles.entityTitle}>{LEGAL_ENTITY_NAME}</Text>
          <Text style={styles.entitySub}>Station HQ: {LEGAL_STATION_HQ}</Text>
          <Text style={styles.entitySub}>Legal Inquiries: {LEGAL_CONTACT_EMAIL}</Text>
          <Text style={styles.entitySub}>Version: {LEGAL_LAST_UPDATED}</Text>
        </View>
      </ScrollView>

      {/* Bottom Accept Button (if shown) */}
      {showAcceptButton && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.acceptBtn}
            onPress={() => {
              if (onAccept) onAccept();
              handleBack();
            }}
            activeOpacity={0.85}
          >
            <Check size={18} color={Theme.colors.onPrimary} strokeWidth={3} />
            <Text style={styles.acceptText}>I Agree & Accept Terms</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
    paddingHorizontal: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    marginBottom: 8,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingRight: 8,
  },
  backText: {
    color: Theme.colors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  headerTitleContainer: {
    alignItems: 'center',
  },
  headerTitle: {
    color: Theme.colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  headerSub: {
    color: Theme.colors.textMuted,
    fontSize: 10,
    fontFamily: 'monospace',
  },
  logoMarkBox: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: 'rgba(34, 197, 94, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: Theme.colors.surfaceContainerLowest,
    borderRadius: Theme.borderRadius.md,
    padding: 3,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: Theme.borderRadius.sm,
    gap: 6,
  },
  segmentBtnActive: {
    backgroundColor: Theme.colors.primary,
  },
  segmentText: {
    fontSize: 12,
    fontWeight: '600',
    color: Theme.colors.textSecondary,
  },
  segmentTextActive: {
    color: Theme.colors.onPrimary,
    fontWeight: '700',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.surface,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    borderRadius: Theme.borderRadius.md,
    paddingHorizontal: 12,
    height: 42,
    marginBottom: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    color: Theme.colors.textPrimary,
    fontSize: 12,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
    gap: 12,
  },
  advisoryBanner: {
    flexDirection: 'row',
    backgroundColor: 'rgba(34, 197, 94, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.25)',
    borderRadius: Theme.borderRadius.md,
    padding: 12,
    gap: 10,
  },
  advisoryTitle: {
    color: Theme.colors.textPrimary,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 2,
  },
  advisoryText: {
    color: Theme.colors.textSecondary,
    fontSize: 11,
    lineHeight: 16,
  },
  clauseCard: {
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.borderRadius.md,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    padding: 14,
  },
  clauseCardWarning: {
    borderColor: 'rgba(245, 158, 11, 0.35)',
    backgroundColor: 'rgba(245, 158, 11, 0.05)',
  },
  clauseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  clauseTitle: {
    color: Theme.colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Theme.borderRadius.full,
    backgroundColor: 'rgba(34, 197, 94, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  badgeWarning: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: 'rgba(245, 158, 11, 0.35)',
  },
  badgeText: {
    color: Theme.colors.primary,
    fontSize: 9,
    fontFamily: 'monospace',
    fontWeight: '700',
  },
  badgeTextWarning: {
    color: Theme.colors.warning,
  },
  clauseBody: {
    gap: 8,
  },
  clauseParagraph: {
    color: Theme.colors.textSecondary,
    fontSize: 11.5,
    lineHeight: 17,
  },
  subPoint: {
    paddingLeft: 10,
    borderLeftWidth: 2,
    borderLeftColor: 'rgba(255, 255, 255, 0.15)',
    color: '#cbd5e1',
  },
  entityBox: {
    backgroundColor: Theme.colors.surfaceContainerLowest,
    borderRadius: Theme.borderRadius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    gap: 4,
    marginTop: 8,
  },
  entityTitle: {
    color: Theme.colors.textPrimary,
    fontSize: 11,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  entitySub: {
    color: Theme.colors.textMuted,
    fontSize: 10,
    fontFamily: 'monospace',
  },
  footer: {
    paddingTop: 10,
  },
  acceptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Theme.colors.primary,
    borderRadius: Theme.borderRadius.md,
    paddingVertical: 14,
    gap: 8,
  },
  acceptText: {
    color: Theme.colors.onPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
});
