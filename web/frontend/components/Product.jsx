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
  List,
} from "@shopify/polaris";
import { useAuthenticatedFetch } from "../hooks";
import { DISPATCH_GENERATE_EVENT, emitter } from "./event-emitter";
import { NoteMinor } from "@shopify/polaris-icons";
import { EditProductForm } from "./EditProductForm";
import { SleepIcon } from "./SleepIcon";
import "./Product.css";

const INTERVAL = 1000;
const GENERATION_OFFSET_PERCENTAGE = 3;
const DESCRIPTION_OFFSET_PERCENTAGE = 20;

export const Product = (product) => {
  const [isGeneratingText, setIsGeneratingText] = useState(false);
  const [isUpdatingDescription, setIsUpdatingDescription] = useState(false);
  const [description, setDescription] = useState("");
  const [isActiveToast, setIsActiveToast] = useState(false);
  const [value, setValue] = useState("");
  const [progress, setProgress] = useState(0);
  const [generatedText, setGeneratedText] = useState("");
  const [isAISleeping, setIsAISleeping] = useState(false);

  const authenticatedFetch = useAuthenticatedFetch();
  const toggleActive = () => setIsActiveToast(!isActiveToast);

  const isPanelOpen =
    progress > 0 ||
    generatedText ||
    isGeneratingText ||
    isUpdatingDescription ||
    description ||
    isAISleeping;

  useEffect(() => {
    let iv;
    if (isGeneratingText) {
      iv = setInterval(() => {
        const offset = progress > 45 ? 1 : GENERATION_OFFSET_PERCENTAGE;
        setProgress(progress + offset);
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

  const cancelGeneration = async (product) => {
    await authenticatedFetch(
      `/api/products/generate/${encodeURIComponent(product.id)}`,
      {
        method: "DELETE",
      }
    );
  };

  const generateDescription = async (product, value) => {
    setIsAISleeping(false);
    setIsGeneratingText(true);
    const response = await authenticatedFetch("/api/products/generate", {
      method: "POST",
      body: JSON.stringify({
        id: product?.id,
        productName: product?.title,
        photoUrl: product?.image.url,
        shouldDescribe: value,
      }),
      headers: {
        "Content-Type": "application/json",
      },
    });
    const data = await response.json();

    if (data?.status === "starting") {
      setIsAISleeping(true);
      setProgress(0);
      setIsGeneratingText(false);
    } else {
      setIsGeneratingText(false);
      setGeneratedText(data.message);
      setIsGeneratingText(false);
      setProgress(0);
      product?.refetch();
    }
  };

  const updateDescription = async (product) => {
    setIsUpdatingDescription(true);
    await cancelGeneration(product);
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
    setProgress(0);
  };

  const toastMarkup = isActiveToast ? (
    <Toast content="Product description updated!" onDismiss={toggleActive} />
  ) : null;

  useEffect(() => {
    setGeneratedText(product?.generation?.generated_text);
  }, [product?.generation]);

  useEffect(() => {
    emitter.on(DISPATCH_GENERATE_EVENT, () => {
      if (product?.image?.url) {
        generateDescription(product);
      }
    });

    return () => {
      emitter.off(DISPATCH_GENERATE_EVENT);
    };
  }, []);
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
                disabled={isGeneratingText || product.noCreditsRemaining}
                onClick={() => generateDescription(product, value)}
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
          <Box>
            {isAISleeping ? (
              <Box padding="8" maxWidth="85ch">
                <HorizontalStack
                  gap="6"
                  align="center"
                  justify="center"
                  wrap={false}
                >
                  <Box>
                    <img
                      src="/assets/mascot.png"
                      style={{ height: "125px", width: "125px" }}
                    />
                  </Box>
                  <VerticalStack align="center" justify="center" gap="2">
                    <Text>
                      Oops! Our AI is taking a quick power nap. Here's what you
                      need to know:
                    </Text>
                    <List type="bullet" spacing="extraTight">
                      <List.Item>The wake-up call: About 10 minutes.</List.Item>
                      <List.Item>Your patience: Much appreciated.</List.Item>
                      <List.Item>
                        Your credits: Safe and sound, none deducted during
                        snooze time.
                      </List.Item>
                    </List>
                    <Text>Try again shortly, and our AI will be all ears!</Text>
                  </VerticalStack>
                </HorizontalStack>
              </Box>
            ) : (
              <Box padding="8" justify="center" maxWidth="65ch">
                {(() => {
                  if (isGeneratingText) {
                    return (
                      <VerticalStack gap="2">
                        <Text>
                          We're writing your product description. This could
                          take a minute or two.{" "}
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
                        cancelGeneration={cancelGeneration}
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
            )}
          </Box>
        </Collapsible>
        <Divider />
      </VerticalStack>
    </Box>
  );
};
