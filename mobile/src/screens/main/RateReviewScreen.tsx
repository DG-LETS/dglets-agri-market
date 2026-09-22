import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, TextInput, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useThemeColors, Typography, Spacing, Radius, Shadow } from '@theme/index';
import { Button } from '@components/ui';
import { reviewsApi } from '@services/api';
import { useAuthStore } from '@store/authStore';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RouteProp } from '@react-navigation/native';
import type { OrdersStackParamList } from '@navigation/MainNavigator';

type Props = {
  navigation: StackNavigationProp<OrdersStackParamList, 'RateReview'>;
  route:      RouteProp<OrdersStackParamList, 'RateReview'>;
};

const RATING_LABELS = ['', 'Very Poor', 'Poor', 'Average', 'Good', 'Excellent'];
const RATING_EMOJIS = ['', 'ðŸ˜ž', 'ðŸ˜•', 'ðŸ˜', 'ðŸ˜Š', 'ðŸ¤©'];

const QUICK_TAGS_BUYER  = ['Fresh produce', 'As described', 'Good packaging', 'Fast response', 'Trustworthy'];
const QUICK_TAGS_SELLER = ['Prompt payment', 'Clear communication', 'Good buyer', 'Reliable'];

export function RateReviewScreen({ navigation, route }: Props) {
  const { orderId, haulageJobId, subjectId, subjectName, isBuyer, isHaulageRating } = route.params as any;
  const insets      = useSafeAreaInsets();
  const { user }    = useAuthStore();
  const queryClient = useQueryClient();

  const [rating,   setRating]  = useState(0);
  const [comment,  setComment] = useState('');
  const [tags,     setTags]    = useState<string[]>([]);

  const quickTags = isHaulageRating
    ? ['On time', 'Careful with cargo', 'Good communication', 'Trustworthy', 'Professional']
    : isBuyer ? QUICK_TAGS_BUYER : QUICK_TAGS_SELLER;

  const mutation = useMutation({
    mutationFn: () => reviewsApi.submit({
      orderId:      orderId || undefined,
      haulageJobId: haulageJobId || undefined,
      subjectId,
      rating,
      comment: comment.trim() || undefined,
      tags,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order', orderId] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['haulage-active-jobs'] });
      Alert.alert(
        'â­ Review Submitted!',
        isHaulageRating
          ? 'Thank you! Your feedback helps maintain quality delivery standards.'
          : 'Thank you for your feedback. It helps build trust on DG-LETS.',
        [{ text: 'OK', onPress: () => navigation.goBack() }],
      );
    },
    onError: (e: any) => {
      Alert.alert('Error', e?.response?.data?.message ?? 'Could not submit review. Please try again.');
    },
  });

  const toggleTag = (tag: string) => {
    setTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  const handleSubmit = () => {
    if (rating === 0) {
      Alert.alert('Rating Required', 'Please select a star rating before submitting.');
      return;
    }
    mutation.mutate();
  };

  return (
    <View style={[styles.flex, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>â†</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Rate & Review</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        style={styles.flex}
        contentContainerStyle={{ paddingBottom: Spacing[12] }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Who you're reviewing */}
        <View style={styles.subjectCard}>
          <View style={styles.subjectAvatar}>
            <Text style={styles.subjectAvatarText}>
              {subjectName?.[0]?.toUpperCase() ?? '?'}
            </Text>
          </View>
          <View style={styles.subjectInfo}>
            <Text style={styles.subjectLabel}>
              {isHaulageRating ? 'Rate the delivery driver' : isBuyer ? 'Rate the seller' : 'Rate the buyer'}
            </Text>
            <Text style={styles.subjectName}>{subjectName}</Text>
          </View>
        </View>

        {/* Star rating */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Overall Rating *</Text>
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map(star => (
              <TouchableOpacity
                key={star}
                onPress={() => setRating(star)}
                style={styles.starBtn}
                activeOpacity={0.7}
              >
                <Text style={[styles.star, star <= rating && styles.starFilled]}>
                  {star <= rating ? 'â˜…' : 'â˜†'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {rating > 0 && (
            <Text style={styles.ratingLabel}>
              {RATING_EMOJIS[rating]} {RATING_LABELS[rating]}
            </Text>
          )}
        </View>

        {/* Quick tags */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What stood out? (optional)</Text>
          <View style={styles.tagsRow}>
            {quickTags.map(tag => (
              <TouchableOpacity
                key={tag}
                style={[styles.tag, tags.includes(tag) && styles.tagActive]}
                onPress={() => toggleTag(tag)}
              >
                <Text style={[styles.tagText, tags.includes(tag) && styles.tagTextActive]}>
                  {tag}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Written review */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Write a Review (optional)</Text>
          <TextInput
            style={styles.commentInput}
            placeholder={`Share your experience with ${subjectName}â€¦`}
            placeholderTextColor={C.gray[400]}
            value={comment}
            onChangeText={setComment}
            multiline
            numberOfLines={4}
            maxLength={500}
          />
          <Text style={styles.charCount}>{comment.length}/500</Text>
        </View>

        {/* Submit */}
        <View style={styles.section}>
          <Button
            title={mutation.isPending ? 'Submittingâ€¦' : 'â­ Submit Review'}
            onPress={handleSubmit}
            loading={mutation.isPending}
            disabled={rating === 0}
            size="lg"
          />
          <TouchableOpacity style={styles.skipBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.skipText}>Skip for now</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: C.background },

  header:       { backgroundColor: C.white, flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing[5], paddingVertical: Spacing[4], borderBottomWidth: 1, borderBottomColor: C.border },
  backBtn:      { width: 40 },
  backText:     { fontSize: 22, color: C.textSecondary },
  headerTitle:  { ...Typography.titleLarge, color: C.textPrimary, flex: 1, textAlign: 'center' },

  subjectCard:  { backgroundColor: C.white, margin: Spacing[4], borderRadius: Radius.xl, padding: Spacing[5], flexDirection: 'row', alignItems: 'center', gap: Spacing[4], borderWidth: 1, borderColor: C.border, ...Shadow.sm },
  subjectAvatar:{ width: 56, height: 56, borderRadius: 28, backgroundColor: C.green[700], alignItems: 'center', justifyContent: 'center' },
  subjectAvatarText: { ...Typography.headingMedium, color: C.white },
  subjectInfo:  { flex: 1 },
  subjectLabel: { ...Typography.bodySmall, color: C.textMuted, marginBottom: 2 },
  subjectName:  { ...Typography.titleLarge, color: C.textPrimary },

  section:      { paddingHorizontal: Spacing[4], marginBottom: Spacing[5] },
  sectionTitle: { ...Typography.titleLarge, color: C.textPrimary, marginBottom: Spacing[4] },

  starsRow:    { flexDirection: 'row', gap: Spacing[3], marginBottom: Spacing[3] },
  starBtn:     { padding: Spacing[1] },
  star:        { fontSize: 40, color: C.gray[300] },
  starFilled:  { color: C.gold[500] },
  ratingLabel: { ...Typography.titleMedium, color: C.textSecondary },

  tagsRow:     { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[2] },
  tag:         { paddingHorizontal: Spacing[4], paddingVertical: Spacing[2], backgroundColor: C.white, borderRadius: 50, borderWidth: 1.5, borderColor: C.border },
  tagActive:   { backgroundColor: C.green[700], borderColor: C.green[700] },
  tagText:     { ...Typography.bodyMedium, color: C.textSecondary, fontWeight: '600' },
  tagTextActive: { color: C.white },

  commentInput:{ backgroundColor: C.white, borderWidth: 1.5, borderColor: C.border, borderRadius: Radius.lg, padding: Spacing[4], ...Typography.bodyLarge, color: C.textPrimary, textAlignVertical: 'top', minHeight: 120 },
  charCount:   { ...Typography.caption, color: C.textMuted, textAlign: 'right', marginTop: Spacing[1] },

  skipBtn:     { alignItems: 'center', marginTop: Spacing[4] },
  skipText:    { ...Typography.bodyMedium, color: C.textMuted },
});

