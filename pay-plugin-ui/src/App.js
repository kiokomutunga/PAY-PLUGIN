import {
    BrowserRouter,
    Routes,
    Route,
} from "react-router-dom";

import Dashboard from "./pages/Dashboard";
import MpesaPaymentForm from "./components/MpesaPaymentForm";
import TransactionsPage from "./pages/TransactioPage";


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

                

            </Routes>
        </BrowserRouter>
    );
}