import { Dimensions, PixelRatio } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Based on iPhone 11 Pro dimensions
const BASE_WIDTH = 375;
const BASE_HEIGHT = 812;

export const wp = (percentage) => {
  const value = (percentage * SCREEN_WIDTH) / 100;
  return Math.round(PixelRatio.roundToNearestPixel(value));
};

export const hp = (percentage) => {
  const value = (percentage * SCREEN_HEIGHT) / 100;
  return Math.round(PixelRatio.roundToNearestPixel(value));
};

export const normalize = (size) => {
  const scale = SCREEN_WIDTH / BASE_WIDTH;
  const newSize = size * scale;
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
};

export const isSmallDevice = () => SCREEN_WIDTH < 375;
export const isMediumDevice = () => SCREEN_WIDTH >= 375 && SCREEN_WIDTH < 414;
export const isLargeDevice = () => SCREEN_WIDTH >= 414;

export const getResponsiveSpacing = (base) => {
  if (isSmallDevice()) return base * 0.8;
  if (isLargeDevice()) return base * 1.2;
  return base;
};

export const getResponsiveFontSize = (base) => {
  if (isSmallDevice()) return base * 0.9;
  if (isLargeDevice()) return base * 1.1;
  return base;
};

export const screenData = {
  width: SCREEN_WIDTH,
  height: SCREEN_HEIGHT,
  isSmall: isSmallDevice(),
  isMedium: isMediumDevice(),
  isLarge: isLargeDevice(),
};