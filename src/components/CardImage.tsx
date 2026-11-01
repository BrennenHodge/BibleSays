import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { PixelRatio, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { getImage, imageUrl } from '@/content/repository';
import { colors } from '@/theme/tokens';

interface Props {
  imageKey: string;
  alt: string;
  width: number;
  height: number;
  /** Height to request from the CDN; keeps one cached rendition per card while the display height adapts. */
  sourceHeight?: number;
  style?: StyleProp<ViewStyle>;
  priority?: 'low' | 'normal' | 'high';
}

/**
 * Optimized, sized image with a blurhash placeholder. If the asset is missing or
 * slow, a deep gradient keeps text readable.
 */
export function CardImage({ imageKey, alt, width, height, sourceHeight, style, priority = 'normal' }: Props) {
  const asset = getImage(imageKey);
  const dpr = Math.min(PixelRatio.get(), 2);

  return (
    <View style={[{ width, height, backgroundColor: colors.forest, overflow: 'hidden' }, style]}>
      <LinearGradient
        colors={[colors.moss, colors.night]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
      />
      {asset ? (
        <Image
          source={{ uri: imageUrl(asset, width * dpr, (sourceHeight ?? height) * dpr) }}
          placeholder={asset.blurHash ? { blurhash: asset.blurHash } : undefined}
          contentFit="cover"
          contentPosition={(asset.focus as never) ?? 'center'}
          transition={350}
          priority={priority}
          cachePolicy="memory-disk"
          style={StyleSheet.absoluteFill}
          accessible
          accessibilityLabel={alt}
          alt={alt}
        />
      ) : null}
    </View>
  );
}

/** Prefetch upcoming card images so vertical swipes never flash. */
export function prefetchCardImages(keys: string[], width: number, height: number) {
  const dpr = Math.min(PixelRatio.get(), 2);
  const urls = keys
    .map((k) => getImage(k))
    .filter((a): a is NonNullable<typeof a> => !!a)
    .map((a) => imageUrl(a, width * dpr, height * dpr));
  if (urls.length) Image.prefetch(urls).catch(() => {});
}
