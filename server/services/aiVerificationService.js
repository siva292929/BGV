const { extractText, extractDataFromText } = require('./ocrService');
const { REVIEW } = require('../constants');

// AI Verdict constants
const AI_VERDICT = {
    PENDING: 0,
    AUTO_VERIFIED: 1,
    NEEDS_REVIEW: 2,
    FLAGGED: 3
};

const AI_VERDICT_LABELS = {
    [AI_VERDICT.PENDING]: 'Pending',
    [AI_VERDICT.AUTO_VERIFIED]: 'Auto-Verified',
    [AI_VERDICT.NEEDS_REVIEW]: 'Needs Review',
    [AI_VERDICT.FLAGGED]: 'Flagged'
};

// Confidence thresholds
const THRESHOLDS = {
    AUTO_VERIFY: 85,
    NEEDS_REVIEW: 50
};

// ─── COMPARISON HELPERS ────────────────────────────────────────────────────────

const normalize = (str) => {
    if (!str) return '';
    return str.toString().toLowerCase().replace(/[\s\-\/\.]/g, '').trim();
};

const compareValues = (extracted, expected) => {
    if (!extracted || !expected) return 0;
    const a = normalize(extracted);
    const b = normalize(expected);
    if (!a || !b) return 0;
    if (a === b) return 100;
    if (a.includes(b) || b.includes(a)) return 80;
    if (a.length < 20 && b.length < 20) {
        const maxLen = Math.max(a.length, b.length);
        let matches = 0;
        for (let i = 0; i < Math.min(a.length, b.length); i++) {
            if (a[i] === b[i]) matches++;
        }
        return Math.round((matches / maxLen) * 100);
    }
    return 0;
};

// ─── DOCUMENT-SPECIFIC VERIFICATION (against HR reference data) ────────────

/**
 * Verify Aadhaar document against HR-provided reference
 */
const verifyAadhaar = (extractedData, hrData) => {
    let confidence = 0;
    const details = [];

    if (extractedData.aadhaarNumber && hrData?.aadharNumber) {
        const score = compareValues(extractedData.aadhaarNumber, hrData.aadharNumber);
        confidence = score;
        if (score === 100) {
            details.push(`✅ Aadhaar number matches HR reference`);
        } else if (score > 0) {
            details.push(`⚠️ Aadhaar partially matches (${score}%): Extracted "${extractedData.aadhaarNumber}" vs HR "${hrData.aadharNumber}"`);
        } else {
            details.push(`❌ Aadhaar mismatch: Extracted "${extractedData.aadhaarNumber}" vs HR "${hrData.aadharNumber}"`);
        }
    } else if (extractedData.aadhaarNumber) {
        confidence = 40;
        details.push(`⚠️ Aadhaar extracted: ${extractedData.aadhaarNumber} (HR did not provide reference)`);
    } else if (hrData?.aadharNumber) {
        confidence = 20;
        details.push(`❌ Could not extract Aadhaar number from document (HR ref: ${hrData.aadharNumber})`);
    } else {
        confidence = 30;
        details.push(`ℹ️ No Aadhaar reference provided by HR`);
    }

    return { confidence, details: details.join('\n') };
};

/**
 * Verify PAN document against HR-provided reference
 */
const verifyPan = (extractedData, hrData) => {
    let confidence = 0;
    const details = [];

    if (extractedData.panNumber && hrData?.panNumber) {
        const score = compareValues(extractedData.panNumber, hrData.panNumber);
        confidence = score;
        if (score === 100) {
            details.push(`✅ PAN number matches HR reference`);
        } else if (score >= 80) {
            details.push(`⚠️ PAN partially matches (${score}%): Extracted "${extractedData.panNumber}" vs HR "${hrData.panNumber}"`);
        } else {
            details.push(`❌ PAN mismatch: Extracted "${extractedData.panNumber}" vs HR "${hrData.panNumber}"`);
        }
    } else if (extractedData.panNumber) {
        confidence = 40;
        details.push(`⚠️ PAN extracted: ${extractedData.panNumber} (HR did not provide reference)`);
    } else if (hrData?.panNumber) {
        confidence = 20;
        details.push(`❌ Could not extract PAN from document (HR ref: ${hrData.panNumber})`);
    } else {
        confidence = 30;
        details.push(`ℹ️ No PAN reference provided by HR`);
    }

    return { confidence, details: details.join('\n') };
};

