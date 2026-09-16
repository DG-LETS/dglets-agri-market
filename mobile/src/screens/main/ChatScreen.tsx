import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput,
  TouchableOpacity, KeyboardAvoidingView, Platform,
  Alert, Linking, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Colors, Typography, Spacing, Radius } from '@theme/index';
import { LoadingState } from '@components/ui';
import { messagesApi } from '@services/api';
import { useAuthStore } from '@store/authStore';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RouteProp } from '@react-navigation/native';
import type { MessagesStackParamList } from '@navigation/MainNavigator';

type Props = {
  navigation: StackNavigationProp<MessagesStackParamList, 'Chat'>;
  route:      RouteProp<MessagesStackParamList, 'Chat'>;
};

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function formatDateDivider(dateStr: string): string {
  const d   = new Date(dateStr);
  const now = new Date();
  const isToday     = d.toDateString() === now.toDateString();
  const isYesterday = new Date(now.setDate(now.getDate() - 1)).toDateString() === d.toDateString();
  if (isToday)     return 'Today';
  if (isYesterday) return 'Yesterday';
  return d.toLocaleDateString('en-NG', { weekday: 'short', day: 'numeric', month: 'short' });
}

/* Insert date dividers between messages that are on different calendar days */
function injectDividers(messages: any[]): Array<{ type: 'message' | 'divider'; data: any; key: string }> {
  const result: Array<{ type: 'message' | 'divider'; data: any; key: string }> = [];
  let lastDate = '';
  for (const msg of messages) {
    const dateKey = new Date(msg.createdAt).toDateString();
    if (dateKey !== lastDate) {
      result.push({ type: 'divider', data: msg.createdAt, key: `div-${msg.createdAt}` });
      lastDate = dateKey;
    }
    result.push({ type: 'message', data: msg, key: msg.id });
  }
  return result;
}

