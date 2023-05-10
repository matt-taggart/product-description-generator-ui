import React, { useEffect, useState, useCallback } from "react";
import {
  Text,
  TextField,
  Page,
  HorizontalStack,
  VerticalStack,
  Button,
  LegacyCard,
  SkeletonDisplayText,
  Frame,
  Box,
} from "@shopify/polaris";

import { useAppQuery, useAuthenticatedFetch } from "../hooks";
import { Product } from "./Product";
import { ProductSkeleton } from "./ProductSkeleton";
import { ProductPagination } from "./ProductPagination";
import { BuyCreditsModal } from "./BuyCreditsModal";
import { GenerateDescriptionsForAllToolbar } from "./GenerateDescriptionsForAllToolbar";

export function Home() {
  const [isLoadingProductSearch, setIsLoadingProductSearch] = useState(false);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [isBuyCreditsModalOpen, setIsBuyCreditsModalOpen] = useState(false);
  const toggleBuyCreditsModal = () =>
    setIsBuyCreditsModalOpen(!isBuyCreditsModalOpen);
  const [value, setValue] = useState("");
  const [products, setProducts] = useState([]);
  const [searchedProducts, setSearchedProducts] = useState([]);
  const [pageInfo, setPageInfo] = useState({});
  const [searchedPageInfo, setSearchedPageInfo] = useState({});

  const { data, isLoading: isLoadingCount } = useAppQuery({
    url: "/api/products/count",
    reactQueryOptions: {},
  });

  const {
    data: generationData,
    isLoading: isLoadingGenerations,
    refetch,
  } = useAppQuery({
    url: "/api/generations",
    reactQueryOptions: {},
  });

  const creditsRemaining = generationData?.creditsRemaining;

  const authenticatedFetch = useAuthenticatedFetch();

  const fetchProducts = useCallback(async () => {
    setIsLoadingProducts(true);
    const response = await authenticatedFetch(`/api/products`, {
      method: "GET",
    });
    const productResponse = await response.json();

    setProductState(productResponse);
    setSearchedProductState([]);
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const onSubmit = async () => {
    setIsLoadingProductSearch(true);
    const response = await authenticatedFetch("/api/products/search", {
      method: "POST",
      body: JSON.stringify({
        searchText: value,
      }),
      headers: {
        "Content-Type": "application/json",
      },
    });
    const searchedProducts = await response.json();
    setSearchedProductState(searchedProducts);
    setProducts([]);
  };

  const handleChange = (newValue) => setValue(newValue);

  const setProductState = (productResponse) => {
    setProducts(productResponse?.products);
    setPageInfo(productResponse?.pageInfo);
    setIsLoadingProducts(false);
  };

  const setSearchedProductState = (productResponse) => {
    setSearchedProducts(productResponse?.products);
    setSearchedPageInfo(productResponse?.pageInfo);
    setIsLoadingProductSearch(false);
  };

  const isPageLoading =
    isLoadingCount ||
    isLoadingProducts ||
    isLoadingProductSearch ||
    isLoadingGenerations;

  const getCreditsRemainingTextColor = (creditsRemaining) => {
    if (creditsRemaining === 0) {
      return "critical";
    }

    if (creditsRemaining < 5) {
      return "warning";
    }

    return null;
  };

  return (
    <Frame>
      <Page>
        <VerticalStack gap="4">
          <Text variant="headingXl" as="h1">
            Product Description Generator
          </Text>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              onSubmit();
            }}
          >
            <TextField
              value={value}
              onChange={handleChange}
              connectedRight={
                <Button type="submit" primary onClick={onSubmit}>
                  Search
                </Button>
              }
              autoComplete="off"
              placeholder="Search for products"
            />
          </form>
          {(() => {
            if (isPageLoading) {
              return <SkeletonDisplayText size="small" />;
            }

            if (searchedProducts?.length) {
              return (
                <HorizontalStack blockAlign="center" gap="4">
                  <Text>
                    Displaying {searchedProducts.length} out of {data?.count}{" "}
                    products
                  </Text>
                  <Button
                    size="slim"
                    onClick={() => {
                      setSearchedProducts([]);
                      setValue("");
                      fetchProducts();
                    }}
                  >
                    Clear Search
                  </Button>
                </HorizontalStack>
              );
            }

            if (products?.length) {
              return (
                <Text color="subdued">
                  Displaying {products.length} out of {data?.count} products
                </Text>
              );
            }
          })()}
          <Box width="100%">
            <HorizontalStack align="space-between">
              <GenerateDescriptionsForAllToolbar
                productCount={
                  searchedProducts?.length
                    ? searchedProducts.length
                    : products.length
                }
              />
              <div style={{ alignSelf: "flex-end", textAlign: "right" }}>
                {isPageLoading ? (
                  <SkeletonDisplayText size="small" />
                ) : (
                  <Text color={getCreditsRemainingTextColor(creditsRemaining)}>
                    {creditsRemaining} credits remaining
                  </Text>
                )}
                <Button plain onClick={toggleBuyCreditsModal}>
                  Get more credits
                </Button>
                <BuyCreditsModal
                  isBuyCreditsModalOpen={isBuyCreditsModalOpen}
                  toggleBuyCreditsModal={toggleBuyCreditsModal}
                />
              </div>
            </HorizontalStack>
          </Box>
          <LegacyCard>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {(() => {
                if (isPageLoading) {
                  return (
                    <>
                      {Array(15)
                        .fill(null)
                        .map((_, index) => (
                          <ProductSkeleton key={index} />
                        ))}
                    </>
                  );
                }

                if (searchedProducts?.length) {
                  return (
                    <>
                      {searchedProducts.map((product) => (
                        <Product
                          key={product.id}
                          {...product}
                          refetch={refetch}
                        />
                      ))}
                    </>
                  );
                }

                if (products?.length) {
                  return (
                    <>
                      {products.map((product) => (
                        <Product
                          key={product.id}
                          {...product}
                          refetch={refetch}
                        />
                      ))}
                    </>
                  );
                }
              })()}
            </div>
          </LegacyCard>
          <ProductPagination
            pageInfo={searchedProducts?.length ? searchedPageInfo : pageInfo}
            setIsLoadingProducts={
              searchedProducts?.length
                ? setIsLoadingProductSearch
                : setIsLoadingProducts
            }
            setProductState={
              searchedProducts?.length
                ? setSearchedProductState
                : setProductState
            }
          />
        </VerticalStack>
      </Page>
    </Frame>
  );
}
