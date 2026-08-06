export const PAYMENT_POLLING_CONFIG = {
    fastInterval: 2000,
    slowInterval: 5000,
    slowAfter: 10000,
    timeout: 30000,
};

export const FINAL_PAYMENT_STATUSES = [
    "SUCCESS",
    "FAILED",
    "CANCELLED",
    "TIMEOUT",
    "INITIATION_FAILED",
];