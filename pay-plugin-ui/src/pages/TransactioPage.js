import {
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    Link,
    useNavigate,
} from "react-router-dom";

import {
    ArrowLeft,
    ChevronRight,
    RefreshCw,
    Search,
    Smartphone,
} from "lucide-react";

import {
    getAllMpesaTransactions,
} from "../services/mpesaApi";

export default function TransactionsPage() {
    const navigate = useNavigate();

    const [transactions, setTransactions] =
        useState([]);

    const [loading, setLoading] =
        useState(true);

    const [refreshing, setRefreshing] =
        useState(false);

    const [error, setError] =
        useState("");

    const [search, setSearch] =
        useState("");

    const [statusFilter, setStatusFilter] =
        useState("ALL");

    async function loadTransactions(
        manualRefresh = false
    ) {
        try {
            if (manualRefresh) {
                setRefreshing(true);
            }

            const data =
                await getAllMpesaTransactions();

            setTransactions(data);
            setError("");
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
            setRefreshing(false);
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
                search
                    .trim()
                    .toLowerCase();

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
            return "bg-[#e8f8ec] text-[#087a2f]";
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
            return "bg-slate-100 text-slate-600";
        }

        return "bg-red-50 text-red-700";
    }

    function openTransaction(transaction) {
        if (
            !transaction.checkout_request_id
        ) {
            return;
        }

        navigate(
            `/transactions/${transaction.checkout_request_id}`
        );
    }

    function formatPhone(phone) {
        if (!phone) {
            return "-";
        }

        return phone;
    }

    function formatDate(date) {
        if (!date) {
            return "-";
        }

        return new Date(
            date
        ).toLocaleString();
    }

    return (
        <main className="min-h-screen bg-[#f3f7f3]">
            <div className="border-b border-[#dfe9df] bg-white">
                <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">

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
            </div>

            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

                <div className="mb-7 flex flex-wrap items-end justify-between gap-4">

                    <div>
                        <Link
                            to="/"
                            className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-[#00a651]"
                        >
                            <ArrowLeft
                                size={17}
                            />
                            Dashboard
                        </Link>

                        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                            Transactions
                        </h1>

                        <p className="mt-2 text-sm text-slate-500">
                            Monitor and review your M-Pesa payment activity.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() =>
                            loadTransactions(
                                true
                            )
                        }
                        disabled={refreshing}
                        className="flex items-center gap-2 rounded-xl border border-[#d8e5da] bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-[#00a651] hover:text-[#008f45] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        <RefreshCw
                            size={16}
                            className={
                                refreshing
                                    ? "animate-spin"
                                    : ""
                            }
                        />

                        {refreshing
                            ? "Refreshing..."
                            : "Refresh"}
                    </button>
                </div>

                <div className="mb-6 h-1 w-16 rounded-full bg-[#00a651]" />

                <div className="mb-5 rounded-2xl border border-[#e0e9e1] bg-white p-4 shadow-sm">

                    <div className="grid gap-3 md:grid-cols-[1fr_220px]">

                        <div className="relative">
                            <Search
                                size={18}
                                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                            />

                            <input
                                type="text"
                                value={search}
                                onChange={(
                                    event
                                ) =>
                                    setSearch(
                                        event
                                            .target
                                            .value
                                    )
                                }
                                placeholder="Search reference, phone or receipt"
                                className="w-full rounded-xl border border-slate-200 bg-[#f8faf8] py-3 pl-11 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#00a651] focus:bg-white focus:ring-4 focus:ring-green-50"
                            />
                        </div>

                        <select
                            value={
                                statusFilter
                            }
                            onChange={(
                                event
                            ) =>
                                setStatusFilter(
                                    event
                                        .target
                                        .value
                                )
                            }
                            className="w-full rounded-xl border border-slate-200 bg-[#f8faf8] px-4 py-3 text-sm font-medium text-slate-700 outline-none transition focus:border-[#00a651] focus:bg-white focus:ring-4 focus:ring-green-50"
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
                </div>

                {error && (
                    <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                        {error}
                    </div>
                )}

                <div className="overflow-hidden rounded-2xl border border-[#e0e9e1] bg-white shadow-sm">

                    <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                        <div>
                            <h2 className="font-semibold text-slate-900">
                                Payment History
                            </h2>

                            <p className="mt-1 text-xs text-slate-500">
                                Click a transaction to view its full details.
                            </p>
                        </div>

                        <div className="rounded-full bg-[#e8f8ec] px-3 py-1 text-xs font-semibold text-[#087a2f]">
                            {
                                filteredTransactions.length
                            }{" "}
                            records
                        </div>
                    </div>

                    <div className="overflow-x-auto">

                        <table className="w-full text-left">

                            <thead className="border-b border-slate-100 bg-[#f8faf8]">
                                <tr className="text-xs font-semibold uppercase tracking-wide text-slate-500">

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

                                    <th className="w-12 px-5 py-4" />
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-slate-100">

                                {loading ? (
                                    <tr>
                                        <td
                                            colSpan="7"
                                            className="px-5 py-14 text-center"
                                        >
                                            <RefreshCw
                                                size={22}
                                                className="mx-auto mb-3 animate-spin text-[#00a651]"
                                            />

                                            <p className="text-sm text-slate-500">
                                                Loading transactions...
                                            </p>
                                        </td>
                                    </tr>
                                ) : filteredTransactions.length ===
                                  0 ? (
                                    <tr>
                                        <td
                                            colSpan="7"
                                            className="px-5 py-14 text-center"
                                        >
                                            <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-[#e8f8ec] text-[#00a651]">
                                                <Search
                                                    size={19}
                                                />
                                            </div>

                                            <p className="font-medium text-slate-700">
                                                No transactions found
                                            </p>

                                            <p className="mt-1 text-sm text-slate-400">
                                                Try changing your search or status filter.
                                            </p>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredTransactions.map(
                                        (
                                            transaction
                                        ) => {
                                            const canOpen =
                                                Boolean(
                                                    transaction.checkout_request_id
                                                );

                                            return (
                                                <tr
                                                    key={
                                                        transaction.id
                                                    }
                                                    onClick={() =>
                                                        openTransaction(
                                                            transaction
                                                        )
                                                    }
                                                    onKeyDown={(
                                                        event
                                                    ) => {
                                                        if (
                                                            canOpen &&
                                                            (
                                                                event.key ===
                                                                    "Enter" ||
                                                                event.key ===
                                                                    " "
                                                            )
                                                        ) {
                                                            event.preventDefault();

                                                            openTransaction(
                                                                transaction
                                                            );
                                                        }
                                                    }}
                                                    tabIndex={
                                                        canOpen
                                                            ? 0
                                                            : -1
                                                    }
                                                    role={
                                                        canOpen
                                                            ? "link"
                                                            : undefined
                                                    }
                                                    className={
                                                        canOpen
                                                            ? "group cursor-pointer transition hover:bg-[#f4fbf6] focus:bg-[#f4fbf6] focus:outline-none"
                                                            : "bg-slate-50/40"
                                                    }
                                                >

                                                    <td className="px-5 py-4">
                                                        <p className="text-sm font-semibold text-slate-900 transition group-hover:text-[#008f45]">
                                                            {transaction.account_reference ||
                                                                "-"}
                                                        </p>

                                                        <p className="mt-1 max-w-[190px] truncate text-xs text-slate-400">
                                                            {transaction.checkout_request_id ||
                                                                "Waiting for Checkout Request ID"}
                                                        </p>
                                                    </td>

                                                    <td className="px-5 py-4 text-sm font-medium text-slate-700">
                                                        {formatPhone(
                                                            transaction.phone_number
                                                        )}
                                                    </td>

                                                    <td className="px-5 py-4">
                                                        <p className="text-sm font-bold text-slate-900">
                                                            KES{" "}
                                                            {Number(
                                                                transaction.amount ||
                                                                    0
                                                            ).toLocaleString()}
                                                        </p>
                                                    </td>

                                                    <td className="px-5 py-4">
                                                        {transaction.mpesa_receipt_number ? (
                                                            <span className="font-mono text-sm font-semibold text-[#087a2f]">
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
                                                            className={`inline-flex rounded-full px-3 py-1.5 text-xs font-semibold ${getStatusStyle(
                                                                transaction.transaction_status
                                                            )}`}
                                                        >
                                                            {
                                                                transaction.transaction_status
                                                            }
                                                        </span>
                                                    </td>

                                                    <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-500">
                                                        {formatDate(
                                                            transaction.created_at
                                                        )}
                                                    </td>

                                                    <td className="px-5 py-4 text-right">
                                                        {canOpen && (
                                                            <ChevronRight
                                                                size={18}
                                                                className="text-slate-300 transition group-hover:translate-x-1 group-hover:text-[#00a651]"
                                                            />
                                                        )}
                                                    </td>

                                                </tr>
                                            );
                                        }
                                    )
                                )}

                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">

                    <p className="text-sm text-slate-500">
                        Showing{" "}
                        <span className="font-semibold text-slate-700">
                            {
                                filteredTransactions.length
                            }
                        </span>{" "}
                        of{" "}
                        <span className="font-semibold text-slate-700">
                            {
                                transactions.length
                            }
                        </span>{" "}
                        transactions
                    </p>

                    <p className="text-xs text-slate-400">
                        Payment data refreshes automatically every 5 seconds.
                    </p>

                </div>
            </div>
        </main>
    );
}