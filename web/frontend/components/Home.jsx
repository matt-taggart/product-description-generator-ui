import React, { useEffect, useState, useCallback } from "react";
import {
  Text,
  Page,
  HorizontalStack,
  VerticalStack,
  Button,
  TextField,
  Pagination,
  LegacyCard,
  SkeletonDisplayText,
} from "@shopify/polaris";

import { useAppQuery, useAuthenticatedFetch } from "../hooks";
import { Product } from "./Product";
import { ProductSkeleton } from "./ProductSkeleton";
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

  const startCursor = pageInfo?.startCursor;
  const endCursor = pageInfo?.endCursor;
  const hasNextPage = pageInfo?.hasNextPage;
  const hasPreviousPage = pageInfo?.hasPreviousPage;

  const authenticatedFetch = useAuthenticatedFetch();

  const fetchProducts = useCallback(async () => {
    setIsLoadingProducts(true);
    const response = await authenticatedFetch(`/api/products`, {
      method: "GET",
    });
    const productResponse = await response.json();

    setProducts(productResponse?.products);
    setPageInfo(productResponse?.pageInfo);
    setIsLoadingProducts(false);
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const getNextPage = async () => {
    setIsLoadingProducts(true);
    const response = await authenticatedFetch(
      `/api/products?after=${endCursor}`,
      {
        method: "GET",
      }
    );
    const productResponse = await response.json();

    setProducts(productResponse?.products);
    setPageInfo(productResponse?.pageInfo);
    setIsLoadingProducts(false);
  };

  const getPreviousPage = async () => {
    setIsLoadingProducts(true);
    const response = await authenticatedFetch(
      `/api/products?before=${startCursor}`,
      {
        method: "GET",
      }
    );
    const productResponse = await response.json();

    setProducts(productResponse?.products);
    setPageInfo(productResponse?.pageInfo);
    setIsLoadingProducts(false);
  };

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

  const isPageLoading =
    isLoadingCount || isLoadingProducts || isLoadingProductSearch;

  return (
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
        <Pagination
          label="Prev | Next"
          hasPrevious={hasPreviousPage}
          onPrevious={getPreviousPage}
          hasNext={hasNextPage}
          onNext={getNextPage}
        />
      </VerticalStack>
    </Page>
  );
}
