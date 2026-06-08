import React from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../types';
import OnboardingLayout from '../../components/onboarding/OnboardingLayout';

type Props = NativeStackScreenProps<AuthStackParamList, 'OnboardingProfile'>;

const OnboardingProfile: React.FC<Props> = ({ navigation }) => {
  const handleNext = () => navigation.navigate('OnboardingDiscover');
  const handleSkip = () => navigation.navigate('Login');

  return (
    <OnboardingLayout
      illustration={require('../../assets/onboarding/onboarding2.png')}
      title="Build your pet's profile"
      description="Upload photos, add breed info, share their personality"
      currentIndex={1}
      totalSlides={3}
      buttonLabel="Next"
      onNext={handleNext}
      onSkip={handleSkip}
    />
  );
};

export default OnboardingProfile;
