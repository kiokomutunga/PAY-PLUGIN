import supabase from "../config/supabase.js";

import { reconcileMpesaTransaction, } from "../services/mpesaService.js";

const MAX_RECONCILIATION_ATTEMPTS = 5;

function getNextRetryTime(attemptNumber) {
    const retryDelays = [ 30, 60, 120, 300,  600, ];

    const delaySeconds =  retryDelays[attemptNumber] || retryDelays[
            retryDelays.length - 1
        ];

    return new Date(
        Date.now() +
        delaySeconds * 1000
    ).toISOString();
}

export async function reconcilePendingPayments() {
    try {
        const now =
            new Date().toISOString();

        const {
            data: pendingTransactions,
            error,
        } = await supabase
            .from("mpesa_transactions")
            .select(`
                id,
                checkout_request_id,
                transaction_status,
                reconciliation_attempts,
                next_reconciliation_at
            `)
            .eq(
                "transaction_status",
                "PENDING"
            )
            .lt(
                "reconciliation_attempts",
                MAX_RECONCILIATION_ATTEMPTS
            )
            .or(
                `next_reconciliation_at.is.null,next_reconciliation_at.lte.${now}`
            );

        if (error) {
            console.error(
                "Failed to load pending transactions:",
                error
            );

            return;
        }

        for (
            const transaction
            of pendingTransactions
        ) {
            if (
                !transaction.checkout_request_id
            ) {
                continue;
            }

            const currentAttempts =
                transaction.reconciliation_attempts || 0;

            const nextAttemptNumber =
                currentAttempts + 1;

            try {
                const result =
                    await reconcileMpesaTransaction(
                        transaction.checkout_request_id
                    );

                const finalStatus =
                    result.transaction
                        ?.transaction_status;

                const isFinal =
                    [
                        "SUCCESS",
                        "FAILED",
                        "CANCELLED",
                        "TIMEOUT",
                    ].includes(
                        finalStatus
                    );

                await supabase
                    .from(
                        "mpesa_transactions"
                    )
                    .update({
                        reconciliation_attempts:
                            nextAttemptNumber,

                        last_reconciliation_at:
                            new Date().toISOString(),

                        next_reconciliation_at:
                            isFinal
                                ? null
                                : getNextRetryTime(
                                      nextAttemptNumber
                                  ),
                    })
                    .eq(
                        "id",
                        transaction.id
                    );

                console.log(
                    "Automatic reconciliation:",
                    {
                        checkoutRequestId:
                            transaction.checkout_request_id,

                        attempt:
                            nextAttemptNumber,

                        status:
                            finalStatus,
                    }
                );
            } catch (error) {
                const nextRetry =
                    nextAttemptNumber >=
                    MAX_RECONCILIATION_ATTEMPTS
                        ? null
                        : getNextRetryTime(
                              nextAttemptNumber
                          );

                await supabase
                    .from(
                        "mpesa_transactions"
                    )
                    .update({
                        reconciliation_attempts:
                            nextAttemptNumber,

                        last_reconciliation_at:
                            new Date().toISOString(),

                        next_reconciliation_at:
                            nextRetry,
                    })
                    .eq(
                        "id",
                        transaction.id
                    );

                console.error(
                    "Automatic reconciliation failed:",
                    {
                        checkoutRequestId:
                            transaction.checkout_request_id,

                        attempt:
                            nextAttemptNumber,

                        error:
                            error.message,
                    }
                );
            }
        }
    } catch (error) {
        console.error(
            "Reconciliation job failed:",
            error
        );
    }
}