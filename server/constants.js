// ─── ROLES ──────────────────────────────────────────────────────────────────
const ROLES = {
    ADMIN: 0,
    HR: 1,
    AGENT: 2,
    CANDIDATE: 3
};

const ROLE_LABELS = {
    [ROLES.ADMIN]: 'Admin',
    [ROLES.HR]: 'HR',
    [ROLES.AGENT]: 'Agent',
    [ROLES.CANDIDATE]: 'Candidate'
};

// ─── BGV / USER STATUS ──────────────────────────────────────────────────────
const STATUS = {
    PENDING: 0,
    UNDER_REVIEW: 1,
    VERIFIED: 2,
    REJECTED: 3
};

const STATUS_LABELS = {
    [STATUS.PENDING]: 'Pending',
    [STATUS.UNDER_REVIEW]: 'Under Review',
    [STATUS.VERIFIED]: 'Verified',
    [STATUS.REJECTED]: 'Rejected'
};

// ─── DOCUMENT REVIEW STATUS ─────────────────────────────────────────────────
const REVIEW = {
    PENDING: 0,
    VERIFIED: 1,
    REJECTED: 2
};

const REVIEW_LABELS = {
    [REVIEW.PENDING]: 'Pending',
    [REVIEW.VERIFIED]: 'Verified',
    [REVIEW.REJECTED]: 'Rejected'
};

// ─── AI VERDICT ─────────────────────────────────────────────────────────────
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

// ─── VERIFICATION SOURCE ────────────────────────────────────────────────────
const VERIFIED_BY = {
    AI: 'AI (OCR Match)',
    AUTOFETCH: 'Official Database (Autofetch)',
    MANUAL: 'Manual Audit'
};

module.exports = { ROLES, ROLE_LABELS, STATUS, STATUS_LABELS, REVIEW, REVIEW_LABELS, AI_VERDICT, AI_VERDICT_LABELS, VERIFIED_BY };
