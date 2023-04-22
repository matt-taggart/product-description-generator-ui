import React, { useState } from "react";
import {
  Text,
  Page,
  HorizontalStack,
  VerticalStack,
  Button,
  Box,
  TextField,
  Pagination,
  LegacyCard,
  Divider,
  Thumbnail,
} from "@shopify/polaris";
import { NoteMinor } from "@shopify/polaris-icons";
import { useAppQuery } from "../hooks";

export function ProductsCard() {
  const [isLoading, setIsLoading] = useState(true);
  const [value, setValue] = useState("");

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

  const { data: products = [] } = useAppQuery({
    url: `/api/products`,
    reactQueryOptions: {},
  });

  console.log("%cproducts", "color:cyan; ", products);
  const handleChange = (newValue) => setValue(newValue);

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
        {data?.count ? (
          <Text>Displaying 10 out of {data?.count} products</Text>
        ) : null}

        <LegacyCard>
          <div style={{ display: "flex", flexDirection: "column" }}>
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
    </Page>
  );
}
