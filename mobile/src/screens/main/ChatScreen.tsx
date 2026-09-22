import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput,
  TouchableOpacity, KeyboardAvoidingView, Platform,
  Alert, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useThemeColors, Typography, Spacing, Radius } from '@theme/index';
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

function formatTime(d: string) {
  return new Date(d).toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit', hour12: true });
}
function formatDateDivider(d: string) {
  const date = new Date(d), now = new Date();
  if (date.toDateString() === now.toDateString()) return 'Today';
  const yest = new Date(now); yest.setDate(now.getDate() - 1);
  if (date.toDateString() === yest.toDateString()) return 'Yesterday';
  return date.toLocaleDateString('en-NG', { weekday: 'short', day: 'numeric', month: 'short' });
}
function injectDividers(messages: any[]) {
  const result: Array<{ type: 'message' | 'divider'; data: any; key: string }> = [];
  let lastDate = '';
  for (const msg of messages) {
    const dk = new Date(msg.createdAt).toDateString();
    if (dk !== lastDate) { result.push({ type: 'divider', data: msg.createdAt, key: `div-${msg.createdAt}` }); lastDate = dk; }
    result.push({ type: 'message', data: msg, key: msg.id });
  }
  return result;
}

export function ChatScreen({ navigation, route }: Props) {
  const { conversationId, recipientId, recipientName, recipientRole, productId, productName } = route.params;
  const insets      = useSafeAreaInsets();
  const { user }    = useAuthStore();
  const queryClient = useQueryClient();
  const C           = useThemeColors();
  const flatRef     = useRef<FlatList>(null);
  const [text, setText] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['messages', conversationId],
    queryFn:  () => messagesApi.getMessages(conversationId).then(r => r.data),
    refetchInterval: 5_000, retry: 0,
  });

  const messages = data?.data ?? [];
  const items    = injectDividers(messages);

  useEffect(() => {
    if (messages.length > 0) setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);
  }, [messages.length]);

  useEffect(() => {
    const unsub = navigation.addListener('focus', () => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['messages-unread'] });
    });
    return unsub;
  }, [navigation, queryClient]);

  const sendMutation = useMutation({
    mutationFn: () => messagesApi.sendMessage(conversationId, text.trim()),
    onSuccess: () => { setText(''); queryClient.invalidateQueries({ queryKey: ['messages', conversationId] }); queryClient.invalidateQueries({ queryKey: ['conversations'] }); },
    onError: () => Alert.alert('Error', 'Message not sent. Please try again.'),
  });

  const handleReport = () => {
    Alert.alert('⚠️ Report User', 'Why are you reporting this user?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Spam / Scam', onPress: () => submitReport('Spam or scam') },
      { text: 'Inappropriate', onPress: () => submitReport('Inappropriate behaviour') },
      { text: 'Fake seller/buyer', onPress: () => submitReport('Fake or fraudulent account') },
    ]);
  };
  const submitReport = async (reason: string) => {
    try { await messagesApi.reportUser(conversationId, recipientId, reason); Alert.alert('✓ Reported', 'Thank you. Our team will review this report.'); }
    catch { Alert.alert('Error', 'Could not submit report. Please try again.'); }
  };

  const s = makeStyles(C);

  const renderItem = useCallback(({ item }: { item: any }) => {
    if (item.type === 'divider') {
      return (
        <View style={s.dateDivider}>
          <View style={s.dateDividerLine} />
          <Text style={s.dateDividerText}>{formatDateDivider(item.data)}</Text>
          <View style={s.dateDividerLine} />
        </View>
      );
    }
    const msg = item.data, isMe = msg.senderId === user?.id, read = isMe && msg.readAt != null;
    return (
      <View style={[s.msgRow, isMe ? s.msgRowMe : s.msgRowThem]}>
        {!isMe && <View style={s.msgAvatar}><Text style={s.msgAvatarText}>{recipientName?.[0]?.toUpperCase() ?? '?'}</Text></View>}
        <View style={[s.bubble, isMe ? s.bubbleMe : s.bubbleThem]}>
          <Text style={[s.bubbleText, isMe ? s.bubbleTextMe : s.bubbleTextThem]}>{msg.body}</Text>
          <View style={s.bubbleMeta}>
            <Text style={[s.bubbleTime, isMe && s.bubbleTimeMe]}>{formatTime(msg.createdAt)}</Text>
            {isMe && <Text style={[s.readTick, read && s.readTickRead]}>{read ? '✓✓' : '✓'}</Text>}
          </View>
        </View>
      </View>
    );
  }, [user?.id, recipientName, s]);

  if (isLoading) return <LoadingState fullScreen message="Loading conversation…" />;

  return (
    <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={0}>
      <View style={[s.flex, { paddingTop: insets.top }]}>
        <View style={s.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}><Text style={s.backText}>←</Text></TouchableOpacity>
          <View style={s.headerCenter}>
            <View style={s.headerAvatar}><Text style={s.headerAvatarText}>{recipientName?.[0]?.toUpperCase() ?? '?'}</Text></View>
            <View>
              <Text style={s.headerName} numberOfLines={1}>{recipientName}</Text>
              {recipientRole && <Text style={s.headerRole}>{recipientRole}</Text>}
            </View>
          </View>
          <TouchableOpacity style={s.headerMoreBtn} onPress={handleReport}><Text style={s.headerMoreText}>⋮</Text></TouchableOpacity>
        </View>
        {productName && (
          <View style={s.productBanner}>
            <Text style={s.productBannerIcon}>🌾</Text>
            <Text style={s.productBannerText} numberOfLines={1}>Re: <Text style={{ fontWeight: '700' }}>{productName}</Text></Text>
          </View>
        )}
        <FlatList
          ref={flatRef} data={items} keyExtractor={item => item.key} renderItem={renderItem}
          contentContainerStyle={s.messagesList} showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flatRef.current?.scrollToEnd({ animated: false })}
          ListEmptyComponent={
            <View style={s.emptyChat}>
              <Text style={s.emptyChatIcon}>👋</Text>
              <Text style={s.emptyChatText}>Start the conversation.{productName ? `\nAsk about "${productName}".` : ''}</Text>
            </View>
          }
        />
        <View style={[s.inputBar, { paddingBottom: insets.bottom + Spacing[2] }]}>
          <TextInput
            style={s.input} placeholder="Type a message…" placeholderTextColor={C.textMuted}
            value={text} onChangeText={setText} multiline maxLength={2000}
          />
          <TouchableOpacity
            style={[s.sendBtn, (!text.trim() || sendMutation.isPending) && s.sendBtnDisabled]}
            onPress={() => { if (!text.trim()) return; sendMutation.mutate(); }}
            disabled={!text.trim() || sendMutation.isPending}
          >
            {sendMutation.isPending ? <ActivityIndicator size="small" color="#fff" /> : <Text style={s.sendBtnText}>➤</Text>}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

