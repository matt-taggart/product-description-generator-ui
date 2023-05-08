import React, { useEffect, useState } from "react";
import {
  Toast,
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
const GENERATION_OFFSET_PERCENTAGE = 5;
const DESCRIPTION_OFFSET_PERCENTAGE = 20;

export const Product = (product) => {
  const [isGeneratingText, setIsGeneratingText] = useState(false);
  const [isUpdatingDescription, setIsUpdatingDescription] = useState(false);
  const [description, setDescription] = useState("");
  const [isActiveToast, setIsActiveToast] = useState(false);
  const [value, setValue] = useState("");
  const [progress, setProgress] = useState(0);
  const [generatedText, setGeneratedText] = useState("");

  const authenticatedFetch = useAuthenticatedFetch();
  const toggleActive = () => setIsActiveToast(!isActiveToast);

  const isPanelOpen =
    progress > 0 ||
    generatedText ||
    isGeneratingText ||
    isUpdatingDescription ||
    description;

  useEffect(() => {
    let iv;
    if (isGeneratingText) {
      iv = setInterval(() => {
        setProgress(progress + GENERATION_OFFSET_PERCENTAGE);
      }, INTERVAL);
    }

    return () => {
      clearInterval(iv);
    };
  }, [isGeneratingText, progress]);

  useEffect(() => {
    let iv;
    if (isUpdatingDescription) {
      iv = setInterval(() => {
        setProgress(progress + DESCRIPTION_OFFSET_PERCENTAGE);
      }, INTERVAL);
    }

    return () => {
      clearInterval(iv);
    };
  }, [isUpdatingDescription, progress]);

  const generateDescription = async (product) => {
    setIsGeneratingText(true);
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
    setIsGeneratingText(false);
    setProgress(0);
    product.refetch();
  };

  const updateDescription = async () => {
    setIsUpdatingDescription(true);
    await authenticatedFetch("/api/products/update", {
      method: "POST",
      body: JSON.stringify({
        id: product.id,
        description: generatedText,
      }),
      headers: {
        "Content-Type": "application/json",
      },
    });
    setIsUpdatingDescription(false);
    setGeneratedText("");
    setDescription("");
    toggleActive();
  };

  const toastMarkup = isActiveToast ? (
    <Toast content="Product description updated!" onDismiss={toggleActive} />
  ) : null;
  return (
    <Box>
      {toastMarkup}
      <VerticalStack>
        <HorizontalStack blockAlign="center" gap="8">
          <HorizontalStack blockAlign="center" gap="6">
            <Box padding="3">
              <Thumbnail
                size="large"
                source={product?.image?.url || NoteMinor}
              />
            </Box>
            <Box width="15ch">
              <VerticalStack>
                <Text fontWeight="bold">Product Name</Text>
                {product?.title?.length >= 20 ? (
                  <Tooltip dismissOnMouseOut content={product.title}>
                    <Text truncate>{product.title}</Text>
                  </Tooltip>
                ) : (
                  <Text truncate>{product.title}</Text>
                )}
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
                disabled={isGeneratingText}
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
              if (isGeneratingText) {
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

              if (isUpdatingDescription) {
                return (
                  <VerticalStack gap="2">
                    <Text>We're updating your product description...</Text>
                    <ProgressBar progress={progress} color="success" />
                  </VerticalStack>
                );
              }
              if (isPanelOpen) {
                return (
                  <EditProductForm
                    generatedText={generatedText}
                    setGeneratedText={setGeneratedText}
                    generateDescription={generateDescription}
                    updateDescription={updateDescription}
                    isGeneratingText={isGeneratingText}
                    product={product}
                    setDescription={setDescription}
                    description={description}
                  />
                );
              }
            })()}
          </Box>
        </Collapsible>
        <Divider />
      </VerticalStack>
    </Box>
  );
};
