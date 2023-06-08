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
  Select,
} from "@shopify/polaris";
import { DISPATCH_GENERATE_EVENT, emitter } from "./event-emitter";
import { NoteMinor } from "@shopify/polaris-icons";
import { EditProductForm } from "./EditProductForm";
import { useAuthenticatedFetch } from "../hooks";
import { StatusTypes } from "../../status.constants";
import "./Product.css";

const INTERVAL = 1000;
const GENERATION_OFFSET_PERCENTAGE = 3;
const DESCRIPTION_OFFSET_PERCENTAGE = 20;

export const Product = (props) => {
  const [isGeneratingText, setIsGeneratingText] = useState(false);
  const [isUpdatingDescription, setIsUpdatingDescription] = useState(false);
  const [description, setDescription] = useState("");
  const [isActiveToast, setIsActiveToast] = useState(false);
  const [value, setValue] = useState("");
  const [progress, setProgress] = useState(0);
  const [generatedText, setGeneratedText] = useState("");
  const [selected, setSelected] = useState("bold and confident");
  const [refreshNotificationMessage, setRefreshNotificationMessage] =
    useState("");

  const options = [
    { label: "Bold and Confident", value: "bold and confident" },
    { label: "Friendly and Playful", value: "friendly and playful" },
    { label: "Warm and Welcoming", value: "warm and welcoming" },
  ];

  const authenticatedFetch = useAuthenticatedFetch();
  const toggleActive = () => setIsActiveToast(!isActiveToast);
  const {
    noCreditsRemaining,
    decrementCredits,
    refetchProducts,
    id,
    setProducts,
  } = props;

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
        const offset = progress > 45 ? 0.5 : GENERATION_OFFSET_PERCENTAGE;
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

  useEffect(() => {
    if (progress > 100) {
      setRefreshNotificationMessage(
        "Our AI model is currently initializing, which might lead to longer response times than anticipated. If you experience delays, please refresh the page to check if the situation improves. Rest assured, no credits will be deducted for this product during a refresh."
      );
    }
  }, [progress]);

  const cancelGeneration = async (product) => {
    await authenticatedFetch(
      `/api/products/generate/${encodeURIComponent(product.id)}`,
      {
        method: "DELETE",
      }
    );

    setRefreshNotificationMessage("");
  };

  const generateDescription = async (product, value) => {
    setIsGeneratingText(true);
    decrementCredits();

    setProducts((prevState) => {
      return prevState.map((product) => {
        if (product.id === id) {
          return {
            ...product,
            generation: {
              status: StatusTypes.STARTING,
            },
          };
        }
        return product;
      });
    });

    const response = await authenticatedFetch("/api/products/generate", {
      method: "POST",
      body: JSON.stringify({
        id: product?.id,
        productName: product?.title,
        photoUrl: product?.image.url,
        keywords: value,
        tone: selected,
      }),
      headers: {
        "Content-Type": "application/json",
      },
    });
    const data = await response.json();

    const generationResponse = await authenticatedFetch(
      `/api/products/generate/${data.id}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    const generationData = await generationResponse.json();
    setGeneratedText(generationData.message);
    setIsGeneratingText(false);
    setProgress(0);
    refetchProducts();
    setRefreshNotificationMessage("");
  };

  const getGenerationResponse = async (data) => {
    setIsGeneratingText(true);

    const generationResponse = await authenticatedFetch(
      `/api/products/generate/${data.id}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    const generationData = await generationResponse.json();
    setGeneratedText(generationData.message);
    setIsGeneratingText(false);
    setProgress(0);
    refetchProducts();
    setRefreshNotificationMessage("");
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
    setGeneratedText(props?.generation?.generated_text);
  }, [props?.generation]);

  useEffect(() => {
    emitter.on(DISPATCH_GENERATE_EVENT, (ctx) => {
      const canGenerate = ctx.productIds.has(props?.id);
      if (canGenerate) {
        generateDescription(props);
      }
    });

    return () => {
      emitter.off(DISPATCH_GENERATE_EVENT);
    };
  }, []);

  useEffect(() => {
    if (props?.generation?.status === StatusTypes.STARTING) {
      getGenerationResponse(props?.generation);
    }
  }, []);

  const isDisabled = isGeneratingText || noCreditsRemaining;
  return (
    <Box>
      {toastMarkup}
      <VerticalStack>
        <HorizontalStack blockAlign="center" gap="4">
          <HorizontalStack blockAlign="center" gap="4">
            <Box padding="3">
              <Thumbnail size="large" source={props?.image?.url || NoteMinor} />
            </Box>
            <Box width="15ch">
              <VerticalStack>
                <Text fontWeight="bold">Product Name</Text>
                {props?.title?.length >= 20 ? (
                  <Tooltip dismissOnMouseOut content={props.title}>
                    <Text truncate>{props.title}</Text>
                  </Tooltip>
                ) : (
                  <Text truncate>{props.title}</Text>
                )}
              </VerticalStack>
            </Box>
          </HorizontalStack>

          <Box padding="3">
            <div className="text-field">
              <TextField
                value={value}
                onChange={setValue}
                label="Features & Keywords (Optional)"
                placeholder="pink, silk, dress, etc."
                type="text"
              />
            </div>
          </Box>

          <Box padding="3">
            <Select
              label="Voice & Tone"
              options={options}
              onChange={setSelected}
              value={selected}
            />
          </Box>
          {props?.image?.url ? (
            <Box padding="3">
              <Button
                size="slim"
                disabled={isDisabled}
                onClick={() => generateDescription(props, value)}
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
                <Button size="slim" disabled={!props?.image?.url}>
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
            <Box padding="8" justify="center" maxWidth="65ch">
              {(() => {
                if (isGeneratingText) {
                  return (
                    <VerticalStack gap="2">
                      {refreshNotificationMessage ? (
                        <>{refreshNotificationMessage}</>
                      ) : (
                        <Text>
                          We're writing your product description. This could
                          take a minute or two.{" "}
                        </Text>
                      )}
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
                      product={props}
                      setDescription={setDescription}
                      description={description}
                      isDisabled={isDisabled}
                    />
                  );
                }
              })()}
            </Box>
          </Box>
        </Collapsible>
        <Divider />
      </VerticalStack>
    </Box>
  );
};
