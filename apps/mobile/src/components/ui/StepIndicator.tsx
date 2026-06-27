import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FONT_SIZE, SPACING } from '../../constants';

const AUTH_PRIMARY = '#7C3AED';

interface StepIndicatorProps {
  current: number;
  total: number;
}

const StepIndicator: React.FC<StepIndicatorProps> = ({ current, total }) => (
  <View style={styles.row}>
    {Array.from({ length: total }).map((_, i) => {
      const step = i + 1;
      const active = step === current;
      const done = step < current;
      return (
        <React.Fragment key={step}>
          <View style={[styles.circle, (active || done) && styles.circleActive]}>
            <Text style={[styles.circleText, (active || done) && styles.circleTextActive]}>
              {step}
            </Text>
          </View>
          {step < total && (
            <View style={[styles.line, done && styles.lineActive]} />
          )}
        </React.Fragment>
      );
    })}
  </View>
);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  circle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleActive: {
    backgroundColor: AUTH_PRIMARY,
    borderColor: AUTH_PRIMARY,
  },
  circleText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: FONT_SIZE.sm,
    fontWeight: '700',
  },
  circleTextActive: {
    color: '#FFFFFF',
  },
  line: {
    flex: 1,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginHorizontal: 4,
    maxWidth: 48,
  },
  lineActive: {
    backgroundColor: AUTH_PRIMARY,
  },
});

export default StepIndicator;
