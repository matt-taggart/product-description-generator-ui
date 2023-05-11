// @ts-check
import { join } from "path";
import { readFileSync } from "fs";
import express from "express";
import serveStatic from "serve-static";
import Replicate from "replicate";
import { Configuration, OpenAIApi } from "openai";
import { v4 as uuidv4 } from "uuid";

import { supabase } from "./supabaseClient.js";
import shopify from "./shopify.js";
import productCreator from "./product-creator.js";
import GDPRWebhookHandlers from "./gdpr.js";

const PORT = parseInt(process.env.BACKEND_PORT || process.env.PORT, 10);

const STATIC_PATH =
  process.env.NODE_ENV === "production"
    ? `${process.cwd()}/frontend/dist`
    : `${process.cwd()}/frontend/`;

const app = express();

// Set up Shopify authentication and webhook handling
app.get(shopify.config.auth.path, shopify.auth.begin());
app.get(
  shopify.config.auth.callbackPath,
  shopify.auth.callback(),
  shopify.redirectToShopifyOrAppRoot()
);
app.post(
  shopify.config.webhooks.path,
  shopify.processWebhooks({ webhookHandlers: GDPRWebhookHandlers })
);

// If you are adding routes outside of the /api path, remember to
// also add a proxy rule for them in web/frontend/vite.config.js

app.use("/api/*", shopify.validateAuthenticatedSession());

app.use(express.json());

app.post("/api/products/search", async (_req, res) => {
  const client = new shopify.api.clients.Graphql({
    session: res.locals.shopify.session,
  });

  const searchText = _req.body.searchText;
  const data = await client.query({
    data: {
      query: `
          {
            products(first: 15, query: "title:${searchText}*") {
              pageInfo {
                hasPreviousPage
                hasNextPage
                startCursor
                endCursor
              }
              edges {
                node {
                  id
                  title
                  images(first: 1) {
                    edges {
                      node {
                        id
                        url
                      }
                    }
                  }
                }
              }
            }
          }
        `,
    },
  });

  const shopIdQuery = `
      {
        shop {
          id
        }
      }
    `;
  const response = await client.query({
    data: {
      query: shopIdQuery,
    },
  });
  const shopId = response.body.data.shop.id;

  const { data: generationData } = await supabase.rpc(
    "get_most_recent_products",
    {
      shop_id_input: shopId,
    }
  );

  const pageInfo = data.body.data.products.pageInfo;
  const products = data.body.data.products.edges
    .map((edge) => {
      return {
        id: edge.node.id,
        title: edge.node.title,
        image: {
          id: edge.node.images?.edges[0]?.node?.id,
          url: edge.node.images?.edges[0]?.node?.url,
        },
      };
    })
    .map((product) => {
      const productGenerationData = generationData.find(
        (generation) => generation.product_id === product.id
      );

      if (!!productGenerationData) {
        return {
          ...product,
          generation: productGenerationData,
        };
      }

      return product;
    });
  res.send({ pageInfo, products });
});

