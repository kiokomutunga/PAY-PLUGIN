import { API_BASE_URL } from "../config/api";

export async function initiateMpesaPayment({
    phoneNumber,
    amount,
    accountReference,
    transactionDescription,
    idempotencyKey,
}) {
    const response = await fetch(
        `${API_BASE_URL}/api/mpesa/stkpush`,
        {
            method: "POST",

            headers: {
                "Content-Type": "application/json",
                "Idempotency-Key":
                    idempotencyKey,
            },

            body: JSON.stringify({
                phoneNumber,
                amount,
                accountReference,
                transactionDescription,
            }),
        }
    );

    const data = await response.json();

    if (!response.ok) {
        throw new Error(
            data.message ||
                "Payment request failed."
        );
    }

    return data;
}

export async function getMpesaPaymentStatus(
    checkoutRequestId
) {
    const response = await fetch(
        `${API_BASE_URL}/api/mpesa/transactions/${encodeURIComponent(
            checkoutRequestId
        )}`,
        {
            method: "GET",
            headers: {
                "Content-Type":
                    "application/json",
            },
        }
    );

    const data = await response.json();

    if (!response.ok) {
        throw new Error(
            data.message ||
                "Failed to retrieve payment status."
        );
    }

    return data;
}

export async function getAllMpesaTransactions() {
    const response = await fetch(
        `${API_BASE_URL}/api/mpesa/transactions`
    );

    const data = await response.json();

    if (!response.ok) {
        throw new Error(
            data.message ||
            "Failed to retrieve transactions."
        );
    }

    return data.transactions || [];
}

export async function getMpesaTransaction(
    checkoutRequestId
) {
    const response = await fetch(
        `${API_BASE_URL}/api/mpesa/transactions/${checkoutRequestId}`
    );

    const data = await response.json();

    if (!response.ok) {
        throw new Error(
            data.message ||
            "Failed to retrieve transaction."
        );
    }

    return data.transaction;
}