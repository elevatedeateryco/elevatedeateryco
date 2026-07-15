/**
 * Elevated Eatery Co. — Square Checkout Worker
 *
 * Store these as Cloudflare Worker secrets:
 * SQUARE_ACCESS_TOKEN
 * SQUARE_LOCATION_ID
 * SQUARE_ENVIRONMENT = production (or sandbox while testing)
 *
 * Never place the access token in GitHub or browser JavaScript.
 */

const ALLOWED_ORIGINS = new Set([
  "https://elevatedeateryco.com",
  "https://www.elevatedeateryco.com",
  "https://elevatedeateryco.pages.dev"
]);

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const cors = {
      "Access-Control-Allow-Origin": ALLOWED_ORIGINS.has(origin) ? origin : "https://elevatedeateryco.com",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Vary": "Origin"
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: cors });
    }

    if (request.method !== "POST") {
      return json({ error: "Method not allowed" }, 405, cors);
    }

    try {
      const order = await request.json();
      validateOrder(order);

      const lineItems = [];

      for (const meal of order.signatureMeals || []) {
        lineItems.push({
          name: meal.name,
          quantity: String(meal.quantity),
          base_price_money: {
            amount: Math.round(customUnitPrice * 100),
            currency: "USD"
          },
          note: `${order.plan.preparation} meal`
        });
      }

      for (const [index, bowl] of (order.customBowls || []).entries()) {
        const customUnitPrice = priceForPreparation(order.plan, bowl.preparation);
        lineItems.push({
          name: `Make Your Own Bowl ${index + 1}`,
          quantity: "1",
          base_price_money: {
            amount: Math.round(order.plan.unitPrice * 100),
            currency: "USD"
          },
          note: [
            `Preparation: ${bowl.preparation}`,
            `Protein: ${bowl.protein}`,
            `Sides: ${bowl.sides.join(", ")}`,
            bowl.note ? `Instructions: ${bowl.note}` : ""
          ].filter(Boolean).join(" | ")
        });
      }

      if (order.fulfillment?.fee > 0) {
        lineItems.push({
          name: order.fulfillment.fee === 75
            ? "Delivery — More Than 25 Miles"
            : "Delivery — Within 25 Miles",
          quantity: "1",
          base_price_money: {
            amount: Math.round(order.fulfillment.fee * 100),
            currency: "USD"
          },
          note: `Delivery ZIP: ${order.fulfillment.zip}`
        });
      }

      const host = env.SQUARE_ENVIRONMENT === "sandbox"
        ? "https://connect.squareupsandbox.com"
        : "https://connect.squareup.com";

      const squareResponse = await fetch(`${host}/v2/online-checkout/payment-links`, {
        method: "POST",
        headers: {
          "Square-Version": "2026-05-20",
          "Authorization": `Bearer ${env.SQUARE_ACCESS_TOKEN}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          idempotency_key: crypto.randomUUID(),
          order: {
            location_id: env.SQUARE_LOCATION_ID,
            reference_id: `EE-${Date.now()}`,
            line_items: lineItems,
            note: [
              `Customer: ${order.customer.name}`,
              `Phone: ${order.customer.phone}`,
              `Email: ${order.customer.email}`,
              `Plan: ${order.plan.label}`,
              `Fulfillment: ${order.fulfillment.method}`,
              order.notes ? `Order notes: ${order.notes}` : ""
            ].filter(Boolean).join("\n")
          },
          checkout_options: {
            redirect_url: "https://elevatedeateryco.com/?order=success",
            ask_for_shipping_address: order.fulfillment.method === "delivery",
            merchant_support_email: "elevatedeateryco@gmail.com",
            allow_tipping: true
          },
          pre_populated_data: {
            buyer_email: order.customer.email,
            buyer_phone_number: order.customer.phone
          },
          payment_note: `Elevated Eatery Co. — ${order.plan.label}`
        })
      });

      const squareData = await squareResponse.json();
      if (!squareResponse.ok) {
        console.error(JSON.stringify(squareData));
        return json({ error: "Square could not create checkout." }, 502, cors);
      }

      return json({ checkoutUrl: squareData.payment_link.url }, 200, cors);
    } catch (error) {
      console.error(error);
      return json({ error: error.message || "Invalid order" }, 400, cors);
    }
  }
};

function validateOrder(order) {
  if (!order?.customer?.name || !order?.customer?.email || !order?.customer?.phone) {
    throw new Error("Customer information is required.");
  }
  const totalMeals =
    (order.signatureMeals || []).reduce((sum, meal) => sum + Number(meal.quantity || 0), 0) +
    (order.customBowls || []).length;

  if (totalMeals < Number(order?.plan?.minimum || 1)) {
    throw new Error("The order does not meet the plan minimum.");
  }
  for (const bowl of order.customBowls || []) {
    if (!["Standard", "Halal"].includes(bowl.preparation)) {
      throw new Error("Every custom bowl requires Regular or Halal preparation.");
    }
    if (!bowl.protein || !Array.isArray(bowl.sides) || bowl.sides.length !== 2) {
      throw new Error("Every custom bowl requires one protein and two sides.");
    }
  }
}

function priceForPreparation(plan, preparation) {
  const minimum = Number(plan?.minimum || 1);
  const tier = minimum >= 25 ? "monthly" : minimum >= 10 ? "ten" : "single";
  const prices = {
    single: { Standard: 15, Halal: 18 },
    ten: { Standard: 14, Halal: 16 },
    monthly: { Standard: 13, Halal: 15 }
  };
  return prices[tier][preparation];
}

function json(body, status, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...extraHeaders
    }
  });
}
