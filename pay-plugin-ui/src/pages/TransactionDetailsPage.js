import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import {
    ArrowLeft,
    CheckCircle,
    Clock,
    RefreshCw,
    Smartphone,
    XCircle,
} from "lucide-react";

import {
    getMpesaTransaction,
} from "../services/mpesaApi";

const FINAL_STATUSES = [
    "SUCCESS",
    "FAILED",
    "CANCELLED",
    "TIMEOUT",
    "INITIATION_FAILED",
];

function TransactionDetailsPage() {
    const { checkoutRequestId } = useParams();

    const [transaction, setTransaction] =
        useState(null);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");

    useEffect(() => {
        let interval = null;
        let active = true;

        async function loadTransaction(
            initialLoad = false
        ) {
            try {
                if (initialLoad) {
                    setLoading(true);
                }

                const data =
                    await getMpesaTransaction(
                        checkoutRequestId
                    );

                if (!active) {
                    return;
                }

                setTransaction(data);
                setError("");

                const isFinal =
                    FINAL_STATUSES.includes(
                        data.transaction_status
                    );

                if (isFinal) {
                    if (interval) {
                        clearInterval(
                            interval
                        );

                        interval = null;
                    }

                    return;
                }

                if (!interval) {
                    interval = setInterval(
                        () => {
                            loadTransaction(
                                false
                            );
                        },
                        5000
                    );
                }
            } catch (error) {
                if (active) {
                    setError(
                        error.message
                    );
                }
            } finally {
                if (
                    active &&
                    initialLoad
                ) {
                    setLoading(false);
                }
            }
        }

        loadTransaction(true);

        return () => {
            active = false;

            if (interval) {
                clearInterval(interval);
            }
        };
    }, [checkoutRequestId]);

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[#f3f7f3]">
                <div className="text-center">
                    <RefreshCw
                        size={24}
                        className="mx-auto mb-3 animate-spin text-[#00a651]"
                    />

                    <p className="text-sm text-slate-500">
                        Loading transaction...
                    </p>
                </div>
            </div>
        );
    }

    if (error && !transaction) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[#f3f7f3] px-6">
                <div className="w-full max-w-md rounded-xl border border-red-100 bg-white p-8 text-center">

                    <XCircle
                        size={28}
                        className="mx-auto mb-4 text-red-600"
                    />

                    <h1 className="text-lg font-semibold text-slate-900">
                        Unable to load transaction
                    </h1>

                    <p className="mt-2 text-sm text-slate-500">
                        {error}
                    </p>

                    <Link
                        to="/transactions"
                        className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#008f45]"
                    >
                        <ArrowLeft
                            size={16}
                        />

                        Back to transactions
                    </Link>

                </div>
            </div>
        );
    }

    const status =
        transaction.transaction_status;

    const isSuccess =
        status === "SUCCESS";

    const isPending =
        status === "PENDING" ||
        status === "INITIATING";

    const StatusIcon =
        isSuccess
            ? CheckCircle
            : isPending
            ? Clock
            : XCircle;

    function getStatusStyle() {
        if (isSuccess) {
            return "bg-[#e8f8ec] text-[#087a2f]";
        }

        if (isPending) {
            return "bg-amber-50 text-amber-700";
        }

        if (status === "CANCELLED") {
            return "bg-orange-50 text-orange-700";
        }

        if (status === "TIMEOUT") {
            return "bg-slate-100 text-slate-700";
        }

        return "bg-red-50 text-red-700";
    }

    return (
        <main className="min-h-screen bg-[#f3f7f3]">

            <header className="border-b border-[#dfe9df] bg-white">
                <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">

                    <div className="flex items-center gap-3">

                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#00a651] text-white">
                            <Smartphone
                                size={20}
                            />
                        </div>

                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#00a651]">
                                M-Pesa
                            </p>

                            <p className="text-sm font-semibold text-slate-900">
                                Payment Console
                            </p>
                        </div>

                    </div>

                    <Link
                        to="/payments"
                        className="rounded-xl bg-[#00a651] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#008f45]"
                    >
                        New Payment
                    </Link>

                </div>
            </header>

            <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">

                <Link
                    to="/transactions"
                    className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-[#00a651]"
                >
                    <ArrowLeft
                        size={17}
                    />

                    Transactions
                </Link>

                {error && transaction && (
                    <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                        Unable to refresh payment status. Showing the latest available transaction information.
                    </div>
                )}

                <div className="overflow-hidden rounded-2xl border border-[#e0e9e1] bg-white">

                    <div className="border-b border-slate-100 p-6 sm:p-8">

                        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">

                            <div>
                                <p className="text-sm text-slate-500">
                                    Transaction
                                </p>

                                <h1 className="mt-1 text-2xl font-semibold text-slate-900">
                                    {transaction.account_reference ||
                                        "Payment"}
                                </h1>
                            </div>

                            <div
                                className={`inline-flex w-fit items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold ${getStatusStyle()}`}
                            >
                                <StatusIcon
                                    size={17}
                                />

                                {status}
                            </div>

                        </div>

                        <div className="mt-8">

                            <p className="text-sm text-slate-500">
                                Amount
                            </p>

                            <p className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
                                KES{" "}
                                {Number(
                                    transaction.amount ||
                                        0
                                ).toLocaleString()}
                            </p>

                        </div>

                        {isPending && (
                            <div className="mt-6 border-l-2 border-amber-400 pl-4">

                                <div className="flex items-center gap-2">

                                    <span className="h-2 w-2 animate-pulse rounded-full bg-amber-500" />

                                    <p className="text-sm font-medium text-slate-700">
                                        Waiting for payment confirmation
                                    </p>

                                </div>

                                <p className="mt-1 text-sm text-slate-500">
                                    Reconciliation attempts:{" "}
                                    {transaction.reconciliation_attempts ??
                                        0}{" "}
                                    of 5
                                </p>

                                <p className="mt-1 text-xs text-slate-400">
                                    Payment status updates automatically.
                                </p>

                            </div>
                        )}

                    </div>

                    {isSuccess &&
                        transaction.mpesa_receipt_number && (
                            <div className="border-b border-slate-100 bg-[#f7fcf8] px-6 py-5 sm:px-8">

                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    M-Pesa Receipt
                                </p>

                                <p className="mt-1 font-mono text-xl font-semibold text-[#087a2f]">
                                    {
                                        transaction.mpesa_receipt_number
                                    }
                                </p>

                            </div>
                        )}

                    <div className="p-6 sm:p-8">

                        <h2 className="text-base font-semibold text-slate-900">
                            Payment details
                        </h2>

                        <div className="mt-6 grid gap-x-12 gap-y-7 md:grid-cols-2">

                            <Detail
                                label="Phone Number"
                                value={
                                    transaction.phone_number
                                }
                            />

                            <Detail
                                label="Account Reference"
                                value={
                                    transaction.account_reference
                                }
                            />

                            <Detail
                                label="Checkout Request ID"
                                value={
                                    transaction.checkout_request_id
                                }
                                mono
                            />

                            <Detail
                                label="Merchant Request ID"
                                value={
                                    transaction.merchant_request_id
                                }
                                mono
                            />

                            <Detail
                                label="Result Code"
                                value={
                                    transaction.result_code
                                }
                            />

                            <Detail
                                label="Callback Received"
                                value={
                                    transaction.callback_received
                                        ? "Yes"
                                        : "No"
                                }
                            />

                            <Detail
                                label="Created"
                                value={formatDate(
                                    transaction.created_at
                                )}
                            />

                            <Detail
                                label="Last Updated"
                                value={formatDate(
                                    transaction.updated_at
                                )}
                            />

                        </div>

                        <div className="my-8 border-t border-slate-100" />

                        <h2 className="text-base font-semibold text-slate-900">
                            Reconciliation
                        </h2>

                        <div className="mt-6 grid gap-x-12 gap-y-7 md:grid-cols-2">

                            <Detail
                                label="Attempts"
                                value={`${
                                    transaction.reconciliation_attempts ??
                                    0
                                } / 5`}
                            />

                            <Detail
                                label="Last Reconciliation"
                                value={formatDate(
                                    transaction.last_reconciliation_at
                                )}
                            />

                            <Detail
                                label="Next Reconciliation"
                                value={
                                    isPending
                                        ? formatDate(
                                              transaction.next_reconciliation_at
                                          )
                                        : "Not required"
                                }
                            />

                        </div>

                        {transaction.result_description && (
                            <>
                                <div className="my-8 border-t border-slate-100" />

                                <div>

                                    <p className="text-sm font-medium text-slate-500">
                                        Result Description
                                    </p>

                                    <p className="mt-2 text-sm leading-6 text-slate-800">
                                        {
                                            transaction.result_description
                                        }
                                    </p>

                                </div>
                            </>
                        )}

                    </div>
                </div>

                <p className="mt-4 text-center text-xs text-slate-400">
                    Checkout Request ID:{" "}
                    {
                        transaction.checkout_request_id
                    }
                </p>

            </div>
        </main>
    );
}

function Detail({
    label,
    value,
    mono = false,
}) {
    return (
        <div>

            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                {label}
            </p>

            <p
                className={`mt-1.5 break-words text-sm font-medium text-slate-800 ${
                    mono
                        ? "font-mono"
                        : ""
                }`}
            >
                {value ?? "Not available"}
            </p>

        </div>
    );
}

function formatDate(value) {
    if (!value) {
        return "Not available";
    }

    return new Date(
        value
    ).toLocaleString();
}

export default TransactionDetailsPage;