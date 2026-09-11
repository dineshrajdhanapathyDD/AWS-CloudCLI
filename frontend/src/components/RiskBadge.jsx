import React from 'react';

const CLASS_MAP = {
  'LOW / READ ONLY': 'risk risk-low',
  MEDIUM: 'risk risk-medium',
  HIGH: 'risk risk-high',
  BLOCKED: 'risk risk-blocked',
};

export default function RiskBadge({ risk }) {
  if (!risk) return null;
  const cls = CLASS_MAP[risk] || 'risk risk-medium';
  return <span className={cls} title={`Risk level: ${risk}`}>{risk}</span>;
}
