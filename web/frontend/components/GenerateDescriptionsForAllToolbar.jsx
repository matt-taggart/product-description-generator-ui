import React, { useState } from "react";
import {
  Text,
  HorizontalStack,
  Button,
  Checkbox,
  Modal,
} from "@shopify/polaris";
import { DISPATCH_GENERATE_EVENT, emitter } from "./event-emitter";

export const GenerateDescriptionsForAllToolbar = ({
  productCount,
  products,
  creditsRemaining,
}) => {
  const [checked, setChecked] = useState(false);
  const handleChecked = (newChecked) => setChecked(newChecked);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const toggleModal = () => setIsModalOpen(!isModalOpen);

  const dispatchAllDescriptions = () => {
    const productIds = new Map();

    let creditCount = creditsRemaining;

    products.forEach((product) => {
      if (creditCount > 0 && product?.image?.url) {
        productIds.set(product.id, product.id);
        creditCount -= 1;
      }
    });

    emitter.emit(DISPATCH_GENERATE_EVENT, { productIds });
  };

  return (
    <>
      <HorizontalStack blockAlign="center" gap="4">
        <Checkbox
          label="Generate all descriptions"
          checked={checked}
          onChange={handleChecked}
        />
        <Button size="slim" disabled={!checked} onClick={toggleModal}>
          Submit
        </Button>
      </HorizontalStack>
      <Modal
        open={isModalOpen}
        onClose={toggleModal}
        title="Confirm Action"
        primaryAction={{
          content: "Generate",
          onAction: () => {
            toggleModal();
            setChecked(false);
            dispatchAllDescriptions();
          },
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
            this page? This will use {productCount} credits.
          </Text>
        </Modal.Section>
      </Modal>
    </>
  );
};
