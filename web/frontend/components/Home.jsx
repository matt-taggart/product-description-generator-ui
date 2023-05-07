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
} from "@shopify/polaris";

import { useAppQuery, useAuthenticatedFetch } from "../hooks";
import { Product } from "./Product";
import { ProductSkeleton } from "./ProductSkeleton";
import { ProductPagination } from "./ProductPagination";
import { GenerateDescriptionsForAllToolbar } from "./GenerateDescriptionsForAllToolbar";

export function Home() {
  const [isLoadingProductSearch, setIsLoadingProductSearch] = useState(false);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [value, setValue] = useState("");
  const [products, setProducts] = useState([]);
  const [searchedProducts, setSearchedProducts] = useState([]);
  const [pageInfo, setPageInfo] = useState({});

  const { data, isLoading: isLoadingCount } = useAppQuery({
    url: "/api/products/count",
    reactQueryOptions: {},
  });

  const authenticatedFetch = useAuthenticatedFetch();

  const fetchProducts = useCallback(async () => {
    setIsLoadingProducts(true);
    const response = await authenticatedFetch(`/api/products`, {
      method: "GET",
    });
    const productResponse = await response.json();

    setProductState(productResponse);
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

    setSearchedProducts(searchedProducts);
    setIsLoadingProductSearch(false);
  };

  const handleChange = (newValue) => setValue(newValue);

  const setProductState = (productResponse) => {
    setProducts(productResponse?.products);
    setPageInfo(productResponse?.pageInfo);
    setIsLoadingProducts(false);
  };

  const isPageLoading =
    isLoadingCount || isLoadingProducts || isLoadingProductSearch;

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
                  <Button size="slim" onClick={() => setSearchedProducts([])}>
                    Clear Search
                  </Button>
                </HorizontalStack>
              );
            }

            if (products?.length) {
              return (
                <Text>
                  Displaying {products.length} out of {data?.count} products
                </Text>
              );
            }
          })()}
          <GenerateDescriptionsForAllToolbar />
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
                        <Product key={product.id} {...product} />
                      ))}
                    </>
                  );
                }

                if (products?.length) {
                  return (
                    <>
                      {products.map((product) => (
                        <Product key={product.id} {...product} />
                      ))}
                    </>
                  );
                }
              })()}
            </div>
          </LegacyCard>
          <ProductPagination
            pageInfo={pageInfo}
            setIsLoadingProducts={setIsLoadingProducts}
            setProductState={setProductState}
          />
        </VerticalStack>
      </Page>
    </Frame>
  );
}
