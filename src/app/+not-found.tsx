import { Link } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { colors, fonts } from '@/theme/tokens';

export default function NotFound() {
  return (
    <View style={styles.root}>
      <Text style={styles.title}>This page wandered off.</Text>
      <Link href="/" style={styles.link}>
        Back to Discover
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.night, alignItems: 'center', justifyContent: 'center', gap: 16 },
  title: { color: colors.cream, fontFamily: fonts.question, fontSize: 24 },
  link: { color: colors.sage, fontFamily: fonts.bodyMedium, fontSize: 15 },
});
