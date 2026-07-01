import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { t } from '../constants/theme';
import { QUESTIONS } from '../constants/questions';

export default function QuestionnaireScreen({ userName, onDone }) {
  const [step,    setStep]    = useState(0);
  const [answers, setAnswers] = useState({ userName });

  const q        = QUESTIONS[step];
  const isLast   = step === QUESTIONS.length - 1;
  const progress = ((step + 1) / QUESTIONS.length) * 100;
  const val      = answers[q.key];
  const hasVal   = q.multi ? Array.isArray(val) && val.length > 0 : !!val;
  const canNext  = !q.required || hasVal;

  const setA = v => setAnswers(p => ({ ...p, [q.key]: v }));

  const toggleChip = opt => {
    const cur      = answers[q.key] || [];
    const selected = cur.includes(opt);
    const max      = q.maxSelect || Infinity;

    if (selected) {
      setA(cur.filter(x => x !== opt));
    } else {
      if (cur.length < max) {
        setA([...cur, opt]);
      }
    }
  };

  const next = () => {
    if (!canNext) return;
    if (isLast) { onDone(answers); return; }
    setStep(s => s + 1);
  };
  const back = () => step > 0 && setStep(s => s - 1);
  const skip = () => { if (isLast) { onDone(answers); return; } setStep(s => s + 1); };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.progressBg}>
        <LinearGradient
          colors={['#7c3aed', '#be185d']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={[styles.progressFill, { width: `${progress}%` }]}
        />
      </View>
      <View style={styles.progressRow}>
        <TouchableOpacity onPress={back} disabled={step === 0} style={styles.navBtn}>
          <Text style={[styles.navBtnText, { opacity: step === 0 ? 0 : 1 }]}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.stepCount}>{step + 1} of {QUESTIONS.length}</Text>
        {!q.required
          ? <TouchableOpacity onPress={skip} style={styles.navBtn}>
              <Text style={styles.navBtnText}>Skip</Text>
            </TouchableOpacity>
          : <View style={styles.navBtn}/>
        }
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.eyebrow}>{q.eyebrow}</Text>
        <Text style={styles.question}>{q.question}</Text>
        {q.subtitle && <Text style={styles.subtitle}>{q.subtitle}</Text>}

        {q.type === 'text' && (
          <TextInput
            defaultValue={val || ''}
            onChangeText={setA}
            onSubmitEditing={next}
            placeholder={q.placeholder}
            placeholderTextColor="#332f4d"
            autoFocus
            returnKeyType="done"
            autoCapitalize="words"
            style={styles.textInput}
          />
        )}

        {q.type === 'textarea' && (
          <TextInput
            defaultValue={val || ''}
            onChangeText={setA}
            placeholder={q.placeholder}
            placeholderTextColor="#332f4d"
            multiline
            numberOfLines={5}
            textAlignVertical="top"
            style={[styles.textInput, styles.textarea]}
          />
        )}

        {q.type === 'cards' && !q.multi && (
          <View style={styles.cards}>
            {q.options.map(opt => {
              const sel = val === opt;
              return (
                <TouchableOpacity key={opt} onPress={() => setA(opt)} style={[styles.card, sel && styles.cardSel]}>
                  <View style={[styles.radio, sel && styles.radioSel]}>
                    {sel && <Text style={styles.check}>✓</Text>}
                  </View>
                  <Text style={[styles.cardText, sel && styles.cardTextSel]}>{opt}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {q.type === 'cards' && q.multi && (
          <View style={styles.cards}>
            {q.options.map(opt => {
              const cur = answers[q.key] || [];
              const sel = cur.includes(opt);
              const max = q.maxSelect || Infinity;
              const disabled = !sel && cur.length >= max;
              return (
                <TouchableOpacity
                  key={opt}
                  onPress={() => {
                    if (disabled) return;
                    const cur2 = answers[q.key] || [];
                    if (cur2.includes(opt)) {
                      setA(cur2.filter(x => x !== opt));
                    } else {
                      setA([...cur2, opt]);
                    }
                  }}
                  style={[styles.card, sel && styles.cardSel, disabled && styles.cardDisabled]}
                >
                  <View style={[styles.radio, sel && styles.radioSel]}>
                    {sel && <Text style={styles.check}>✓</Text>}
                  </View>
                  <Text style={[styles.cardText, sel && styles.cardTextSel, disabled && styles.cardTextDisabled]}>{opt}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {q.type === 'chips' && (
          <View style={styles.chips}>
            {q.options.map(opt => {
              const cur      = answers[q.key] || [];
              const sel      = cur.includes(opt);
              const max      = q.maxSelect || Infinity;
              const disabled = !sel && cur.length >= max;
              return (
                <TouchableOpacity
                  key={opt}
                  onPress={() => toggleChip(opt)}
                  disabled={disabled}
                  style={[
                    styles.chip,
                    sel && styles.chipSel,
                    disabled && styles.chipDisabled,
                  ]}
                >
                  <Text style={[styles.chipText, sel && styles.chipTextSel, disabled && styles.chipTextDisabled]}>
                    {opt}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {q.maxSelect && (
          <Text style={styles.maxHint}>
            {(answers[q.key] || []).length}/{q.maxSelect} selected
          </Text>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity onPress={next} disabled={!canNext} style={styles.btnWrap}>
          <LinearGradient
            colors={canNext ? ['#7c3aed', '#be185d'] : ['rgba(124,58,237,0.12)', 'rgba(124,58,237,0.12)']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={styles.btn}
          >
            <Text style={[styles.btnText, !canNext && { color: t.muted }]}>
              {isLast ? 'Enter Over It 💙' : 'Continue'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: t.bg },
  progressBg:   { height: 3, backgroundColor: 'rgba(124,58,237,0.1)' },
  progressFill: { height: '100%', borderRadius: 2 },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10 },
  navBtn:      { width: 60 },
  navBtnText:  { fontSize: 13, color: t.mutedLt },
  stepCount:   { fontSize: 11, color: t.muted },
  scroll:        { flex: 1 },
  scrollContent: { padding: 24, paddingTop: 12, maxWidth: 480, width: '100%', alignSelf: 'center' },
  eyebrow:  { fontSize: 11, color: '#7c3aed', letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 10, fontWeight: '600' },
  question: { fontSize: 22, fontWeight: '700', letterSpacing: -0.4, lineHeight: 29, color: t.text, marginBottom: 6 },
  subtitle: { fontSize: 13, color: t.mutedLt, marginBottom: 20 },
  textInput: {
    backgroundColor: 'rgba(30,26,53,0.6)', borderWidth: 1,
    borderColor: 'rgba(124,58,237,0.3)', borderRadius: 12,
    padding: 15, color: t.text, fontSize: 16, marginTop: 4,
  },
  textarea: { height: 120, paddingTop: 15 },
  cards: { gap: 9 },
  card:  {
    flexDirection: 'row', alignItems: 'center', gap: 11,
    padding: 14, borderRadius: 12, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)', backgroundColor: 'rgba(22,18,42,0.6)',
  },
  cardSel:     { borderColor: 'rgba(124,58,237,0.6)', backgroundColor: 'rgba(124,58,237,0.15)' },
  radio:       { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  radioSel:    { borderColor: '#7c3aed', backgroundColor: '#7c3aed' },
  check:       { color: '#fff', fontSize: 9, fontWeight: '700' },
  cardText:        { fontSize: 14, color: t.textDim, flex: 1 },
  cardTextSel:     { fontSize: 14, color: '#c4b5fd', fontWeight: '600' },
  cardDisabled:    { opacity: 0.35 },
  cardTextDisabled:{ color: t.muted },
  chips:           { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip:            { paddingVertical: 10, paddingLeft: 14, paddingRight: 18, borderRadius: 24, borderWidth: 1, borderColor: '#2a2548', backgroundColor: '#16122a', alignSelf: 'flex-start' },
  chipSel:         { borderColor: 'rgba(124,58,237,0.6)', backgroundColor: '#1e1a35' },
  chipDisabled:    { opacity: 0.35 },
  chipText:        { fontSize: 13, color: t.textDim, includeFontPadding: false },
  chipTextSel:     { color: '#c4b5fd', fontWeight: '600' },
  chipTextDisabled:{ color: t.muted },
  maxHint: { fontSize: 11, color: t.muted, marginTop: 12, textAlign: 'center' },
  footer:  { padding: 16, paddingBottom: 30, maxWidth: 480, width: '100%', alignSelf: 'center' },
  btnWrap: { borderRadius: 13, overflow: 'hidden' },
  btn:     { padding: 15, alignItems: 'center', borderRadius: 13 },
  btnText: { color: '#fff', fontSize: 15, fontWeight: '600', letterSpacing: -0.2 },
});
