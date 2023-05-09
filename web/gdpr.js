import { DeliveryMethod } from "@shopify/shopify-api";
import { supabase } from "./supabaseClient.js";

export default {
  /**
   * Customers can request their data from a store owner. When this happens,
   * Shopify invokes this webhook.
   *
   * https://shopify.dev/docs/apps/webhooks/configuration/mandatory-webhooks#customers-data_request
   */
  CUSTOMERS_DATA_REQUEST: {
    deliveryMethod: DeliveryMethod.Http,
    callbackUrl: "/api/webhooks",
    callback: async (topic, shop, body, webhookId) => {
      const payload = JSON.parse(body);
      // Payload has the following shape:
      // {
      //   "shop_id": 954889,
      //   "shop_domain": "{shop}.myshopify.com",
      //   "orders_requested": [
      //     299938,
      //     280263,
      //     220458
      //   ],
      //   "customer": {
      //     "id": 191167,
      //     "email": "john@example.com",
      //     "phone": "555-625-1199"
      //   },
      //   "data_request": {
      //     "id": 9999
      //   }
      // }
    },
  },

  /**
   * Store owners can request that data is deleted on behalf of a customer. When
   * this happens, Shopify invokes this webhook.
   *
   * https://shopify.dev/docs/apps/webhooks/configuration/mandatory-webhooks#customers-redact
   */
  CUSTOMERS_REDACT: {
    deliveryMethod: DeliveryMethod.Http,
    callbackUrl: "/api/webhooks",
    callback: async (topic, shop, body, webhookId) => {
      const payload = JSON.parse(body);
      // Payload has the following shape:
      // {
      //   "shop_id": 954889,
      //   "shop_domain": "{shop}.myshopify.com",
      //   "customer": {
      //     "id": 191167,
      //     "email": "john@example.com",
      //     "phone": "555-625-1199"
      //   },
      //   "orders_to_redact": [
      //     299938,
      //     280263,
      //     220458
      //   ]
      // }
    },
  },

  /**
   * 48 hours after a store owner uninstalls your app, Shopify invokes this
   * webhook.
   *
   * https://shopify.dev/docs/apps/webhooks/configuration/mandatory-webhooks#shop-redact
   */
  SHOP_REDACT: {
    deliveryMethod: DeliveryMethod.Http,
    callbackUrl: "/api/webhooks",
    callback: async (topic, shop, body, webhookId) => {
      const payload = JSON.parse(body);
      // Payload has the following shape:
      // {
      //   "shop_id": 954889,
      //   "shop_domain": "{shop}.myshopify.com"
      // }
    },
  },
  APP_PURCHASES_ONE_TIME_UPDATE: {
    deliveryMethod: DeliveryMethod.Http,
    callbackUrl: "/api/webhooks",
    callback: async (topic, shop, body, webhookId) => {
      const payload = JSON.parse(body);
      const admin_graphql_api_id =
        payload?.app_purchase_one_time?.admin_graphql_api_id;
      const admin_graphql_api_shop_id =
        payload?.app_purchase_one_time?.admin_graphql_api_shop_id;
      const { data } = await supabase
        .from("shops")
        .select("id, credits_remaining")
        .eq("name", shop);

      const shop_id = data[0]?.id;
      const credits_remaining = data[0]?.credits_remaining;

      // SHOP: id, credits_remaining
      // BILLING: get most recent billing entry by shop id
      // and get id

      const { data: billingData } = await supabase
        .from("billing")
        .select("id, credits_applied")
        .order("created_at", { ascending: false })
        .eq("shop_id", shop_id);
      const credits_applied = billingData[0]?.credits_applied;

      await supabase
        .from("billing")
        .update({
          admin_graphql_api_id,
          admin_graphql_api_shop_id,
          webhook_id: webhookId,
        })
        .eq("id", billingData[0].id);

      await supabase
        .from("shops")
        .update({
          credits_remaining: credits_remaining + credits_applied,
        })
        .eq("id", shop_id);
    },
  },
};