app.get("/api/products", async (_req, res) => {
  const client = new shopify.api.clients.Graphql({
    session: res.locals.shopify.session,
  });

  const after = _req.query?.after;
  const before = _req.query?.before;

  let query = "";

  const baseQuery = `
    {
      products(first: 15) {
        pageInfo {
          hasPreviousPage
          hasNextPage
          startCursor
          endCursor
        }
        edges {
          node {
            id
            title
            images(first: 1) {
              edges {
                node {
                  id
                  url
                }
              }
            }
          }
        }
      }
    }
  `;

  const nextQuery = `
    {
      products(first: 15, after: "${after}") {
        pageInfo {
          hasPreviousPage
          hasNextPage
          startCursor
          endCursor
        }
        edges {
          node {
            id
            title
            images(first: 1) {
              edges {
                node {
                  id
                  url
                }
              }
            }
          }
        }
      }
    }
  `;

  const previousQuery = `
    {
      products(last: 15, before: "${before}") {
        pageInfo {
          hasPreviousPage
          hasNextPage
          startCursor
          endCursor
        }
        edges {
          node {
            id
            title
            images(first: 1) {
              edges {
                node {
                  id
                  url
                }
              }
            }
          }
        }
      }
    }
  `;

  if (!after && !before) {
    query = baseQuery;
  } else if (after) {
    query = nextQuery;
  } else {
    query = previousQuery;
  }

  const data = await client.query({
    data: {
      query,
    },
  });

  const shopIdQuery = `
      {
        shop {
          id
        }
      }
    `;
  const response = await client.query({
    data: {
      query: shopIdQuery,
    },
  });
  const shopId = response.body.data.shop.id;

  const { data: generationData } = await supabase.rpc(
    "get_most_recent_products",
    {
      shop_id_input: shopId,
    }
  );

  const pageInfo = data.body.data.products.pageInfo;
  const products = data.body.data.products.edges
    .map((edge) => {
      return {
        id: edge.node.id,
        title: edge.node.title,
        image: {
          id: edge.node.images?.edges[0]?.node?.id,
          url: edge.node.images?.edges[0]?.node?.url,
        },
      };
    })
    .map((product) => {
      const productGenerationData = generationData.find(
        (generation) => generation.product_id === product.id
      );

      if (!!productGenerationData) {
        return {
          ...product,
          generation: productGenerationData,
        };
      }

      return product;
    });
  res.send({
    pageInfo,
    products,
  });
});

app.get("/api/generations", async (_req, res) => {
  const client = new shopify.api.clients.Graphql({
    session: res.locals.shopify.session,
  });
  const shopIdQuery = `
      {
        shop {
          id
        }
      }
    `;
  const response = await client.query({
    data: {
      query: shopIdQuery,
    },
  });
  const id = response.body.data.shop.id;
  const { data } = await supabase.from("shops").select("*").eq("shop_id", id);

  const creditsRemaining = data[0]?.credits_remaining || 0;

  res.status(200).send({ creditsRemaining });
});

app.get("/api/products/count", async (_req, res) => {
  const countData = await shopify.api.rest.Product.count({
    session: res.locals.shopify.session,
  });

  res.status(200).send(countData);
});

app.get("/api/products/create", async (_req, res) => {
  let status = 200;
  let error = null;

  try {
    await productCreator(res.locals.shopify.session);
  } catch (e) {
    console.log(`Failed to process products/create: ${e.message}`);
    status = 500;
    error = e.message;
  }
  res.status(status).send({ success: status === 200, error });
});

app.post("/api/credits", async (_req, res) => {
  const client = new shopify.api.clients.Graphql({
    session: res.locals.shopify.session,
  });

  const shop = client.client.domain;
  const option = _req.body.option;
  const query = `
    mutation AppPurchaseOneTimeCreate($name: String!, $price: MoneyInput!, $returnUrl: URL!, $test: Boolean) {
      appPurchaseOneTimeCreate(name: $name, returnUrl: $returnUrl, price: $price, test: $test) {
        userErrors {
          field
          message
        }
        appPurchaseOneTime {
          createdAt
          id
        }
        confirmationUrl
      }
    }
  `;

  const returnUrl = `https://${shop}?shop=${client.session.shop}&host=${btoa(
    `${client.session.shop}/admin`
  )}`;

  const variables = {
    name: "App one-time purchase",
    returnUrl,
    price: {
      amount: option,
      currencyCode: "USD",
    },
    test: true,
  };

  const response = await client.query({
    data: {
      query,
      variables,
    },
  });

  const shopIdQuery = `
      {
        shop {
          id
        }
      }
    `;
  const shopResponse = await client.query({
    data: {
      query: shopIdQuery,
    },
  });
  const shopId = shopResponse.body.data.shop.id;

  const { count } = await supabase
    .from("shops")
    .select("name", { count: "exact" })
    .eq("shop_id", shopId);

  if (count === 0) {
    await supabase.from("shops").insert({
      id: uuidv4(),
      shop_id: shopId,
      name: shop,
      generation_count: 0,
      credits_remaining: 0,
    });
  }

  const getCreditsApplied = (option) => {
    switch (option) {
      case "10":
        return 100;
      case "20":
        return 200;
      case "30":
        return 350;
    }
  };

  await supabase.from("billing").insert({
    id: uuidv4(),
    shop_id: shopId,
    amount_billed: option,
    credits_applied: getCreditsApplied(option),
  });

  const id = response.body.data.appPurchaseOneTimeCreate.appPurchaseOneTime.id;
  const confirmationUrl =
    response.body.data.appPurchaseOneTimeCreate.confirmationUrl;

  res.send({ id, confirmationUrl });
});