/**
 * Verify academic document against HR-provided reference
 */
const verifyAcademic = (extractedData, hrData, docType) => {
    let confidence = 0;
    const details = [];
    let totalChecks = 0;
    let passedChecks = 0;

    const fieldMap = {
        tenth: 'tenthPercentage',
        twelfth: 'twelfthPercentage',
        degree: 'degreeGPA'
    };
    const hrField = fieldMap[docType];
    const hrValue = hrData?.[hrField];
    const extractedValue = extractedData.percentage || extractedData.gpa;

    if (extractedValue && hrValue) {
        totalChecks++;
        const score = compareValues(extractedValue, hrValue);
        if (score >= 80) {
            passedChecks++;
            details.push(`✅ ${docType === 'degree' ? 'GPA' : 'Percentage'} matches HR ref: ${extractedValue} ≈ ${hrValue}`);
        } else {
            details.push(`⚠️ ${docType === 'degree' ? 'GPA' : 'Percentage'} differs: Extracted "${extractedValue}" vs HR "${hrValue}"`);
        }
    } else if (extractedValue) {
        totalChecks++;
        passedChecks += 0.5;
        details.push(`ℹ️ Extracted ${docType === 'degree' ? 'GPA' : 'percentage'}: ${extractedValue} (HR did not provide reference)`);
    } else {
        details.push(`⚠️ Could not extract percentage/GPA from document`);
    }

    // University check (if HR provided degreeUniversity)
    if (extractedData.university && hrData?.degreeUniversity && docType === 'degree') {
        totalChecks++;
        const score = compareValues(extractedData.university, hrData.degreeUniversity);
        if (score >= 60) {
            passedChecks++;
            details.push(`✅ University matches: "${extractedData.university}" ≈ "${hrData.degreeUniversity}"`);
        } else {
            details.push(`⚠️ University differs: Extracted "${extractedData.university}" vs HR "${hrData.degreeUniversity}"`);
        }
    } else if (extractedData.university || extractedData.board) {
        totalChecks++;
        passedChecks++;
        details.push(`✅ ${extractedData.university ? 'University' : 'Board'}: ${extractedData.university || extractedData.board}`);
    }

    if (totalChecks > 0) {
        confidence = Math.round((passedChecks / totalChecks) * 100);
    } else {
        confidence = 25;
    }

    return { confidence, details: details.join('\n') };
};

/**
 * Verify experience documents against HR-provided reference
 */
const verifyExperience = (extractedData, hrData) => {
    let confidence = 0;
    const details = [];
    let totalChecks = 0;
    let passedChecks = 0;

    if (extractedData.company && hrData?.previousCompany) {
        totalChecks++;
        const score = compareValues(extractedData.company, hrData.previousCompany);
        if (score >= 60) {
            passedChecks++;
            details.push(`✅ Company matches HR ref: "${extractedData.company}" ≈ "${hrData.previousCompany}"`);
        } else {
            details.push(`⚠️ Company differs: Extracted "${extractedData.company}" vs HR "${hrData.previousCompany}"`);
        }
    } else if (extractedData.company) {
        totalChecks++;
        passedChecks += 0.5;
        details.push(`ℹ️ Company extracted: ${extractedData.company} (HR did not provide reference)`);
    }

    if (extractedData.designation && hrData?.previousDesignation) {
        totalChecks++;
        const score = compareValues(extractedData.designation, hrData.previousDesignation);
        if (score >= 60) {
            passedChecks++;
            details.push(`✅ Designation matches HR ref: "${extractedData.designation}" ≈ "${hrData.previousDesignation}"`);
        } else {
            details.push(`⚠️ Designation differs: Extracted "${extractedData.designation}" vs HR "${hrData.previousDesignation}"`);
        }
    }

    if (extractedData.salary && hrData?.ctc) {
        totalChecks++;
        const score = compareValues(extractedData.salary, hrData.ctc);
        if (score >= 80) {
            passedChecks++;
            details.push(`✅ Salary/CTC matches HR ref`);
        } else {
            details.push(`⚠️ Salary differs: Extracted "${extractedData.salary}" vs HR "${hrData.ctc}"`);
        }
    }

    if (totalChecks > 0) {
        confidence = Math.round((passedChecks / totalChecks) * 100);
    } else {
        confidence = 30;
        details.push(`ℹ️ Limited data extracted for comparison`);
    }

    return { confidence, details: details.join('\n') };
};

