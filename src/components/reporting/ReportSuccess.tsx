import React from 'react';
import { Text, View } from 'react-native';
import { styles } from '../UI';
import { SuccessConfirmation } from '../SuccessConfirmation';
import { FormAction, FormPage, formCard } from './ReportFormUI';

export function ReportSuccess({ title, summary, reference, onBack, onViewStatus }: {
  title: string; summary: string; reference?: string; onBack: () => void; onViewStatus: () => void;
}) {
  return (
    <FormPage edges={['top']} footer={<>
      <FormAction label="View status" onPress={onViewStatus} />
      <FormAction label="Back to report options" secondary onPress={onBack} />
    </>}>
      <SuccessConfirmation title={title} message="Your submission is ready. View its details and progress in Status." />
      <View style={formCard}>
        <Text style={styles.section}>Submission summary</Text>
        {!!reference && <Text selectable style={styles.small}>Reference: {reference}</Text>}
        <Text style={styles.subtitle}>{summary}</Text>
        <Text style={styles.small}>You can find this submission in your status list.</Text>
      </View>
    </FormPage>
  );
}
