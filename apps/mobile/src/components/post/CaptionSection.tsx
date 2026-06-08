import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import * as Keychain from 'react-native-keychain';
import { STORAGE_KEYS } from '../../constants';
import api from '../../services/api';
import { SelectedPet } from '../../screens/feed/CreatePostScreen';
import HashtagSuggestions from './HashtagSuggestions';
import StreamingCursor from './StreamingCursor';

interface CaptionSectionProps {
  caption: string;
  onCaptionChange: (text: string) => void;
  onAICaptionGenerated: (caption: string) => void;
  pet: SelectedPet | null;
  mediaUri?: string;
}

const CaptionSection: React.FC<CaptionSectionProps> = ({
  caption,
  onCaptionChange,
  onAICaptionGenerated,
  pet,
  mediaUri,
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const xhrRef = useRef<XMLHttpRequest | null>(null);

  const handleGenerateCaption = async () => {
    if (!pet) {
      Alert.alert('Pet Required', 'Please tag a pet to generate an AI caption.');
      return;
    }

    if (!mediaUri) {
      Alert.alert('Media Required', 'Please add a photo to generate an AI caption.');
      return;
    }

    try {
      setIsGenerating(true);
      setStreamingText('');

      const credentials = await Keychain.getGenericPassword({ service: STORAGE_KEYS.ACCESS_TOKEN });
      if (!credentials) {
        throw new Error('Not authenticated');
      }

      const token = credentials.password;
      const baseURL = api.defaults.baseURL || 'http://10.0.2.2:5000/api/v1';

      const xhr = new XMLHttpRequest();
      xhrRef.current = xhr;

      xhr.open('POST', `${baseURL}/ai/captions/stream`);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);

      let buffer = '';
      let lastIndex = 0;
      let fullCaption = '';

      xhr.onreadystatechange = () => {
        if (xhr.readyState >= 3) {
          const newData = xhr.responseText.slice(lastIndex);
          lastIndex = xhr.responseText.length;
          buffer += newData;

          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const raw = line.slice(6).trim();
              if (raw === '[DONE]') {
                setIsGenerating(false);
                onAICaptionGenerated(fullCaption);
                return;
              }

              try {
                const parsed = JSON.parse(raw);
                if (parsed.text) {
                  fullCaption += parsed.text;
                  setStreamingText(fullCaption);
                }
                if (parsed.error) {
                  Alert.alert('Error', parsed.error);
                  setIsGenerating(false);
                }
              } catch (err) {
                console.warn('Failed to parse SSE:', raw);
              }
            }
          }
        }

        if (xhr.readyState === 4 && xhr.status !== 200) {
          Alert.alert('Error', 'Failed to generate caption. Please try again.');
          setIsGenerating(false);
        }
      };

      xhr.onerror = () => {
        Alert.alert('Error', 'Network error. Please check your connection.');
        setIsGenerating(false);
      };

      xhr.send(
        JSON.stringify({
          pet: {
            name: pet.name,
            species: pet.species,
          },
          imageDescription: 'A photo',
          style: 'cute',
        })
      );
    } catch (error) {
      console.error('AI caption error:', error);
      Alert.alert('Error', 'Failed to generate caption. Please try again.');
      setIsGenerating(false);
    }
  };

  const handleCancelGeneration = () => {
    if (xhrRef.current) {
      xhrRef.current.abort();
    }
    setIsGenerating(false);
    setStreamingText('');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.label}>Caption</Text>
        <TouchableOpacity
          onPress={isGenerating ? handleCancelGeneration : handleGenerateCaption}
          style={styles.aiButton}
          disabled={!pet || !mediaUri}
        >
          <Icon
            name={isGenerating ? 'stop-circle-outline' : 'sparkles'}
            size={16}
            color={!pet || !mediaUri ? 'rgba(124,58,237,0.4)' : '#7C3AED'}
          />
          <Text
            style={[
              styles.aiButtonText,
              (!pet || !mediaUri) && styles.aiButtonTextDisabled,
            ]}
          >
            {isGenerating ? 'Stop' : 'Generate with AI'}
          </Text>
        </TouchableOpacity>
      </View>

      {isGenerating && streamingText ? (
        <View style={styles.streamingContainer}>
          <Text style={styles.streamingText}>
            {streamingText}
            <StreamingCursor />
          </Text>
        </View>
      ) : isGenerating ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#7C3AED" />
          <Text style={styles.loadingText}>Generating caption...</Text>
        </View>
      ) : (
        <TextInput
          value={caption}
          onChangeText={onCaptionChange}
          placeholder="Write a caption..."
          placeholderTextColor="rgba(255,255,255,0.3)"
          style={styles.input}
          multiline
          maxLength={2200}
        />
      )}

      <Text style={styles.charCount}>{caption.length} / 2200</Text>

      <HashtagSuggestions caption={caption} onSelectHashtag={(tag) => onCaptionChange(caption + tag)} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  aiButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: 'rgba(124,58,237,0.15)',
  },
  aiButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7C3AED',
  },
  aiButtonTextDisabled: {
    color: 'rgba(124,58,237,0.4)',
  },
  input: {
    fontSize: 15,
    color: '#FFFFFF',
    minHeight: 80,
    textAlignVertical: 'top',
    paddingVertical: 0,
  },
  streamingContainer: {
    minHeight: 80,
    paddingVertical: 4,
  },
  streamingText: {
    fontSize: 15,
    color: '#FFFFFF',
    lineHeight: 22,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 80,
  },
  loadingText: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.6)',
  },
  charCount: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
    marginTop: 8,
    textAlign: 'right',
  },
});

export default CaptionSection;
