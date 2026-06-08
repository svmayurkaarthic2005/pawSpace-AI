import React from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../types';
import OnboardingLayout from '../../components/onboarding/OnboardingLayout';

type Props = NativeStackScreenProps<AuthStackParamList, 'OnboardingWelcome'>;

const OnboardingWelcome: React.FC<Props> = ({ navigation }) => {
  const handleNext = () => navigation.navigate('OnboardingProfile');
  const handleSkip = () => navigation.navigate('Login');

  return (
    <OnboardingLayout
      illustration={require('../../assets/onboarding/onboarding1.png')}
      title={'Your pet deserves\na social life'}
      description="Connect with thousands of pet lovers nearby"
      currentIndex={0}
      totalSlides={3}
      buttonLabel="Next"
      onNext={handleNext}
      onSkip={handleSkip}
    />
  );
};

export default OnboardingWelcome;
