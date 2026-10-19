import React, { useMemo } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { AssessmentCategory } from '../questions';
import { createStyles } from '../styles';
import { useTheme } from '../../../../theme/ThemeContext';
import { useLanguage } from '../../../../i18n/LanguageContext';

interface Props {
    category: AssessmentCategory;
    answers: Record<string, number>;
    onAnswer: (questionKey: string, optionIndex: number) => void;
}

export default function CategoryQuestionStep({ category, answers, onAnswer }: Props) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { t } = useLanguage();
    return (
        <View style={styles.container}>
            <Text style={styles.heading}>{t(category.label)}</Text>
            <Text style={styles.subheading}>{t('a_couple_of_quick_questions')}</Text>

            {category.questions.map((question) => (
                <View key={question.key} style={{ marginBottom: 8 }}>
                    <Text style={styles.sectionLabel}>{t(question.text).toUpperCase()}</Text>
                    <View style={styles.optionList}>
                        {question.options.map((option, index) => {
                            const isActive = answers[question.key] === index;
                            return (
                                <TouchableOpacity
                                    key={option}
                                    style={[styles.optionRow, isActive && styles.optionRowActive]}
                                    onPress={() => onAnswer(question.key, index)}
                                    activeOpacity={0.7}
                                >
                                    <Text style={[styles.optionLabel, isActive && styles.optionLabelActive]}>
                                        {t(option)}
                                    </Text>
                                    <View style={[styles.radio, isActive && styles.radioActive]}>
                                        {isActive && <View style={styles.radioDot} />}
                                    </View>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>
            ))}
        </View>
    );
}
