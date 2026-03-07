const Tesseract = require('tesseract.js');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Safety net: catch Tesseract Worker errors that bypass try-catch
process.on('uncaughtException', (err) => {
    if (err.message && err.message.includes('Error attempting to read image')) {
        console.warn('⚠️ Tesseract worker error caught (PDF/unsupported file) — continuing...');
        return; // Don't crash
    }
    // Re-throw non-Tesseract errors
    console.error('Uncaught exception:', err);
    process.exit(1);
});

/**
 * Download a file from URL to a temp path
 */
const downloadToTemp = async (url) => {
    const tempPath = path.join(os.tmpdir(), `ocr_${Date.now()}_${Math.random().toString(36).slice(2)}`);
    const response = await axios({ url, responseType: 'stream' });
    const writer = fs.createWriteStream(tempPath);
    response.data.pipe(writer);
    return new Promise((resolve, reject) => {
        writer.on('finish', () => resolve(tempPath));
        writer.on('error', reject);
    });
};

/**
 * Check if a file is a PDF by reading its magic bytes
 */
const isPdf = (filePath) => {
    try {
        const buf = Buffer.alloc(5);
        const fd = fs.openSync(filePath, 'r');
        fs.readSync(fd, buf, 0, 5, 0);
        fs.closeSync(fd);
        return buf.toString('ascii', 0, 4) === '%PDF';
    } catch { return false; }
};

/**
 * Force Cloudinary URL to serve as JPG image
 */
const toImageUrl = (url) => {
    if (!url || !url.includes('cloudinary')) return url;
    if (!url.includes('/upload/')) return url;
    return url.replace('/upload/', '/upload/pg_1,f_jpg,fl_lossy/');
};

/**
 * Extract text from a document image/PDF URL using Tesseract OCR
 */
