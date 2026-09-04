import supabase from "../config/supabase.js";
import { reconcileMpesaTransaction, } from "../services/mpesaService.js";

export async function reconcilePendingPayments() {
    try {
        const cutoffTime = new Date(
                Date.now() - 30 * 1000
            ).toISOString();

        const {
            data: pendingTransactions,
            error,
        } = await supabase.from("mpesa_transactions")
            .select(`
                id,
                checkout_request_id,
                transaction_status,
                created_at
            `)
            .eq(
                "transaction_status",
                "PENDING"
            )
            .lt(
                "created_at",
                cutoffTime
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

            try {
                const result =
                    await reconcileMpesaTransaction(
                        transaction.checkout_request_id
                    );

                console.log(
                    "Reconciliation result:",
                    {
                        checkoutRequestId:
                            transaction.checkout_request_id,
                        reconciled:
                            result.reconciled,
                        status:
                            result.transaction
                                ?.transaction_status,
                    }
                );
            } catch (error) {
                console.error(
                    "Automatic reconciliation failed:",
                    transaction.checkout_request_id,
                    error.message
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