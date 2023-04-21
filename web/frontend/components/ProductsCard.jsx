import { useState } from "react";
import {
  Text,
  Page,
  VerticalStack,
  Button,
  TextField,
  Pagination,
} from "@shopify/polaris";
import { Toast } from "@shopify/app-bridge-react";
import { useAppQuery, useAuthenticatedFetch } from "../hooks";

export function ProductsCard() {
  const emptyToastProps = { content: null };
  const [isLoading, setIsLoading] = useState(true);
  const [toastProps, setToastProps] = useState(emptyToastProps);
  const fetch = useAuthenticatedFetch();

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

  const toastMarkup = toastProps.content && !isRefetchingCount && (
    <Toast {...toastProps} onDismiss={() => setToastProps(emptyToastProps)} />
  );

  const handlePopulate = async () => {
    setIsLoading(true);
    const response = await fetch("/api/products/create");

    if (response.ok) {
      await refetchProductCount();
      setToastProps({ content: "5 products created!" });
    } else {
      setIsLoading(false);
      setToastProps({
        content: "There was an error creating products",
        error: true,
      });
    }
  };
  const [value, setValue] = useState("");

  // const { data, isLoading, isRefetching } = useAppQuery({
  //   url: `/api/products`,
  //   // reactQueryOptions: {
  //   //   refetchOnReconnect: false,
  //   // },
  // });
  // console.log("%cdata", "color:cyan; ", data);

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
