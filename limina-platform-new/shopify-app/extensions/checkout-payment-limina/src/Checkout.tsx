import {
  reactExtension,
  Banner,
  BlockStack,
  Button,
  Checkbox,
  Heading,
  InlineLayout,
  Text,
  TextField,
  useApi,
  useCartLines,
  useSettings,
  useTotalAmount,
  useCustomer,
} from '@shopify/ui-extensions-react/checkout';
import { useState, useEffect } from 'react';

export default reactExtension(
  'purchase.checkout.payment-method-list.render-after',
  () => <Extension />,
);

function Extension() {
  const { extension } = useApi();
  const cartLines = useCartLines();
  const settings = useSettings();
  const totalAmount = useTotalAmount();
  const customer = useCustomer();
  
  const [isLiminaSelected, setIsLiminaSelected] = useState(false);
  const [targetPrices, setTargetPrices] = useState({});
  const [customerEmail, setCustomerEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (customer?.email) {
      setCustomerEmail(customer.email);
    }
  }, [customer]);

  // Calculate suggested prices (20% off each item)
  const suggestedPrices = cartLines.reduce((acc, line) => {
    const currentPrice = parseFloat(line.cost.amount);
    const suggestedPrice = (currentPrice * 0.8).toFixed(2);
    acc[line.id] = suggestedPrice;
    return acc;
  }, {});

  useEffect(() => {
    setTargetPrices(suggestedPrices);
  }, [cartLines]);

  const totalTargetPrice = Object.values(targetPrices)
    .reduce((sum, price) => sum + (parseFloat(price) || 0), 0);

  const totalCurrentPrice = parseFloat(totalAmount?.amount || '0');
  const totalSavings = totalCurrentPrice - totalTargetPrice;
  const savingsPercentage = totalCurrentPrice > 0 
    ? ((totalSavings / totalCurrentPrice) * 100).toFixed(1)
    : 0;

  const handlePriceChange = (lineId, newPrice) => {
    setTargetPrices(prev => ({
      ...prev,
      [lineId]: newPrice
    }));
  };

  const handleLiminaCheckout = async () => {
    if (!isLiminaSelected || !customerEmail) return;

    setIsSubmitting(true);

    try {
      // Create buy orders for each cart item
      const buyOrderPromises = cartLines.map(line => {
        const targetPrice = targetPrices[line.id];
        if (!targetPrice || parseFloat(targetPrice) >= parseFloat(line.cost.amount)) {
          return null;
        }

        const apiUrl = settings.api_url || 'http://localhost:3000';
        return fetch(`${apiUrl}/api/shopify/buy-orders`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            shopify_product_id: line.merchandise.product.id,
            customer_email: customerEmail,
            target_price: parseFloat(targetPrice),
            current_price: parseFloat(line.cost.amount),
            currency: line.cost.currencyCode,
            quantity: line.quantity,
            expires_in_days: 30,
            source: 'checkout'
          }),
        });
      }).filter(Boolean);

      const results = await Promise.all(buyOrderPromises);
      const successCount = results.filter(r => r?.ok).length;

      if (successCount > 0) {
        // Show success and potentially redirect or complete checkout
        extension.banner.show({
          status: 'success',
          title: `${successCount} buy orders created!`,
          message: 'We\'ll notify you when prices drop to your targets.'
        });

        // Optional: Redirect to a success page or complete the "checkout"
        // This depends on how you want to handle the UX flow
      }
    } catch (error) {
      console.error('Error creating buy orders:', error);
      extension.banner.show({
        status: 'critical',
        title: 'Something went wrong',
        message: 'Please try again or contact support.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <BlockStack spacing="base">
      {/* Limina Payment Option */}
      <Banner status="info">
        <BlockStack spacing="tight">
          <InlineLayout columns={['auto', 'fill']}>
            <Checkbox
              checked={isLiminaSelected}
              onChange={setIsLiminaSelected}
            />
            <BlockStack spacing="tight">
              <Heading level={4}>
                💰 {settings.title || 'Pay when price drops - Limina'}
              </Heading>
              <Text size="small">
                {settings.description || 'Set your target price and only pay if items go on sale'}
              </Text>
            </BlockStack>
          </InlineLayout>

          {isLiminaSelected && (
            <BlockStack spacing="base">
              <Text emphasis="bold">Set your target prices:</Text>
              
              {cartLines.map((line) => (
                <BlockStack key={line.id} spacing="tight">
                  <InlineLayout columns={['2fr', '1fr', '1fr']}>
                    <Text size="small">
                      {line.merchandise.product.title}
                      {line.quantity > 1 && ` (×${line.quantity})`}
                    </Text>
                    <Text size="small">
                      Current: {line.cost.currencyCode} {line.cost.amount}
                    </Text>
                    <TextField
                      label="Target price"
                      value={targetPrices[line.id] || ''}
                      onChange={(value) => handlePriceChange(line.id, value)}
                      type="number"
                      placeholder={suggestedPrices[line.id]}
                    />
                  </InlineLayout>
                </BlockStack>
              ))}

              <Banner status="success">
                <BlockStack spacing="tight">
                  <Text emphasis="bold">
                    Potential savings: {totalAmount?.currencyCode} {totalSavings.toFixed(2)} ({savingsPercentage}% off)
                  </Text>
                  <Text size="small">
                    Target total: {totalAmount?.currencyCode} {totalTargetPrice.toFixed(2)} 
                    (vs current: {totalAmount?.currencyCode} {totalCurrentPrice.toFixed(2)})
                  </Text>
                </BlockStack>
              </Banner>

              {!customer?.email && (
                <TextField
                  label="Email address"
                  value={customerEmail}
                  onChange={setCustomerEmail}
                  type="email"
                  placeholder="your@email.com"
                />
              )}

              <BlockStack spacing="tight">
                <Text size="small" emphasis="bold">How it works:</Text>
                <Text size="small">
                  • We'll monitor prices for the next 30 days
                  • You'll be notified when any item drops to your target price
                  • Only pay when the price actually drops
                  • No upfront payment required
                </Text>
              </BlockStack>

              <Button
                kind="primary"
                onPress={handleLiminaCheckout}
                loading={isSubmitting}
                disabled={!customerEmail || totalTargetPrice >= totalCurrentPrice}
              >
                {isSubmitting ? 'Creating buy orders...' : 'Create Buy Orders'}
              </Button>
            </BlockStack>
          )}
        </BlockStack>
      </Banner>
    </BlockStack>
  );
}