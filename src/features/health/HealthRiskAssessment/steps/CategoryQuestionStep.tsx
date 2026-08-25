import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { AssessmentCategory } from '../questions';
import { styles } from '../styles';

interface Props {
    category: AssessmentCategory;
    answers: Record<string, number>;
    onAnswer: (questionKey: string, optionIndex: number) => void;
}

export default function CategoryQuestionStep({ category, answers, onAnswer }: Props) {
    return (
        <View style={styles.container}>
            <Text style={styles.heading}>{category.label}</Text>
            <Text style={styles.subheading}>A couple of quick questions.</Text>

            {category.questions.map((question) => (
                <View key={question.key} style={{ marginBottom: 8 }}>
                    <Text style={styles.sectionLabel}>{question.text.toUpperCase()}</Text>
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
                                        {option}
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
