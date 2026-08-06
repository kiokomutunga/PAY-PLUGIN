import { useState } from "react";
import { initiateMpesaPayment } from "../services/mpesaApi";

export default function MpesaPaymentForm() {
    const [phoneNumber, setPhoneNumber] = useState("");
    const [amount, setAmount] = useState("");
    const [status, setStatus] = useState("IDLE");
    const [message, setMessage] = useState("");
    const [transaction, setTransaction] = useState(null);

    async function handleSubmit(event) {
        event.preventDefault();

        setStatus("LOADING");
        setMessage("");
        setTransaction(null);

        try {
            const result = await initiateMpesaPayment({
                phoneNumber,
                amount: Number(amount),
                accountReference: `PAY-${Date.now()}`,
                transactionDescription: "M-Pesa payment",
                idempotencyKey: crypto.randomUUID(),
            });

            const returnedTransaction =
                result.transaction || result.data?.transaction;

            setTransaction(returnedTransaction);

            setStatus(
                result.transactionStatus ||
                returnedTransaction?.transaction_status ||
                "PENDING"
            );

            setMessage(result.message);
        } catch (error) {
            setStatus("ERROR");
            setMessage(error.message);
        }
    }

    const isLoading = status === "LOADING";

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

                <form onSubmit={handleSubmit} className="space-y-5">
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
                                setPhoneNumber(event.target.value)
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
                                setAmount(event.target.value)
                            }
                            placeholder="KES 0"
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-green-500 focus:bg-white focus:ring-2 focus:ring-green-100"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full rounded-xl bg-[#16351f] px-4 py-3 font-medium text-white transition hover:bg-[#204b2d] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {isLoading
                            ? "Sending..."
                            : "Pay with M-Pesa"}
                    </button>
                </form>

                {message && (
                    <div className="mt-5 rounded-xl bg-slate-50 p-4">
                        <p className="text-sm text-slate-700">
                            {message}
                        </p>

                        {transaction && (
                            <p className="mt-2 text-sm font-medium text-slate-900">
                                Status: {transaction.transaction_status}
                            </p>
                        )}
                    </div>
                )}
            </div>
        </main>
    );
}