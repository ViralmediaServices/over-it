import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, KeyboardAvoidingView, Platform, Alert, Animated,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { t } from '../constants/theme';
import Avatar from '../components/Avatar';
import { SYSTEM_PROMPT } from '../utils/prompts';
import { sendChat, saveMessages, getMessages, getProfile, saveProfile, extractProfile, clearMessages, signOut } from '../utils/api';

const Dots = () => {
  const anims = [
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
  ];
  useEffect(() => {
    anims.forEach((a, i) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 170),
          Animated.timing(a, { toValue: -6, duration: 300, useNativeDriver: true }),
          Animated.timing(a, { toValue: 0,  duration: 300, useNativeDriver: true }),
          Animated.delay(600),
        ])
      ).start();
    });
  }, []);
  return (
    <View style={{ flexDirection: 'row', gap: 5, alignItems: 'center', padding: 13 }}>
      {anims.map((a, i) => (
        <Animated.View
          key={i}
          style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#c4b5fd', transform: [{ translateY: a }] }}
        />
      ))}
    </View>
  );
};

const LABELS = {
  userName: 'Name', timeSinceBreakup: 'Time since breakup', relationshipLength: 'Relationship length',
  breakupInitiator: 'Who initiated', currentFeelings: 'Current feelings', primaryGoal: 'Goal',
  initialShare: 'Initially shared', attachmentStyle: 'Attachment style',
  attachmentSignals: 'Attachment signals', currentGriefStage: 'Grief stage',
  coreWounds: 'Core wounds', triggersIdentified: 'Triggers',
  copingStrategiesWorking: 'Helping strategies', keyThemes: 'Key themes', progressNote: 'Progress',
  attachmentQ1: 'Relationship patterns', attachmentQ2: 'Biggest fears', attachmentQ3: 'Conflict style',
};

const profileCtx = p => {
  if (!Object.keys(p).length) return 'New user — building profile from conversation.';
  return Object.entries(p)
    .filter(([k]) => !['attachmentQ1','attachmentQ2','attachmentQ3'].includes(k))
    .map(([k, v]) => `${LABELS[k] || k}: ${Array.isArray(v) ? v.join(', ') : v}`)
    .join('\n');
};

const JOURNEY_ROWS = [
  ['🌊', 'Where You Are',    'currentGriefStage'],
  ['🔗', 'Attachment Style', 'attachmentStyle'],
  ['💡', 'Attachment Signals','attachmentSignals'],
  ['💔', 'Who Ended It',     'breakupInitiator'],
  ['⏱️', 'Together For',     'relationshipLength'],
  ['🩹', 'Core Wounds',      'coreWounds'],
  ['⚡', 'Your Triggers',    'triggersIdentified'],
  ['✨', "What's Helping",   'copingStrategiesWorking'],
  ['🔍', 'Key Themes',       'keyThemes'],
  ['🌱', 'Your Progress',    'progressNote'],
];

const useWordReveal = (setMessages) => {
  const timerRefs = useRef([]);
  const reveal = useCallback((text, messageId) => {
    timerRefs.current.forEach(clearTimeout);
    timerRefs.current = [];
    const words = text.split(' ');
    words.forEach((_, i) => {
      const tm = setTimeout(() => {
        const partial = words.slice(0, i + 1).join(' ');
        setMessages(prev => prev.map(m => m.id === messageId ? { ...m, content: partial } : m));
      }, i * 25);
      timerRefs.current.push(tm);
    });
  }, [setMessages]);
  return reveal;
};

