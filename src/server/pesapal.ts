import "dotenv/config";

export const PESAPAL_BASE_URL =
  process.env.PESAPAL_ENV === "production"
    ? "https://pay.pesapal.com/v3/api"
    : "https://cybqa.pesapal.com/pesapalv3/api";

export const getPesapalToken = async () => {
  const url = `${PESAPAL_BASE_URL}/Auth/RequestToken`;
  const req = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      consumer_key: process.env.PESAPAL_CONSUMER_KEY,
      consumer_secret: process.env.PESAPAL_CONSUMER_SECRET,
    }),
  });
  const data = await req.json();
  if (data.error) throw new Error(data.error.message || "Failed to get token");
  return data.token;
};

export const submitPesapalOrder = async (
  token: string,
  options: {
    id: string;
    amount: number;
    email: string;
    phone: string;
    firstName: string;
    lastName: string;
    merchantReference?: string;
  },
) => {
  const url = `${PESAPAL_BASE_URL}/Transactions/SubmitOrderRequest`;
  // The callback URL should be our absolute URL, which we don't have trivially in this generic module without request context.
  // We'll use a placeholder or read from env.
  const baseUrl = process.env.PUBLIC_APP_URL || "http://localhost:3000";

  const payload = {
    id: options.merchantReference || options.id,
    currency: "KES",
    amount: options.amount,
    description: "Ameer Expo VIP Pass",
    callback_url: `${baseUrl}/register?rid=${options.id}`,
    notification_id: process.env.PESAPAL_IPN_ID,
    billing_address: {
      email_address: options.email,
      phone_number: options.phone,
      country_code: "KE",
      first_name: options.firstName,
      last_name: options.lastName,
      line_1: "Nairobi",
      line_2: "",
      city: "Nairobi",
      state: "Nairobi",
      postal_code: "",
      zip_code: "",
    },
  };

  const req = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const data = await req.json();
  if (data.error) throw new Error(data.error.message || "Failed to submit order");
  return data; // contains redirect_url, order_tracking_id
};
