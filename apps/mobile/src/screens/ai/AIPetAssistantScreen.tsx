import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/Ionicons';
import { useQuery } from '@tanstack/react-query';
import { useAIPetAssistant } from '../../hooks/useAIPetAssistant';
import { petApi } from '../../services/post.service';
import { PetProfile } from '../../services/aiAssistant.service';
import { FeedStackParamList } from '../../types';
import { COLORS, SPACING, QUERY_KEYS } from '../../constants';
import MessageBubble from '../../components/ai/MessageBubble';
import TypingIndicator from '../../components/ai/TypingIndicator';
import SuggestionChips from '../../components/ai/SuggestionChips';
import PetContextBanner from '../../components/ai/PetContextBanner';
import PetSelectorModal from '../../components/ai/PetSelectorModal';
import EmptyAIState from '../../components/ai/EmptyAIState';

type AIPetAssistantNavProp = NativeStackNavigationProp<FeedStackParamList, 'PetAssistant'>;
type AIPetAssistantRouteProp = RouteProp<FeedStackParamList, 'PetAssistant'>;

const AIPetAssistantScreen: React.FC = () => {
  const navigation = useNavigation<AIPetAssistantNavProp>();
  const route = useRoute<AIPetAssistantRouteProp>();
  
  const [inputText, setInputText] = useState('');
  const [showPetSelector, setShowPetSelector] = useState(false);
  const [showBanner, setShowBanner] = useState(true);
  
  const flatListRef = useRef<FlatList>(null);
  const inputRef = useRef<TextInput>(null);

  // Fetch user's pets
  const { data: pets = [], isLoading: petsLoading } = useQuery<any[]>({
    queryKey: [QUERY_KEYS.MY_PETS],
    queryFn: petApi.getMyPets,
  });

  // Convert pets to PetProfile format
  const petProfiles: PetProfile[] = pets.map((pet: any) => ({
    id: pet._id,
    name: pet.name,
    species: pet.species,
    breed: pet.breed,
    age: pet.age,
    gender: pet.gender,
    bio: pet.bio,
  }));

  // Initialize with first pet or route param
  const initialPet = route.params?.petId 
    ? petProfiles.find(p => p.id === route.params?.petId)
    : petProfiles[0];

  const {
    messages,
    isStreaming,
    streamingMessageId,
    suggestions,
    selectedPet,
    sendMessage,
    stopGenerating,
    sendQuickAction,
    changePet,
  } = useAIPetAssistant(initialPet);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  const handleSend = () => {
    if (!inputText.trim() || isStreaming) return;
    sendMessage(inputText);
    setInputText('');
  };

  const handleSuggestionPress = (suggestion: string) => {
    sendMessage(suggestion);
  };

  const handleQuickAction = (action: string) => {
    sendQuickAction(action);
  };

  const handlePetSelect = (pet: PetProfile) => {
    changePet(pet);
    setShowBanner(true);
  };

  const renderMessage = ({ item, index }: { item: any; index: number }) => {
    const isLastMessage = index === messages.length - 1;
    const showTyping = isLastMessage && item.isStreaming && !item.content;

    if (showTyping) {
      return <TypingIndicator />;
    }

    return (
      <View>
        <MessageBubble message={item} />
        {/* Show suggestions below the last AI message */}
        {isLastMessage && item.role === 'ai' && !item.isStreaming && item.suggestions && (
          <SuggestionChips
            suggestions={item.suggestions}
            onPress={handleSuggestionPress}
            style="outline"
          />
        )}
      </View>
    );
  };

  const canSend = inputText.trim().length > 0 && !isStreaming;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Icon name="arrow-back" size={24} color={COLORS.primary} />
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>PawSpace AI</Text>
          <Icon name="sparkles" size={16} color="#FFFFFF" style={{ marginLeft: 6 }} />
        </View>
        
        <TouchableOpacity
          onPress={() => setShowPetSelector(true)}
          style={styles.petAvatarBtn}
        >
          {selectedPet ? (
            <View style={styles.petAvatar}>
              <Text style={styles.petAvatarText}>
                {selectedPet.name.charAt(0).toUpperCase()}
              </Text>
            </View>
          ) : (
            <Icon name="paw" size={20} color={COLORS.primary} />
          )}
        </TouchableOpacity>
      </View>

      {/* Pet Context Banner */}
      {selectedPet && showBanner && (
        <PetContextBanner pet={selectedPet} onClose={() => setShowBanner(false)} />
      )}

      {/* Messages List */}
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {petsLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Loading your pets...</Text>
          </View>
        ) : !selectedPet ? (
          <View style={styles.noPetContainer}>
            <Icon name="paw-outline" size={64} color="#4B5563" />
            <Text style={styles.noPetText}>No pet selected</Text>
            <Text style={styles.noPetSubtext}>Select a pet to start chatting</Text>
            <TouchableOpacity
              style={styles.selectPetBtn}
              onPress={() => setShowPetSelector(true)}
            >
              <Text style={styles.selectPetBtnText}>Select Pet</Text>
            </TouchableOpacity>
          </View>
        ) : messages.length === 0 ? (
          <EmptyAIState
            petName={selectedPet.name}
            onQuickAction={handleQuickAction}
          />
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.messagesList}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          />
        )}

        {/* Stop Generating Button */}
        {isStreaming && (
          <View style={styles.stopContainer}>
            <TouchableOpacity style={styles.stopBtn} onPress={stopGenerating}>
              <Icon name="stop-circle-outline" size={16} color="rgba(255,255,255,0.5)" />
              <Text style={styles.stopText}>Stop generating</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Input Bar */}
        {selectedPet && (
          <View style={styles.inputContainer}>
            <View style={styles.inputWrapper}>
              <TextInput
                ref={inputRef}
                style={styles.input}
                value={inputText}
                onChangeText={setInputText}
                placeholder={`Ask about ${selectedPet.name}...`}
                placeholderTextColor="rgba(255,255,255,0.3)"
                multiline
                maxLength={500}
                editable={!isStreaming}
                onSubmitEditing={handleSend}
                blurOnSubmit={false}
              />
              
              <TouchableOpacity
                style={styles.micBtn}
                disabled={isStreaming}
              >
                <Icon
                  name="mic-outline"
                  size={22}
                  color={isStreaming ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.4)'}
                />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.sendBtn,
                  !canSend && styles.sendBtnDisabled,
                ]}
                onPress={handleSend}
                disabled={!canSend}
              >
                <Icon
                  name="arrow-up"
                  size={18}
                  color="#FFFFFF"
                />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </KeyboardAvoidingView>

      {/* Pet Selector Modal */}
      <PetSelectorModal
        visible={showPetSelector}
        pets={petProfiles}
        selectedPetId={selectedPet?.id}
        onSelect={handlePetSelect}
        onClose={() => setShowPetSelector(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0D1A',
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255,255,255,0.1)',
    backgroundColor: '#1A1A2E',
  },
  backBtn: {
    padding: SPACING.xs,
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  petAvatarBtn: {
    padding: SPACING.xs,
  },
  petAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  petAvatarText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: SPACING.md,
  },
  noPetContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  noPetText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: SPACING.md,
  },
  noPetSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: SPACING.xs,
  },
  selectPetBtn: {
    marginTop: SPACING.lg,
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.sm,
    borderRadius: 12,
  },
  selectPetBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  messagesList: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
    paddingTop: SPACING.sm,
  },
  stopContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  stopBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
  },
  stopText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
  },
  inputContainer: {
    backgroundColor: '#1A1A2E',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    paddingBottom: SPACING.md + 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
  },
  input: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: '#FFFFFF',
    maxHeight: 100,
  },
  micBtn: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  sendBtnDisabled: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    opacity: 0.5,
    shadowOpacity: 0,
    elevation: 0,
  },
});

export default AIPetAssistantScreen;
