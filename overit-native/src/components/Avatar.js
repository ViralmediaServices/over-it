import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Line, G } from 'react-native-svg';

export default function Avatar({ size = 36 }) {
  const breathe = useRef(new Animated.Value(1)).current;
  const glow    = useRef(new Animated.Value(0.6)).current;
  const ic      = Math.round(size * 0.64);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(breathe, { toValue: 0.91, duration: 1600, useNativeDriver: true }),
        Animated.timing(breathe, { toValue: 1,    duration: 1600, useNativeDriver: true }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 0.12, duration: 1600, useNativeDriver: true }),
        Animated.timing(glow, { toValue: 0.6,  duration: 1600, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const glowSize = size + size * 0.2;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View
        style={[
          styles.glowRing,
          {
            width:        glowSize,
            height:       glowSize,
            borderRadius: glowSize / 2,
            position:     'absolute',
            opacity:      glow,
          },
        ]}
      >
        <LinearGradient
          colors={['rgba(124,58,237,0.25)', 'rgba(190,24,93,0.14)']}
          start={{ x: 0.15, y: 0 }}
          end={{ x: 0.85, y: 1 }}
          style={{ flex: 1, borderRadius: glowSize / 2 }}
        />
      </Animated.View>

      <Animated.View
        style={{
          width:       size,
          height:      size,
          borderRadius: size / 2,
          overflow:    'hidden',
          transform:   [{ scale: breathe }],
        }}
      >
        <LinearGradient
          colors={['#7c3aed', '#be185d']}
          start={{ x: 0.15, y: 0 }}
          end={{ x: 0.85, y: 1 }}
          style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
        >
          <Svg width={ic} height={ic} viewBox="0 0 40 40">
            <Path
              d="M20,34 C16,31 6,23 6,15.5 C6,11 10.5,8 14.5,8 C18,8 20,10.5 20,12"
              stroke="white" strokeWidth="1.8" strokeLinecap="round" fill="none"
            />
            <Path
              d="M20,12 C20,10.5 22,8 25.5,8 C29.5,8 34,11 34,15.5 C34,23 24,31 20,34"
              stroke="rgba(255,255,255,0.38)" strokeWidth="1.8" strokeLinecap="round"
              strokeDasharray="2 2.5" fill="none"
            />
            <G strokeLinecap="round">
              <Line x1="27.7" y1="12" x2="30.3" y2="12" stroke="white" strokeWidth="1.25"/>
              <Line x1="29"   y1="10.7" x2="29" y2="13.3" stroke="white" strokeWidth="1.25"/>
              <Line x1="32.8" y1="17" x2="36.2" y2="17" stroke="rgba(255,255,255,0.68)" strokeWidth="0.9"/>
              <Line x1="34.5" y1="15.3" x2="34.5" y2="18.7" stroke="rgba(255,255,255,0.68)" strokeWidth="0.9"/>
              <Line x1="31.3" y1="23.5" x2="34.7" y2="23.5" stroke="rgba(196,181,253,0.9)" strokeWidth="1.05"/>
              <Line x1="33"   y1="21.8" x2="33" y2="25.2" stroke="rgba(196,181,253,0.9)" strokeWidth="1.05"/>
              <Line x1="28.3" y1="29.5" x2="31.7" y2="29.5" stroke="rgba(255,255,255,0.52)" strokeWidth="0.82"/>
              <Line x1="30"   y1="27.8" x2="30" y2="31.2" stroke="rgba(255,255,255,0.52)" strokeWidth="0.82"/>
              <Line x1="24.4" y1="33.5" x2="27.6" y2="33.5" stroke="rgba(255,255,255,0.36)" strokeWidth="0.72"/>
              <Line x1="26"   y1="31.8" x2="26" y2="35.2" stroke="rgba(255,255,255,0.36)" strokeWidth="0.72"/>
            </G>
          </Svg>
        </LinearGradient>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  glowRing: {
    position: 'absolute',
  },
});
