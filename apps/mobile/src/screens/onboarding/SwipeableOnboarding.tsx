import React, { useRef, useState, useCallback } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
  ImageSourcePropType,
  ViewToken,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../types';
import OnboardingLayout from '../../components/onboarding/OnboardingLayout';
import { markOnboardingComplete } from '../../utils/onboardingStorage';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type Props = NativeStackScreenProps<AuthStackParamList, 'OnboardingWelcome'>;

interface OnboardingSlide {
  id: string;
  illustration: ImageSourcePropType;
  title: string;
  description: string;
}

const ONBOARDING_DATA: OnboardingSlide[] = [
  {
    id: '1',
    illustration: require('../../assets/onboarding/onboarding1.png'),
    title: 'Your pet deserves\na social life',
    description: 'Connect with thousands of pet lovers nearby',
  },
  {
    id: '2',
    illustration: require('../../assets/onboarding/onboarding2.png'),
    title: "Build your pet's profile",
    description: 'Upload photos, add breed info, share their personality',
  },
  {
    id: '3',
    illustration: require('../../assets/onboarding/onboarding3.png'),
    title: 'Discover meetups near you',
    description: 'AI-powered event and community recommendations',
  },
];

const SwipeableOnboarding: React.FC<Props> = ({ navigation }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList<OnboardingSlide>>(null);

  // Update current index based on visible items
  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index !== null) {
        setCurrentIndex(viewableItems[0].index);
      }
    },
    []
  );

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  const handleNext = useCallback(() => {
    if (currentIndex < ONBOARDING_DATA.length - 1) {
      // Navigate to next page
      flatListRef.current?.scrollToIndex({
        index: currentIndex + 1,
        animated: true,
      });
    } else {
      // Last page - navigate to login
      handleGetStarted();
    }
  }, [currentIndex]);

  const handleSkip = useCallback(() => {
    navigation.navigate('Login');
  }, [navigation]);

  const handleGetStarted = useCallback(async () => {
    await markOnboardingComplete();
    navigation.navigate('Login');
  }, [navigation]);

  const renderItem = useCallback(
    ({ item, index }: { item: OnboardingSlide; index: number }) => {
      const isLastSlide = index === ONBOARDING_DATA.length - 1;
      const buttonLabel = isLastSlide ? 'Get Started' : 'Next';
      const showSkip = !isLastSlide;

      return (
        <View style={styles.slideContainer}>
          <OnboardingLayout
            illustration={item.illustration}
            title={item.title}
            description={item.description}
            currentIndex={currentIndex}
            totalSlides={ONBOARDING_DATA.length}
            buttonLabel={buttonLabel}
            onNext={handleNext}
            onSkip={showSkip ? handleSkip : undefined}
          />
        </View>
      );
    },
    [currentIndex, handleNext, handleSkip]
  );

  const keyExtractor = useCallback((item: OnboardingSlide) => item.id, []);

  const getItemLayout = useCallback(
    (_data: ArrayLike<OnboardingSlide> | null | undefined, index: number) => ({
      length: SCREEN_WIDTH,
      offset: SCREEN_WIDTH * index,
      index,
    }),
    []
  );

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={ONBOARDING_DATA}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        scrollEventThrottle={16}
        decelerationRate="fast"
        snapToAlignment="center"
        snapToInterval={SCREEN_WIDTH}
        getItemLayout={getItemLayout}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        removeClippedSubviews={false}
        initialNumToRender={1}
        maxToRenderPerBatch={1}
        windowSize={3}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D1A',
  },
  slideContainer: {
    width: SCREEN_WIDTH,
    flex: 1,
  },
});

export default SwipeableOnboarding;
