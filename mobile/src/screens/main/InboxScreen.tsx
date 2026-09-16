import React, { useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, RefreshControl, Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { Colors, Typography, Spacing, Radius } from '@theme/index';
import { LoadingState, EmptyState } from '@components/ui';
import { messagesApi } from '@services/api';
import { useAuthStore } from '@store/authStore';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { MessagesStackParamList } from '@navigation/MainNavigator';

type Props = {
  navigation: StackNavigationProp<MessagesStackParamList, 'Inbox'>;
};

function formatTime(date: string | null | undefined): string {
  if (!date) return '';
  const d   = new Date(date);
  const now = new Date();
  const diff = now.getTime() - d.getTime();

  if (diff < 60_000)                    return 'now';
  if (diff < 3_600_000)                 return `${Math.floor(diff / 60_000)}m`;
  if (diff < 86_400_000)                return `${Math.floor(diff / 3_600_000)}h`;
  if (diff < 7 * 86_400_000)            return `${Math.floor(diff / 86_400_000)}d`;
  return d.toLocaleDateString('en-NG', { day: 'numeric', month: 'short' });
}

export function InboxScreen({ navigation }: Props) {
  const insets   = useSafeAreaInsets();
  const { user } = useAuthStore();

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['conversations'],
    queryFn:  () => messagesApi.getConversations().then(r => r.data),
    refetchInterval: 15_000, /* poll every 15s for new messages */
    retry: 0,
  });

  const conversations = Array.isArray(data) ? data : [];

  const renderItem = useCallback(({ item }: { item: any }) => {
    const other      = item.other;
    const lastName   = other?.lastName ?? '';
    const firstName  = other?.firstName ?? 'Unknown';
    const initials   = `${firstName[0] ?? ''}${lastName[0] ?? ''}`.toUpperCase();
    const isVerified = other?.verification?.identityStatus === 'VERIFIED'
                    || other?.verification?.phoneVerified === true;
    const unread     = item.unread ?? 0;
    const lastMsg    = item.lastMessage;
    const isMe       = lastMsg?.senderId === user?.id;

    return (
      <TouchableOpacity
        style={styles.convItem}
        activeOpacity={0.7}
        onPress={() => navigation.navigate('Chat', {
          conversationId: item.id,
          recipientId:    other?.id,
          recipientName:  `${firstName} ${lastName}`.trim(),
          recipientRole:  other?.role,
          productId:      item.product?.id,
          productName:    item.product?.name,
        })}
      >
        {/* Avatar */}
        <View style={styles.avatarWrap}>
          {other?.profileImage ? (
            <Image source={{ uri: other.profileImage }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Text style={styles.avatarInitials}>{initials}</Text>
            </View>
          )}
          {isVerified && <View style={styles.verifiedDot} />}
        </View>

        {/* Content */}
        <View style={styles.convContent}>
          <View style={styles.convTop}>
            <Text style={styles.convName} numberOfLines={1}>
              {firstName} {lastName}
            </Text>
            <Text style={styles.convTime}>{formatTime(item.lastMessageAt)}</Text>
          </View>

          {/* Product context */}
          {item.product && (
            <Text style={styles.convProduct} numberOfLines={1}>
              🌾 {item.product.name}
            </Text>
          )}

          {/* Last message preview */}
          <View style={styles.convBottom}>
            <Text
              style={[styles.convPreview, unread > 0 && styles.convPreviewUnread]}
              numberOfLines={1}
            >
              {lastMsg
                ? `${isMe ? 'You: ' : ''}${lastMsg.body}`
                : 'No messages yet — say hello!'}
            </Text>
            {unread > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadBadgeText}>
                  {unread > 99 ? '99+' : unread}
                </Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  }, [user?.id, navigation]);

  return (
    <View style={[styles.flex, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
        {conversations.length > 0 && (
          <Text style={styles.headerSub}>{conversations.length} conversation{conversations.length !== 1 ? 's' : ''}</Text>
        )}
      </View>

      {isLoading ? (
        <LoadingState message="Loading messages…" />
      ) : conversations.length === 0 ? (
        <EmptyState
          icon="💬"
          title="No messages yet"
          description="When you contact a seller or a buyer messages you, conversations will appear here."
        />
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={Colors.green[700]}
            />
          }
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex:   { flex: 1, backgroundColor: Colors.white },

  header:     { paddingHorizontal: Spacing[5], paddingTop: Spacing[4], paddingBottom: Spacing[4], borderBottomWidth: 1, borderBottomColor: Colors.border },
  headerTitle:{ ...Typography.headingMedium, color: Colors.textPrimary },
  headerSub:  { ...Typography.bodySmall, color: Colors.textMuted, marginTop: 2 },

  list:        { paddingVertical: Spacing[1] },
  separator:   { height: 1, backgroundColor: Colors.gray[100], marginLeft: 76 },

  convItem:    { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing[5], paddingVertical: Spacing[4], gap: Spacing[3] },

  /* Avatar */
  avatarWrap:         { position: 'relative', flexShrink: 0 },
  avatar:             { width: 52, height: 52, borderRadius: 26 },
  avatarPlaceholder:  { backgroundColor: Colors.green[700], alignItems: 'center', justifyContent: 'center' },
  avatarInitials:     { ...Typography.titleLarge, color: Colors.white },
  verifiedDot:        { position: 'absolute', bottom: 0, right: 0, width: 14, height: 14, borderRadius: 7, backgroundColor: Colors.green[500], borderWidth: 2, borderColor: Colors.white },

  /* Content */
  convContent:    { flex: 1, minWidth: 0 },
  convTop:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
  convName:       { ...Typography.titleMedium, color: Colors.textPrimary, flex: 1 },
  convTime:       { ...Typography.caption, color: Colors.textMuted, marginLeft: Spacing[2] },
  convProduct:    { ...Typography.caption, color: Colors.green[600], marginBottom: 2 },
  convBottom:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  convPreview:    { ...Typography.bodySmall, color: Colors.textMuted, flex: 1 },
  convPreviewUnread: { color: Colors.textPrimary, fontWeight: '600' },
  unreadBadge:    { minWidth: 20, height: 20, borderRadius: 10, backgroundColor: Colors.green[700], alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5, marginLeft: Spacing[2] },
  unreadBadgeText:{ fontSize: 11, fontWeight: '800', color: Colors.white },
});
