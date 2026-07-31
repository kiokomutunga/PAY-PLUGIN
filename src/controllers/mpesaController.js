import { getMpesaAccessToken, initiateStkPush, } from "../services/mpesaService.js";

export async function testMpesaConnection(
    request,
    response
) {
    try {
        const accessToken =
            await getMpesaAccessToken();

        return response.status(200).json({
            success: true,
            message:
                "M-Pesa connection successful",
            tokenReceived:
                Boolean(accessToken),
        });
    } catch (error) {
        return response.status(500).json({
            success: false,
            message:
                "M-Pesa connection failed",
            error: error.message,
        });
    }
}

export async function initiateMpesaPayment(
    request,
    response
) {
    try {
        const { phoneNumber, amount, accountReference, transactionDescription, } = request.body;

        const idempotencyKey =
            request
                .get("Idempotency-Key")
                ?.trim();

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

        const result =
            await initiateStkPush({ phoneNumber, amount, accountReference,transactionDescription, idempotencyKey,
                
             });

        if (result.reused) {
            const transaction =
                result.transaction;

            const transactionStatus =
                transaction.transaction_status;

            const statusMessages = {
                INITIATING:
                    "This payment request is already being initiated. Please wait before trying again.",

                PENDING:
                    "A payment request has already been sent to your phone. Please complete it or wait for the result.",

                SUCCESS:
                    "This payment has already been completed successfully. No new payment request was sent.",

                FAILED:
                    "The previous payment attempt failed. Start a new payment using a new idempotency key.",

                CANCELLED:
                    "The previous payment was cancelled. Start a new payment using a new idempotency key.",

                TIMEOUT:
                    "The previous payment request expired. Start a new payment using a new idempotency key.",

                INITIATION_FAILED:
                    "The previous payment request could not be initiated. Start a new payment using a new idempotency key.",
            };

            return response.status(200).json({
                success: true,
                message:
                    statusMessages[
                        transactionStatus
                    ] ||
                    "This payment request already exists. No new STK Push was sent.",

                reused: true,

                transactionStatus,

                transaction,
            });
        }
        return response.status(201).json({
            success: true,
            message:
                "STK Push initiated successfully. Please check your phone and complete the payment.",

            reused: false,

            transactionStatus:
                result.transaction
                    .transaction_status,

            mpesaResponse:
                result.mpesaResponse,

            transaction:
                result.transaction,
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