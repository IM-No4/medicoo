import { useNavigation } from '@react-navigation/native';
import { StatusBar } from '../../components/ThemedStatusBar';
import { Brain, Check, ChevronLeft, X } from 'lucide-react-native';
import React, { useState, useMemo } from 'react';
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeContext';
import type { ThemeColors } from '../../theme/colors';
import { useLanguage } from '../../i18n/LanguageContext';

interface Question {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

// A genuinely game-like activity (tap to answer, see a score) rather than
// a passive timer or flip-card, for variety alongside the others. Same
// self-contained, zero-network, bundled-locally pattern. Indigo for a
// "brain/focus" feel, distinct from the other activities' colors.
const QUESTIONS: Question[] = [
  {
    question: 'About how many bones are in the adult human body?',
    options: ['126', '166', '206', '246'],
    correctIndex: 2,
    explanation: 'Adults have 206 bones - babies are actually born with more (around 300), many of which fuse together as they grow.',
  },
  {
    question: 'Which organ produces insulin?',
    options: ['Liver', 'Pancreas', 'Kidney', 'Spleen'],
    correctIndex: 1,
    explanation: 'The pancreas produces insulin, which helps regulate blood sugar levels.',
  },
  {
    question: 'How many hours of sleep do most adults need per night?',
    options: ['4-5 hours', '7-9 hours', '10-12 hours', '3-4 hours'],
    correctIndex: 1,
    explanation: 'Most adults need 7-9 hours of quality sleep for the body and mind to properly rest and recover.',
  },
  {
    question: 'Which of these is the largest organ in the human body?',
    options: ['Liver', 'Brain', 'Skin', 'Lungs'],
    correctIndex: 2,
    explanation: 'Skin is the body’s largest organ, covering about 2 square meters in an average adult.',
  },
  {
    question: 'What is the recommended daily water intake often cited for adults?',
    options: ['About 0.5L', 'About 1L', 'About 2.5L', 'About 5L'],
    correctIndex: 2,
    explanation: 'Around 2.5L a day is a commonly cited guideline, though it varies by body size, climate, and activity level.',
  },
  {
    question: 'Which nutrient is most associated with bone health?',
    options: ['Vitamin C', 'Calcium', 'Vitamin B12', 'Iron'],
    correctIndex: 1,
    explanation: 'Calcium (alongside vitamin D, which helps absorb it) is essential for building and maintaining strong bones.',
  },
  {
    question: 'What is the average adult resting heart rate range?',
    options: ['20-40 bpm', '60-100 bpm', '120-150 bpm', '160-200 bpm'],
    correctIndex: 1,
    explanation: 'A normal resting heart rate for most adults is between 60 and 100 beats per minute.',
  },
  {
    question: 'Which of these is a good source of dietary fiber?',
    options: ['White bread', 'Whole grains', 'Butter', 'Soda'],
    correctIndex: 1,
    explanation: 'Whole grains, along with fruits, vegetables, and legumes, are great sources of fiber that support digestion.',
  },
];

function randomIndex(exclude: number, length: number) {
  if (length <= 1) return 0;
  let index = Math.floor(Math.random() * length);
  while (index === exclude) {
    index = Math.floor(Math.random() * length);
  }
  return index;
}

export default function QuickQuizScreen() {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();

  const [questionIndex, setQuestionIndex] = useState(() => Math.floor(Math.random() * QUESTIONS.length));
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(0);

  const question = QUESTIONS[questionIndex];

  const handleSelect = (optionIndex: number) => {
    if (selected !== null) return;
    setSelected(optionIndex);
    setAnswered((prev) => prev + 1);
    if (optionIndex === question.correctIndex) {
      setScore((prev) => prev + 1);
    }
  };

  const handleNext = () => {
    setSelected(null);
    setQuestionIndex((prev) => randomIndex(prev, QUESTIONS.length));
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <View style={[styles.header, { paddingTop: insets.top + (Platform.OS === 'android' ? 12 : 4) }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} activeOpacity={0.7}>
          <ChevronLeft size={22} color={theme.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('quick_quiz')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: 40 + insets.bottom }]} showsVerticalScrollIndicator={false}>
        <View style={styles.scoreRow}>
          <View style={styles.iconBox}>
            <Brain size={20} color="#4F46E5" />
          </View>
          <Text style={styles.scoreText}>{score} / {answered} correct</Text>
        </View>

        <Text style={styles.question}>{question.question}</Text>

        {question.options.map((option, index) => {
          const isSelected = selected === index;
          const isCorrect = index === question.correctIndex;
          const showResult = selected !== null;

          return (
            <TouchableOpacity
              key={option}
              style={[
                styles.option,
                showResult && isCorrect && styles.optionCorrect,
                showResult && isSelected && !isCorrect && styles.optionWrong,
              ]}
              activeOpacity={0.8}
              onPress={() => handleSelect(index)}
              disabled={showResult}
            >
              <Text
                style={[
                  styles.optionText,
                  showResult && isCorrect && styles.optionTextCorrect,
                  showResult && isSelected && !isCorrect && styles.optionTextWrong,
                ]}
              >
                {option}
              </Text>
              {showResult && isCorrect && <Check size={18} color="#059669" />}
              {showResult && isSelected && !isCorrect && <X size={18} color="#DC2626" />}
            </TouchableOpacity>
          );
        })}

        {selected !== null && (
          <>
            <Text style={styles.explanation}>{question.explanation}</Text>
            <TouchableOpacity style={styles.nextButton} activeOpacity={0.85} onPress={handleNext}>
              <Text style={styles.nextButtonText}>{t('next_question')}</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const createStyles = (c: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: c.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 16,
    backgroundColor: c.card,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
      android: { elevation: 2 },
    }),
  },
  backButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', marginLeft: -8 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: c.text },
  content: { padding: 24, paddingBottom: 40 },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 24,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: c.infoBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4F46E5',
  },
  question: {
    fontSize: 18,
    fontWeight: '800',
    color: c.text,
    lineHeight: 26,
    marginBottom: 20,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: c.cardSecondary,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: c.border,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  optionCorrect: {
    backgroundColor: c.successBg,
    borderColor: '#A7F3D0',
  },
  optionWrong: {
    backgroundColor: c.errorBg,
    borderColor: '#FECACA',
  },
  optionText: {
    fontSize: 14.5,
    fontWeight: '600',
    color: c.text,
    flex: 1,
  },
  optionTextCorrect: {
    color: '#047857',
  },
  optionTextWrong: {
    color: c.error,
  },
  explanation: {
    fontSize: 13,
    lineHeight: 20,
    color: c.textSecondary,
    marginTop: 12,
    marginBottom: 20,
  },
  nextButton: {
    backgroundColor: '#4F46E5',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
