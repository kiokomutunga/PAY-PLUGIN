import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, RefreshCw, Search, } from "lucide-react";

import { getAllMpesaTransactions, } from "../services/mpesaApi";

export default function TransactionsPage() {
    const [transactions, setTransactions] = useState([]);

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState("");

    const [search, setSearch] = useState("");

    const [statusFilter, setStatusFilter] = useState("ALL");

    async function loadTransactions() {
        try {
            const data =
                await getAllMpesaTransactions();

            setTransactions(data);
            setError("");
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadTransactions();

        const interval = setInterval(
            loadTransactions,
            5000
        );

        return () =>
            clearInterval(interval);
    }, []);

    const filteredTransactions =
        useMemo(() => {
            const normalizedSearch =
                search.trim().toLowerCase();

            return transactions.filter(
                (transaction) => {
                    const matchesStatus =
                        statusFilter === "ALL" ||
                        transaction.transaction_status ===
                            statusFilter;

                    const matchesSearch =
                        !normalizedSearch ||
                        String(
                            transaction.account_reference ||
                                ""
                        )
                            .toLowerCase()
                            .includes(
                                normalizedSearch
                            ) ||
                        String(
                            transaction.phone_number ||
                                ""
                        )
                            .toLowerCase()
                            .includes(
                                normalizedSearch
                            ) ||
                        String(
                            transaction.mpesa_receipt_number ||
                                ""
                        )
                            .toLowerCase()
                            .includes(
                                normalizedSearch
                            );

                    return (
                        matchesStatus &&
                        matchesSearch
                    );
                }
            );
        }, [
            transactions,
            search,
            statusFilter,
        ]);

    function getStatusStyle(status) {
        if (status === "SUCCESS") {
            return "bg-green-50 text-green-700";
        }

        if (
            status === "PENDING" ||
            status === "INITIATING"
        ) {
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
        <main className="min-h-screen bg-[#eef3ed] p-4 sm:p-6 lg:p-8">
            <div className="mx-auto max-w-7xl">

                {/* Header */}
                <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Link
                            to="/"
                            className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-600 transition hover:bg-slate-50"
                        >
                            <ArrowLeft size={18} />
                        </Link>

                        <div>
                            <p className="text-sm text-slate-500">
                                Payment history
                            </p>

                            <h1 className="text-2xl font-semibold text-slate-900">
                                Transactions
                            </h1>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={
                                loadTransactions
                            }
                            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-50"
                        >
                            <RefreshCw size={16} />
                            Refresh
                        </button>

                        <Link
                            to="/payments"
                            className="rounded-xl bg-[#16351f] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#204b2d]"
                        >
                            New Payment
                        </Link>
                    </div>
                </div>

                {/* Filters */}
                <div className="mb-5 grid gap-3 rounded-2xl bg-white p-4 md:grid-cols-[1fr_220px]">

                    <div className="relative">
                        <Search
                            size={17}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                        />

                        <input
                            type="text"
                            value={search}
                            onChange={(event) =>
                                setSearch(
                                    event.target.value
                                )
                            }
                            placeholder="Search reference, phone or receipt"
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-green-500 focus:bg-white focus:ring-2 focus:ring-green-100"
                        />
                    </div>

                    <select
                        value={statusFilter}
                        onChange={(event) =>
                            setStatusFilter(
                                event.target.value
                            )
                        }
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none focus:border-green-500 focus:bg-white"
                    >
                        <option value="ALL">
                            All statuses
                        </option>

                        <option value="SUCCESS">
                            Successful
                        </option>

                        <option value="PENDING">
                            Pending
                        </option>

                        <option value="INITIATING">
                            Initiating
                        </option>

                        <option value="FAILED">
                            Failed
                        </option>

                        <option value="CANCELLED">
                            Cancelled
                        </option>

                        <option value="TIMEOUT">
                            Timeout
                        </option>

                        <option value="INITIATION_FAILED">
                            Initiation failed
                        </option>
                    </select>

                </div>

                {error && (
                    <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                        {error}
                    </div>
                )}

                {/* Table */}
                <div className="overflow-hidden rounded-2xl bg-white">

                    <div className="overflow-x-auto">

                        <table className="w-full text-left">

                            <thead className="border-b border-slate-100 bg-slate-50">

                                <tr className="text-xs font-medium uppercase tracking-wide text-slate-500">

                                    <th className="px-5 py-4">
                                        Reference
                                    </th>

                                    <th className="px-5 py-4">
                                        Phone
                                    </th>

                                    <th className="px-5 py-4">
                                        Amount
                                    </th>

                                    <th className="px-5 py-4">
                                        Receipt
                                    </th>

                                    <th className="px-5 py-4">
                                        Status
                                    </th>

                                    <th className="px-5 py-4">
                                        Date
                                    </th>

                                </tr>

                            </thead>

                            <tbody className="divide-y divide-slate-100">

                                {loading ? (

                                    <tr>
                                        <td
                                            colSpan="6"
                                            className="px-5 py-10 text-center text-sm text-slate-500"
                                        >
                                            Loading transactions...
                                        </td>
                                    </tr>

                                ) : filteredTransactions.length ===
                                  0 ? (

                                    <tr>
                                        <td
                                            colSpan="6"
                                            className="px-5 py-10 text-center text-sm text-slate-500"
                                        >
                                            No transactions found.
                                        </td>
                                    </tr>

                                ) : (

                                    filteredTransactions.map(
                                        (
                                            transaction
                                        ) => (

                                            <tr
                                                key={
                                                    transaction.id
                                                }
                                                className="transition hover:bg-slate-50/70"
                                            >

                                                <td className="px-5 py-4">
                                                    <p className="text-sm font-medium text-slate-900">
                                                        {transaction.account_reference ||
                                                            "-"}
                                                    </p>

                                                    <p className="mt-1 max-w-[180px] truncate text-xs text-slate-400">
                                                        {
                                                            transaction.checkout_request_id
                                                        }
                                                    </p>
                                                </td>

                                                <td className="px-5 py-4 text-sm text-slate-700">
                                                    {
                                                        transaction.phone_number
                                                    }
                                                </td>

                                                <td className="px-5 py-4 text-sm font-semibold text-slate-900">
                                                    KES{" "}
                                                    {Number(
                                                        transaction.amount ||
                                                            0
                                                    ).toLocaleString()}
                                                </td>

                                                <td className="px-5 py-4">
                                                    {transaction.mpesa_receipt_number ? (
                                                        <span className="font-mono text-sm font-medium text-green-700">
                                                            {
                                                                transaction.mpesa_receipt_number
                                                            }
                                                        </span>
                                                    ) : (
                                                        <span className="text-sm text-slate-400">
                                                            —
                                                        </span>
                                                    )}
                                                </td>

                                                <td className="px-5 py-4">
                                                    <span
                                                        className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${getStatusStyle(
                                                            transaction.transaction_status
                                                        )}`}
                                                    >
                                                        {
                                                            transaction.transaction_status
                                                        }
                                                    </span>
                                                </td>

                                                <td className="px-5 py-4 text-sm text-slate-500">
                                                    {transaction.created_at
                                                        ? new Date(
                                                              transaction.created_at
                                                          ).toLocaleString()
                                                        : "-"}
                                                </td>

                                            </tr>

                                        )
                                    )

                                )}

                            </tbody>

                        </table>

                    </div>
                </div>

                <p className="mt-4 text-sm text-slate-500">
                    Showing{" "}
                    {
                        filteredTransactions.length
                    }{" "}
                    of {transactions.length} transactions
                </p>

            </div>
        </main>
    );
}