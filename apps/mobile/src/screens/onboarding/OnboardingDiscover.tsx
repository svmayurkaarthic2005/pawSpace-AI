import React from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../types';
import OnboardingLayout from '../../components/onboarding/OnboardingLayout';
import { markOnboardingComplete } from '../../utils/onboardingStorage';

type Props = NativeStackScreenProps<AuthStackParamList, 'OnboardingDiscover'>;

const OnboardingDiscover: React.FC<Props> = ({ navigation }) => {
  const handleGetStarted = async () => {
    await markOnboardingComplete();
    navigation.navigate('Login');
  };

  return (
    <OnboardingLayout
      illustration={require('../../assets/onboarding/onboarding3.png')}
      title="Discover meetups near you"
      description="AI-powered event and community recommendations"
      currentIndex={2}
      totalSlides={3}
      buttonLabel="Get Started"
      onNext={handleGetStarted}
      // No Skip on last screen — user must tap Get Started
    />
  );
};

export default OnboardingDiscover;
