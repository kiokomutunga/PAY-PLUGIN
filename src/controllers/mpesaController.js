import { getMpesaAccessToken, initiateStkPush,} from "../services/mpesaService.js";

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

        const idempotencyKey =
            request.get("Idempotency-Key");

        if (!idempotencyKey) {
            return response.status(400).json({
                success: false,
                message:
                    "Idempotency-Key header is required.",
            });
        }

        if (idempotencyKey.length > 100) {
            return response.status(400).json({
                success: false,
                message:
                    "Idempotency-Key must not exceed 100 characters.",
            });
        }

        const result = await initiateStkPush({
            phoneNumber,
            amount,
            accountReference,
            transactionDescription,
            idempotencyKey,
        });

        const statusCode = result.reused ? 200 : 201;

        return response.status(statusCode).json({
            success: true,
            message: result.reused
                ? "Existing payment request returned."
                : "STK Push initiated successfully.",
            reused: result.reused,
            data: result,
        });
    } catch (error) {
        console.error(
            "STK Push controller error:",
            error
        );

        return response
            .status(error.statusCode || 500)
            .json({
                success: false,
                message:
                    error.message ||
                    "Failed to initiate STK Push.",
            });
    }
}