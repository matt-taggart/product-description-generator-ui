import React, { useState } from "react";
import {
  Text,
  HorizontalStack,
  Button,
  Checkbox,
  Modal,
} from "@shopify/polaris";

export const GenerateDescriptionsForAllToolbar = ({ productCount }) => {
  const [checked, setChecked] = useState(false);
  const handleChecked = (newChecked) => setChecked(newChecked);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const toggleModal = () => setIsModalOpen(!isModalOpen);

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
            this page? This will use {productCount} credits.
          </Text>
        </Modal.Section>
      </Modal>
    </>
  );
};
