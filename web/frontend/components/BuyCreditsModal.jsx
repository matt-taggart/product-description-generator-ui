import { useState } from "react";
import {
  Form,
  FormLayout,
  Badge,
  RadioButton,
  Modal,
  Text,
  VerticalStack,
  HorizontalStack,
} from "@shopify/polaris";

export function BuyCreditsModal({
  isBuyCreditsModalOpen,
  toggleBuyCreditsModal,
}) {
  const [value, setValue] = useState("disabled");
  const handleChange = (_, newValue) => setValue(newValue);
  return (
    <>
      <Modal
        open={isBuyCreditsModalOpen}
        onClose={toggleBuyCreditsModal}
        title="Purchase Credits"
        primaryAction={{
          content: "Start Purchase",
          onAction: () => {
            updateDescription();
            toggleBuyCreditsModal();
          },
        }}
        secondaryActions={[
          {
            content: "Cancel",
            onAction: toggleBuyCreditsModal,
          },
        ]}
      >
        <Modal.Section>
          <VerticalStack gap="4">
            <Text>Select your package:</Text>
            <Form>
              <FormLayout>
                <RadioButton
                  label="100 Credits"
                  helpText="Cost: $10"
                  checked={value === "10"}
                  id="10"
                  name="package"
                  onChange={handleChange}
                />
                <RadioButton
                  label="200 Credits"
                  helpText="Cost: $20"
                  id="20"
                  name="package"
                  checked={value === "20"}
                  onChange={handleChange}
                />{" "}
                <RadioButton
                  label={
                    <HorizontalStack gap="3">
                      <Text>350 credits</Text>
                      <Badge status="info">Most Popular</Badge>
                    </HorizontalStack>
                  }
                  helpText="Cost $30. Includes volume discount of 50 credits"
                  id="30"
                  name="accounts"
                  checked={value === "30"}
                  onChange={handleChange}
                />{" "}
              </FormLayout>
            </Form>
          </VerticalStack>
        </Modal.Section>
      </Modal>
    </>
  );
}