/**
 * Verify generic documents (address proof, bank statement, signature)
 */
const verifyGeneric = (extractedData, text) => {
    let confidence = 30;
    const details = [];

    const wordCount = text ? text.split(/\s+/).length : 0;
    if (wordCount > 20) {
        confidence += 20;
        details.push(`✅ Document contains readable text (${wordCount} words)`);
    } else if (wordCount > 5) {
        confidence += 10;
        details.push(`⚠️ Limited text extracted (${wordCount} words)`);
    } else {
        details.push(`❌ Very little text could be extracted`);
    }

    if (extractedData.name) { confidence += 15; details.push(`✅ Name found: ${extractedData.name}`); }
    if (extractedData.address) { confidence += 10; details.push(`✅ Address found`); }
    if (extractedData.accountNumber) { confidence += 10; details.push(`✅ Account number found`); }

    return { confidence: Math.min(confidence, 100), details: details.join('\n') };
};

// ─── MAIN VERIFICATION PIPELINE ────────────────────────────────────────────────

/**
 * Run AI verification on a single document
 * @param {string} docType - Document type key
 * @param {string} docUrl - Cloudinary URL
 * @param {Object} hrData - HR-provided reference data (from BGVRequest.hrData)
 */
const verifyDocument = async (docType, docUrl, hrData) => {
    const result = {
        extractedText: '',
        extractedData: {},
        confidence: 0,
        verdict: AI_VERDICT.PENDING,
        matchDetails: '',
        processedAt: new Date()
    };

    try {
        if (docType === 'signature') {
            result.confidence = docUrl ? 70 : 0;
            result.matchDetails = docUrl ? '✅ Signature document uploaded' : '❌ No signature uploaded';
            result.verdict = docUrl ? AI_VERDICT.NEEDS_REVIEW : AI_VERDICT.FLAGGED;
            return result;
        }

        console.log(`   🔍 OCR: Processing ${docType}...`);
        const text = await extractText(docUrl);
        result.extractedText = text.substring(0, 2000);

        const extracted = extractDataFromText(text, docType);
        result.extractedData = extracted;

        // Compare against HR reference data
        let verification;
        switch (docType) {
            case 'aadhar':
                verification = verifyAadhaar(extracted, hrData);
                break;
            case 'pan':
                verification = verifyPan(extracted, hrData);
                break;
            case 'degree':
            case 'twelfth':
            case 'tenth':
                verification = verifyAcademic(extracted, hrData, docType);
                break;
            case 'experience':
            case 'releasingLetter':
            case 'payslip':
                verification = verifyExperience(extracted, hrData);
                break;
            default:
                verification = verifyGeneric(extracted, text);
        }

        result.confidence = verification.confidence;
        result.matchDetails = verification.details;

        if (result.confidence >= THRESHOLDS.AUTO_VERIFY) {
            result.verdict = AI_VERDICT.AUTO_VERIFIED;
        } else if (result.confidence >= THRESHOLDS.NEEDS_REVIEW) {
            result.verdict = AI_VERDICT.NEEDS_REVIEW;
        } else {
            result.verdict = AI_VERDICT.FLAGGED;
        }

        console.log(`   📊 ${docType}: Confidence ${result.confidence}%, Verdict: ${AI_VERDICT_LABELS[result.verdict]}`);

    } catch (err) {
        console.error(`   ❌ AI verification failed for ${docType}:`, err.message);
        result.matchDetails = `AI processing error: ${err.message}`;
        result.verdict = AI_VERDICT.NEEDS_REVIEW;
        result.confidence = 0;
    }

    return result;
};

/**
 * Run AI verification on ALL documents for a BGV request
 * @param {Object} docPaths - { aadhar: 'url', pan: 'url', ... }
 * @param {Object} hrData - HR-provided reference data (from BGVRequest.hrData)
 */