const extractText = async (imageUrl) => {
    if (!imageUrl) return '';

    let tempPath = null;
    try {
        // First try with Cloudinary image conversion
        const processUrl = toImageUrl(imageUrl);
        tempPath = await downloadToTemp(processUrl);

        // Check if the downloaded file is still a PDF (conversion failed)
        if (isPdf(tempPath)) {
            console.warn(`⚠️ File is PDF, skipping OCR: ${imageUrl.slice(-40)}`);
            return '';
        }

        // Check file size — skip very small files (likely errors)
        const stats = fs.statSync(tempPath);
        if (stats.size < 1000) {
            console.warn(`⚠️ File too small (${stats.size}b), skipping OCR`);
            return '';
        }

        const result = await Tesseract.recognize(tempPath, 'eng', {
            logger: () => { }
        });
        return result.data.text || '';
    } catch (err) {
        console.warn(`⚠️ OCR extraction failed (non-fatal): ${err.message}`);
        return '';
    } finally {
        try {
            if (tempPath && fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
        } catch (_) { }
    }
};

// ─── DOCUMENT-SPECIFIC DATA EXTRACTORS ──────────────────────────────────────

/**
 * Extract Aadhaar number from text (12-digit in groups of 4)
 */
const extractAadhaarData = (text) => {
    const data = {};
    const aadhaarPatterns = [
        /(\d{4}\s?\d{4}\s?\d{4})/g,
        /(\d{12})/g
    ];
    for (const pattern of aadhaarPatterns) {
        const matches = text.match(pattern);
        if (matches) {
            for (const m of matches) {
                const digits = m.replace(/\s/g, '');
                if (digits.length === 12) {
                    data.aadhaarNumber = digits;
                    break;
                }
            }
            if (data.aadhaarNumber) break;
        }
    }

    const nameMatch = text.match(/(?:Government|GOVERNMENT)[\s\S]*?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/);
    if (nameMatch) data.name = nameMatch[1].trim();

    const dobMatch = text.match(/(\d{2}[\/\-]\d{2}[\/\-]\d{4})/);
    if (dobMatch) data.dob = dobMatch[1];

    return data;
};

/**
 * Extract PAN number (format: ABCDE1234F)
 */
const extractPanData = (text) => {
    const data = {};
    const panMatch = text.match(/[A-Z]{5}\d{4}[A-Z]/);
    if (panMatch) data.panNumber = panMatch[0];

    const nameMatch = text.match(/(?:Name|NAME)\s*[:\n]\s*([A-Z\s]+)/);
    if (nameMatch) data.name = nameMatch[1].trim();

    const fatherMatch = text.match(/(?:Father|FATHER)[\s']*(?:s\s*)?(?:Name|NAME)\s*[:\n]\s*([A-Z\s]+)/i);
    if (fatherMatch) data.fatherName = fatherMatch[1].trim();

    return data;
};

/**
 * Extract academic data from marksheets/degree certificates
 */
const extractAcademicData = (text) => {
    const data = {};

    const percentPatterns = [
        /(\d{2,3}\.?\d{0,2})\s*%/,
        /percentage\s*[:\-]?\s*(\d{2,3}\.?\d{0,2})/i,
        /marks\s*[:\-]?\s*(\d{2,3}\.?\d{0,2})/i
    ];
    for (const pattern of percentPatterns) {
        const match = text.match(pattern);
        if (match) {
            const val = parseFloat(match[1]);
            if (val > 0 && val <= 100) {
                data.percentage = match[1];
                break;
            }
        }
    }

    const gpaPatterns = [
        /(?:CGPA|GPA|cgpa|gpa)\s*[:\-]?\s*(\d+\.?\d{0,2})/i,
        /(\d\.\d{1,2})\s*(?:out of|\/)\s*(?:10|4)/i
    ];
    for (const pattern of gpaPatterns) {
        const match = text.match(pattern);
        if (match) {
            data.gpa = match[1];
            break;
        }
    }

    const uniPatterns = [
        /(?:university|UNIVERSITY)\s*(?:of\s+)?([A-Za-z\s]+)/i,
        /([A-Za-z\s]+)\s*(?:university|UNIVERSITY)/i
    ];
    for (const pattern of uniPatterns) {
        const match = text.match(pattern);
        if (match) {
            data.university = match[1].trim();
            break;
        }
    }

    const boardMatch = text.match(/(?:CBSE|ICSE|State\s*Board|Board\s*of\s*[A-Za-z\s]+)/i);
    if (boardMatch) data.board = boardMatch[0].trim();

    return data;
};

/**
 * Extract experience/employment data
 */
const extractExperienceData = (text) => {
    const data = {};

    const companyPatterns = [
        /(?:company|employer|organization|organisation)\s*[:\-]?\s*([A-Za-z\s&.]+)/i,
        /(?:This is to certify|We hereby certify).*?at\s+([A-Za-z\s&.]+)/i,
        /([A-Z][A-Za-z\s&.]+(?:Ltd|Limited|Pvt|Inc|Corp|Solutions|Technologies|Services|Consulting))/
    ];
    for (const pattern of companyPatterns) {
        const match = text.match(pattern);
        if (match) {
            data.company = match[1].trim();
            break;
        }
    }

    const desigPatterns = [
        /(?:designation|position|role|title)\s*[:\-]?\s*([A-Za-z\s]+)/i,
        /(?:worked as|serving as|employed as)\s+(?:a\s+)?([A-Za-z\s]+)/i
    ];
    for (const pattern of desigPatterns) {
        const match = text.match(pattern);
        if (match) {
            data.designation = match[1].trim();
            break;
        }
    }

    const datePatterns = [
        /(?:from|joining|start)\s*[:\-]?\s*(\d{2}[\/\-]\d{2}[\/\-]\d{4})/i,
        /(\d{2}[\/\-]\d{2}[\/\-]\d{4})\s*(?:to|till|until)\s*(\d{2}[\/\-]\d{2}[\/\-]\d{4})/i
    ];
    for (const pattern of datePatterns) {
        const match = text.match(pattern);
        if (match) {
            data.startDate = match[1];
            if (match[2]) data.endDate = match[2];
            break;
        }
    }

    const salaryMatch = text.match(/(?:salary|ctc|compensation|package)\s*[:\-]?\s*(?:Rs\.?|INR|₹)?\s*([\d,]+)/i);
    if (salaryMatch) data.salary = salaryMatch[1].replace(/,/g, '');

    return data;
};

/**
 * Extract data from generic documents (address proof, bank statement, etc.)
 */
const extractGenericData = (text) => {
    const data = {};

    const nameMatch = text.match(/(?:Name|NAME)\s*[:\-]?\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/);
    if (nameMatch) data.name = nameMatch[1].trim();

    const addressMatch = text.match(/(?:Address|ADDRESS)\s*[:\-]?\s*(.+?)(?:\n|$)/);
    if (addressMatch) data.address = addressMatch[1].trim();

    const accountMatch = text.match(/(?:Account|A\/C)\s*(?:No|Number)?\s*[:\-]?\s*(\d{8,18})/i);
    if (accountMatch) data.accountNumber = accountMatch[1];

    const ifscMatch = text.match(/(?:IFSC)\s*[:\-]?\s*([A-Z]{4}0[A-Z0-9]{6})/i);
    if (ifscMatch) data.ifsc = ifscMatch[1];

    return data;
};

/**
 * Main extraction function — routes to the appropriate extractor
 */
const extractDataFromText = (text, docType) => {
    if (!text || text.trim().length < 10) return {};

    switch (docType) {
        case 'aadhar': return extractAadhaarData(text);
        case 'pan': return extractPanData(text);
        case 'degree': return extractAcademicData(text);
        case 'twelfth': return extractAcademicData(text);
        case 'tenth': return extractAcademicData(text);
        case 'experience':
        case 'releasingLetter': return extractExperienceData(text);
        case 'payslip': return { ...extractExperienceData(text), ...extractGenericData(text) };
        case 'addressProof': return extractGenericData(text);
        case 'bankStatement': return extractGenericData(text);
        case 'signature': return {};
        default: return extractGenericData(text);
    }
};

module.exports = { extractText, extractDataFromText };
