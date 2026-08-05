import { API_BASE_URL } from "../config/api";

export async function initiateMpesaPayment ({
    phoneNumber, amount, accountReference, transactionDescription, idempotencyKey,
}) {

    const response = await fetch(`${API_BASE_URL}/api/mpesa/stkpush`,
    {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Idemptency-Key": idempotencyKey  
         },

        body: JSON.stringify({ phoneNumber, amount, accountReference, transactionDescription,
        }), //converts a javascript object to json and send its to the server

    }
    );

    const data = await response.json();

    if (!response.ok) {
        throw new Error ( data.message || "payment request failed");
    }

    return data;




}