app.post("/api/products/update", async (_req, res) => {
  try {
    const client = new shopify.api.clients.Graphql({
      session: res.locals.shopify.session,
    });
    const { id, description } = _req.body;

    const query = `
      mutation productUpdate($input: ProductInput!) {
        productUpdate(input: $input) {
          product {
            id
            descriptionHtml
          }
          userErrors {
            field
            message
          }
        }
      }
      `;

    const variables = {
      input: {
        id,
        descriptionHtml: description,
      },
    };

    await client.query({
      data: {
        query,
        variables,
      },
    });

    const shopIdQuery = `
      {
        shop {
          id
        }
      }
    `;
    const shopResponse = await client.query({
      data: {
        query: shopIdQuery,
      },
    });
    const shopId = shopResponse.body.data.shop.id;

    const { data } = await supabase
      .from("shops")
      .select("product_description_update_count")
      .eq("shop_id", shopId);

    const product_description_update_count =
      data[0]?.product_description_update_count;

    await supabase
      .from("shops")
      .update({
        product_description_update_count: product_description_update_count + 1,
      })
      .eq("shop_id", shopId);

    res.status(201).send({ message: "updated product" });
    return;
  } catch (e) {
    res.status(400);
  }
});

app.delete("/api/products/generate/:id", async (_req, res) => {
  const client = new shopify.api.clients.Graphql({
    session: res.locals.shopify.session,
  });

  await supabase.from("generations").delete().eq("product_id", _req.params.id);

  res.send({ message: "deleted product generation" });
});

const replicate = new Replicate({
  // get your token from https://replicate.com/account
  auth: process.env.VITE_REPLICATE_API_TOKEN,
});
const configuration = new Configuration({
  apiKey: process.env.VITE_OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

app.post("/api/products/generate", async (_req, res) => {
  const client = new shopify.api.clients.Graphql({
    session: res.locals.shopify.session,
  });
  const { id: productId, photoUrl, shouldDescribe } = _req.body;

  try {
    const output = await replicate.run(
      "chen/minigpt-4_vicuna-13b:c1f0352f9da298ac874159e350d6d78139e3805b7e55f5df7c5b79a66ae19528",
      {
        input: {
          image: photoUrl,
          message: `Please give a product description for this photo. Please focus on the ${shouldDescribe} in the photo.`,
        },
      }
    );

    const completion = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "user",
          content: `Context: ${output} \n\n Question: Can you please improve the wording of the product description provided in the context? Please focus on the ${shouldDescribe} in the photo.`,
        },
      ],
      temperature: 1,
    });

    // get shop id
    const shopIdQuery = `
      {
        shop {
          id
        }
      }
    `;
    const response = await client.query({
      data: {
        query: shopIdQuery,
      },
    });
    const shopId = response.body.data.shop.id;

    const generatedText = completion.data.choices[0].message.content;

    await supabase.from("generations").insert({
      id: uuidv4(),
      shop_id: shopId,
      product_id: productId,
      generated_text: generatedText,
    });

    // update generation count and credits remaining
    await supabase.rpc("update_credits_and_generations", {
      shop_id: shopId,
    });

    res.send({ message: generatedText });
  } catch (error) {
    res.status(400).send({ message: "Something went wrong" });
  }
});

app.use(shopify.cspHeaders());
app.use(serveStatic(STATIC_PATH, { index: false }));

app.use("/*", shopify.ensureInstalledOnShop(), async (_req, res, _next) => {
  return res
    .status(200)
    .set("Content-Type", "text/html")
    .send(readFileSync(join(STATIC_PATH, "index.html")));
});

app.listen(PORT);
