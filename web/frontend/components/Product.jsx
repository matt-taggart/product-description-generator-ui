import React, { useEffect, useState } from "react";
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
  ProgressBar,
  Collapsible,
} from "@shopify/polaris";
import { NoteMinor } from "@shopify/polaris-icons";
import { EditProductForm } from "./EditProductForm";
import { useAuthenticatedFetch } from "../hooks";
import "./Product.css";

const INTERVAL = 1000;
const OFFSET_PERCENTAGE = 5;

export const Product = (product) => {
  const [isLoading, setLoading] = useState(false);
  const [value, setValue] = useState("");
  const [progress, setProgress] = useState(0);
  const [generatedText, setGeneratedText] = useState("");
  const authenticatedFetch = useAuthenticatedFetch();

  const isPanelOpen = progress > 0 || generatedText || isLoading;

  useEffect(() => {
    let iv;
    if (isLoading) {
      iv = setInterval(() => {
        setProgress(progress + OFFSET_PERCENTAGE);
      }, INTERVAL);
    }

    return () => {
      clearInterval(iv);
    };
  }, [isLoading, progress]);

  const generateDescription = async (product) => {
    setLoading(true);
    const response = await authenticatedFetch("/api/products/generate", {
      method: "POST",
      body: JSON.stringify({
        id: product.id,
        productName: product.title,
        photoUrl: product.image.url,
        shouldDescribe: value,
      }),
      headers: {
        "Content-Type": "application/json",
      },
    });
    const data = await response.json();

    setGeneratedText(data.message);
    setLoading(false);
    setProgress(0);
  };
  return (
    <Box>
      <VerticalStack>
        <HorizontalStack blockAlign="center" gap="8">
          <HorizontalStack blockAlign="center" gap="6">
            <Box padding="3">
              <Thumbnail
                size="large"
                source={product?.image?.url || NoteMinor}
              />
            </Box>
            <Box padding="3">
              <VerticalStack>
                <Text fontWeight="bold">Product Name</Text>
                <Text>{product.title}</Text>
              </VerticalStack>
            </Box>
          </HorizontalStack>

          <Box padding="3">
            <div className="text-field">
              <TextField
                value={value}
                onChange={setValue}
                label="What should the AI describe?"
                placeholder="t-shirt, phone, shoes, etc."
                type="text"
              />
            </div>
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
        <Collapsible
          open={isPanelOpen}
          id="basic-collapsible"
          transition={{ duration: "500ms", timingFunction: "ease-in-out" }}
          expandOnPrint
        >
          <Box padding="8" justify="center" maxWidth="65ch">
            {(() => {
              if (isLoading) {
                return (
                  <VerticalStack gap="2">
                    <Text>
                      We're writing your product description. This could take up
                      to 30 seconds.
                    </Text>
                    <ProgressBar progress={progress} color="success" />
                  </VerticalStack>
                );
              }

              return (
                <EditProductForm
                  generatedText={generatedText}
                  setGeneratedText={setGeneratedText}
                  generateDescription={generateDescription}
                  isLoading={isLoading}
                  product={product}
                />
              );
            })()}
          </Box>
        </Collapsible>
        <Divider />
      </VerticalStack>
    </Box>
  );
};
