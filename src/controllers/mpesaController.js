import {
    getMpesaAccessToken,
    initiateStkPush,
} from "../services/mpesaService.js";

export async function testMpesaConnection(request, response) {
    try {
        const accessToken = await getMpesaAccessToken();

        return response.status(200).json({
            success: true,
            message: "M-Pesa connection successful",
            tokenReceived: Boolean(accessToken),
        });
    } catch (error) {
        return response.status(500).json({
            success: false,
            message: "M-Pesa connection failed",
            error: error.message,
        });
    }
}

export async function initiateMpesaPayment(request, response) {
    try {
        const {
            phoneNumber,
            amount,
            accountReference,
            transactionDescription,
        } = request.body;

        const result = await initiateStkPush({
            phoneNumber,
            amount,
            accountReference,
            transactionDescription,
        });

        return response.status(201).json({
            success: true,
            message: "STK Push initiated successfully",
            data: result,
        });
    } catch (error) {
        console.error("STK Push controller error:", error);

        return response.status(400).json({
            success: false,
            message: error.message,
        });
    }
}