const verifyAllDocuments = async (docPaths, hrData) => {
    console.log('🤖 AI Verification started (comparing against HR reference data)...');

    if (!hrData || Object.keys(hrData).length === 0) {
        console.log('⚠️ No HR reference data available — AI will do basic document analysis only');
    }

    const aiResults = {};
    const docTypes = Object.keys(docPaths).filter(k => docPaths[k]);

    // Process documents in parallel (max 3 concurrently)
    const chunks = [];
    for (let i = 0; i < docTypes.length; i += 3) {
        chunks.push(docTypes.slice(i, i + 3));
    }

    for (const chunk of chunks) {
        const results = await Promise.all(
            chunk.map(docType => verifyDocument(docType, docPaths[docType], hrData))
        );
        chunk.forEach((docType, idx) => {
            aiResults[docType] = results[idx];
        });
    }

    const verifiedCount = Object.values(aiResults).filter(r => r.verdict === AI_VERDICT.AUTO_VERIFIED).length;
    const flaggedCount = Object.values(aiResults).filter(r => r.verdict === AI_VERDICT.FLAGGED).length;
    console.log(`🤖 AI Verification complete: ${verifiedCount} auto-verified, ${flaggedCount} flagged, ${docTypes.length - verifiedCount - flaggedCount} need review`);

    return aiResults;
};

/**
 * Generate a concise executive summary based on BGVRequest results
 * Categorized by verification source: Autofetch, AI, and Manual
 */
const generateExecutiveSummary = (bgvRequest) => {
    if (!bgvRequest || !bgvRequest.reviews) {
        return "No documents submitted for verification yet.";
    }

    const reviews = Object.entries(bgvRequest.reviews).filter(([_, r]) => r.status !== 0); // Filter out PENDING
    if (reviews.length === 0) return "Verification is in progress.";

    const verified = reviews.filter(([_, r]) => r.status === 1); // REVIEW.VERIFIED
    const flagged = reviews.filter(([_, r]) => r.status === 2);  // REVIEW.REJECTED (or FLAGGED in AI context)

    // Group verified types by source
    const bySource = {
        'Official Database (Autofetch)': [],
        'AI (OCR Match)': [],
        'Manual Audit': []
    };

    verified.forEach(([type, r]) => {
        const source = r.verifiedBy || 'Manual Audit';
        if (bySource[source]) {
            bySource[source].push(type);
        } else {
            bySource['Manual Audit'].push(type);
        }
    });

    let summary = "";

    // 1. Successes by source
    const sourcesWithDocs = Object.entries(bySource).filter(([_, docs]) => docs.length > 0);
    if (sourcesWithDocs.length > 0) {
        summary += "VERIFIED: " + sourcesWithDocs.map(([source, docs]) => `${docs.join(', ')} via ${source}`).join("; ") + ". ";
    }

    // 2. Critical Flags
    const aiVerification = bgvRequest.aiVerification || new Map();
    const getAiResult = (type) => aiVerification instanceof Map ? aiVerification.get(type) : aiVerification[type];

    const aiFlags = Object.keys(bgvRequest.reviews).filter(type => getAiResult(type)?.verdict === 3); // AI_VERDICT.FLAGGED
    if (aiFlags.length > 0) {
        summary += `CRITICAL: AI flagged discrepancies in ${aiFlags.join(', ')}. `;
    }

    // 3. Specific Mismatches
    if (getAiResult('aadhar')?.verdict === 3) summary += "Aadhaar number mismatch detected. ";
    if (getAiResult('pan')?.verdict === 3) summary += "PAN number mismatch detected. ";

    // 4. Pending/Overall
    const totalPossible = Object.keys(bgvRequest.reviews).length;
    if (verified.length === totalPossible) {
        summary += "All credentials successfully validated against HR records.";
    } else if (verified.length > 0) {
        const pending = totalPossible - verified.length - flagged.length;
        if (pending > 0) summary += `${pending} document(s) still awaiting verification.`;
    }

    return summary || "Verification results pending.";
};

module.exports = {
    verifyDocument,
    verifyAllDocuments,
    generateExecutiveSummary,
    AI_VERDICT,
    AI_VERDICT_LABELS,
    THRESHOLDS
};
