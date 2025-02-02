import { useEffect, useState } from "react";
import {
  Form,
  FormLayout,
  TextField,
  ButtonGroup,
  Button,
  Modal,
  Text,
} from "@shopify/polaris";
import { RedoMajor } from "@shopify/polaris-icons";

export function EditProductForm({
  generatedText = "",
  setGeneratedText,
  generateDescription,
  product,
  isGeneratingText,
  updateDescription,
  description,
  setDescription,
  cancelGeneration,
  isDisabled,
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const toggleModal = () => setIsModalOpen(!isModalOpen);

  useEffect(() => {
    setDescription(generatedText);
  }, [generatedText]);

  return (
    <>
      <Form>
        <FormLayout>
          <TextField
            multiline
            value={description}
            onChange={setDescription}
            label="Description"
            type="text"
          />
          <ButtonGroup>
            <Button primary onClick={toggleModal}>
              Submit
            </Button>
            <Button
              disabled={isDisabled}
              isLoading={isGeneratingText}
              icon={RedoMajor}
              onClick={() => generateDescription(product)}
            >
              Redo
            </Button>
            <Button
              onClick={() => {
                setGeneratedText("");
                cancelGeneration(product);
              }}
            >
              Cancel
            </Button>
          </ButtonGroup>
        </FormLayout>
      </Form>
      <Modal
        open={isModalOpen}
        onClose={toggleModal}
        title="Confirm Action"
        primaryAction={{
          content: "Confirm",
          onAction: () => {
            updateDescription(product);
            toggleModal();
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
          <Text>Are you sure you want to update your product description?</Text>
        </Modal.Section>
      </Modal>
    </>
  );
}
