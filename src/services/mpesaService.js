import "dotenv/config";
import supabase from "../config/supabase.js";

const consumerKey = process.env.MPESA_CONSUMER_KEY
const consumerSecret = process.env.MPESA_CONSUMER_SECRET
const mpesaBaseUrl = process.env.MPESA_BASE_URL
const mpesaShortcode = process.env.MPESA_SHORTCODE
const mpesaPasskey = process.env.MPESA_PASSKEY
const mpesaCallbackUrl = process.env.MPESA_CALLBACK_URL;

if (!consumerKey) {
    throw new Error ("wrong consumer key")
}

if (!consumerSecret){
    throw new Error ("confirm the consumer secret key ")
}

if (!mpesaBaseUrl){
    throw new Error ("confirm mpesa base url")
}
if (!mpesaCallbackUrl) {
    throw new Error("MPESA_CALLBACK_URL is missing.");
}

console.log({
    consumerKeyLoaded: Boolean(consumerKey),
    consumerSecretLoaded: Boolean(consumerSecret),
    mpesaBaseUrl,
});
console.log({
    consumerKeyLength: consumerKey?.length,
    consumerSecretLength: consumerSecret?.length,
    keyHasSpaces: consumerKey !== process.env.MPESA_CONSUMER_KEY,
    secretHasSpaces: consumerSecret !== process.env.MPESA_CONSUMER_SECRET,
});

export async function getMpesaAccessToken (){
    const credentials = `${consumerKey}:${consumerSecret}`;
    const encodedCredentials = Buffer.from(credentials).toString("base64"); //Buffer.from() converts the text into data Node can encode.


    const response = await fetch(
        `${mpesaBaseUrl}/oauth/v1/generate?grant_type=client_credentials`,
        {

            method: "GET",
            headers: {
            Authorization: `Basic ${encodedCredentials}`,
            },
         }
  
  
    );

    const data = await response.json();
    if (!response.ok) {
        throw new Error(
        data.errorMessage ||
        data.error_description ||
        "Failed to retrieve M-Pesa access token"
        );
    }

    if (!data.access_token) {
        throw new Error("Safaricom response did not contain an access token");
    }
    return data.access_token;
}
//generate timestamp
function generateTimestamp(){
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1 ).padStart (2, "0");
    const day = String (now.getDate()).padStart (2, "0");
    const hour = String(now.getHours()).padStart(2, "0");
    const minute = String(now.getMinutes()).padStart(2, "0");
    const second = String(now.getSeconds()).padStart(2, "0");

    return `${year}${month}${day}${hour}${minute}${second}`;
}

function generateMpesaPassword (timestamp){
    const passwordString = `${mpesaShortcode}${mpesaPasskey}${timestamp}`;//required password format by daraja
    const encodedPassword = Buffer.from(passwordString).toString("base64");

    return encodedPassword;
}

