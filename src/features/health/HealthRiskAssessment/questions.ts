// Must stay in sync with the backend's source of truth:
// C:\Users\Admin\mediseen\backend\services\healthRiskAssessmentScoring.js
// (same question keys, same option order/count - option index = points).

export interface AssessmentQuestion {
    key: string;
    text: string;
    options: string[];
}

export interface AssessmentCategory {
    key: string;
    label: string;
    questions: AssessmentQuestion[];
}

export const ASSESSMENT_CATEGORIES: AssessmentCategory[] = [
    {
        key: 'activity',
        label: 'Activity',
        questions: [
            {
                key: 'activity_frequency',
                text: 'How many days a week do you get at least 30 minutes of physical activity?',
                options: ['0 days', '1-2 days', '3-4 days', '5+ days'],
            },
            {
                key: 'activity_level',
                text: 'How would you describe your typical activity level?',
                options: ['Sedentary', 'Light', 'Moderate', 'Active'],
            },
        ],
    },
    {
        key: 'sleep',
        label: 'Sleep',
        questions: [
            {
                key: 'sleep_hours',
                text: 'On average, how many hours do you sleep per night?',
                options: ['Less than 5', '5-6 hours', '7-8 hours', '8+ hours'],
            },
            {
                key: 'sleep_quality',
                text: 'How would you rate your sleep quality?',
                options: ['Poor', 'Fair', 'Good', 'Excellent'],
            },
        ],
    },
    {
        key: 'nutrition',
        label: 'Nutrition',
        questions: [
            {
                key: 'nutrition_produce',
                text: 'How many servings of fruits or vegetables do you eat daily?',
                options: ['0-1', '2-3', '4+'],
            },
            {
                key: 'nutrition_processed',
                text: 'How often do you eat processed or fast food?',
                options: ['Daily', 'A few times a week', 'Rarely', 'Never'],
            },
        ],
    },
    {
        key: 'stress',
        label: 'Stress & Wellbeing',
        questions: [
            {
                key: 'stress_level',
                text: 'How would you rate your typical stress level?',
                options: ['Very high', 'High', 'Moderate', 'Low'],
            },
            {
                key: 'stress_relief',
                text: 'Do you regularly practice any relaxation or stress-relief activity?',
                options: ['Never', 'Rarely', 'Sometimes', 'Regularly'],
            },
        ],
    },
    {
        key: 'lifestyle',
        label: 'Lifestyle Habits',
        questions: [
            {
                key: 'lifestyle_smoking',
                text: 'Do you currently smoke?',
                options: ['Regularly', 'Occasionally', 'No'],
            },
            {
                key: 'lifestyle_alcohol',
                text: 'How often do you consume alcohol?',
                options: ['Daily', 'Weekly', 'Occasionally', 'Never'],
            },
        ],
    },
];
