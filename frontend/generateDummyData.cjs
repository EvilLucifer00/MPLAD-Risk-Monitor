const fs = require('fs');

const geojsonPath = 'c:/VS CODE/WEB DEV/SIH/public/data/india_constituencies.geojson';
const targetPath = 'c:/VS CODE/WEB DEV/SIH/src/data/riskData.js';

try {
  const geojson = JSON.parse(fs.readFileSync(geojsonPath, 'utf8'));
  
  const dummyData = geojson.features.map(feature => {
    const props = feature.properties;
    const risk_score = Math.floor(Math.random() * 101); // 0-100
    return {
      pc_id: props.pc_id || props.PC_ID || (props.pc_name || 'unknown').toUpperCase().substring(0,4) + '-' + Math.floor(Math.random()*100),
      constituency: props.pc_name || props.PC_NAME || 'Unknown',
      state: props.st_name || props.ST_NAME || 'Unknown State',
      risk_score: risk_score,
      projects: Math.floor(Math.random() * 500) + 10,
      anomalies: Math.floor(Math.random() * 50),
      delayed_projects: Math.floor(Math.random() * 100),
      financial_risk: Math.floor(Math.random() * 101),
      execution_risk: Math.floor(Math.random() * 101),
      vendor_risk: Math.floor(Math.random() * 101),
      geographic_risk: Math.floor(Math.random() * 101),
      timeline_risk: Math.floor(Math.random() * 101)
    };
  });

  const fileContent = `export const riskData = ${JSON.stringify(dummyData, null, 2)};

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

// Create an efficient lookup map
export const riskDataMap = new Map(riskData.map(item => [item.pc_id, item]));

export const getConstituencyData = (constituencyId) => {
  return riskDataMap.get(constituencyId) || null;
};

export const getRiskScore = (constituencyId) => {
  const data = getConstituencyData(constituencyId);
  return data ? data.risk_score : null;
};
`;

  fs.writeFileSync(targetPath, fileContent, 'utf8');
  console.log('Successfully generated riskData.js');
} catch (e) {
  console.error('Error generating data:', e);
}
