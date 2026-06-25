import React, { useState } from 'react';
import styles from './OCRDebug.module.css';

interface OCRDebugData {
  rawText: string;
  easyocrText: string;
  tesseractText: string;
  selectedEngine: string;
  confidence: number;
  easyocrConfidence: number;
  tesseractConfidence: number;
  rejectedLines: string[];
  acceptedLines: Array<{ text: string; reason?: string }>;
  finalItems: Array<{ name: string; price: number }>;
  errorMessage?: string;
}

const OCRDebug: React.FC<{ data?: OCRDebugData }> = ({ data }) => {
  const [expandedSection, setExpandedSection] = useState<string>('engine-comparison');
  const [selectedEngine, setSelectedEngine] = useState<'easyocr' | 'tesseract'>('easyocr');

  if (!data) {
    return (
      <div className={styles.container}>
        <div className={styles.placeholder}>
          <h2>No OCR Data Available</h2>
          <p>Upload an image and run OCR to see debug information</p>
        </div>
      </div>
    );
  }

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? '' : section);
  };

  const renderEngineComparison = () => (
    <div className={styles.comparison}>
      <div className={styles.engineCard}>
        <h4>EasyOCR</h4>
        <div className={styles.confidenceBar}>
          <div
            className={styles.confidenceFill}
            style={{
              width: `${Math.min(data.easyocrConfidence * 100, 100)}%`,
              backgroundColor: data.easyocrConfidence > 0.7 ? '#10b981' : data.easyocrConfidence > 0.4 ? '#f59e0b' : '#ef4444'
            }}
          />
        </div>
        <p className={styles.confidenceText}>
          Confidence: {(data.easyocrConfidence * 100).toFixed(1)}%
        </p>
        <div className={styles.ocrText}>{data.easyocrText || '(No text detected)'}</div>
      </div>

      <div className={styles.engineCard}>
        <h4>Tesseract</h4>
        <div className={styles.confidenceBar}>
          <div
            className={styles.confidenceFill}
            style={{
              width: `${Math.min(data.tesseractConfidence * 100, 100)}%`,
              backgroundColor: data.tesseractConfidence > 0.7 ? '#10b981' : data.tesseractConfidence > 0.4 ? '#f59e0b' : '#ef4444'
            }}
          />
        </div>
        <p className={styles.confidenceText}>
          Confidence: {(data.tesseractConfidence * 100).toFixed(1)}%
        </p>
        <div className={styles.ocrText}>{data.tesseractText || '(No text detected)'}</div>
      </div>
    </div>
  );

  const renderRawOCROutput = () => (
    <div className={styles.rawOutput}>
      <h4>Raw OCR Text (Selected Engine: {data.selectedEngine})</h4>
      <div className={styles.codeBlock}>
        {data.rawText || '(Empty)'}
      </div>
      <p className={styles.hint}>
        This is the exact text extracted by the OCR engine before parsing.
      </p>
    </div>
  );

  const renderLineAnalysis = () => (
    <div className={styles.lineAnalysis}>
      <div className={styles.lineGroup}>
        <h4>✅ Accepted Lines ({data.acceptedLines.length})</h4>
        <div className={styles.lineList}>
          {data.acceptedLines.length > 0 ? (
            data.acceptedLines.map((line, idx) => (
              <div key={idx} className={styles.lineItem + ' ' + styles.accepted}>
                <span className={styles.lineText}>{line.text}</span>
                {line.reason && <span className={styles.reason}>{line.reason}</span>}
              </div>
            ))
          ) : (
            <p className={styles.noItems}>No lines accepted</p>
          )}
        </div>
      </div>

      <div className={styles.lineGroup}>
        <h4>❌ Rejected Lines ({data.rejectedLines.length})</h4>
        <div className={styles.lineList}>
          {data.rejectedLines.length > 0 ? (
            data.rejectedLines.map((line, idx) => (
              <div key={idx} className={styles.lineItem + ' ' + styles.rejected}>
                <span className={styles.lineText}>{line}</span>
              </div>
            ))
          ) : (
            <p className={styles.noItems}>No lines rejected</p>
          )}
        </div>
      </div>
    </div>
  );

  const renderFinalItems = () => (
    <div className={styles.finalItems}>
      <h4>Final Parsed Menu Items ({data.finalItems.length})</h4>
      {data.finalItems.length > 0 ? (
        <div className={styles.itemsTable}>
          <table>
            <thead>
              <tr>
                <th>Item Name</th>
                <th>Price</th>
              </tr>
            </thead>
            <tbody>
              {data.finalItems.map((item, idx) => (
                <tr key={idx}>
                  <td>{item.name}</td>
                  <td>₹{item.price}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className={styles.noItems}>
          {data.errorMessage || 'No menu items detected'}
        </p>
      )}
    </div>
  );

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>OCR Debug Dashboard</h2>
        <div className={styles.indicator}>
          <span
            className={styles.statusDot}
            style={{
              backgroundColor:
                data.finalItems.length > 0
                  ? '#10b981'
                  : data.errorMessage
                  ? '#ef4444'
                  : '#f59e0b'
            }}
          />
          <span>
            {data.finalItems.length > 0
              ? `${data.finalItems.length} items extracted`
              : data.errorMessage
              ? 'Extraction failed'
              : 'Processing...'}
          </span>
        </div>
      </div>

      <div className={styles.sections}>
        <div className={styles.section}>
          <div
            className={styles.sectionHeader}
            onClick={() => toggleSection('engine-comparison')}
          >
            <h3>🔍 Engine Comparison</h3>
            <span className={styles.toggle}>
              {expandedSection === 'engine-comparison' ? '▼' : '▶'}
            </span>
          </div>
          {expandedSection === 'engine-comparison' && renderEngineComparison()}
        </div>

        <div className={styles.section}>
          <div
            className={styles.sectionHeader}
            onClick={() => toggleSection('raw-output')}
          >
            <h3>📄 Raw OCR Output</h3>
            <span className={styles.toggle}>
              {expandedSection === 'raw-output' ? '▼' : '▶'}
            </span>
          </div>
          {expandedSection === 'raw-output' && renderRawOCROutput()}
        </div>

        <div className={styles.section}>
          <div
            className={styles.sectionHeader}
            onClick={() => toggleSection('line-analysis')}
          >
            <h3>📋 Line Analysis</h3>
            <span className={styles.toggle}>
              {expandedSection === 'line-analysis' ? '▼' : '▶'}
            </span>
          </div>
          {expandedSection === 'line-analysis' && renderLineAnalysis()}
        </div>

        <div className={styles.section}>
          <div
            className={styles.sectionHeader}
            onClick={() => toggleSection('final-items')}
          >
            <h3>✨ Final Parsed Items</h3>
            <span className={styles.toggle}>
              {expandedSection === 'final-items' ? '▼' : '▶'}
            </span>
          </div>
          {expandedSection === 'final-items' && renderFinalItems()}
        </div>
      </div>

      {data.errorMessage && (
        <div className={styles.errorBox}>
          <h4>⚠️ Error Message</h4>
          <p>{data.errorMessage}</p>
        </div>
      )}
    </div>
  );
};

export default OCRDebug;
