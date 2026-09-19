import supabase from "../config/supabase.js";
import { getMpesaAccessToken, initiateStkPush,reconcileMpesaTransaction, } from "../services/mpesaService.js";


export async function testMpesaConnection(
    request, response ) {
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

export async function getmpesaTransactionstatus (request, response){
     try {
        const { checkoutRequestId } = request.params;

        if (!checkoutRequestId) {
            return response.status(400).json({
                success: false,
                message:
                    "CheckoutRequestID is required.",
            });
        }

        const { data: transaction, error: databaseError, } = await supabase .from("mpesa_transactions")
            .select(`
                checkout_request_id, merchant_request_id, account_reference, phone_number,
                amount,
                transaction_status,
                mpesa_receipt_number,
                result_code,
                result_description,
                callback_received,
                created_at,
                updated_at
            `)
            .eq(
                "checkout_request_id",
                checkoutRequestId
            )
            .maybeSingle();

        if (databaseError) {
            console.error(
                "Transaction-status database error:",
                databaseError
            );

            return response.status(500).json({
                success: false,
                message:
                    "Failed to retrieve payment status.",
            });
        }

        if (!transaction) {
            return response.status(404).json({
                success: false,
                message:
                    "Payment transaction was not found.",
            });
        }

        return response.status(200).json({
            success: true,
            transaction,
        });
    } catch (error) {
        console.error(
            "Payment-status controller error:",
            error
        );

        return response.status(500).json({
            success: false,
            message:
                "Failed to retrieve payment status.",
            error: error.message,
        });
    }

}

export async function getAllMpesaTransactions(
    request,
    response
) {
    try {
        const {
            page = "1",
            limit = "20",
            status,
            search,
            from,
            to,
        } = request.query;

        const pageNumber = Number(page);
        const limitNumber = Number(limit);

        if (
            !Number.isInteger(pageNumber) ||
            pageNumber < 1
        ) {
            return response.status(400).json({
                success: false,
                message:
                    "Page must be a positive integer.",
            });
        }

        if (
            !Number.isInteger(limitNumber) ||
            limitNumber < 1 ||
            limitNumber > 100
        ) {
            return response.status(400).json({
                success: false,
                message:
                    "Limit must be between 1 and 100.",
            });
        }

        const allowedStatuses = [
            "INITIATING",
            "PENDING",
            "SUCCESS",
            "FAILED",
            "CANCELLED",
            "TIMEOUT",
            "INITIATION_FAILED",
        ];

        if (
            status &&
            status !== "ALL" &&
            !allowedStatuses.includes(status)
        ) {
            return response.status(400).json({
                success: false,
                message:
                    "Invalid transaction status.",
            });
        }

        const start =
            (pageNumber - 1) *
            limitNumber;

        const end =
            start + limitNumber - 1;

        let query = supabase
            .from("mpesa_transactions")
            .select(
                `
                    id,
                    checkout_request_id,
                    merchant_request_id,
                    account_reference,
                    phone_number,
                    amount,
                    transaction_status,
                    mpesa_receipt_number,
                    result_code,
                    result_description,
                    callback_received,
                    created_at,
                    updated_at
                `,
                {
                    count: "exact",
                }
            );

        // Status filter
        if (
            status &&
            status !== "ALL"
        ) {
            query = query.eq(
                "transaction_status",
                status
            );
        }

        // Search
        if (
            search &&
            search.trim()
        ) {
            const safeSearch =
                search.trim();

            query = query.or(
                `account_reference.ilike.%${safeSearch}%,phone_number.ilike.%${safeSearch}%,mpesa_receipt_number.ilike.%${safeSearch}%`
            );
        }

        // Date from
        if (from) {
            const fromDate =
                new Date(from);

            if (
                Number.isNaN(
                    fromDate.getTime()
                )
            ) {
                return response
                    .status(400)
                    .json({
                        success: false,
                        message:
                            "Invalid from date.",
                    });
            }

            query = query.gte(
                "created_at",
                fromDate.toISOString()
            );
        }

        // Date to
        if (to) {
            const toDate =
                new Date(to);

            if (
                Number.isNaN(
                    toDate.getTime()
                )
            ) {
                return response
                    .status(400)
                    .json({
                        success: false,
                        message:
                            "Invalid to date.",
                    });
            }

            /*
             * Include the whole selected day.
             */
            toDate.setHours(
                23,
                59,
                59,
                999
            );

            query = query.lte(
                "created_at",
                toDate.toISOString()
            );
        }

        const {
            data: transactions,
            error,
            count,
        } = await query
            .order(
                "created_at",
                {
                    ascending: false,
                }
            )
            .range(start, end);

        if (error) {
            console.error(
                "Failed to fetch transactions:",
                error
            );

            return response
                .status(500)
                .json({
                    success: false,
                    message:
                        "Failed to retrieve transactions.",
                });
        }

        const total =
            count || 0;

        const totalPages =
            Math.ceil(
                total /
                limitNumber
            );

        return response
            .status(200)
            .json({
                success: true,

                transactions:
                    transactions || [],

                pagination: {
                    page:
                        pageNumber,

                    limit:
                        limitNumber,

                    total,

                    totalPages,

                    hasNextPage:
                        pageNumber <
                        totalPages,

                    hasPreviousPage:
                        pageNumber >
                        1,
                },
            });

    } catch (error) {
        console.error(
            "Transaction retrieval error:",
            error
        );

        return response
            .status(500)
            .json({
                success: false,

                message:
                    "Failed to retrieve transactions.",

                error:
                    error.message,
            });
    }
}

export async function reconcileMpesaPayment(
    request,
    response
) {
    try {
        const {
            checkoutRequestId,
        } = request.params;

        const result = await reconcileMpesaTransaction( checkoutRequestId );

        return response
            .status(200)
            .json({
                success: true,
                message: result.reconciled 
                        ? "Transaction reconciled successfully."
                        : "Transaction already has a final status.",

                reconciled: result.reconciled,

                source: result.source,

                transaction: result.transaction,
            });

    } catch (error) {
        console.error( "M-Pesa reconciliation error:",
            error
        );

        return response
            .status(
                error.statusCode || 500
            )
            .json({
                success: false,
                message: error.message || "Failed to reconcile payment.",
            });
    }
}