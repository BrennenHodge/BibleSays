import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconButton } from '@/components/IconButton';
import { QuestionRow } from '@/components/QuestionRow';
import { useToast } from '@/components/Toast';
import { getCard } from '@/content/repository';
import { useSaved } from '@/state/saved';
import { colors, fonts, radius, space } from '@/theme/tokens';

export default function SavedScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const toast = useToast();
  const { saved, remove } = useSaved();
  const cards = saved.map((s) => getCard(s.cardId)).filter((c) => c && c.status === 'published');

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + space.xl }]}>
      <Text style={styles.title} accessibilityRole="header">
        Saved
      </Text>
      {cards.length ? (
        <>
          <Text style={styles.sub}>
            {cards.length} {cards.length === 1 ? 'card' : 'cards'} to return to
          </Text>
          <View style={{ marginTop: space.lg }}>
            {cards.map((card) =>
              card ? (
                <QuestionRow
                  key={card.id}
                  card={card}
                  trailing={
                    <IconButton
                      icon="bookmark"
                      label={`Remove “${card.question}” from saved`}
                      color={colors.gold}
                      variant="plain"
                      onPress={() => {
                        remove(card.id);
                        toast('Removed from saved');
                      }}
                    />
                  }
                />
              ) : null,
            )}
          </View>
        </>
      ) : (
        <View style={styles.empty}>
          <View style={styles.emptyIcon}>
            <Ionicons name="bookmark-outline" size={26} color={colors.gold} />
          </View>
          <Text style={styles.emptyTitle}>Keep what speaks to you.</Text>
          <Text style={styles.emptyBody}>
            Tap the bookmark on any card to save it here. Your saved cards stay on this device.
          </Text>
          <Pressable onPress={() => router.navigate('/')} style={styles.button} accessibilityRole="button">
            <Text style={styles.buttonText}>Discover cards</Text>
          </Pressable>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.night },
  content: { paddingHorizontal: space.gutter, paddingBottom: 48, flexGrow: 1 },
  title: { color: colors.cream, fontFamily: fonts.question, fontSize: 34, letterSpacing: -0.5 },
  sub: { color: colors.creamFaint, fontFamily: fonts.body, fontSize: 14, marginTop: 4 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'flex-start', paddingBottom: 80 },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(227,207,164,0.1)',
    marginBottom: space.lg,
  },
  emptyTitle: { color: colors.cream, fontFamily: fonts.question, fontSize: 26, lineHeight: 31 },
  emptyBody: { color: colors.creamMuted, fontFamily: fonts.body, fontSize: 15, lineHeight: 23, marginTop: space.sm },
  button: {
    marginTop: space.xl,
    paddingHorizontal: 20,
    height: 46,
    borderRadius: radius.pill,
    backgroundColor: colors.cream,
    justifyContent: 'center',
  },
  buttonText: { color: colors.night, fontFamily: fonts.bodySemi, fontSize: 15 },
});
