import supabase from "../config/supabase.js";

export async function handleMpesaCallback (req,res){
    try{
        console.log(
            "mpesa callback received: ", JSON.stringify(req.body, null, 2)
        );

        const callback = req.body?.Body?.stkCallback;

        if (!callback) {
            return res.status(400).json({
                success: false,
                message: "Invalid Mpesa call back payload"
            });
        }

        const {MerchantRequestID, CheckoutRequestID, ResultCode, ResultDesc, CallbackMetadata, } = callback;

        if (!CheckoutRequestID) {
            return res.status(400).json({
                success: false,
                message: "CheckoutRequestID is missing"
            });
        }

        const {data: existingTransaction, error: transactionLookupError,} = await supabase.from("mpesa_transactions").select("*").eq("checkout_request_id", CheckoutRequestID).maybeSingle();
        //searching table for transaction
        if (transactionLookupError){
            console.error("Transaction lookup error: ", transactionLookupError);

            return res.status(500).json({
                success: false,
                message: "failed to retrieve payment",
                error: transactionLookupError.message
            });
        }

        //handle supabase database error
        if (!existingTransaction){
            return res.status(404).json({
                success: false,
                message: "Np transaction matching this CheckoutId"
            })
        }

        if (existingTransaction.callback_received === true && existingTransaction.result_code !== null){
            return res.status(200).json({
                success: true,
                message: "callback already processed. No duplicate update performed",
                duplicate: true,
                transactionStatus: existingTransaction.transaction_status,
                transaction: existingTransaction,
            });
             }


        const callbackItems = Array.isArray( CallbackMetadata?.Item) ?CallbackMetadata.Item : [];
        

        const metadata = callbackItems.reduce((result, item) => {
            result[item.Name] = item.Value;
            return result;

        }, {});

        const numericResultCode = Number(ResultCode);

        let transaction_status;
        if (numericResultCode === 0){
            transactionStatus = "SUCCESS";
        }
        else if (numericResultCode === 1032){
            transactionStatus = "CANCELLED"
        }
        else if (numericResultCode === 1037){
            transactionStatus = "TIMEOUT"
        }
        else{
            transactionStatus = "FAILED"
        }

        const updateData = {
            merchant_request_id: MerchantRequestID,
            transaction_status: transactionStatus,
            result_code: numericResultCode,
            result_description: ResultDesc,
            callback_received: true,
            updated_at: new Date().toISOString(),
        };

        if (metadata.MpesaReceiptNumber) {
            updateData.mpesa_receipt_number =
                metadata.MpesaReceiptNumber;
        }

        if (metadata.Amount !== undefined) {
            updateData.amount = Number(metadata.Amount);
        }

        if (metadata.PhoneNumber !== undefined) {
            updateData.phone_number =
                String(metadata.PhoneNumber);
        }

        const { data: transaction, error: databaseError } =
            await supabase
                .from("mpesa_transactions")
                .update(updateData)
                .eq("checkout_request_id", CheckoutRequestID)
                .select()
                .single();

        if (databaseError) {
            console.error(
                "Callback database error:",
                databaseError
            );

            return res.status(500).json({
                success: false,
                message: "Failed to update transaction",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Callback processed successfully",
            transaction,
        });
    } catch (error) {
    console.error("Callback processing error:", error);

    return res.status(500).json({
        success: false,
        message: "Callback processing failed",
        error: error.message,
    });
}

}