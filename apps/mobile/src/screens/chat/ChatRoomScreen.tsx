import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList,
  TextInput, KeyboardAvoidingView, Platform, ActivityIndicator,
  useColorScheme, Alert, Modal, Image,
} from 'react-native';
import FastImage from 'react-native-fast-image';
import Animated, {
  useSharedValue, useAnimatedStyle, withRepeat,
  withSequence, withTiming, withDelay,
} from 'react-native-reanimated';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { launchImageLibrary } from 'react-native-image-picker';
import { chatApi } from '../../services/chat.api';
import { useChatStore, ChatParticipant } from '../../store/chatStore';
import { useAuthStore } from '../../store/authStore';
import { useChat } from '../../hooks/useChat';
import { SerializedMessage } from '../../services/socket.service';
import { timeAgo } from '../../utils';
import { FONT_SIZE, SPACING } from '../../constants';
import { nanoid } from '../../utils/nanoid';

type Props = NativeStackScreenProps<any, 'ChatRoom'>;

// ─── Typing Indicator ─────────────────────────────────────────────────────────

const TypingIndicator: React.FC = () => {
  const dot1 = useSharedValue(0);
  const dot2 = useSharedValue(0);
  const dot3 = useSharedValue(0);

  useEffect(() => {
    const anim = (sv: typeof dot1, delay: number) => {
      sv.value = withDelay(
        delay,
        withRepeat(
          withSequence(withTiming(-6, { duration: 300 }), withTiming(0, { duration: 300 })),
          -1,
          false,
        ),
      );
    };
    anim(dot1, 0);
    anim(dot2, 150);
    anim(dot3, 300);
  }, [dot1, dot2, dot3]);

  const s1 = useAnimatedStyle(() => ({ transform: [{ translateY: dot1.value }] }));
  const s2 = useAnimatedStyle(() => ({ transform: [{ translateY: dot2.value }] }));
  const s3 = useAnimatedStyle(() => ({ transform: [{ translateY: dot3.value }] }));

  return (
    <View style={typingStyles.container}>
      <Animated.View style={[typingStyles.dot, s1]} />
      <Animated.View style={[typingStyles.dot, s2]} />
      <Animated.View style={[typingStyles.dot, s3]} />
    </View>
  );
};

const typingStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#2D2D4E',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignSelf: 'flex-start',
    marginLeft: SPACING.md,
    marginBottom: SPACING.xs,
  },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#9CA3AF' },
});

// ─── Message Bubble ───────────────────────────────────────────────────────────

interface BubbleProps {
  message: SerializedMessage;
  isMine: boolean;
  isDark: boolean;
  onLongPress: (msg: SerializedMessage) => void;
  onImagePress: (url: string) => void;
}

