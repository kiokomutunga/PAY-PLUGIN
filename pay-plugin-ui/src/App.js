import {
    BrowserRouter,
    Routes,
    Route,
} from "react-router-dom";

import Dashboard from "./pages/Dashboard";
import MpesaPaymentForm from "./components/MpesaPaymentForm";
import TransactionsPage from "./pages/TransactioPage";
import TransactionDetailsPage from "./pages/TransactionDetailsPage";


export default function App() {
    return (
        <BrowserRouter>
            <Routes>

                <Route
                    path="/"
                    element={<Dashboard />}
                />

                <Route
                    path="/payments"
                    element={<MpesaPaymentForm />}
                />

                <Route
                  path="/transactions"
                  element={<TransactionsPage />}
                />

                <Route
                    path="/transactions/:checkoutRequestId"
                    element={<TransactionDetailsPage />}
/>

                

            </Routes>
        </BrowserRouter>
    );
}