function makeStyles(C: ReturnType<typeof useThemeColors>) {
  return StyleSheet.create({
    flex:            { flex: 1, backgroundColor: C.background },
    header:          { backgroundColor: C.white, flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing[4], paddingVertical: Spacing[3], borderBottomWidth: 1, borderBottomColor: C.border, gap: Spacing[3] },
    backBtn:         { width: 36 },
    backText:        { fontSize: 22, color: C.textSecondary },
    headerCenter:    { flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing[3], minWidth: 0 },
    headerAvatar:    { width: 40, height: 40, borderRadius: 20, backgroundColor: C.green[700], alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    headerAvatarText:{ ...Typography.titleLarge, color: '#ffffff' },
    headerName:      { ...Typography.titleMedium, color: C.textPrimary },
    headerRole:      { ...Typography.caption, color: C.textMuted },
    headerMoreBtn:   { width: 36, alignItems: 'flex-end' },
    headerMoreText:  { fontSize: 22, color: C.textSecondary, fontWeight: '700' },
    productBanner:   { backgroundColor: C.green[50], borderBottomWidth: 1, borderBottomColor: C.green[100], flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing[5], paddingVertical: Spacing[2], gap: Spacing[2] },
    productBannerIcon: { fontSize: 14 },
    productBannerText: { ...Typography.bodySmall, color: C.green[700], flex: 1 },
    messagesList:    { paddingHorizontal: Spacing[4], paddingVertical: Spacing[4], gap: Spacing[2], flexGrow: 1, justifyContent: 'flex-end' },
    dateDivider:     { flexDirection: 'row', alignItems: 'center', marginVertical: Spacing[4], gap: Spacing[3] },
    dateDividerLine: { flex: 1, height: 1, backgroundColor: C.border },
    dateDividerText: { ...Typography.caption, color: C.textMuted, fontWeight: '600' },
    msgRow:          { flexDirection: 'row', alignItems: 'flex-end', marginBottom: Spacing[2] },
    msgRowMe:        { justifyContent: 'flex-end' },
    msgRowThem:      { justifyContent: 'flex-start', gap: Spacing[2] },
    msgAvatar:       { width: 28, height: 28, borderRadius: 14, backgroundColor: C.green[200], alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    msgAvatarText:   { fontSize: 12, fontWeight: '700', color: C.green[800] },
    bubble:          { maxWidth: '75%', borderRadius: Radius.xl, paddingHorizontal: Spacing[4], paddingVertical: Spacing[3] },
    bubbleMe:        { backgroundColor: C.green[700], borderBottomRightRadius: 4 },
    bubbleThem:      { backgroundColor: C.white, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: C.border },
    bubbleText:      { ...Typography.bodyMedium, lineHeight: 22 },
    bubbleTextMe:    { color: '#ffffff' },
    bubbleTextThem:  { color: C.textPrimary },
    bubbleMeta:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 4, marginTop: 3 },
    bubbleTime:      { fontSize: 10, color: C.textMuted },
    bubbleTimeMe:    { color: 'rgba(255,255,255,.6)' },
    readTick:        { fontSize: 10, color: 'rgba(255,255,255,.5)', letterSpacing: -1 },
    readTickRead:    { color: '#86efac' },
    emptyChat:       { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing[12] },
    emptyChatIcon:   { fontSize: 48, marginBottom: Spacing[4] },
    emptyChatText:   { ...Typography.bodyLarge, color: C.textMuted, textAlign: 'center', lineHeight: 24 },
    inputBar:        { backgroundColor: C.white, borderTopWidth: 1, borderTopColor: C.border, flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: Spacing[4], paddingTop: Spacing[3], gap: Spacing[3] },
    input:           { flex: 1, backgroundColor: C.gray[100], borderRadius: Radius.xl, borderWidth: 1, borderColor: C.border, paddingHorizontal: Spacing[4], paddingVertical: Spacing[3], ...Typography.bodyMedium, color: C.textPrimary, maxHeight: 120 },
    sendBtn:         { width: 44, height: 44, borderRadius: 22, backgroundColor: C.green[700], alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    sendBtnDisabled: { backgroundColor: C.gray[300] },
    sendBtnText:     { color: '#ffffff', fontSize: 18, marginLeft: 2 },
  });
}
