import React, { useEffect, useState, useCallback } from "react";
import {
  Text,
  HorizontalStack,
  VerticalStack,
  Button,
  Box,
  Tooltip,
  Divider,
  Thumbnail,
} from "@shopify/polaris";
import { NoteMinor } from "@shopify/polaris-icons";
import { useAppQuery, useAuthenticatedFetch } from "../hooks";

export const Product = (product) => {
  const [isLoading, setLoading] = useState(false);
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
    <React.Fragment>
      <HorizontalStack blockAlign="center" gap="20">
        <HorizontalStack blockAlign="center" gap="6">
          <Box padding="3">
            <Thumbnail
              size="large"
              source={product?.image?.url || NoteMinor}
              style={{
                margin: "1rem 0.75rem",
              }}
            />
          </Box>
          <VerticalStack>
            <Text fontWeight="bold">Product Name</Text>
            <Text>{product.title}</Text>
          </VerticalStack>
        </HorizontalStack>
        {product?.image?.url ? (
          <Button
            size="slim"
            disabled={isLoading}
            onClick={() => generateDescription(product)}
          >
            Generate description
          </Button>
        ) : (
          <Tooltip
            dismissOnMouseOut
            content="You must add an image to generate a description"
          >
            <Button size="slim" disabled={!product?.image?.url}>
              Generate description
            </Button>
          </Tooltip>
        )}
      </HorizontalStack>
      <Divider />
    </React.Fragment>
  );
};
