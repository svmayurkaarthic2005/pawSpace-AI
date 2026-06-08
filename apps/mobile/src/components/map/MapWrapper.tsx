/**
 * Safe wrapper for react-native-maps
 * Prevents app crash if native module is not properly linked
 */
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';

let MapView: any = null;
let Marker: any = null;
let Polyline: any = null;
let PROVIDER_GOOGLE: any = null;

let mapModuleError: Error | null = null;

try {
  const Maps = require('react-native-maps');
  MapView = Maps.default;
  Marker = Maps.Marker;
  Polyline = Maps.Polyline;
  PROVIDER_GOOGLE = Maps.PROVIDER_GOOGLE;
} catch (error) {
  mapModuleError = error as Error;
  console.error('Failed to load react-native-maps:', error);
}

interface MapErrorFallbackProps {
  error: Error;
}

const MapErrorFallback: React.FC<MapErrorFallbackProps> = ({ error }) => {
  const handleFixInstructions = () => {
    console.log(`
╔═══════════════════════════════════════════════════════════════╗
║  FIX REACT-NATIVE-MAPS ERROR                                  ║
╠═══════════════════════════════════════════════════════════════╣
║                                                                ║
║  The native module for react-native-maps is not linked.       ║
║                                                                ║
║  SOLUTION:                                                     ║
║                                                                ║
║  1. Stop Metro bundler (Ctrl+C)                               ║
║                                                                ║
║  2. Clean Android build:                                      ║
║     cd apps/mobile/android                                    ║
║     ./gradlew clean                                           ║
║     cd ..                                                     ║
║                                                                ║
║  3. Start fresh:                                              ║
║     npx react-native start --reset-cache                      ║
║                                                                ║
║  4. In new terminal, rebuild:                                 ║
║     npx react-native run-android                              ║
║                                                                ║
╚═══════════════════════════════════════════════════════════════╝
    `);
  };

  return (
    <View style={styles.errorContainer}>
      <View style={styles.errorCard}>
        <Text style={styles.errorIcon}>🗺️</Text>
        <Text style={styles.errorTitle}>Maps Module Error</Text>
        <Text style={styles.errorMessage}>
          The native maps module isn't loaded. This requires rebuilding the app.
        </Text>
        <TouchableOpacity style={styles.button} onPress={handleFixInstructions}>
          <Text style={styles.buttonText}>View Fix Instructions (Console)</Text>
        </TouchableOpacity>
        <Text style={styles.errorDetail}>
          Error: {error.message}
        </Text>
      </View>
    </View>
  );
};

export { MapView, Marker, Polyline, PROVIDER_GOOGLE, mapModuleError, MapErrorFallback };

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    backgroundColor: '#0D0D1A',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorCard: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 16,
    padding: 24,
    maxWidth: 400,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#EF4444',
    marginBottom: 12,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  button: {
    backgroundColor: '#7C3AED',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  errorDetail: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.4)',
    textAlign: 'center',
    marginTop: 8,
  },
});
