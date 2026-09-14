import type { CropAssessment, Field } from '@/types';

export function generateCropReportPDF(assessment: CropAssessment, field: Field | null) {
  const reportDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const assessmentDate = new Date(assessment.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Neraya Crop Intelligence Report</title>
<style>
  @page { margin: 2cm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Georgia', 'Times New Roman', serif; color: #1a2e20; line-height: 1.6; }
  .header { text-align: center; padding-bottom: 20px; border-bottom: 2px solid #2d4a32; margin-bottom: 30px; }
  .header h1 { font-size: 28px; font-weight: 600; letter-spacing: 2px; color: #2d4a32; }
  .header .subtitle { font-size: 13px; color: #6b8a72; margin-top: 4px; letter-spacing: 1px; text-transform: uppercase; }
  .meta { display: flex; justify-content: space-between; font-size: 12px; color: #6b8a72; margin-bottom: 30px; }
  .section { margin-bottom: 24px; }
  .section-title { font-size: 14px; font-weight: 600; color: #2d4a32; text-transform: uppercase; letter-spacing: 1px; padding-bottom: 6px; border-bottom: 1px solid #d4e4d6; margin-bottom: 12px; }
  .field-info { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 24px; font-size: 13px; }
  .field-info .label { font-weight: 600; color: #4a6a52; }
  .field-info .value { color: #1a2e20; }
  .crop-image { max-width: 300px; max-height: 250px; border-radius: 8px; border: 1px solid #d4e4d6; }
  .assessment-summary { background: #f5f9f3; border-radius: 8px; padding: 16px; margin-bottom: 8px; }
  .assessment-summary .row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 13px; }
  .assessment-summary .label { font-weight: 600; color: #4a6a52; }
  .badge { display: inline-block; padding: 2px 10px; border-radius: 12px; font-size: 11px; font-weight: 600; }
  .badge-high { background: #fde8e8; color: #c45a4a; }
  .badge-moderate { background: #fef3e0; color: #c99846; }
  .badge-low { background: #e8f5ec; color: #4d7c5e; }
  .list { list-style: none; padding-left: 0; }
  .list li { padding: 4px 0 4px 16px; position: relative; font-size: 13px; }
  .list li::before { content: ''; position: absolute; left: 0; top: 10px; width: 5px; height: 5px; border-radius: 50%; background: #4d7c5e; }
  .recommendation { background: #f5f9f3; border-radius: 8px; padding: 12px 16px; margin-bottom: 8px; }
  .recommendation .title { font-weight: 600; font-size: 13px; color: #2d4a32; margin-bottom: 4px; }
  .recommendation .why { font-size: 12px; color: #4a6a52; }
  .disclaimer { margin-top: 30px; padding: 16px; background: #f9f6f0; border-radius: 8px; border: 1px solid #e8e0d0; font-size: 11px; color: #6b6555; line-height: 1.5; }
  .page-break { page-break-before: always; }
  .footer { margin-top: 20px; text-align: center; font-size: 10px; color: #9ca89e; }
</style>
</head>
<body>

<div class="header">
  <h1>NERAYA</h1>
  <div class="subtitle">Crop Intelligence Report</div>
</div>

<div class="meta">
  <span>Report date: ${reportDate}</span>
  <span>Assessment date: ${assessmentDate}</span>
</div>

<div class="section">
  <div class="section-title">Field Information</div>
  <div class="field-info">
    <div><span class="label">Field:</span> <span class="value">${field?.name ?? 'Not specified'}</span></div>
    <div><span class="label">Crop:</span> <span class="value">${field?.crop_type ?? 'Not specified'}${field?.crop_variety ? ` (${field.crop_variety})` : ''}</span></div>
    <div><span class="label">Location:</span> <span class="value">${field?.location_text ?? 'Not specified'}</span></div>
    <div><span class="label">Field size:</span> <span class="value">${field?.area_size ?? 'Not specified'}</span></div>
    <div><span class="label">Planting date:</span> <span class="value">${field?.planting_date ? new Date(field.planting_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Not specified'}</span></div>
    <div><span class="label">Growth stage:</span> <span class="value">${field?.growth_stage ?? 'Not specified'}</span></div>
  </div>
</div>

${assessment.image_url ? `
<div class="section">
  <div class="section-title">Crop Image</div>
  <img src="${assessment.image_url}" class="crop-image" alt="Crop image" />
</div>
` : ''}

<div class="section">
  <div class="section-title">Assessment Summary</div>
  <div class="assessment-summary">
    <div class="row"><span class="label">Possible issue</span><span>${assessment.possible_issue ?? 'Unable to determine'}</span></div>
    <div class="row"><span class="label">Confidence</span><span>${assessment.assessment_confidence ?? 'Unknown'}</span></div>
    <div class="row"><span class="label">Severity</span><span>${assessment.severity ? `<span class="badge badge-${assessment.severity.toLowerCase()}">${assessment.severity}</span>` : 'Not assessed'}</span></div>
  </div>
</div>

${assessment.assessment_explanation ? `
<div class="section">
  <div class="section-title">What the Assessment Means</div>
  <p style="font-size: 13px; line-height: 1.6;">${assessment.assessment_explanation}</p>
</div>
` : ''}

${assessment.observed_indicators.length > 0 ? `
<div class="section">
  <div class="section-title">Observed Indicators</div>
  <ul class="list">
    ${assessment.observed_indicators.map(i => `<li>${i}</li>`).join('')}
  </ul>
</div>
` : ''}

${assessment.context_factors.length > 0 ? `
<div class="section">
  <div class="section-title">Context</div>
  <ul class="list">
    ${assessment.context_factors.map(i => `<li>${i}</li>`).join('')}
  </ul>
</div>
` : ''}

${assessment.evidence_used.length > 0 ? `
<div class="section">
  <div class="section-title">Evidence Used</div>
  <ul class="list">
    ${assessment.evidence_used.map(i => `<li>${i}</li>`).join('')}
  </ul>
</div>
` : ''}

${assessment.missing_evidence.length > 0 ? `
<div class="section">
  <div class="section-title">Missing Evidence</div>
  <ul class="list">
    ${assessment.missing_evidence.map(i => `<li>${i}</li>`).join('')}
  </ul>
</div>
` : ''}

${assessment.what_to_check.length > 0 ? `
<div class="section">
  <div class="section-title">What to Check Next</div>
  <ul class="list">
    ${assessment.what_to_check.map(i => `<li>${i}</li>`).join('')}
  </ul>
</div>
` : ''}

${assessment.environmental_considerations ? `
<div class="section">
  <div class="section-title">Environmental Considerations</div>
  <p style="font-size: 13px; line-height: 1.6;">${assessment.environmental_considerations}</p>
</div>
` : ''}

${assessment.recommendations.length > 0 ? `
<div class="section">
  <div class="section-title">What You Can Consider</div>
  ${assessment.recommendations.map(r => `
    <div class="recommendation">
      <div class="title">${r.option}</div>
      <div class="why">${r.why}</div>
      ${r.what_to_check && r.what_to_check.length > 0 ? `<div style="font-size: 12px; color: #4a6a52; margin-top: 4px;">Check: ${r.what_to_check.join(', ')}</div>` : ''}
      ${r.conditions_to_consider && r.conditions_to_consider.length > 0 ? `<div style="font-size: 12px; color: #4a6a52; margin-top: 2px;">Conditions: ${r.conditions_to_consider.join(', ')}</div>` : ''}
    </div>
  `).join('')}
</div>
` : ''}

${assessment.escalation_guidance ? `
<div class="section">
  <div class="section-title">When to Seek Expert Help</div>
  <p style="font-size: 13px; line-height: 1.6;">${assessment.escalation_guidance}</p>
</div>
` : ''}

${assessment.symptoms_description || assessment.observations ? `
<div class="section">
  <div class="section-title">Farmer Observations</div>
  ${assessment.symptoms_description ? `<p style="font-size: 13px; margin-bottom: 8px;"><strong>Symptoms:</strong> ${assessment.symptoms_description}</p>` : ''}
  ${assessment.observations ? `<p style="font-size: 13px;"><strong>Additional notes:</strong> ${assessment.observations}</p>` : ''}
</div>
` : ''}

<div class="disclaimer">
  This report contains an AI assisted agricultural assessment based on the information and image available at the time of analysis. It is not a confirmed diagnosis. Field conditions should be verified through direct observation and, where appropriate, local agricultural expertise.
</div>

<div class="footer">
  Generated by Neraya, Agricultural Intelligence for the Farmer
</div>

</body>
</html>
  `.trim();

  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const printWindow = window.open(url, '_blank');
  if (printWindow) {
    printWindow.onload = () => {
      printWindow.print();
    };
  }
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}
