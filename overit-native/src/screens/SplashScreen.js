import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Animated, StyleSheet, Dimensions } from 'react-native';
import { t } from '../constants/theme';
import Avatar from '../components/Avatar';

const { width } = Dimensions.get('window');

export default function SplashScreen({ onDone }) {
  const [progress, setProgress] = useState(0);
  const fadeIn  = useRef(new Animated.Value(0)).current;
  const scaleIn = useRef(new Animated.Value(0.93)).current;
  const shimmer = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeIn,  { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.timing(scaleIn, { toValue: 1, duration: 700, useNativeDriver: true }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1,   duration: 1250, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0.4, duration: 1250, useNativeDriver: true }),
      ])
    ).start();

    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 100) { clearInterval(interval); return 100; }
        return Math.min(p + 2.4, 100);
      });
    }, 55);

    const timer = setTimeout(onDone, 2800);
    return () => { clearInterval(interval); clearTimeout(timer); };
  }, []);

  return (
    <View style={styles.container}>
      <View style={[styles.glow, { top: '-20%', left: '-10%', width: width * 0.6, height: width * 0.6 }]}>
        <View style={{ flex: 1, backgroundColor: 'rgba(124,58,237,0.07)', borderRadius: 9999 }}/>
      </View>
      <View style={[styles.glow, { bottom: '-5%', right: '-15%', width: width * 0.5, height: width * 0.5 }]}>
        <View style={{ flex: 1, backgroundColor: 'rgba(190,24,93,0.05)', borderRadius: 9999 }}/>
      </View>

      <Animated.View style={[styles.center, { opacity: fadeIn, transform: [{ scale: scaleIn }] }]}>
        <Avatar size={88} />
        <Text style={styles.title}>Over It</Text>
        <Animated.Text style={[styles.subtitle, { opacity: shimmer }]}>
          You are not alone in this.
        </Animated.Text>
      </Animated.View>

      <View style={styles.progressBg}>
        <View style={[styles.progressFill, { width: `${progress}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: t.bg, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  glow:      { position: 'absolute' },
  center:    { alignItems: 'center', gap: 22 },
  title:     { fontSize: 46, fontWeight: '800', letterSpacing: -1.8, color: '#c4b5fd', marginTop: 6 , includeFontPadding: false},
  subtitle:  { fontSize: 15, color: t.mutedLt, letterSpacing: 0.3, textAlign: 'center' , includeFontPadding: false},
  progressBg:   { position: 'absolute', bottom: 52, width: 110, height: 2, borderRadius: 2, backgroundColor: 'rgba(124,58,237,0.12)', overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 2, backgroundColor: '#7c3aed' },
});
