import {
  reactExtension,
  Banner,
  BlockStack,
  Button,
  Heading,
  InlineLayout,
  Text,
  TextField,
  useApi,
  useCartLines,
  useSettings,
} from '@shopify/ui-extensions-react/checkout';
import { useState, useEffect } from 'react';

export default reactExtension(
  'purchase.checkout.block.render',
  () => <Extension />,
);

function Extension() {
  const { extension, lines } = useApi();
  const cartLines = useCartLines();
  const settings = useSettings();
  
  const [selectedProduct, setSelectedProduct] = useState<typeof cartLines[0] | null>(null);
  const [offerPrice, setOfferPrice] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Check if customer wants to make an offer for items in cart
  const [showOfferForm, setShowOfferForm] = useState(false);

  useEffect(() => {
    // Auto-populate customer email if available
    const customer = extension.customer;
    if (customer?.email) {
      setCustomerEmail(customer.email);
    }
  }, [extension.customer]);

  const handleMakeOffer = async () => {
    if (!selectedProduct || !offerPrice || !customerEmail) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Clean the Shopify product ID exactly like the working version
      const cleanProductId = selectedProduct.merchandise.product.id
        .replace('gid://shopify/Product/', '')
        .replace('gid://shopify/ProductVariant/', '')
        .split('/')[0];

      console.log('Making direct API call like working version:', {
        shopify_product_id: cleanProductId,
        customer_email: customerEmail,
        target_price: parseFloat(offerPrice),
        current_price: parseFloat(selectedProduct.cost.amount),
        currency: selectedProduct.cost.currencyCode,
      });

      // Make direct API call exactly like the working product page version
      const apiUrl = settings.api_url || 'http://localhost:3000';
      const response = await fetch(`${apiUrl}/api/shopify/buy-orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          shopify_product_id: cleanProductId,
          customer_email: customerEmail,
          target_price: parseFloat(offerPrice),
          current_price: parseFloat(selectedProduct.cost.amount),
          currency: selectedProduct.cost.currencyCode,
          expires_in_days: 30
        }),
      });

      const data = await response.json();
      console.log('API response:', data);

      if (response.ok) {
        setShowSuccess(true);
        setShowOfferForm(false);
        setTimeout(() => setShowSuccess(false), 5000);
      } else {
        console.error('API Error:', data);
        alert(`Error: ${data.error || 'Failed to submit offer'}`);
      }
    } catch (error) {
      console.error('Error submitting offer:', error);
      alert('Error submitting offer. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const suggestedOffer = selectedProduct 
    ? (parseFloat(selectedProduct.cost.amount) * 0.9).toFixed(2)
    : '';

  if (showSuccess) {
    return (
      <Banner status="success">
        <BlockStack spacing="tight">
          <Heading level={3}>🎉 Offer Submitted!</Heading>
          <Text>
            We&apos;ll notify you if the price drops to your offer amount.
            You can continue shopping or complete your current purchase.
          </Text>
        </BlockStack>
      </Banner>
    );
  }

  return (
    <BlockStack spacing="base">
      <Banner status="info">
        <BlockStack spacing="tight">
          <Heading level={3}>
            {settings.banner_title || "Can't afford it right now?"}
          </Heading>
          <Text>
            Make an offer and we&apos;ll notify you if the price drops to your target!
          </Text>
          
          {!showOfferForm && (
            <Button
              kind="secondary"
              onPress={() => setShowOfferForm(true)}
            >
              Make an Offer
            </Button>
          )}
        </BlockStack>
      </Banner>

      {showOfferForm && (
        <BlockStack spacing="base">
          <Heading level={4}>Choose Product & Make Offer</Heading>
          
          {/* Product Selection */}
          <BlockStack spacing="tight">
            <Text emphasis="bold">Select Product:</Text>
            {cartLines.map((line: any) => (
              <Button
                key={line.id}
                kind={selectedProduct?.id === line.id ? "primary" : "secondary"}
                onPress={() => setSelectedProduct(line)}
              >
                {line.merchandise.product.title} - ${line.cost.amount}
              </Button>
            ))}
          </BlockStack>

          {selectedProduct && (
            <BlockStack spacing="base">
              <InlineLayout columns={['fill', 'fill']}>
                <BlockStack spacing="tight">
                  <Text emphasis="bold">Current Price:</Text>
                  <Text size="large">
                    ${selectedProduct.cost.amount} {selectedProduct.cost.currencyCode}
                  </Text>
                </BlockStack>
                <BlockStack spacing="tight">
                  <Text emphasis="bold">Suggested Offer:</Text>
                  <Text size="large" appearance="accent">
                    ${suggestedOffer} {selectedProduct.cost.currencyCode}
                  </Text>
                </BlockStack>
              </InlineLayout>

              <TextField
                label="Your Offer Price"
                value={offerPrice}
                onChange={setOfferPrice}
                type="number"
                placeholder={suggestedOffer}
              />

              <TextField
                label="Email Address"
                value={customerEmail}
                onChange={setCustomerEmail}
                type="email"
                placeholder="your@email.com"
              />

              <InlineLayout columns={['fill', 'fill']}>
                <Button
                  kind="secondary"
                  onPress={() => setShowOfferForm(false)}
                >
                  Cancel
                </Button>
                <Button
                  kind="primary"
                  onPress={handleMakeOffer}
                  loading={isSubmitting}
                  disabled={!selectedProduct || !offerPrice || !customerEmail}
                >
                  Submit Offer
                </Button>
              </InlineLayout>
            </BlockStack>
          )}
        </BlockStack>
      )}
    </BlockStack>
  );
}