import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

import SplashScreen        from './src/screens/SplashScreen';
import AuthScreen          from './src/screens/AuthScreen';
import QuestionnaireScreen from './src/screens/QuestionnaireScreen';
import ChatScreen          from './src/screens/ChatScreen';

import { buildWelcome }                        from './src/utils/welcome';
import { getProfile, saveProfile, savePushToken } from './src/utils/api';
import { storage }                             from './src/utils/storage';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge:  false,
  }),
});

async function registerForPushNotifications() {
  if (!Device.isDevice) return null;
  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;
  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') return null;
  const tokenData = await Notifications.getExpoPushTokenAsync();
  return tokenData.data;
}

// Derive an initial attachment style signal from questionnaire answers
function deriveAttachmentStyle(answers) {
  const q1 = answers.attachmentQ1 || [];
  const q2 = answers.attachmentQ2 || [];
  const q3 = answers.attachmentQ3 || [];
  const all = [...q1, ...q2, ...q3];

  const scores = { anxious: 0, avoidant: 0, secure: 0, disorganized: 0 };

  all.forEach(a => {
    if (a.includes('worry') || a.includes('alone') || a.includes('reassurance') || a.includes('lose interest')) scores.anxious++;
    if (a.includes('trust') || a.includes('independence') || a.includes('pull back') || a.includes('hurt if I open')) scores.avoidant++;
    if (a.includes('secure') || a.includes('comfortable') || a.includes('calmly') || a.includes('ready')) scores.secure++;
    if (a.includes('overwhelmed') || a.includes('swing') || a.includes('not knowing')) scores.disorganized++;
  });

  const top = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  if (top[0][1] === 0) return null;

  const primary   = top[0][0];
  const secondary = top[1][1] > 0 && top[1][0] !== primary ? top[1][0] : null;

  if (secondary) return `${primary} with ${secondary} traits`;
  return primary;
}

export default function App() {
  const [screen,   setScreen]   = useState('splash');
  const [profile,  setProfile]  = useState({});
  const [firstMsg, setFirstMsg] = useState('');

  const handleSplashDone = async () => {
    try {
      const token = await storage.get('overit_token');
      if (token?.value) {
        const { profile: saved, questionnaireComplete } = await getProfile();
        if (questionnaireComplete) {
          setProfile(saved);
          setScreen('chat');
          return;
        }
        if (saved?.userName) {
          setProfile(saved);
          setScreen('questionnaire');
          return;
        }
      }
    } catch {
      await storage.delete('overit_token');
    }
    setScreen('auth');
  };

  const handleAuthDone = async ({ userName, skip }) => {
    if (skip) {
      try {
        const { profile: saved } = await getProfile();
        setProfile(saved);
      } catch {}
      setScreen('chat');
      return;
    }
    setProfile(p => ({ ...p, userName }));
    setScreen('questionnaire');
  };

  const handleQuestDone = async (answers) => {
    // Derive initial attachment style from questionnaire answers
    const initialAttachment = deriveAttachmentStyle(answers);

    const merged = {
      ...profile,
      ...answers,
      ...(initialAttachment ? { attachmentStyle: initialAttachment } : {}),
    };

    setProfile(merged);
    setFirstMsg(buildWelcome(answers));

    try { await saveProfile(merged, true); } catch {}

    registerForPushNotifications().then(async pushToken => {
      if (pushToken) {
        try { await savePushToken(pushToken); } catch {}
      }
    });

    setScreen('chat');
  };

  return (
    <SafeAreaProvider>
      <StatusBar style="light" backgroundColor="transparent" translucent />
      {screen === 'splash'        && <SplashScreen          onDone={handleSplashDone} />}
      {screen === 'auth'          && <AuthScreen            onDone={handleAuthDone} />}
      {screen === 'questionnaire' && <QuestionnaireScreen   userName={profile.userName} onDone={handleQuestDone} />}
      {screen === 'chat'          && <ChatScreen            initProfile={profile} firstMsg={firstMsg} />}
    </SafeAreaProvider>
  );
}