export function ChatScreen({ navigation, route }: Props) {
  const {
    conversationId, recipientId, recipientName,
    recipientRole, productId, productName,
  } = route.params;

  const insets      = useSafeAreaInsets();
  const { user }    = useAuthStore();
  const queryClient = useQueryClient();
  const flatRef     = useRef<FlatList>(null);
  const [text, setText] = useState('');

  /* ── Fetch messages, poll every 5s ── */
  const { data, isLoading } = useQuery({
    queryKey: ['messages', conversationId],
    queryFn:  () => messagesApi.getMessages(conversationId).then(r => r.data),
    refetchInterval: 5_000,
    retry: 0,
  });

  const messages = data?.data ?? [];
  const items    = injectDividers(messages);

  /* Auto-scroll to bottom when new messages arrive */
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages.length]);

  /* Invalidate inbox unread count when this screen is focused */
  useEffect(() => {
    const unsub = navigation.addListener('focus', () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['messages-unread'] });
    });
    return unsub;
  }, [navigation, queryClient]);

  /* ── Send message ── */
  const sendMutation = useMutation({
    mutationFn: () => messagesApi.sendMessage(conversationId, text.trim()),
    onSuccess: () => {
      setText('');
      queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
    onError: () => Alert.alert('Error', 'Message not sent. Please try again.'),
  });

  const handleSend = () => {
    if (!text.trim()) return;
    sendMutation.mutate();
  };

  /* ── Report user ── */
  const handleReport = () => {
    Alert.alert(
      '⚠️ Report User',
      'Why are you reporting this user?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Spam / Scam',       onPress: () => submitReport('Spam or scam') },
        { text: 'Inappropriate',     onPress: () => submitReport('Inappropriate behaviour') },
        { text: 'Fake seller/buyer', onPress: () => submitReport('Fake or fraudulent account') },
      ],
    );
  };

  const submitReport = async (reason: string) => {
    try {
      await messagesApi.reportUser(conversationId, recipientId, reason);
      Alert.alert('✓ Reported', 'Thank you. Our team will review this report.');
    } catch {
      Alert.alert('Error', 'Could not submit report. Please try again.');
    }
  };

  /* ── Render item ── */
  const renderItem = useCallback(({ item }: { item: any }) => {
    if (item.type === 'divider') {
      return (
        <View style={styles.dateDivider}>
          <View style={styles.dateDividerLine} />
          <Text style={styles.dateDividerText}>{formatDateDivider(item.data)}</Text>
          <View style={styles.dateDividerLine} />
        </View>
      );
    }

    const msg   = item.data;
    const isMe  = msg.senderId === user?.id;
    const read  = isMe && msg.readAt != null;

    return (
      <View style={[styles.msgRow, isMe ? styles.msgRowMe : styles.msgRowThem]}>
        {/* Avatar for other person */}
        {!isMe && (
          <View style={styles.msgAvatar}>
            <Text style={styles.msgAvatarText}>
              {recipientName?.[0]?.toUpperCase() ?? '?'}
            </Text>
          </View>
        )}

        <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleThem]}>
          <Text style={[styles.bubbleText, isMe ? styles.bubbleTextMe : styles.bubbleTextThem]}>
            {msg.body}
          </Text>
          <View style={styles.bubbleMeta}>
            <Text style={[styles.bubbleTime, isMe && styles.bubbleTimeMe]}>
              {formatTime(msg.createdAt)}
            </Text>
            {isMe && (
              <Text style={[styles.readTick, read && styles.readTickRead]}>
                {read ? '✓✓' : '✓'}
              </Text>
            )}
          </View>
        </View>
      </View>
    );
  }, [user?.id, recipientName]);

  if (isLoading) return <LoadingState fullScreen message="Loading conversation…" />;

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      <View style={[styles.flex, { paddingTop: insets.top }]}>

        {/* ── Header ── */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <View style={styles.headerAvatar}>
              <Text style={styles.headerAvatarText}>
                {recipientName?.[0]?.toUpperCase() ?? '?'}
              </Text>
            </View>
            <View>
              <Text style={styles.headerName} numberOfLines={1}>{recipientName}</Text>
              {recipientRole && (
                <Text style={styles.headerRole}>{recipientRole}</Text>
              )}
            </View>
          </View>

          <TouchableOpacity style={styles.headerMoreBtn} onPress={handleReport}>
            <Text style={styles.headerMoreText}>⋮</Text>
          </TouchableOpacity>
        </View>

        {/* ── Product context banner ── */}
        {productName && (
          <View style={styles.productBanner}>
            <Text style={styles.productBannerIcon}>🌾</Text>
            <Text style={styles.productBannerText} numberOfLines={1}>
              Re: <Text style={{ fontWeight: '700' }}>{productName}</Text>
            </Text>
          </View>
        )}

        {/* ── Messages list ── */}
        <FlatList
          ref={flatRef}
          data={items}
          keyExtractor={item => item.key}
          renderItem={renderItem}
          contentContainerStyle={styles.messagesList}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flatRef.current?.scrollToEnd({ animated: false })}
          ListEmptyComponent={
            <View style={styles.emptyChat}>
              <Text style={styles.emptyChatIcon}>👋</Text>
              <Text style={styles.emptyChatText}>
                Start the conversation.{productName ? `\nAsk about "${productName}".` : ''}
              </Text>
            </View>
          }
        />

        {/* ── Input bar ── */}
        <View style={[styles.inputBar, { paddingBottom: insets.bottom + Spacing[2] }]}>
          <TextInput
            style={styles.input}
            placeholder="Type a message…"
            placeholderTextColor={Colors.gray[400]}
            value={text}
            onChangeText={setText}
            multiline
            maxLength={2000}
            returnKeyType="default"
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!text.trim() || sendMutation.isPending) && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!text.trim() || sendMutation.isPending}
          >
            {sendMutation.isPending
              ? <ActivityIndicator size="small" color={Colors.white} />
              : <Text style={styles.sendBtnText}>➤</Text>
            }
          </TouchableOpacity>
        </View>

      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.background },

  /* Header */
  header:          { backgroundColor: Colors.white, flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing[4], paddingVertical: Spacing[3], borderBottomWidth: 1, borderBottomColor: Colors.border, gap: Spacing[3] },
  backBtn:         { width: 36 },
  backText:        { fontSize: 22, color: Colors.textSecondary },
  headerCenter:    { flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing[3], minWidth: 0 },
  headerAvatar:    { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.green[700], alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  headerAvatarText:{ ...Typography.titleLarge, color: Colors.white },
  headerName:      { ...Typography.titleMedium, color: Colors.textPrimary },
  headerRole:      { ...Typography.caption, color: Colors.textMuted },
  headerMoreBtn:   { width: 36, alignItems: 'flex-end' },
  headerMoreText:  { fontSize: 22, color: Colors.textSecondary, fontWeight: '700' },

  /* Product banner */
  productBanner:     { backgroundColor: Colors.green[50], borderBottomWidth: 1, borderBottomColor: Colors.green[100], flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing[5], paddingVertical: Spacing[2], gap: Spacing[2] },
  productBannerIcon: { fontSize: 14 },
  productBannerText: { ...Typography.bodySmall, color: Colors.green[700], flex: 1 },

  /* Messages */
  messagesList: { paddingHorizontal: Spacing[4], paddingVertical: Spacing[4], gap: Spacing[2], flexGrow: 1, justifyContent: 'flex-end' },

  /* Date divider */
  dateDivider:     { flexDirection: 'row', alignItems: 'center', marginVertical: Spacing[4], gap: Spacing[3] },
  dateDividerLine: { flex: 1, height: 1, backgroundColor: Colors.gray[200] },
  dateDividerText: { ...Typography.caption, color: Colors.textMuted, fontWeight: '600' },

  /* Message rows */
  msgRow:      { flexDirection: 'row', alignItems: 'flex-end', marginBottom: Spacing[2] },
  msgRowMe:    { justifyContent: 'flex-end' },
  msgRowThem:  { justifyContent: 'flex-start', gap: Spacing[2] },

  /* Avatar (for other person) */
  msgAvatar:     { width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.green[200], alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  msgAvatarText: { fontSize: 12, fontWeight: '700', color: Colors.green[800] },

  /* Bubbles */
  bubble:         { maxWidth: '75%', borderRadius: Radius.xl, paddingHorizontal: Spacing[4], paddingVertical: Spacing[3] },
  bubbleMe:       { backgroundColor: Colors.green[700], borderBottomRightRadius: 4 },
  bubbleThem:     { backgroundColor: Colors.white, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: Colors.border },
  bubbleText:     { ...Typography.bodyMedium, lineHeight: 22 },
  bubbleTextMe:   { color: Colors.white },
  bubbleTextThem: { color: Colors.textPrimary },
  bubbleMeta:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 4, marginTop: 3 },
  bubbleTime:     { fontSize: 10, color: Colors.gray[400] },
  bubbleTimeMe:   { color: 'rgba(255,255,255,.6)' },
  readTick:       { fontSize: 10, color: 'rgba(255,255,255,.5)', letterSpacing: -1 },
  readTickRead:   { color: '#86efac' }, /* light green for double-tick read */

  /* Empty state */
  emptyChat:     { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing[12] },
  emptyChatIcon: { fontSize: 48, marginBottom: Spacing[4] },
  emptyChatText: { ...Typography.bodyLarge, color: Colors.textMuted, textAlign: 'center', lineHeight: 24 },

  /* Input bar */
  inputBar: {
    backgroundColor: Colors.white,
    borderTopWidth:  1, borderTopColor: Colors.border,
    flexDirection:   'row',
    alignItems:      'flex-end',
    paddingHorizontal: Spacing[4],
    paddingTop:      Spacing[3],
    gap:             Spacing[3],
  },
  input:         {
    flex:            1,
    backgroundColor: Colors.gray[50],
    borderRadius:    Radius.xl,
    borderWidth:     1, borderColor: Colors.border,
    paddingHorizontal: Spacing[4],
    paddingVertical:   Spacing[3],
    ...Typography.bodyMedium,
    color:           Colors.textPrimary,
    maxHeight:       120,
  },
  sendBtn:         { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.green[700], alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  sendBtnDisabled: { backgroundColor: Colors.gray[300] },
  sendBtnText:     { color: Colors.white, fontSize: 18, marginLeft: 2 },
});
