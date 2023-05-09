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
import { Redirect } from "@shopify/app-bridge/actions";
import { useAppBridge } from "@shopify/app-bridge-react";
import { useAuthenticatedFetch } from "../hooks";

export function BuyCreditsModal({
  isBuyCreditsModalOpen,
  toggleBuyCreditsModal,
}) {
  const app = useAppBridge();
  const redirect = Redirect.create(app);
  const [value, setValue] = useState("10");
  const handleChange = (_, newValue) => setValue(newValue);
  const authenticatedFetch = useAuthenticatedFetch();

  const onSubmit = async () => {
    const response = await authenticatedFetch("/api/credits", {
      method: "POST",
      body: JSON.stringify({
        option: value,
      }),
      headers: {
        "Content-Type": "application/json",
      },
    });
    const data = await response.json();
    redirect.dispatch(
      Redirect.Action.REMOTE,
      decodeURIComponent(data.confirmationUrl)
    );
  };

  return (
    <>
      <Modal
        open={isBuyCreditsModalOpen}
        onClose={toggleBuyCreditsModal}
        title="Purchase Credits"
        primaryAction={{
          content: "Start Purchase",
          onAction: () => {
            onSubmit();
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
                    <HorizontalStack gap="4">
                      <Text>350 credits</Text>
                      <Badge status="info">Best Value</Badge>
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