const MessageBubble: React.FC<BubbleProps> = ({ message, isMine, isDark, onLongPress, onImagePress }) => {
  const isDeleted = message.isDeleted;
  const isImage = message.content.type === 'image';
  const isAI = message.content.type === 'ai_suggestion';
  const isRead = message.readBy.length > 0;

  return (
    <TouchableOpacity
      onLongPress={() => onLongPress(message)}
      activeOpacity={0.85}
      style={[styles.bubbleWrapper, isMine ? styles.bubbleRight : styles.bubbleLeft]}
    >
      {isAI && (
        <View style={styles.aiSuggestionBubble}>
          <Text style={styles.aiSuggestionLabel}>✦ AI suggestion</Text>
          <Text style={styles.aiSuggestionText}>{message.content.text}</Text>
        </View>
      )}

      {!isAI && (
        <View
          style={[
            styles.bubble,
            isMine ? styles.bubbleMine : styles.bubbleTheirs,
            isDeleted && styles.bubbleDeleted,
          ]}
        >
          {isImage && message.content.mediaUrl ? (
            <TouchableOpacity onPress={() => onImagePress(message.content.mediaUrl!)}>
              <FastImage
                source={{ uri: message.content.mediaUrl, priority: FastImage.priority.normal }}
                style={styles.imageMessage}
                resizeMode={FastImage.resizeMode.cover}
              />
            </TouchableOpacity>
          ) : (
            <Text
              style={[
                styles.bubbleText,
                isMine ? styles.bubbleTextMine : styles.bubbleTextTheirs,
                isDeleted && styles.bubbleTextDeleted,
              ]}
            >
              {isDeleted ? 'This message was deleted' : message.content.text}
            </Text>
          )}
        </View>
      )}

      <View style={[styles.bubbleMeta, isMine && styles.bubbleMetaRight]}>
        <Text style={styles.bubbleTime}>{timeAgo(message.createdAt)}</Text>
        {isMine && !isDeleted && (
          <Text style={[styles.readReceipt, isRead && styles.readReceiptRead]}>
            {isRead ? '✓✓' : '✓'}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

// ─── ChatRoomScreen ───────────────────────────────────────────────────────────

const ChatRoomScreen: React.FC<Props> = ({ route, navigation }) => {
  const { chatId, otherUser } = route.params as { chatId: string; otherUser: ChatParticipant };
  const isDark = useColorScheme() === 'dark';
  const currentUser = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();

  const { messages, typingUsers, onlineUsers, setMessages, setActiveChat } = useChatStore();
  const chatMessages = messages[chatId] ?? [];
  const isTyping = (typingUsers[chatId] ?? []).length > 0;
  const isOtherOnline = onlineUsers.has(otherUser._id);

  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [expandedImage, setExpandedImage] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { sendMessage, sendImageMessage, startTyping, stopTyping, markAsRead } = useChat({
    chatId,
    currentUserId: currentUser?.id ?? '',
  });

  // Load initial messages
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: ['messages', chatId],
    queryFn: ({ pageParam }) => chatApi.getMessages(chatId, pageParam as string | undefined),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  });

  // Update messages when data changes
  useEffect(() => {
    if (data) {
      const allMessages = data.pages.flatMap((p) => p.items);
      setMessages(chatId, allMessages);
    }
  }, [data, chatId, setMessages]);

  useEffect(() => {
    setActiveChat(chatId);
    return () => setActiveChat(null);
  }, [chatId, setActiveChat]);

  // Mark last message as read on mount and when new messages arrive
  useEffect(() => {
    if (chatMessages.length === 0) return;
    
    const last = chatMessages[chatMessages.length - 1];
    if (last && last.sender._id !== currentUser?.id) {
      markAsRead(last._id);
    }
  }, [chatMessages.length, currentUser?.id, markAsRead]);

  const handleSend = useCallback(async () => {
    const text = inputText.trim();
    if (!text || isSending) return;

    const tempId = nanoid();
    const optimisticMsg: SerializedMessage = {
      _id: tempId,
      chatId,
      sender: {
        _id: currentUser?.id ?? '',
        username: currentUser?.username ?? '',
        name: currentUser?.displayName ?? '',
        avatar: currentUser?.avatarUrl,
      },
      content: { type: 'text', text },
      readBy: [],
      isDeleted: false,
      createdAt: new Date().toISOString(),
      tempId,
    };

    setInputText('');
    stopTyping();
    setIsSending(true);

    // Optimistic add
    useChatStore.getState().addMessage(chatId, optimisticMsg);

    try {
      sendMessage(text, tempId);
    } catch {
      // Revert on error
      useChatStore.getState().deleteMessage(chatId, tempId);
      Alert.alert('Error', 'Failed to send message');
    } finally {
      setIsSending(false);
    }
  }, [inputText, isSending, chatId, currentUser, sendMessage, stopTyping]);

  const handlePickImage = useCallback(async () => {
    const result = await launchImageLibrary({ mediaType: 'photo', quality: 0.8 });
    if (result.assets?.[0]?.uri) {
      const tempId = nanoid();
      sendImageMessage(result.assets[0].uri, tempId);
    }
  }, [sendImageMessage]);

  const handleTyping = useCallback(
    (text: string) => {
      setInputText(text);
      if (text.length > 0) {
        startTyping();
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(stopTyping, 2000);
      } else {
        stopTyping();
      }
    },
    [startTyping, stopTyping],
  );

  const handleLongPress = useCallback((msg: SerializedMessage) => {
    if (msg.sender._id !== currentUser?.id) return;
    Alert.alert('Message', 'Delete this message?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          void chatApi.deleteMessage(chatId, msg._id).then(() => {
            useChatStore.getState().deleteMessage(chatId, msg._id);
          });
        },
      },
    ]);
  }, [chatId, currentUser]);

  const bg = isDark ? '#080810' : '#F8F8FF';
  const inputBg = isDark ? '#1A1A2E' : '#FFFFFF';
  const textColor = isDark ? '#FFFFFF' : '#1A1A2E';
  const subColor = isDark ? '#9CA3AF' : '#6B7280';

  const avatarUri =
    otherUser.avatar ??
    `https://ui-avatars.com/api/?name=${otherUser.name}&background=7C3AED&color=fff`;

  return (
    <View style={[styles.root, { backgroundColor: bg }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: inputBg }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={[styles.backIcon, { color: textColor }]}>←</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.headerUser}>
          <FastImage source={{ uri: avatarUri, priority: FastImage.priority.high }} style={styles.headerAvatar} />
          <View>
            <Text style={[styles.headerName, { color: textColor }]}>{otherUser.name}</Text>
            <Text style={[styles.headerStatus, { color: isOtherOnline ? '#10B981' : subColor }]}>
              {isOtherOnline ? 'Online' : 'Offline'}
            </Text>
          </View>
        </TouchableOpacity>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerActionBtn}>
            <Text style={styles.headerActionIcon}>✦</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerActionBtn}>
            <Text style={styles.headerActionIcon}>📹</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerActionBtn}>
            <Text style={styles.headerActionIcon}>···</Text>
          </TouchableOpacity>
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={chatMessages}
          keyExtractor={(item) => item._id}
          inverted
          renderItem={({ item }) => (
            <MessageBubble
              message={item}
              isMine={item.sender._id === currentUser?.id}
              isDark={isDark}
              onLongPress={handleLongPress}
              onImagePress={(url) => setExpandedImage(url)}
            />
          )}
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) void fetchNextPage();
          }}
          onEndReachedThreshold={0.3}
          ListHeaderComponent={
            isFetchingNextPage ? (
              <ActivityIndicator color="#7C3AED" style={{ marginVertical: SPACING.sm }} />
            ) : null
          }
          ListFooterComponent={isTyping ? <TypingIndicator /> : null}
          contentContainerStyle={styles.messageList}
          showsVerticalScrollIndicator={false}
        />

        {/* Input Bar */}
        <View style={[styles.inputBar, { backgroundColor: inputBg }]}>
          <TouchableOpacity style={styles.inputAction}>
            <Text style={styles.inputActionIcon}>＋</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.inputAction}>
            <Text style={styles.inputActionIcon}>✦</Text>
          </TouchableOpacity>
          <TextInput
            style={[styles.input, { color: textColor, backgroundColor: isDark ? '#0D0D1A' : '#F3F4F6' }]}
            placeholder="Message..."
            placeholderTextColor={subColor}
            value={inputText}
            onChangeText={handleTyping}
            multiline
            maxLength={4000}
            returnKeyType="default"
          />
          <TouchableOpacity style={styles.inputAction} onPress={handlePickImage}>
            <Text style={styles.inputActionIcon}>📷</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sendBtn, (!inputText.trim() || isSending) && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!inputText.trim() || isSending}
          >
            {isSending ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.sendIcon}>▶</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Image Expand Modal */}
      <Modal visible={!!expandedImage} transparent animationType="fade">
        <TouchableOpacity
          style={styles.imageModal}
          onPress={() => setExpandedImage(null)}
          activeOpacity={1}
        >
          {expandedImage && (
            <Image source={{ uri: expandedImage }} style={styles.expandedImage} resizeMode="contain" />
          )}
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  backBtn: { padding: SPACING.xs, marginRight: SPACING.xs },
  backIcon: { fontSize: 22, fontWeight: '700' },
  headerUser: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  headerAvatar: { width: 38, height: 38, borderRadius: 19 },
  headerName: { fontSize: FONT_SIZE.md, fontWeight: '700' },
  headerStatus: { fontSize: 11, marginTop: 1 },
  headerActions: { flexDirection: 'row', gap: SPACING.xs },
  headerActionBtn: { padding: SPACING.xs },
  headerActionIcon: { fontSize: 18, color: '#7C3AED' },
  messageList: { paddingHorizontal: SPACING.sm, paddingVertical: SPACING.sm },
  bubbleWrapper: { marginBottom: SPACING.xs },
  bubbleLeft: { alignItems: 'flex-start' },
  bubbleRight: { alignItems: 'flex-end' },
  bubble: {
    maxWidth: '78%',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleMine: {
    backgroundColor: '#7C3AED',
    borderBottomRightRadius: 4,
  },
  bubbleTheirs: {
    backgroundColor: '#2D2D4E',
    borderBottomLeftRadius: 4,
  },
  bubbleDeleted: { opacity: 0.5 },
  bubbleText: { fontSize: FONT_SIZE.sm, lineHeight: 20 },
  bubbleTextMine: { color: '#FFFFFF' },
  bubbleTextTheirs: { color: '#E2E8F0' },
  bubbleTextDeleted: { fontStyle: 'italic' },
  imageMessage: { width: 220, height: 220, borderRadius: 12 },
  bubbleMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
    paddingHorizontal: 4,
  },
  bubbleMetaRight: { justifyContent: 'flex-end' },
  bubbleTime: { fontSize: 10, color: '#6B7280' },
  readReceipt: { fontSize: 11, color: '#6B7280' },
  readReceiptRead: { color: '#7C3AED' },
  aiSuggestionBubble: {
    maxWidth: '85%',
    backgroundColor: 'rgba(124,58,237,0.12)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(124,58,237,0.3)',
    padding: SPACING.sm,
    marginLeft: SPACING.md,
  },
  aiSuggestionLabel: {
    color: '#7C3AED',
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 4,
  },
  aiSuggestionText: { color: '#A78BFA', fontSize: FONT_SIZE.sm, lineHeight: 18 },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    gap: SPACING.xs,
  },
  inputAction: { padding: SPACING.xs, alignSelf: 'flex-end', paddingBottom: 10 },
  inputActionIcon: { fontSize: 22, color: '#7C3AED' },
  input: {
    flex: 1,
    borderRadius: 22,
    paddingHorizontal: SPACING.md,
    paddingVertical: Platform.OS === 'ios' ? 10 : 6,
    fontSize: FONT_SIZE.sm,
    maxHeight: 120,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#7C3AED',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-end',
  },
  sendBtnDisabled: { opacity: 0.4 },
  sendIcon: { color: '#FFFFFF', fontSize: 16 },
  imageModal: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  expandedImage: { width: '95%', height: '80%' },
});

export default ChatRoomScreen;
