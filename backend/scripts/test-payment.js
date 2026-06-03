/**
 * Manual end-to-end test for the Pakasir payment → subscription flow.
 *
 * Usage (from backend/ folder):
 *   node scripts/test-payment.js login    <email> <password>   -> prints a JWT
 *   node scripts/test-payment.js create   <JWT> <pro|premium>  -> creates payment, prints order_id + QR
 *   node scripts/test-payment.js status   <JWT> <order_id>     -> checks/forces a status re-check
 *   node scripts/test-payment.js simulate <order_id> <amount>  -> SANDBOX ONLY: marks the QR as paid
 *
 * Typical run:
 *   1) node scripts/test-payment.js login you@mail.com yourpass
 *   2) node scripts/test-payment.js create  <JWT> premium
 *   3) node scripts/test-payment.js simulate <order_id> 30000   (sandbox)
 *   4) node scripts/test-payment.js status  <JWT> <order_id>    -> should say "paid"
 */
require("dotenv").config();
const axios = require("axios");

const API = process.env.TEST_API_URL || "http://localhost:5000/api";
const PAKASIR_BASE_URL = process.env.PAKASIR_BASE_URL;
const PAKASIR_PROJECT = process.env.PAKASIR_PROJECT;
const PAKASIR_API_KEY = process.env.PAKASIR_API_KEY;

const [cmd, ...args] = process.argv.slice(2);

const log = (label, data) =>
  console.log(`\n=== ${label} ===\n`, JSON.stringify(data, null, 2));

async function main() {
  if (cmd === "login") {
    const [email, password] = args;
    const { data } = await axios.post(`${API}/auth/login`, { email, password });
    log("LOGIN OK — copy this accessToken", { accessToken: data.data.accessToken });
  } else if (cmd === "create") {
    const [jwt, plan] = args;
    const { data } = await axios.post(
      `${API}/user/payment/create`,
      { plan },
      { headers: { Authorization: `Bearer ${jwt}` } },
    );
    log("PAYMENT CREATED", data.data);
    console.log("\n→ order_id:", data.data.order_id);
    console.log("→ QR string (payment_number):", data.data.qr_string);
    console.log("→ Open payment page:", data.data.payment_url);
  } else if (cmd === "status") {
    const [jwt, orderId] = args;
    const { data } = await axios.get(
      `${API}/user/payment/status/${orderId}`,
      { headers: { Authorization: `Bearer ${jwt}` } },
    );
    log("STATUS", data.data);
  } else if (cmd === "simulate") {
    // Works only while the Pakasir project is in SANDBOX mode.
    const [orderId, amount] = args;
    const { data } = await axios.post(
      `${PAKASIR_BASE_URL}/api/paymentsimulation`,
      {
        project: PAKASIR_PROJECT,
        order_id: orderId,
        amount: Number(amount),
        api_key: PAKASIR_API_KEY,
      },
      { headers: { "Content-Type": "application/json" } },
    );
    log("SIMULATION (sandbox) RESPONSE", data);
    console.log("\nNow run the `status` command to let the backend confirm + upgrade the plan.");
  } else {
    console.log("Unknown command. See the comment block at the top of this file.");
  }
}

main().catch((e) => {
  console.error("\nERROR:", e.response?.status, e.response?.data || e.message);
  process.exit(1);
});
