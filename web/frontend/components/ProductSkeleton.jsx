import React from "react";
import {
  HorizontalStack,
  Button,
  Box,
  Divider,
  SkeletonBodyText,
  SkeletonThumbnail,
} from "@shopify/polaris";

export const ProductSkeleton = () => {
  return (
    <React.Fragment>
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
  );
};
