import { StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../styles';

interface Props {
  taken: number;
  total: number;
  percentage: number;
}

export default function ProgressCard({ taken, total, percentage }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.contentContainer}>
        {/* Header Text */}
        <View style={styles.textRow}>
          <Text style={styles.title}>Today's progress</Text>
          <Text style={styles.percentageText}>{percentage}%</Text>
        </View>

        {/* Linear Progress Bar */}
        <View style={styles.progressBarBackground}>
          <View style={[styles.progressBarFill, { width: `${percentage}%` }]} />
        </View>

        {/* Subtitle */}
        <View style={styles.subtitleRow}>
          <Text style={styles.subtitle}>
            {taken} of {total} medications taken
          </Text>
          {/* Optional: Add "See details" if needed, or remove to keep clean */}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 24,
    borderRadius: 20,
    padding: 16,
    // Soft shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 24, // Spacing from next section
  },
  contentContainer: {
    flexDirection: 'column',
  },
  textRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  percentageText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: '#F0F2F5', // Light gray track
    borderRadius: 4,
    width: '100%',
    marginBottom: 12,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 4,
  },
  subtitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
});