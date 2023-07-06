import React, { useEffect, useState, useCallback, useRef } from "react";
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
import { ScribeLogo } from "./ScribeLogo";

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

  const { data: generationData, isLoading: isLoadingGenerations } = useAppQuery(
    {
      url: "/api/generations",
      reactQueryOptions: {},
    }
  );

  const generatedCreditsRemaining = generationData?.creditsRemaining;

  const creditsRef = useRef();

  useEffect(() => {
    if (!creditsRef.current) {
      creditsRef.current = generatedCreditsRemaining;
    }
  }, [generatedCreditsRemaining]);

  function decrementCredits() {
    creditsRef.current = creditsRef.current - 1;
  }

  const creditsRemaining = creditsRef.current;

  const authenticatedFetch = useAuthenticatedFetch();

  const fetchProducts = useCallback(async () => {
    setIsLoadingProducts(true);
    const response = await authenticatedFetch(`/api/products`, {
      method: "GET",
    });
    const productResponse = await response.json();

    setProductState(productResponse);
    setSearchedProductState([]);
    setIsLoadingProducts(false);
  }, []);

  const refetchProducts = useCallback(async () => {
    const response = await authenticatedFetch(`/api/products`, {
      method: "GET",
    });
    const productResponse = await response.json();

    setProductState(productResponse);
    setSearchedProductState([]);
  }, []);

  const refetchSearchedProducts = useCallback(async () => {
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
  }, [value]);

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

  const noCreditsRemaining = creditsRemaining <= 0;

  const getCreditsRemainingTextColor = (creditsRemaining) => {
    if (creditsRemaining === 0) {
      return "critical";
    }

    if (creditsRemaining < 5) {
      return "warning";
    }

    return null;
  };

  const searchResultsEmpty = value && searchedProducts?.length === 0;

  return (
    <Frame>
      <Page>
        <VerticalStack gap="4">
          <div style={{ width: "200px" }}>
            <ScribeLogo />
          </div>
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
                <Button type="submit" disabled={!value} onClick={onSubmit}>
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

            if (searchResultsEmpty) {
              return (
                <HorizontalStack blockAlign="center" gap="4">
                  <Text>No search results found</Text>
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
              {searchResultsEmpty || noCreditsRemaining ? null : (
                <GenerateDescriptionsForAllToolbar
                  creditsRemaining={creditsRemaining}
                  products={
                    searchedProducts?.length ? searchedProducts : products
                  }
                  productCount={
                    searchedProducts?.length
                      ? searchedProducts.length
                      : products.length
                  }
                />
              )}
              <div
                style={{
                  marginLeft: "auto",
                  alignSelf: "flex-end",
                  textAlign: "right",
                }}
              >
                {isPageLoading ? (
                  <SkeletonDisplayText size="small" />
                ) : (
                  <>
                    {searchResultsEmpty ? null : (
                      <Text
                        color={getCreditsRemainingTextColor(creditsRemaining)}
                      >
                        {creditsRemaining} credits remaining
                      </Text>
                    )}
                  </>
                )}
                {searchResultsEmpty ? null : (
                  <Button plain onClick={toggleBuyCreditsModal}>
                    Get more credits
                  </Button>
                )}

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
                      {searchedProducts.map((product, index) => (
                        <Product
                          key={product.id}
                          index={index}
                          creditsRemaining={creditsRemaining}
                          {...product}
                          noCreditsRemaining={noCreditsRemaining}
                          decrementCredits={decrementCredits}
                          refetchProducts={refetchSearchedProducts}
                          setProducts={setSearchedProducts}
                        />
                      ))}
                    </>
                  );
                }

                if (products?.length) {
                  return (
                    <>
                      {products.map((product, index) => (
                        <Product
                          key={product.id}
                          index={index}
                          creditsRemaining={creditsRemaining}
                          {...product}
                          noCreditsRemaining={noCreditsRemaining}
                          decrementCredits={decrementCredits}
                          refetchProducts={refetchProducts}
                          setProducts={setProducts}
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
