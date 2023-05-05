// @ts-check
import { join } from "path";
import { readFileSync } from "fs";
import express from "express";
import serveStatic from "serve-static";
import Replicate from "replicate";
import { Configuration, OpenAIApi } from "openai";

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

  const products = data.body.data.products.edges.map((edge) => ({
    id: edge.node.id,
    title: edge.node.title,
    image: {
      id: edge.node.images?.edges[0]?.node?.id,
      url: edge.node.images?.edges[0]?.node?.url,
    },
  }));
  res.send(products);
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

  const pageInfo = data.body.data.products.pageInfo;
  const products = data.body.data.products.edges.map((edge) => ({
    id: edge.node.id,
    title: edge.node.title,
    image: {
      id: edge.node.images?.edges[0]?.node?.id,
      url: edge.node.images?.edges[0]?.node?.url,
    },
  }));
  res.send({
    pageInfo,
    products,
  });
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

// const baseQuery = `
// {
//   mutation {
//     productUpdate(input: {
//       id: "gid://shopify/Product/1234567890",
//       descriptionHtml: "This is the updated product description."
//     }) {
//       product {
//         id
//         descriptionHtml
//       }
//       userErrors {
//         field
//         message
//       }
//     }
//   }
// }
// `;

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
  const shop = client.session.shop;
  const { id, photoUrl, productName } = _req.body;

  try {
    const output = await replicate.run(
      "chen/minigpt-4_vicuna-13b:c1f0352f9da298ac874159e350d6d78139e3805b7e55f5df7c5b79a66ae19528",
      {
        input: {
          image: photoUrl,
          message: `Please give a sales pitch for this photo. The product name is ${productName}.`,
        },
      }
    );
    console.log("output", output);

    const completion = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "user",
          content: `Sales Pitch: ${output} \n\n Question: Can you please improve the wording of the sales pitch for the product name above?`,
        },
      ],
      temperature: 1,
    });

    res.send({ message: completion.data.choices[0].message.content });
    return;
  } catch (error) {
    console.log("%cerror", "color:cyan; ", error.message);
  }

  res.send({ message: "success" });
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
