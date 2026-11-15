import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  BackHandler,
  Linking,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { WebView } from 'react-native-webview';
import { CLOUD_BACKEND_URL } from './api';
import { XChargeMarkNative } from './XChargeLogoNative';

const APP_URL = CLOUD_BACKEND_URL;
const NativeWebView = WebView as unknown as React.ComponentType<any>;

function WilpowerShell() {
  const insets = useSafeAreaInsets();
  const webViewRef = useRef<any>(null);
  const [canGoBack, setCanGoBack] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    StatusBar.setBarStyle('light-content');
    if (Platform.OS === 'android') {
      StatusBar.setBackgroundColor('#07110B');
    }

    Location.requestForegroundPermissionsAsync().catch(() => {});
  }, []);

  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (canGoBack && webViewRef.current) {
        webViewRef.current.goBack();
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [canGoBack]);

  const handleNavigationStateChange = (navState: { canGoBack: boolean }) => {
    setCanGoBack(navState.canGoBack);
  };

  const handleShouldStartLoad = (request: { url: string }) => {
    const { url } = request;
    if (!url) return false;
    if (
      url.startsWith('tel:') ||
      url.startsWith('mailto:') ||
      url.startsWith('whatsapp:') ||
      url.startsWith('https://maps.google.com') ||
      url.startsWith('https://www.google.com/maps')
    ) {
      Linking.openURL(url).catch(() => {});
      return false;
    }
    return true;
  };

  const handleRetry = () => {
    setHasError(false);
    setIsLoading(true);
    webViewRef.current?.reload();
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <NativeWebView
        ref={webViewRef}
        source={{ uri: APP_URL }}
        style={styles.webview}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        geolocationEnabled={true}
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        pullToRefreshEnabled={true}
        startInLoadingState={true}
        mixedContentMode="compatibility"
        thirdPartyCookiesEnabled={true}
        sharedCookiesEnabled={true}
        onNavigationStateChange={handleNavigationStateChange}
        onShouldStartLoadWithRequest={handleShouldStartLoad}
        onLoadStart={() => {
          setHasError(false);
        }}
        onLoadEnd={() => {
          setIsLoading(false);
        }}
        onError={() => {
          setIsLoading(false);
          setHasError(true);
        }}
        onHttpError={(syntheticEvent: { nativeEvent: { statusCode: number } }) => {
          const { statusCode } = syntheticEvent.nativeEvent;
          if (statusCode >= 500) {
            setIsLoading(false);
            setHasError(true);
          }
        }}
      />

      {isLoading && !hasError && (
        <View style={styles.loadingOverlay} pointerEvents="none">
          <XChargeMarkNative size={56} />
          <Text style={styles.loadingTitle}>Wilpower</Text>
          <ActivityIndicator size="small" color="#BDF22E" style={{ marginTop: 12 }} />
        </View>
      )}

      {hasError && (
        <View style={styles.errorOverlay}>
          <XChargeMarkNative size={56} />
          <Text style={styles.errorTitle}>Connection Unavailable</Text>
          <Text style={styles.errorText}>
            Unable to reach Wilpower servers. Check your internet connection and try again.
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRetry} activeOpacity={0.85}>
            <Text style={styles.retryText}>Retry Connection</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <WilpowerShell />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#07110B',
  },
  webview: {
    flex: 1,
    backgroundColor: '#07110B',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: '#07110B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingTitle: {
    marginTop: 14,
    fontSize: 22,
    fontWeight: '800',
    color: '#F8FBF4',
    letterSpacing: -0.5,
  },
  errorOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: '#07110B',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  errorTitle: {
    marginTop: 16,
    fontSize: 20,
    fontWeight: '700',
    color: '#F8FBF4',
  },
  errorText: {
    marginTop: 8,
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 20,
  },
  retryButton: {
    marginTop: 20,
    backgroundColor: '#BDF22E',
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryText: {
    color: '#07110B',
    fontWeight: '700',
    fontSize: 14,
  },
});
