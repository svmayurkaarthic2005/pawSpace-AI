import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../types';

const { width: W } = Dimensions.get('window');
const LOGO_SIZE = W * 0.38;
const GLOW_SIZE = LOGO_SIZE * 2.2;

type Props = NativeStackScreenProps<AuthStackParamList, 'Splash'>;

const SplashScreen: React.FC<Props> = ({ navigation }) => {
  // ── Animations ──────────────────────────────────────────────────────────
  const logoScale = useSharedValue(0.8);
  const logoOpacity = useSharedValue(0);
  const textOpacity = useSharedValue(0);
  const glowOpacity = useSharedValue(0);
  const glowScale = useSharedValue(0.7);
  const pulseScale = useSharedValue(1);

  const navigate = () => {
    navigation.replace('OnboardingWelcome');
  };

  useEffect(() => {
    // Fade-in + scale entrance
    logoOpacity.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) });
    logoScale.value = withTiming(1, { duration: 700, easing: Easing.out(Easing.back(1.5)) });

    glowOpacity.value = withDelay(300, withTiming(0.7, { duration: 700 }));
    glowScale.value = withDelay(300, withTiming(1, { duration: 700 }));

    textOpacity.value = withDelay(500, withTiming(1, { duration: 600 }));

    // Pulse loop after entrance
    pulseScale.value = withDelay(
      900,
      withRepeat(
        withSequence(
          withTiming(1.05, { duration: 1000, easing: Easing.inOut(Easing.sin) }),
          withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        false,
      ),
    );

    // Navigate after 2.5 s
    const timer = setTimeout(() => {
      runOnJS(navigate)();
    }, 2500);

    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const logoAnimStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [
      { scale: logoScale.value * pulseScale.value },
    ],
  }));

  const glowAnimStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
    transform: [{ scale: glowScale.value }],
  }));

  const textAnimStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
    transform: [{ translateY: (1 - textOpacity.value) * 12 }],
  }));

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#0D0D1A" />

      {/* Purple glow ring behind logo */}
      <Animated.View style={[styles.glow, glowAnimStyle]} />

      {/* Outer ring decoration */}
      <View style={styles.ringOuter} />
      <View style={styles.ringInner} />

      {/* Paw logo */}
      <Animated.View style={[styles.logoContainer, logoAnimStyle]}>
        <Text style={styles.pawIcon}>🐾</Text>
      </Animated.View>

      {/* Text */}
      <Animated.View style={[styles.textBlock, textAnimStyle]}>
        <Text style={styles.appName}>PawSpace</Text>
        <Text style={styles.tagline}>your pet's world</Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0D0D1A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Purple radial glow
  glow: {
    position: 'absolute',
    width: GLOW_SIZE,
    height: GLOW_SIZE,
    borderRadius: GLOW_SIZE / 2,
    backgroundColor: '#7C3AED',
    opacity: 0.25,
  },
  // Decorative concentric rings
  ringOuter: {
    position: 'absolute',
    width: LOGO_SIZE + 96,
    height: LOGO_SIZE + 96,
    borderRadius: (LOGO_SIZE + 96) / 2,
    borderWidth: 1,
    borderColor: 'rgba(124,58,237,0.18)',
  },
  ringInner: {
    position: 'absolute',
    width: LOGO_SIZE + 44,
    height: LOGO_SIZE + 44,
    borderRadius: (LOGO_SIZE + 44) / 2,
    borderWidth: 1,
    borderColor: 'rgba(124,58,237,0.3)',
  },
  logoContainer: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
    borderRadius: LOGO_SIZE / 2,
    backgroundColor: 'rgba(124,58,237,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pawIcon: {
    fontSize: LOGO_SIZE * 0.52,
  },
  textBlock: {
    marginTop: 32,
    alignItems: 'center',
  },
  appName: {
    fontSize: 34,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  tagline: {
    fontSize: 15,
    fontWeight: '500',
    color: '#A78BFA',
    marginTop: 6,
    letterSpacing: 0.3,
  },
});

export default SplashScreen;
