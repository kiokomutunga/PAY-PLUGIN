import {
    useCallback,
    useEffect,
    useRef,
    useState,
} from "react";

import {
    initiateMpesaPayment,
    getMpesaPaymentStatus,
} from "../services/mpesaApi";

export default function MpesaPaymentForm() {
    const [phoneNumber, setPhoneNumber] = useState("");
    const [amount, setAmount] = useState("");
    const [status, setStatus] = useState("IDLE");
    const [message, setMessage] = useState("");
    const [transaction, setTransaction] = useState(null);
    const [checkoutRequestId, setCheckoutRequestId] = useState(null);

    const pollingTimer = useRef(null);

    const finalStatuses = [
        "SUCCESS",
        "FAILED",
        "CANCELLED",
        "TIMEOUT",
        "INITIATION_FAILED",
    ];

    const checkPaymentStatus = useCallback(
        async (requestId) => {
            const result = await getMpesaPaymentStatus(requestId);

            const latestTransaction = result.transaction;

            if (!latestTransaction) {
                return null;
            }

            const latestStatus =
                latestTransaction.transaction_status;

            setTransaction(latestTransaction);
            setStatus(latestStatus);

            if (latestStatus === "SUCCESS") {
                setMessage("Payment completed successfully.");
            }

            else if (
                latestStatus === "PENDING" ||
                latestStatus === "INITIATING"
            ) {
                setMessage(
                    "Waiting for payment confirmation..."
                );
            }

            else if (latestStatus === "CANCELLED") {
                setMessage("Payment was cancelled.");
            }

            else if (latestStatus === "TIMEOUT") {
                setMessage(
                    "Payment request timed out."
                );
            }

            else if (
                latestStatus === "FAILED" ||
                latestStatus === "INITIATION_FAILED"
            ) {
                setMessage(
                    latestTransaction.result_description ||
                    "Payment failed."
                );
            }

            return latestTransaction;
        },
        []
    );

    useEffect(() => {
        if (!checkoutRequestId) {
            return;
        }

        let cancelled = false;

        async function poll() {
            try {
                const latestTransaction =
                    await checkPaymentStatus(
                        checkoutRequestId
                    );

                if (
                    cancelled ||
                    !latestTransaction
                ) {
                    return;
                }

                const latestStatus =
                    latestTransaction
                        .transaction_status;

                if (
                    finalStatuses.includes(
                        latestStatus
                    )
                ) {
                    return;
                }

                pollingTimer.current =
                    setTimeout(
                        poll,
                        2000
                    );

            } catch (error) {
                console.error(
                    "Payment polling failed:",
                    error
                );

                if (!cancelled) {
                    pollingTimer.current =
                        setTimeout(
                            poll,
                            5000
                        );
                }
            }
        }

        poll();

        return () => {
            cancelled = true;

            if (pollingTimer.current) {
                clearTimeout(
                    pollingTimer.current
                );
            }
        };

    }, [
        checkoutRequestId,
        checkPaymentStatus,
    ]);

    async function handleSubmit(event) {
        event.preventDefault();

        if (pollingTimer.current) {
            clearTimeout(
                pollingTimer.current
            );
        }

        setStatus("LOADING");
        setMessage("");
        setTransaction(null);
        setCheckoutRequestId(null);

        try {
            const result =
                await initiateMpesaPayment({
                    phoneNumber,
                    amount: Number(amount),

                    accountReference:
                        `PAY-${Date.now()}`,

                    transactionDescription:
                        "M-Pesa payment",

                    idempotencyKey:
                        crypto.randomUUID(),
                });

            const returnedTransaction =
                result.transaction ||
                result.data?.transaction;

            const returnedMpesaResponse =
                result.mpesaResponse ||
                result.data?.mpesaResponse;

            const requestId =
                returnedTransaction
                    ?.checkout_request_id ||
                returnedMpesaResponse
                    ?.CheckoutRequestID;

            setTransaction(
                returnedTransaction
            );

            setStatus(
                returnedTransaction
                    ?.transaction_status ||
                "PENDING"
            );

            setMessage(
                "STK Push sent. Complete the payment on your phone."
            );

            if (requestId) {
                setCheckoutRequestId(
                    requestId
                );
            }

        } catch (error) {
            setStatus("ERROR");
            setMessage(error.message);
        }
    }

    const isLoading =
        status === "LOADING";

    const isWaiting =
        status === "PENDING" ||
        status === "INITIATING";

    const isSuccess =
        status === "SUCCESS";

    return (
        <main className="min-h-screen bg-[#eef3ed] px-4 py-12">

            <div className="mx-auto max-w-md rounded-3xl bg-white p-6 shadow-sm">

                <div className="mb-6">

                    <p className="text-sm font-medium text-green-600">
                        M-Pesa payment
                    </p>

                    <h1 className="mt-1 text-2xl font-semibold text-slate-900">
                        Send STK Push
                    </h1>

                </div>

                <form
                    onSubmit={handleSubmit}
                    className="space-y-5"
                >

                    <div>

                        <label
                            htmlFor="phoneNumber"
                            className="mb-2 block text-sm font-medium text-slate-700"
                        >
                            Phone number
                        </label>

                        <input
                            id="phoneNumber"
                            type="tel"
                            value={phoneNumber}

                            onChange={(event) =>
                                setPhoneNumber(
                                    event.target.value
                                )
                            }

                            placeholder="0712345678"

                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-green-500 focus:bg-white focus:ring-2 focus:ring-green-100"

                            required
                        />

                    </div>

                    <div>

                        <label
                            htmlFor="amount"
                            className="mb-2 block text-sm font-medium text-slate-700"
                        >
                            Amount
                        </label>

                        <input
                            id="amount"
                            type="number"
                            min="1"
                            value={amount}

                            onChange={(event) =>
                                setAmount(
                                    event.target.value
                                )
                            }

                            placeholder="KES 0"

                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-green-500 focus:bg-white focus:ring-2 focus:ring-green-100"

                            required
                        />

                    </div>

                    <button
                        type="submit"

                        disabled={
                            isLoading ||
                            isWaiting
                        }

                        className="w-full rounded-xl bg-[#16351f] px-4 py-3 font-medium text-white transition hover:bg-[#204b2d] disabled:cursor-not-allowed disabled:opacity-60"
                    >

                        {isLoading
                            ? "Sending..."
                            : isWaiting
                                ? "Waiting for payment..."
                                : "Pay with M-Pesa"}

                    </button>

                </form>

                {message && (

                    <div className="mt-5 rounded-xl bg-slate-50 p-4">

                        <div className="flex items-center gap-3">

                            {isWaiting && (

                                <span className="h-4 w-4 animate-spin rounded-full border-2 border-green-700 border-t-transparent" />

                            )}

                            <p className="text-sm text-slate-700">
                                {message}
                            </p>

                        </div>

                    </div>

                )}

                {isSuccess &&
                    transaction
                        ?.mpesa_receipt_number && (

                        <div className="mt-4 rounded-xl border border-green-200 bg-green-50 p-4">

                            <p className="text-sm font-medium text-green-800">
                                Payment successful
                            </p>

                            <div className="mt-2 flex items-center justify-between">

                                <span className="text-sm text-green-700">
                                    M-Pesa receipt
                                </span>

                                <strong className="text-sm text-green-900">
                                    {
                                        transaction
                                            .mpesa_receipt_number
                                    }
                                </strong>

                            </div>

                        </div>

                    )}

            </div>

        </main>
    );
}