function formatPhoneNumber(phoneNumber) {
    const cleanedPhone = String(phoneNumber)
        .replace(/\D/g, "");

    if (
        cleanedPhone.startsWith("254") &&
        cleanedPhone.length === 12
    ) {
        return cleanedPhone;
    }
    if (
        cleanedPhone.startsWith("0") &&
        cleanedPhone.length === 10
    ) {
        return `254${cleanedPhone.slice(1)}`;
    }
    if (
        cleanedPhone.startsWith("7") &&
        cleanedPhone.length === 9
    ) {
        return `254${cleanedPhone}`;
    }
    if (
        cleanedPhone.startsWith("1") &&
        cleanedPhone.length === 9
    ) {
        return `254${cleanedPhone}`;
    }
    throw new Error("Invalid Kenyan phone number.");
}
export async function initiateStkPush({
    phoneNumber,
    amount,
    accountReference,
    transactionDescription,
    idempotencyKey,
}) {
    // 1. Validate request values

    if (!phoneNumber) {
        const error = new Error(
            "Phone number is required."
        );
        error.statusCode = 400;
        throw error;
    }

    if (
        amount === undefined ||
        amount === null ||
        amount === ""
    ) {
        const error = new Error(
            "Amount is required."
        );
        error.statusCode = 400;
        throw error;
    }

    if (!idempotencyKey) {
        const error = new Error(
            "Idempotency key is required."
        );
        error.statusCode = 400;
        throw error;
    }

    const paymentAmount = Number(amount);

    if (
        Number.isNaN(paymentAmount) ||
        paymentAmount <= 0
    ) {
        const error = new Error(
            "Amount must be greater than zero."
        );
        error.statusCode = 400;
        throw error;
    }

    const safeAccountReference = String(
        accountReference || "PAYMENT"
    ).trim();

    const safeTransactionDescription = String(
        transactionDescription ||
            "Customer payment"
    ).trim();

    const formattedPhoneNumber =
        formatPhoneNumber(phoneNumber);

    /*
     * 2. Check whether this idempotency key
     * already exists.
     */

    const {
        data: existingTransaction,
        error: existingTransactionError,
    } = await supabase
        .from("mpesa_transactions")
        .select("*")
        .eq(
            "idempotency_key",
            idempotencyKey
        )
        .maybeSingle();

    if (existingTransactionError) {
        throw new Error(
            `Failed to check idempotency key: ${existingTransactionError.message}`
        );
    }

    if (existingTransaction) {
        const samePayment =
            String(
                existingTransaction.phone_number
            ) === formattedPhoneNumber &&
            Number(
                existingTransaction.amount
            ) === paymentAmount &&
            String(
                existingTransaction.account_reference
            ) === safeAccountReference;

        if (!samePayment) {
            const error = new Error(
                "This idempotency key was already used for a different payment."
            );

            error.statusCode = 409;
            throw error;
        }

        return {
            reused: true,
            mpesaResponse: null,
            transaction:
                existingTransaction,
        };
    }

    /*
     * 3. Reserve the idempotency key before
     * contacting Safaricom.
     */

    const {
        data: reservedTransaction,
        error: reservationError,
    } = await supabase
        .from("mpesa_transactions")
        .insert({
            idempotency_key:
                idempotencyKey,

            phone_number:
                formattedPhoneNumber,

            amount:
                paymentAmount,

            transaction_status:
                "INITIATING",

            account_reference:
                safeAccountReference,

            transaction_description:
                safeTransactionDescription,

            callback_received: false,
        })
        .select()
        .single();

    if (reservationError) {
        /*
         * PostgreSQL code 23505 means another
         * request reserved the same unique key.
         */
        if (
            reservationError.code === "23505"
        ) {
            const {
                data: concurrentTransaction,
                error: concurrentReadError,
            } = await supabase
                .from("mpesa_transactions")
                .select("*")
                .eq(
                    "idempotency_key",
                    idempotencyKey
                )
                .single();

            if (concurrentReadError) {
                throw new Error(
                    "A duplicate payment request was detected, but the existing transaction could not be retrieved."
                );
            }

            const samePayment =
                String(
                    concurrentTransaction
                        .phone_number
                ) === formattedPhoneNumber &&
                Number(
                    concurrentTransaction.amount
                ) === paymentAmount &&
                String(
                    concurrentTransaction
                        .account_reference
                ) === safeAccountReference;

            if (!samePayment) {
                const error = new Error(
                    "This idempotency key was already used for a different payment."
                );

                error.statusCode = 409;
                throw error;
            }

            return {
                reused: true,
                mpesaResponse: null,
                transaction:
                    concurrentTransaction,
            };
        }

        throw new Error(
            `Failed to reserve payment request: ${reservationError.message}`
        );
    }

    /*
     * This variable tells the catch block whether
     * Safaricom already accepted the STK request.
     */
    let stkPushAccepted = false;
    let responseData = null;

    try {
        /*
         * 4. Generate credentials and send
         * the STK Push request.
         */

        const timestamp =
            generateTimestamp();

        const password =
            generateMpesaPassword(
                timestamp
            );

        const accessToken =
            await getMpesaAccessToken();

        const payload = {
            BusinessShortCode:
                mpesaShortcode,

            Password: password,

            Timestamp: timestamp,

            TransactionType:
                "CustomerPayBillOnline",

            Amount: paymentAmount,

            PartyA:
                formattedPhoneNumber,

            PartyB:
                mpesaShortcode,

            PhoneNumber:
                formattedPhoneNumber,

            CallBackURL:
                mpesaCallbackUrl,

            AccountReference:
                safeAccountReference,

            TransactionDesc:
                safeTransactionDescription,
        };

        const mpesaResponse = await fetch(
            `${mpesaBaseUrl}/mpesa/stkpush/v1/processrequest`,
            {
                method: "POST",

                headers: {
                    Authorization:
                        `Bearer ${accessToken}`,

                    "Content-Type":
                        "application/json",
                },

                body:
                    JSON.stringify(payload),
            }
        );

        responseData =
            await mpesaResponse.json();

        if (!mpesaResponse.ok) {
            const error = new Error(
                responseData.errorMessage ||
                    responseData
                        .ResponseDescription ||
                    responseData.errorCode ||
                    "STK Push request failed."
            );

            error.statusCode =
                mpesaResponse.status;

            throw error;
        }

        /*
         * Safaricom has accepted the request.
         * From this point onward, do not mark it
         * as INITIATION_FAILED.
         */
        stkPushAccepted = true;

        /*
         * 5. Update the reserved transaction.
         */

        const {
            data: transaction,
            error: databaseError,
        } = await supabase
            .from("mpesa_transactions")
            .update({
                checkout_request_id:
                    responseData
                        .CheckoutRequestID,

                merchant_request_id:
                    responseData
                        .MerchantRequestID,

                transaction_status:
                    "PENDING",

                customer_message:
                    responseData
                        .CustomerMessage,

                result_description:
                    responseData
                        .ResponseDescription,

                updated_at:
                    new Date().toISOString(),
            })
            .eq(
                "id",
                reservedTransaction.id
            )
            .select()
            .single();

        if (databaseError) {
            const error = new Error(
                `STK Push was accepted, but updating the transaction failed: ${databaseError.message}`
            );

            error.statusCode = 500;
            error.stkPushAccepted = true;
            throw error;
        }

        return {
            reused: false,
            mpesaResponse: responseData,
            transaction,
        };
    } catch (error) {
        /*
         * Only mark INITIATION_FAILED when
         * Safaricom did not accept the request.
         */
        if (!stkPushAccepted) {
            const {
                error: failureUpdateError,
            } = await supabase
                .from(
                    "mpesa_transactions"
                )
                .update({
                    transaction_status:
                        "INITIATION_FAILED",

                    result_description:
                        error.message,

                    updated_at:
                        new Date()
                            .toISOString(),
                })
                .eq(
                    "id",
                    reservedTransaction.id
                );

            if (failureUpdateError) {
                console.error(
                    "Failed to mark transaction as INITIATION_FAILED:",
                    failureUpdateError
                );
            }
        } else {
            console.error(
                "Safaricom accepted the STK Push, but a local error occurred:",
                {
                    transactionId:
                        reservedTransaction.id,

                    checkoutRequestId:
                        responseData
                            ?.CheckoutRequestID,

                    error:
                        error.message,
                }
            );
        }

        throw error;
    }
}