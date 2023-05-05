import React, { useState } from "react";
import {
  Text,
  HorizontalStack,
  VerticalStack,
  Button,
  Box,
  Tooltip,
  Divider,
  Thumbnail,
  TextField,
} from "@shopify/polaris";
import { NoteMinor } from "@shopify/polaris-icons";
import { useAuthenticatedFetch } from "../hooks";

export const Product = (product) => {
  const [isLoading, setLoading] = useState(false);
  const [value, setValue] = useState("");
  const authenticatedFetch = useAuthenticatedFetch();

  const generateDescription = async (product) => {
    setLoading(true);
    const response = await authenticatedFetch("/api/products/generate", {
      method: "POST",
      body: JSON.stringify({
        id: product.id,
        productName: product.title,
        photoUrl: product.image.url,
      }),
      headers: {
        "Content-Type": "application/json",
      },
    });
    const message = await response.json();

    setLoading(false);
    console.log("%cmessage", "color:cyan; ", message);
  };
  return (
    <Box>
      <HorizontalStack blockAlign="center" gap="8">
        <HorizontalStack blockAlign="center" gap="6">
          <Box padding="3">
            <Thumbnail size="large" source={product?.image?.url || NoteMinor} />
          </Box>
          <Box padding="3">
            <VerticalStack>
              <Text fontWeight="bold">Product Name</Text>
              <Text>{product.title}</Text>
            </VerticalStack>
          </Box>
        </HorizontalStack>

        <Box padding="3">
          <TextField
            value={value}
            onChange={setValue}
            label="What should the AI focus on?"
            placeholder="t-shirt, phone, shoes, etc."
            type="text"
          />
        </Box>
        {product?.image?.url ? (
          <Box padding="3">
            <Button
              size="slim"
              disabled={isLoading}
              onClick={() => generateDescription(product)}
            >
              Generate description
            </Button>
          </Box>
        ) : (
          <Tooltip
            dismissOnMouseOut
            content="You must add an image to generate a description"
          >
            <Box padding="3">
              <Button size="slim" disabled={!product?.image?.url}>
                Generate description
              </Button>
            </Box>
          </Tooltip>
        )}
      </HorizontalStack>
      <Divider />
    </Box>
  );
};
