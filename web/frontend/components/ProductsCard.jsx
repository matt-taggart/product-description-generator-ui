import React, { useEffect, useState, useCallback } from "react";
import {
  Text,
  Page,
  HorizontalStack,
  VerticalStack,
  Button,
  Checkbox,
  Box,
  Tooltip,
  TextField,
  Pagination,
  LegacyCard,
  Divider,
  Thumbnail,
  Modal,
  SkeletonDisplayText,
  SkeletonBodyText,
  SkeletonThumbnail,
} from "@shopify/polaris";
import { NoteMinor } from "@shopify/polaris-icons";
import { useAppQuery, useAuthenticatedFetch } from "../hooks";

export function ProductsCard() {
  const [isLoadingProductSearch, setIsLoadingProductSearch] = useState(false);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [isLoadingDescription, setIsLoadingDescription] = useState(false);
  const [value, setValue] = useState("");
  const [products, setProducts] = useState([]);
  const [searchedProducts, setSearchedProducts] = useState([]);
  const [checked, setChecked] = useState(false);
  const [active, setActive] = useState(false);
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

  const generateDescription = async (product) => {
    setIsLoadingDescription(true);
    const response = await authenticatedFetch("/api/products/generate", {
      method: "POST",
      body: JSON.stringify({
        id: product.id,
        productName: product.title,
        photoUrl: product.image.url,
      }),
      headers: {
        "Content-Type": "application/json",
      },
    });
    const message = await response.json();

    setIsLoadingDescription(false);
    console.log("%cmessage", "color:cyan; ", message);
  };
  const handleChange = (newValue) => setValue(newValue);
  const handleCheck = (newChecked) => setChecked(newChecked);
  const toggleModal = () => setActive(!active);

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
            {(() => {
              if (isPageLoading) {
                return (
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
                );
              }

              if (searchedProducts?.length) {
                return (
                  <>
                    {searchedProducts.map((product) => (
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
                          {product?.image?.url ? (
                            <Button
                              size="slim"
                              disabled={isLoadingDescription}
                              onClick={() => generateDescription(product)}
                            >
                              Generate description
                            </Button>
                          ) : (
                            <Tooltip
                              dismissOnMouseOut
                              content="You must add an image to generate a description"
                            >
                              <Button
                                size="slim"
                                disabled={!product?.image?.url}
                              >
                                Generate description
                              </Button>
                            </Tooltip>
                          )}
                        </HorizontalStack>
                        <Divider />
                      </React.Fragment>
                    ))}
                  </>
                );
              }

              if (products?.length) {
                return (
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
                          {product?.image?.url ? (
                            <Button
                              size="slim"
                              onClick={() => generateDescription(product)}
                            >
                              Generate description
                            </Button>
                          ) : (
                            <Tooltip
                              dismissOnMouseOut
                              content="You must add an image to generate a description"
                            >
                              <Button
                                size="slim"
                                disabled={!product?.image?.url}
                              >
                                Generate description
                              </Button>
                            </Tooltip>
                          )}
                        </HorizontalStack>
                        <Divider />
                      </React.Fragment>
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