export default function ChatScreen({ initProfile, firstMsg, onSignOut }) {
  const insets = useSafeAreaInsets();
  const [messages,    setMessages]    = useState([]);
  const [input,       setInput]       = useState('');
  const [isLoading,   setIsLoading]   = useState(false);
  const [profile,     setProfile]     = useState(initProfile || {});
  const [showJourney, setShowJourney] = useState(false);

  const flatRef    = useRef(null);
  const profileRef = useRef(initProfile || {});
  const revealMsg  = useWordReveal(setMessages);

  useEffect(() => { profileRef.current = profile; }, [profile]);

  useEffect(() => {
    (async () => {
      try {
        const [msgRes, profRes] = await Promise.allSettled([
          getMessages(),
          getProfile(),
        ]);
        if (profRes.status === 'fulfilled' && profRes.value?.profile) {
          const merged = { ...initProfile, ...profRes.value.profile };
          setProfile(merged);
          profileRef.current = merged;
        }
        if (msgRes.status === 'fulfilled' && msgRes.value?.messages?.length) {
          setMessages(msgRes.value.messages);
          return;
        }
      } catch {}
      setMessages([{ role: 'assistant', content: firstMsg || "Hey. I'm here. 💙", id: 'welcome' }]);
    })();
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages.length, isLoading]);

  const send = async () => {
    if (!input.trim() || isLoading) return;
    const um   = { role: 'user', content: input.trim(), id: `u${Date.now()}` };
    const next = [...messages, um];
    setMessages(next);
    setInput('');
    setIsLoading(true);

    try {
      const systemPrompt = SYSTEM_PROMPT.replace('{PROFILE}', profileCtx(profileRef.current));
      const text = await sendChat(next, systemPrompt);
      const am    = { role: 'assistant', content: '', id: `a${Date.now()}` };
      const final = [...next, am];
      setMessages(final);
      setIsLoading(false);
      revealMsg(text, am.id);
      const finalWithContent = final.map(m => m.id === am.id ? { ...m, content: text } : m);
      saveMessages(finalWithContent).catch(() => {});
      const uc = finalWithContent.filter(m => m.role === 'user').length;
      if (uc > 0 && uc % 3 === 0) {
        const excerpt = finalWithContent.slice(-14)
          .map(m => `${m.role === 'user' ? 'User' : 'Over It'}: ${m.content}`)
          .join('\n\n');
        extractProfile(excerpt).then(extracted => {
          if (extracted && Object.keys(extracted).length) {
            const updated = { ...profileRef.current, ...extracted };
            setProfile(updated);
            profileRef.current = updated;
            saveProfile(updated).catch(() => {});
          }
        }).catch(() => {});
      }
    } catch {
      setIsLoading(false);
      setMessages(p => [...p, {
        role:    'assistant',
        content: "Something went wrong on my end — I'm so sorry. Please try again. I'm still here. 💙",
        id:      `err${Date.now()}`,
      }]);
    }
  };

  const runExtraction = useCallback(async (msgs) => {
    const uc = msgs.filter(m => m.role === 'user').length;
    if (!uc || uc % 3 !== 0) return;
    try {
      const excerpt = msgs.slice(-14)
        .map(m => `${m.role === 'user' ? 'User' : 'Over It'}: ${m.content}`)
        .join('\n\n');
      const extracted = await extractProfile(excerpt);
      if (Object.keys(extracted).length) {
        const updated = { ...profileRef.current, ...extracted };
        setProfile(updated);
        profileRef.current = updated;
        await saveProfile(updated).catch(() => {});
      }
    } catch {}
  }, []);

  const handleSignOut = () => {
    Alert.alert(
      'Sign out?',
      'You can sign back in anytime with your email and password.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign out',
          style: 'destructive',
          onPress: async () => {
            await signOut();
            onSignOut?.();
          },
        },
      ]
    );
  };

  const handleNewChat = () => {
    Alert.alert(
      'Start new conversation?',
      'Your Journey insights will be kept.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'New chat',
          onPress: async () => {
            await clearMessages().catch(() => {});
            setMessages([{ role: 'assistant', content: "Hey. Glad you're back. 💙", id: 'welcome2' }]);
          },
        },
      ]
    );
  };

  const renderMessage = useCallback(({ item: msg }) => {
    const isUser = msg.role === 'user';
    return (
      <View style={[styles.msgRow, isUser && styles.msgRowUser]}>
        {!isUser && <Avatar size={24} />}
        {isUser ? (
          <LinearGradient
            colors={['#6d28d9', '#9d174d']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={[styles.bubble, styles.bubbleUser]}
          >
            <Text style={styles.bubbleTextUser}>{msg.content}</Text>
          </LinearGradient>
        ) : (
          <View style={[styles.bubble, styles.bubbleAI]}>
            <Text style={styles.bubbleTextAI}>{msg.content}</Text>
          </View>
        )}
      </View>
    );
  }, []);

  const hasProfile = Object.keys(profile).length > 0;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}>
          <Avatar size={32} />
          <View>
            <Text style={styles.headerName}>Over It</Text>
            <Text style={styles.headerSub}>
              {profile.userName ? `Hey, ${profile.userName}` : 'Your healing companion'}
            </Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', gap: 6 }}>
          <TouchableOpacity
            onPress={() => setShowJourney(v => !v)}
            style={[styles.headerBtn, showJourney && styles.headerBtnActive]}
          >
            <Text style={[styles.headerBtnText, showJourney && { color: '#c4b5fd' }]}>
              🌱 Journey{hasProfile ? ' ●' : ''}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleNewChat} style={styles.headerBtn}>
            <Text style={styles.headerBtnText}>New chat</Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        ref={flatRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={item => item.id || Math.random().toString()}
        contentContainerStyle={styles.msgList}
        showsVerticalScrollIndicator={false}
        ListFooterComponent={
          isLoading ? (
            <View style={styles.msgRow}>
              <Avatar size={24} />
              <View style={[styles.bubble, styles.bubbleAI]}>
                <Dots />
              </View>
            </View>
          ) : null
        }
      />

      {/* Journey overlay */}
      {showJourney && (
        <TouchableOpacity
          style={styles.journeyOverlayBg}
          activeOpacity={1}
          onPress={() => setShowJourney(false)}
        >
          <TouchableOpacity activeOpacity={1} style={styles.journeyOverlay}>
            <View style={styles.journeyOverlayHeader}>
              <Text style={styles.journeyTitle}>🌱 Your Journey</Text>
              <TouchableOpacity onPress={() => setShowJourney(false)} style={styles.journeyClose}>
                <Text style={styles.journeyCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
            {!hasProfile ? (
              <Text style={styles.journeyEmpty}>
                As we talk, I will quietly build a picture of where you are so I can support you better over time.
              </Text>
            ) : (
              <View style={styles.journeyGrid}>
                {JOURNEY_ROWS.map(([icon, label, key]) => profile[key] ? (
                  <View key={key} style={styles.journeyCard}>
                    <Text style={styles.journeyCardLabel}>{icon} {label}</Text>
                    <Text style={styles.journeyCardVal}>
                      {Array.isArray(profile[key]) ? profile[key].join(' · ') : profile[key]}
                    </Text>
                  </View>
                ) : null)}
              </View>
            )}
            <TouchableOpacity onPress={handleSignOut} style={styles.signOutBtn}>
              <Text style={styles.signOutText}>Sign out</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      )}

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <View style={[styles.inputArea, { paddingBottom: Math.max(insets.bottom, 14) }]}>
          <View style={styles.inputRow}>
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder="Tell me how you are feeling..."
              placeholderTextColor="#332f4d"
              multiline
              editable={!isLoading}
              style={styles.input}
              onSubmitEditing={send}
              blurOnSubmit={false}
            />
            <TouchableOpacity
              onPress={send}
              disabled={!input.trim() || isLoading}
              style={styles.sendWrap}
            >
              <LinearGradient
                colors={
                  input.trim() && !isLoading
                    ? ['#7c3aed', '#be185d']
                    : ['rgba(124,58,237,0.12)', 'rgba(124,58,237,0.12)']
                }
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={styles.sendBtn}
              >
                <Text style={[styles.sendArrow, { color: input.trim() && !isLoading ? '#fff' : t.muted }]}>
                  ↑
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
          <Text style={styles.legal}>
            You're chatting with an AI, not a human. Not a substitute for professional mental health care.{' '}
            <Text style={{ color: '#5a3f82' }}>In crisis? Call or text 988.</Text>
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0b0914' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)',
    backgroundColor: 'rgba(11,9,20,0.78)',
  },
  headerName:      { fontWeight: '700', fontSize: 14, letterSpacing: -0.2, color: t.text },
  headerSub:       { fontSize: 10, color: t.muted, textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 1 },
  headerBtn:       { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' },
  headerBtnActive: { borderColor: 'rgba(124,58,237,0.45)', backgroundColor: 'rgba(124,58,237,0.13)' },
  headerBtnText:   { color: t.mutedLt, fontSize: 12 },
  journey: {
    backgroundColor: 'rgba(15,11,28,0.97)',
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)',
    padding: 14, maxHeight: '36%',
  },
  journeyOverlayBg: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#0b0914', zIndex: 50 },
  journeyOverlay: { position: 'absolute', top: 60, left: 12, right: 12, backgroundColor: '#0f0b1c', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(124,58,237,0.25)', padding: 16, maxHeight: '80%' },
  journeyOverlayHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  journeyClose: { padding: 4 },
  journeyCloseText: { color: t.muted, fontSize: 16 },
  journeyTitle: { fontSize: 11, fontWeight: '600', color: '#c4b5fd', letterSpacing: 0.8, textTransform: 'uppercase' },
  journeyEmpty: { fontSize: 12.5, color: t.muted, lineHeight: 20, fontStyle: 'italic' },
  journeyGrid:  { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  journeyCard:  { backgroundColor: 'rgba(124,58,237,0.06)', borderWidth: 1, borderColor: 'rgba(124,58,237,0.12)', borderRadius: 8, padding: 8, minWidth: 155 },
  journeyCardLabel: { fontSize: 10, color: t.muted, marginBottom: 3 },
  journeyCardVal:   { fontSize: 12, color: '#c4b5fd', fontWeight: '500', lineHeight: 18 },
  signOutBtn:   { marginTop: 18, paddingVertical: 12, alignItems: 'center', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)' },
  signOutText:  { color: '#f87171', fontSize: 13, fontWeight: '600' },
  msgList:    { padding: 14, gap: 13, paddingBottom: 8 },
  msgRow:     { flexDirection: 'row', alignItems: 'flex-end', gap: 7, justifyContent: 'flex-start' },
  msgRowUser: { justifyContent: 'flex-end' },
  bubble:         { maxWidth: '78%', paddingHorizontal: 15, paddingVertical: 11, borderRadius: 18 },
  bubbleUser:     { borderBottomRightRadius: 5 },
  bubbleAI:       { backgroundColor: 'rgba(22,18,42,0.9)', borderWidth: 1, borderColor: 'rgba(124,58,237,0.11)', borderTopLeftRadius: 4 },
  bubbleTextUser: { color: '#f0ecff', fontSize: 13.5, lineHeight: 23 },
  bubbleTextAI:   { color: t.textDim,  fontSize: 13.5, lineHeight: 23 },
  inputArea: {
    paddingHorizontal: 14, paddingTop: 10,
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.04)',
    backgroundColor: 'rgba(11,9,20,0.82)',
  },
  inputRow: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 8,
    backgroundColor: 'rgba(22,18,42,0.85)',
    borderWidth: 1, borderColor: 'rgba(124,58,237,0.19)',
    borderRadius: 22, paddingLeft: 15, paddingRight: 8, paddingVertical: 8,
  },
  input:     { flex: 1, color: t.text, fontSize: 13.5, lineHeight: 21, maxHeight: 132, paddingVertical: 4 },
  sendWrap:  { width: 34, height: 34, borderRadius: 17, overflow: 'hidden', flexShrink: 0 },
  sendBtn:   { flex: 1, alignItems: 'center', justifyContent: 'center' },
  sendArrow: { fontSize: 17, fontWeight: '700' },
  legal: { textAlign: 'center', fontSize: 10.5, color: '#2d2a42', marginTop: 8 },
});
