import "dotenv/config"
import app from "./src/app.js";
import { reconcilePendingPayments, } from "./src/jobs/reconcilePendingPayments.js";

const port = process.env.PORT || 5000;

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

reconcilePendingPayments();

    // check every 60 seconds
    setInterval(
        reconcilePendingPayments,
        60 * 1000
    );

