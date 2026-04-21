import type { Severity, Recommendation } from '../api/types';

export const severityConfig = {
  high: {
    bg: 'bg-danger-light',
    text: 'text-danger',
    border: 'border-danger/20',
    dot: 'bg-danger',
    label: 'High Risk',
  },
  medium: {
    bg: 'bg-warning-light',
    text: 'text-warning',
    border: 'border-warning/20',
    dot: 'bg-warning',
    label: 'Medium Risk',
  },
  low: {
    bg: 'bg-surface-2',
    text: 'text-secondary',
    border: 'border-border',
    dot: 'bg-muted',
    label: 'Low Risk',
  },
};

export const recommendationConfig: Record<Recommendation, {
  label: string;
  bg: string;
  text: string;
  border: string;
  icon: string;
}> = {
  approve: {
    label: 'Approve',
    bg: 'bg-success-light',
    text: 'text-success',
    border: 'border-success/20',
    icon: '✓',
  },
  needs_verification: {
    label: 'Needs Verification',
    bg: 'bg-warning-light',
    text: 'text-warning',
    border: 'border-warning/20',
    icon: '!',
  },
  reject: {
    label: 'Reject',
    bg: 'bg-danger-light',
    text: 'text-danger',
    border: 'border-danger/20',
    icon: '✕',
  },
};

export const getSeverityConfig = (severity: Severity) => severityConfig[severity];