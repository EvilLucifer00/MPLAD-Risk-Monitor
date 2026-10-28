import rawData from './constituencyRiskData.json';

export const riskData = rawData;

// Pre-indexed Map for high-performance O(1) lookups
export const riskDataMap = new Map(rawData.map(item => [item.pc_id, item]));

export const getRiskLevel = (score) => {
  if (score === null || score === undefined) return 'No Data';
  if (score < 20) return 'VERY LOW';
  if (score < 40) return 'LOW';
  if (score < 60) return 'MODERATE';
  if (score < 80) return 'HIGH';
  return 'CRITICAL';
};

export const getRiskColor = (score) => {
  if (score === null || score === undefined) return '#9CA3AF'; // Gray - No Data
  if (score < 20) return '#22C55E'; // Green - Very Low
  if (score < 40) return '#86EFAC'; // Light Green - Low
  if (score < 60) return '#FACC15'; // Yellow - Moderate
  if (score < 80) return '#F97316'; // Orange - High
  return '#EF4444'; // Red - Critical
};

export const getConstituencyData = (constituencyId) => {
  return riskDataMap.get(constituencyId) || null;
};

export const getRiskScore = (constituencyId) => {
  const data = getConstituencyData(constituencyId);
  return data ? data.risk_score : null;
};
