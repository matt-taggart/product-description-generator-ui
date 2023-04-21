import { useState } from "react";
import {
  Text,
  Page,
  VerticalStack,
  Button,
  TextField,
  Pagination,
} from "@shopify/polaris";
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
