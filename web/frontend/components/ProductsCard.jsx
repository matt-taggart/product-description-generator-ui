import React, { useState } from "react";
import {
  Text,
  Page,
  HorizontalStack,
  VerticalStack,
  Button,
  Checkbox,
  Box,
  TextField,
  Pagination,
  LegacyCard,
  Divider,
  Thumbnail,
  Modal,
  SkeletonDisplayText,
  SkeletonBodyText,
  SkeletonPage,
  SkeletonThumbnail,
} from "@shopify/polaris";
import { NoteMinor } from "@shopify/polaris-icons";
import { useAppQuery } from "../hooks";

export function ProductsCard() {
  const [isLoading, setIsLoading] = useState(true);
  const [value, setValue] = useState("");
  const [checked, setChecked] = useState(false);
  const [active, setActive] = useState(false);

  const {
    data,
    refetch: refetchProductCount,
    isLoading: isLoadingCount,
    isRefetching: isRefetchingCount,
  } = useAppQuery({
    url: "/api/products/count",
    reactQueryOptions: {
      onSuccess: () => {
        setIsLoading(false);
      },
    },
  });

  const { data: products = [], isLoading: isLoadingProducts } = useAppQuery({
    url: `/api/products`,
    reactQueryOptions: {},
  });

  const handleChange = (newValue) => setValue(newValue);
  const handleCheck = (newChecked) => setChecked(newChecked);
  const toggleModal = () => setActive(!active);

  const isPageLoading = isLoadingCount || isLoadingProducts;

  return (
    <Page>
      <VerticalStack gap="4">
        <Text variant="headingXl" as="h1">
          Product Description Generator
        </Text>
        <TextField
          value={value}
          onChange={handleChange}
          connectedRight={<Button primary>Search</Button>}
          autoComplete="off"
          placeholder="Search for products"
        />
        {!isPageLoading && data?.count ? (
          <Text>Displaying 10 out of {data?.count} products</Text>
        ) : (
          <SkeletonDisplayText size="small" />
        )}
        <HorizontalStack blockAlign="center" gap="4">
          <Checkbox
            label="Generate all descriptions"
            checked={checked}
            onChange={handleCheck}
          />
          <Button size="slim" disabled={!checked} onClick={toggleModal}>
            Submit
          </Button>
        </HorizontalStack>
        <LegacyCard>
          <div style={{ display: "flex", flexDirection: "column" }}>
            {isPageLoading ? (
              <>
                {Array(10)
                  .fill(null)
                  .map((_, index) => (
                    <React.Fragment key={index}>
                      <HorizontalStack blockAlign="center" gap="20">
                        <HorizontalStack blockAlign="center" gap="6">
                          <Box padding="3">
                            <SkeletonThumbnail size="large" />
                          </Box>
                          <div style={{ width: "98px" }}>
                            <SkeletonBodyText lines={2} />
                          </div>
                        </HorizontalStack>
                        <Button size="slim">Generate description</Button>
                      </HorizontalStack>
                      <Divider />
                    </React.Fragment>
                  ))}
              </>
            ) : (
              <>
                {products.map((product) => (
                  <React.Fragment key={product.id}>
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
                      <Button size="slim">Generate description</Button>
                    </HorizontalStack>
                    <Divider />
                  </React.Fragment>
                ))}
              </>
            )}
          </div>
        </LegacyCard>
        <Pagination
          label="Prev | Next"
          hasPrevious
          onPrevious={() => {
            console.log("Previous");
          }}
          hasNext
          onNext={() => {
            console.log("Next");
          }}
        />
      </VerticalStack>
      <Modal
        open={active}
        onClose={toggleModal}
        title="Confirm Action"
        primaryAction={{
          content: "Generate",
          onAction: toggleModal,
        }}
        secondaryActions={[
          {
            content: "Cancel",
            onAction: toggleModal,
          },
        ]}
      >
        <Modal.Section>
          <Text>
            Are you sure you want to generate descriptions for all products on
            this page?
          </Text>
        </Modal.Section>
      </Modal>
    </Page>
  );
}
