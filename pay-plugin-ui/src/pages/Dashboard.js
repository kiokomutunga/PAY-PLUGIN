import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
    LayoutDashboard,
    ArrowLeftRight,
    Smartphone,
    RefreshCw,
    CheckCircle2,
    Clock3,
    XCircle,
    Wallet,
} from "lucide-react";

import { getAllMpesaTransactions } from "../services/mpesaApi";

export default function Dashboard() {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    async function loadTransactions() {
        try {
            const data = await getAllMpesaTransactions();

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

        return () => clearInterval(interval);
    }, []);

    const successfulTransactions =
        transactions.filter(
            (transaction) =>
                transaction.transaction_status ===
                "SUCCESS"
        );

    const pendingTransactions =
        transactions.filter(
            (transaction) =>
                transaction.transaction_status ===
                    "PENDING" ||
                transaction.transaction_status ===
                    "INITIATING"
        );

    const failedTransactions =
        transactions.filter(
            (transaction) =>
                [
                    "FAILED",
                    "CANCELLED",
                    "TIMEOUT",
                    "INITIATION_FAILED",
                ].includes(
                    transaction.transaction_status
                )
        );

    const totalRevenue =
        successfulTransactions.reduce(
            (total, transaction) =>
                total +
                Number(transaction.amount || 0),
            0
        );

    const completedTransactions =
        successfulTransactions.length +
        failedTransactions.length;

    const successRate =
        completedTransactions > 0
            ? (
                  (successfulTransactions.length /
                      completedTransactions) *
                  100
              ).toFixed(1)
            : "0.0";

    const recentTransactions =
        transactions.slice(0, 6);

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

        return "bg-red-50 text-red-700";
    }

    return (
        <div className="min-h-screen bg-[#eef3ed]">
            <div className="flex min-h-screen">

                {/* Sidebar */}
                <aside className="hidden w-64 border-r border-slate-200 bg-white p-5 md:block">

                    <div className="mb-8 flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#16351f] text-sm font-bold text-green-400">
                            P
                        </div>

                        <div>
                            <p className="font-semibold text-slate-900">
                                Pay Plugin
                            </p>

                            <p className="text-xs text-slate-400">
                                M-Pesa Dashboard
                            </p>
                        </div>
                    </div>

                    <nav className="space-y-2">

                        <Link
                            to="/"
                            className="flex items-center gap-3 rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white"
                        >
                            <LayoutDashboard size={18} />
                            Dashboard
                        </Link>

                        <Link
                            to="/payments"
                            className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-slate-600 transition hover:bg-slate-100"
                        >
                            <Smartphone size={18} />
                            M-Pesa Payment
                        </Link>

                        <Link
                            to="/transactions"
                            className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-slate-600 transition hover:bg-slate-100"
                        >
                            <ArrowLeftRight size={18} />
                            Transactions
                        </Link>

                    </nav>
                </aside>

                {/* Main content */}
                <main className="flex-1 p-5 md:p-8">

                    {/* Header */}
                    <div className="mb-8 flex flex-wrap items-center justify-between gap-4">

                        <div>
                            <p className="text-sm text-slate-500">
                                Payment overview
                            </p>

                            <h1 className="text-2xl font-semibold text-slate-900">
                                Dashboard
                            </h1>
                        </div>

                        <div className="flex items-center gap-3">

                            <button
                                type="button"
                                onClick={loadTransactions}
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

                    {error && (
                        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                            {error}
                        </div>
                    )}

                    {/* Stats */}
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

                        <StatCard
                            title="Total Collected"
                            value={`KES ${totalRevenue.toLocaleString()}`}
                            icon={Wallet}
                            iconStyle="bg-green-50 text-green-700"
                        />

                        <StatCard
                            title="Successful"
                            value={successfulTransactions.length}
                            icon={CheckCircle2}
                            iconStyle="bg-green-50 text-green-700"
                        />

                        <StatCard
                            title="Pending"
                            value={pendingTransactions.length}
                            icon={Clock3}
                            iconStyle="bg-amber-50 text-amber-700"
                        />

                        <StatCard
                            title="Failed"
                            value={failedTransactions.length}
                            icon={XCircle}
                            iconStyle="bg-red-50 text-red-700"
                        />

                    </div>

                    {/* Second row */}
                    <div className="mt-6 grid gap-6 lg:grid-cols-3">

                        {/* Payment summary */}
                        <div className="rounded-2xl bg-[#16351f] p-6 text-white">

                            <p className="text-sm text-white/60">
                                Overall success rate
                            </p>

                            <p className="mt-2 text-4xl font-semibold">
                                {successRate}%
                            </p>

                            <div className="mt-6 grid grid-cols-2 gap-4">

                                <div className="rounded-xl bg-white/10 p-4">
                                    <p className="text-xs text-white/60">
                                        Total transactions
                                    </p>

                                    <p className="mt-1 text-xl font-medium">
                                        {transactions.length}
                                    </p>
                                </div>

                                <div className="rounded-xl bg-white/10 p-4">
                                    <p className="text-xs text-white/60">
                                        Pending
                                    </p>

                                    <p className="mt-1 text-xl font-medium">
                                        {pendingTransactions.length}
                                    </p>
                                </div>

                            </div>
                        </div>

                        {/* Status breakdown */}
                        <div className="rounded-2xl bg-white p-6 lg:col-span-2">

                            <div className="mb-5 flex items-center justify-between">
                                <div>
                                    <h2 className="font-semibold text-slate-900">
                                        Payment status
                                    </h2>

                                    <p className="text-sm text-slate-400">
                                        Live transaction distribution
                                    </p>
                                </div>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-3">

                                <StatusBox
                                    label="Successful"
                                    value={
                                        successfulTransactions.length
                                    }
                                    style="bg-green-50 text-green-700"
                                />

                                <StatusBox
                                    label="Pending"
                                    value={
                                        pendingTransactions.length
                                    }
                                    style="bg-amber-50 text-amber-700"
                                />

                                <StatusBox
                                    label="Failed"
                                    value={
                                        failedTransactions.length
                                    }
                                    style="bg-red-50 text-red-700"
                                />

                            </div>
                        </div>

                    </div>

                    {/* Recent transactions */}
                    <div className="mt-6 rounded-2xl bg-white p-6">

                        <div className="mb-5 flex items-center justify-between">

                            <div>
                                <h2 className="font-semibold text-slate-900">
                                    Recent Transactions
                                </h2>

                                <p className="text-sm text-slate-400">
                                    Latest M-Pesa payment activity
                                </p>
                            </div>

                            <Link
                                to="/transactions"
                                className="text-sm font-medium text-green-700"
                            >
                                View all
                            </Link>

                        </div>

                        {loading ? (
                            <p className="text-sm text-slate-500">
                                Loading transactions...
                            </p>
                        ) : recentTransactions.length === 0 ? (
                            <div className="rounded-xl bg-slate-50 p-6 text-center text-sm text-slate-500">
                                No transactions yet.
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100">

                                {recentTransactions.map(
                                    (transaction) => (

                                        <div
                                            key={transaction.id}
                                            className="flex flex-wrap items-center gap-4 py-4"
                                        >

                                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50 font-semibold text-green-700">
                                                M
                                            </div>

                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm font-medium text-slate-900">
                                                    {
                                                        transaction.account_reference ||
                                                        "M-Pesa Payment"
                                                    }
                                                </p>

                                                <p className="mt-1 text-xs text-slate-400">
                                                    {
                                                        transaction.phone_number
                                                    }
                                                </p>
                                            </div>

                                            <div className="text-right">
                                                <p className="text-sm font-semibold text-slate-900">
                                                    KES{" "}
                                                    {Number(
                                                        transaction.amount ||
                                                            0
                                                    ).toLocaleString()}
                                                </p>

                                                <span
                                                    className={`mt-1 inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getStatusStyle(
                                                        transaction.transaction_status
                                                    )}`}
                                                >
                                                    {
                                                        transaction.transaction_status
                                                    }
                                                </span>
                                            </div>

                                            <div className="hidden w-40 text-right sm:block">
                                                <p className="text-xs text-slate-400">
                                                    {new Date(
                                                        transaction.created_at
                                                    ).toLocaleString()}
                                                </p>

                                                {transaction.mpesa_receipt_number && (
                                                    <p className="mt-1 text-xs font-medium text-green-700">
                                                        {
                                                            transaction.mpesa_receipt_number
                                                        }
                                                    </p>
                                                )}
                                            </div>

                                        </div>

                                    )
                                )}

                            </div>
                        )}
                    </div>

                </main>
            </div>
        </div>
    );
}

function StatCard({
    title,
    value,
    icon: Icon,
    iconStyle,
}) {
    return (
        <div className="rounded-2xl bg-white p-5">
            <div className="flex items-center justify-between">

                <div>
                    <p className="text-sm text-slate-500">
                        {title}
                    </p>

                    <p className="mt-2 text-2xl font-semibold text-slate-900">
                        {value}
                    </p>
                </div>

                <div
                    className={`flex h-11 w-11 items-center justify-center rounded-xl ${iconStyle}`}
                >
                    <Icon size={20} />
                </div>

            </div>
        </div>
    );
}

function StatusBox({
    label,
    value,
    style,
}) {
    return (
        <div className={`rounded-xl p-4 ${style}`}>
            <p className="text-sm opacity-80">
                {label}
            </p>

            <p className="mt-2 text-2xl font-semibold">
                {value}
            </p>
        </div>
    );
}