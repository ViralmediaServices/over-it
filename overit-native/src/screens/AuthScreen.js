import React, { useState, useCallback, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, ActivityIndicator,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { t } from '../constants/theme';
import Avatar from '../components/Avatar';
import { signup, signin, getProfile } from '../utils/api';

const isValidEmail = email => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

const Field = React.memo(({ label, onChangeText, secureTextEntry = false, placeholder, keyboardType = 'default', onSubmit }) => {
  const [value, setValue] = useState('');
  const [focused, setFocused] = useState(false);
  const handleChange = useCallback(v => { setValue(v); onChangeText(v); }, [onChangeText]);
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={handleChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onSubmitEditing={onSubmit}
        returnKeyType="done"
        placeholder={placeholder}
        placeholderTextColor="#332f4d"
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize="none"
        style={[styles.input, focused && styles.inputFocused]}
      />
    </View>
  );
});

export default function AuthScreen({ onDone }) {
  const [mode, setMode] = useState('signup');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const nameRef = useRef('');
  const emailRef = useRef('');
  const passwordRef = useRef('');

  const handleName = useCallback(v => { nameRef.current = v; }, []);
  const handleEmail = useCallback(v => { emailRef.current = v; }, []);
  const handlePassword = useCallback(v => { passwordRef.current = v; }, []);

  const submit = async () => {
    const name = nameRef.current.trim();
    const email = emailRef.current.trim();
    const password = passwordRef.current;
    setError('');
    if (mode === 'signup' && !name) { setError('Please enter your first name.'); return; }
    if (!email) { setError('Please enter your email address.'); return; }
    if (!isValidEmail(email)) { setError('Please enter a valid email address.'); return; }
    if (!password) { setError('Please enter a password.'); return; }
    if (mode === 'signup' && password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    setLoading(true);
    try {
      if (mode === 'signin') {
        await signin({ email, password });
        const { questionnaireComplete } = await getProfile();
        onDone({ skip: questionnaireComplete });
      } else {
        await signup({ name, email, password });
        onDone({ userName: name });
      }
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="on-drag"
        >
          <View style={styles.logo}>
            <Avatar size={52} />
            <Text style={styles.logoText}>Over It</Text>
          </View>
          <View style={styles.heading}>
            <Text style={styles.h1}>{mode === 'signup' ? 'Begin your healing' : 'Welcome back'}</Text>
            <Text style={styles.sub}>{mode === 'signup' ? 'A private, judgment-free space to heal.' : 'Continue where you left off.'}</Text>
          </View>
          <TouchableOpacity style={styles.ghostBtn}>
            <Text style={styles.ghostBtnText}>🍎  Continue with Apple</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.ghostBtn, { marginTop: 8 }]}>
            <Text style={[styles.ghostBtnText, { fontWeight: '700' }]}>G  Continue with Google</Text>
          </TouchableOpacity>
          <View style={styles.divider}>
            <View style={styles.dividerLine}/>
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine}/>
          </View>
          {mode === 'signup' && <Field label="First Name" onChangeText={handleName} placeholder="Your name" onSubmit={submit}/>}
          <Field label="Email" onChangeText={handleEmail} placeholder="you@email.com" keyboardType="email-address" onSubmit={submit}/>
          <Field label="Password" onChangeText={handlePassword} placeholder="8+ characters" secureTextEntry onSubmit={submit}/>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <TouchableOpacity onPress={submit} disabled={loading} style={styles.submitWrap} activeOpacity={0.8}>
            <LinearGradient
              colors={loading ? ['rgba(124,58,237,0.12)', 'rgba(124,58,237,0.12)'] : ['#7c3aed', '#be185d']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={styles.submitBtn}
            >
              {loading ? <ActivityIndicator color={t.mutedLt}/> : <Text style={styles.submitText}>{mode === 'signup' ? 'Create my account' : 'Sign in'}</Text>}
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => { nameRef.current=''; emailRef.current=''; passwordRef.current=''; setError(''); setMode(m => m === 'signup' ? 'signin' : 'signup'); }}
            style={styles.toggle}
          >
            <Text style={styles.toggleText}>{mode === 'signup' ? 'Already have an account? Sign in' : 'New here? Create an account'}</Text>
          </TouchableOpacity>
          <Text style={styles.legal}>🔒 Your conversations are private and never shared.{'\n'}Over It is an AI companion, not a human or licensed therapist.</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:         { flex: 1, backgroundColor: t.bg },
  container:    { padding: 28, alignItems: 'center', maxWidth: 420, alignSelf: 'center', width: '100%' },
  logo:         { alignItems: 'center', gap: 10, marginBottom: 32 },
  logoText:     { fontSize: 28, fontWeight: '800', letterSpacing: -1, color: '#c4b5fd' , includeFontPadding: false},
  heading:      { alignItems: 'center', marginBottom: 26, width: '100%' },
  h1:           { fontSize: 22, fontWeight: '700', letterSpacing: -0.5, color: t.text, marginBottom: 7 , includeFontPadding: false},
  sub:          { fontSize: 13.5, color: t.mutedLt, lineHeight: 21, textAlign: 'center' , includeFontPadding: false},
  ghostBtn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', width: '100%', padding: 13, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  ghostBtnText: { color: t.textDim, fontSize: 14 , includeFontPadding: false},
  divider:      { flexDirection: 'row', alignItems: 'center', width: '100%', marginVertical: 20, gap: 12 },
  dividerLine:  { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.06)' },
  dividerText:  { fontSize: 11, color: t.muted , includeFontPadding: false},
  fieldWrap:    { width: '100%', marginBottom: 12 },
  fieldLabel:   { fontSize: 11, color: t.mutedLt, letterSpacing: 0.6, textTransform: 'uppercase', fontWeight: '600', marginBottom: 6 , includeFontPadding: false},
  input:        { backgroundColor: 'rgba(30,26,53,0.6)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderRadius: 10, padding: 13, color: t.text, fontSize: 14 , includeFontPadding: false},
  inputFocused: { borderColor: 'rgba(124,58,237,0.55)' },
  error:        { color: '#f87171', fontSize: 12.5, marginBottom: 12, textAlign: 'center', width: '100%' , includeFontPadding: false},
  submitWrap:   { width: '100%', marginTop: 4, borderRadius: 13, overflow: 'hidden' },
  submitBtn:    { padding: 15, alignItems: 'center', borderRadius: 13 },
  submitText:   { color: '#fff', fontSize: 15, fontWeight: '600', letterSpacing: -0.2 , includeFontPadding: false},
  toggle:       { marginTop: 16 },
  toggleText:   { color: t.mutedLt, fontSize: 13 , includeFontPadding: false},
  legal:        { fontSize: 11, color: t.muted, textAlign: 'center', marginTop: 22, lineHeight: 18 , includeFontPadding: false},
});
