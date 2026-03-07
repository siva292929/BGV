// ─── ROLES ──────────────────────────────────────────────────────────────────
export const ROLES = {
    ADMIN: 0,
    HR: 1,
    AGENT: 2,
    CANDIDATE: 3
};

export const ROLE_LABELS = {
    [ROLES.ADMIN]: 'Admin',
    [ROLES.HR]: 'HR',
    [ROLES.AGENT]: 'Agent',
    [ROLES.CANDIDATE]: 'Candidate'
};

// ─── BGV / USER STATUS ──────────────────────────────────────────────────────
export const STATUS = {
    PENDING: 0,
    UNDER_REVIEW: 1,
    VERIFIED: 2,
    REJECTED: 3
};

export const STATUS_LABELS = {
    [STATUS.PENDING]: 'Pending',
    [STATUS.UNDER_REVIEW]: 'Under Review',
    [STATUS.VERIFIED]: 'Verified',
    [STATUS.REJECTED]: 'Rejected'
};

// ─── DOCUMENT REVIEW STATUS ─────────────────────────────────────────────────
export const REVIEW = {
    PENDING: 0,
    VERIFIED: 1,
    REJECTED: 2
};

export const REVIEW_LABELS = {
    [REVIEW.PENDING]: 'Pending',
    [REVIEW.VERIFIED]: 'Verified',
    [REVIEW.REJECTED]: 'Rejected'
};

// ─── AI VERDICT ─────────────────────────────────────────────────────────────
export const AI_VERDICT = {
    PENDING: 0,
    AUTO_VERIFIED: 1,
    NEEDS_REVIEW: 2,
    FLAGGED: 3
};

export const AI_VERDICT_LABELS = {
    [AI_VERDICT.PENDING]: 'Pending',
    [AI_VERDICT.AUTO_VERIFIED]: 'Auto-Verified',
    [AI_VERDICT.NEEDS_REVIEW]: 'Needs Review',
    [AI_VERDICT.FLAGGED]: 'Flagged'
};
