import React from "react";
import { Pagination } from "@shopify/polaris";
import { useAuthenticatedFetch } from "../hooks";

export const ProductPagination = ({
  pageInfo,
  setIsLoadingProducts,
  setProductState,
}) => {
  const authenticatedFetch = useAuthenticatedFetch();

  const startCursor = pageInfo?.startCursor;
  const endCursor = pageInfo?.endCursor;
  const hasNextPage = pageInfo?.hasNextPage;
  const hasPreviousPage = pageInfo?.hasPreviousPage;

  const getNextPage = async () => {
    setIsLoadingProducts(true);
    const response = await authenticatedFetch(
      `/api/products?after=${endCursor}`,
      {
        method: "GET",
      }
    );
    const productResponse = await response.json();

    setProductState(productResponse);
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

    setProductState(productResponse);
  };

  return (
    <Pagination
      label="Prev | Next"
      hasPrevious={hasPreviousPage}
      onPrevious={getPreviousPage}
      hasNext={hasNextPage}
      onNext={getNextPage}
    />
  );
};
