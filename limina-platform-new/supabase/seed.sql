-- Seed data for local development
-- This file will be run automatically when using `supabase db reset`

-- Clear existing data
TRUNCATE TABLE notifications, buy_orders, price_history, products, customers, merchants RESTART IDENTITY CASCADE;

-- Insert sample merchants
INSERT INTO merchants (id, name, email, shopify_domain, shopify_access_token) VALUES 
('123e4567-e89b-12d3-a456-426614174000', 'TechStore Ltd', 'admin@techstore.com', 'techstore.myshopify.com', 'sample_token_123'),
('123e4567-e89b-12d3-a456-426614174001', 'Fashion Forward', 'hello@fashionforward.com', 'fashionforward.myshopify.com', 'sample_token_456'),
('123e4567-e89b-12d3-a456-426614174002', 'HomeGoods Plus', 'info@homegoods.com', 'homegoods.myshopify.com', 'sample_token_789');

-- Insert sample customers
INSERT INTO customers (id, email, name) VALUES 
('223e4567-e89b-12d3-a456-426614174000', 'john@example.com', 'John Smith'),
('223e4567-e89b-12d3-a456-426614174001', 'sarah@example.com', 'Sarah Johnson'),
('223e4567-e89b-12d3-a456-426614174002', 'mike@example.com', 'Mike Chen'),
('223e4567-e89b-12d3-a456-426614174003', 'emma@example.com', 'Emma Wilson'),
('223e4567-e89b-12d3-a456-426614174004', 'alex@example.com', 'Alex Rodriguez');

-- Insert sample products
INSERT INTO products (id, merchant_id, title, description, price, current_price, currency, image_url, shopify_product_id) VALUES 
-- TechStore Products
('323e4567-e89b-12d3-a456-426614174000', '123e4567-e89b-12d3-a456-426614174000', 'iPhone 16 Pro', 'Latest iPhone with advanced camera system and A18 Pro chip. Available in Natural Titanium, Blue Titanium, White Titanium, and Black Titanium.', 999.00, 999.00, 'GBP', 'https://images.unsplash.com/photo-1605236453806-6ff36851218e?w=400&h=400&fit=crop', 'iphone-16-pro'),
('323e4567-e89b-12d3-a456-426614174001', '123e4567-e89b-12d3-a456-426614174000', 'MacBook Pro 14"', 'Powerful M3 MacBook Pro with 14-inch Liquid Retina XDR display. Perfect for professionals and creatives.', 1799.00, 1799.00, 'GBP', 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=400&h=400&fit=crop', 'macbook-pro-14'),
('323e4567-e89b-12d3-a456-426614174002', '123e4567-e89b-12d3-a456-426614174000', 'Sony WH-1000XM5', 'Industry-leading noise cancelling headphones with exceptional sound quality and 30-hour battery life.', 329.00, 279.00, 'GBP', 'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=400&h=400&fit=crop', 'sony-wh1000xm5'),
('323e4567-e89b-12d3-a456-426614174003', '123e4567-e89b-12d3-a456-426614174000', 'iPad Air', 'Powerful iPad Air with M2 chip. Perfect for creativity, productivity, and entertainment on the go.', 699.00, 649.00, 'GBP', 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400&h=400&fit=crop', 'ipad-air'),
('323e4567-e89b-12d3-a456-426614174004', '123e4567-e89b-12d3-a456-426614174000', 'Apple Watch Series 9', 'Advanced health and fitness features with the brightest Always-On Retina display yet.', 399.00, 359.00, 'GBP', 'https://images.unsplash.com/photo-1551816230-ef5deaed4a26?w=400&h=400&fit=crop', 'apple-watch-9'),

-- Fashion Forward Products  
('323e4567-e89b-12d3-a456-426614174005', '123e4567-e89b-12d3-a456-426614174001', 'Designer Handbag', 'Luxury leather handbag crafted from premium Italian leather. Timeless design meets modern functionality.', 450.00, 450.00, 'GBP', 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=400&h=400&fit=crop', 'designer-handbag'),
('323e4567-e89b-12d3-a456-426614174006', '123e4567-e89b-12d3-a456-426614174001', 'Cashmere Sweater', 'Ultra-soft 100% cashmere sweater. Perfect for layering or wearing on its own.', 189.00, 149.00, 'GBP', 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=400&h=400&fit=crop', 'cashmere-sweater'),
('323e4567-e89b-12d3-a456-426614174007', '123e4567-e89b-12d3-a456-426614174001', 'Silk Scarf', 'Hand-rolled silk scarf with exclusive print. A perfect accessory for any season.', 89.00, 79.00, 'GBP', 'https://images.unsplash.com/photo-1601486887965-8e43ad8e7e8d?w=400&h=400&fit=crop', 'silk-scarf'),

-- HomeGoods Products
('323e4567-e89b-12d3-a456-426614174008', '123e4567-e89b-12d3-a456-426614174002', 'Smart Coffee Maker', 'WiFi-enabled coffee maker with programmable brewing and smartphone app control.', 199.00, 179.00, 'GBP', 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=400&fit=crop', 'smart-coffee-maker'),
('323e4567-e89b-12d3-a456-426614174009', '123e4567-e89b-12d3-a456-426614174002', 'Organic Bedding Set', 'Luxurious organic cotton bedding set. Hypoallergenic and sustainably sourced.', 129.00, 119.00, 'GBP', 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&h=400&fit=crop', 'organic-bedding');

-- Insert price history for products (showing price changes over time)
INSERT INTO price_history (product_id, price, recorded_at) VALUES 
-- iPhone 16 Pro price history
('323e4567-e89b-12d3-a456-426614174000', 1099.00, NOW() - INTERVAL '90 days'),
('323e4567-e89b-12d3-a456-426614174000', 1049.00, NOW() - INTERVAL '60 days'),
('323e4567-e89b-12d3-a456-426614174000', 999.00, NOW() - INTERVAL '30 days'),
('323e4567-e89b-12d3-a456-426614174000', 999.00, NOW()),

-- MacBook Pro price history
('323e4567-e89b-12d3-a456-426614174001', 1899.00, NOW() - INTERVAL '90 days'),
('323e4567-e89b-12d3-a456-426614174001', 1849.00, NOW() - INTERVAL '60 days'),
('323e4567-e89b-12d3-a456-426614174001', 1799.00, NOW() - INTERVAL '30 days'),
('323e4567-e89b-12d3-a456-426614174001', 1799.00, NOW()),

-- Sony Headphones price history (showing recent drop)
('323e4567-e89b-12d3-a456-426614174002', 349.00, NOW() - INTERVAL '90 days'),
('323e4567-e89b-12d3-a456-426614174002', 329.00, NOW() - INTERVAL '60 days'),
('323e4567-e89b-12d3-a456-426614174002', 329.00, NOW() - INTERVAL '30 days'),
('323e4567-e89b-12d3-a456-426614174002', 279.00, NOW() - INTERVAL '5 days'),
('323e4567-e89b-12d3-a456-426614174002', 279.00, NOW()),

-- iPad Air price history
('323e4567-e89b-12d3-a456-426614174003', 699.00, NOW() - INTERVAL '60 days'),
('323e4567-e89b-12d3-a456-426614174003', 679.00, NOW() - INTERVAL '30 days'),
('323e4567-e89b-12d3-a456-426614174003', 649.00, NOW() - INTERVAL '10 days'),
('323e4567-e89b-12d3-a456-426614174003', 649.00, NOW()),

-- Apple Watch price history
('323e4567-e89b-12d3-a456-426614174004', 399.00, NOW() - INTERVAL '60 days'),
('323e4567-e89b-12d3-a456-426614174004', 379.00, NOW() - INTERVAL '30 days'),
('323e4567-e89b-12d3-a456-426614174004', 359.00, NOW() - INTERVAL '7 days'),
('323e4567-e89b-12d3-a456-426614174004', 359.00, NOW());

-- Insert sample buy orders with various statuses
INSERT INTO buy_orders (id, merchant_id, product_id, customer_id, customer_email, customer_name, target_price, current_price, status, condition_value, expires_at, created_at, fulfilled_at) VALUES 
-- Active monitoring orders
('423e4567-e89b-12d3-a456-426614174000', '123e4567-e89b-12d3-a456-426614174000', '323e4567-e89b-12d3-a456-426614174000', '223e4567-e89b-12d3-a456-426614174000', 'john@example.com', 'John Smith', 849.00, 999.00, 'monitoring', '{"probability": 85}', NOW() + INTERVAL '25 days', NOW() - INTERVAL '5 days', NULL),
('423e4567-e89b-12d3-a456-426614174001', '123e4567-e89b-12d3-a456-426614174000', '323e4567-e89b-12d3-a456-426614174001', '223e4567-e89b-12d3-a456-426614174001', 'sarah@example.com', 'Sarah Johnson', 1699.00, 1799.00, 'monitoring', '{"probability": 75}', NOW() + INTERVAL '20 days', NOW() - INTERVAL '10 days', NULL),
('423e4567-e89b-12d3-a456-426614174002', '123e4567-e89b-12d3-a456-426614174000', '323e4567-e89b-12d3-a456-426614174003', '223e4567-e89b-12d3-a456-426614174003', 'mike@example.com', 'Mike Chen', 599.00, 649.00, 'monitoring', '{"probability": 65}', NOW() + INTERVAL '35 days', NOW() - INTERVAL '3 days', NULL),

-- Fulfilled orders (showing successful purchases)
('423e4567-e89b-12d3-a456-426614174003', '123e4567-e89b-12d3-a456-426614174000', '323e4567-e89b-12d3-a456-426614174002', '223e4567-e89b-12d3-a456-426614174002', 'mike@example.com', 'Mike Chen', 279.00, 279.00, 'fulfilled', '{"probability": 100}', NOW() + INTERVAL '55 days', NOW() - INTERVAL '15 days', NOW() - INTERVAL '5 days'),
('423e4567-e89b-12d3-a456-426614174004', '123e4567-e89b-12d3-a456-426614174000', '323e4567-e89b-12d3-a456-426614174004', '223e4567-e89b-12d3-a456-426614174004', 'emma@example.com', 'Emma Wilson', 359.00, 359.00, 'fulfilled', '{"probability": 100}', NOW() + INTERVAL '45 days', NOW() - INTERVAL '8 days', NOW() - INTERVAL '1 day'),

-- More customer orders for variety
('423e4567-e89b-12d3-a456-426614174005', '123e4567-e89b-12d3-a456-426614174001', '323e4567-e89b-12d3-a456-426614174006', '223e4567-e89b-12d3-a456-426614174001', 'sarah@example.com', 'Sarah Johnson', 129.00, 149.00, 'monitoring', '{"probability": 80}', NOW() + INTERVAL '40 days', NOW() - INTERVAL '2 days', NULL),
('423e4567-e89b-12d3-a456-426614174006', '123e4567-e89b-12d3-a456-426614174002', '323e4567-e89b-12d3-a456-426614174008', '223e4567-e89b-12d3-a456-426614174003', 'mike@example.com', 'Mike Chen', 159.00, 179.00, 'monitoring', '{"probability": 70}', NOW() + INTERVAL '28 days', NOW() - INTERVAL '7 days', NULL),

-- Some expired/cancelled orders for realistic data
('423e4567-e89b-12d3-a456-426614174007', '123e4567-e89b-12d3-a456-426614174000', '323e4567-e89b-12d3-a456-426614174000', '223e4567-e89b-12d3-a456-426614174004', 'emma@example.com', 'Emma Wilson', 750.00, 999.00, 'expired', '{"probability": 45}', NOW() - INTERVAL '5 days', NOW() - INTERVAL '35 days', NULL),
('423e4567-e89b-12d3-a456-426614174008', '123e4567-e89b-12d3-a456-426614174001', '323e4567-e89b-12d3-a456-426614174005', '223e4567-e89b-12d3-a456-426614174000', 'john@example.com', 'John Smith', 350.00, 450.00, 'cancelled', '{"probability": 30}', NOW() + INTERVAL '15 days', NOW() - INTERVAL '12 days', NULL);

-- Insert sample notifications
INSERT INTO notifications (user_id, user_type, buy_order_id, title, message, type, created_at, read_at) VALUES 
-- Merchant notifications
('123e4567-e89b-12d3-a456-426614174000', 'merchant', '423e4567-e89b-12d3-a456-426614174000', 'New Buy Order', 'John Smith created a buy order for iPhone 16 Pro at £849', 'new_order', NOW() - INTERVAL '5 days', NULL),
('123e4567-e89b-12d3-a456-426614174000', 'merchant', '423e4567-e89b-12d3-a456-426614174003', 'Order Fulfilled', 'Buy order for Sony WH-1000XM5 has been automatically fulfilled', 'order_fulfilled', NOW() - INTERVAL '5 days', NOW() - INTERVAL '3 days'),

-- Customer notifications  
('223e4567-e89b-12d3-a456-426614174002', 'customer', '423e4567-e89b-12d3-a456-426614174003', 'Order Fulfilled!', 'Your buy order for Sony WH-1000XM5 has been fulfilled at £279. You saved £50!', 'order_fulfilled', NOW() - INTERVAL '5 days', NOW() - INTERVAL '4 days'),
('223e4567-e89b-12d3-a456-426614174004', 'customer', '423e4567-e89b-12d3-a456-426614174004', 'Order Fulfilled!', 'Your buy order for Apple Watch Series 9 has been fulfilled at £359. You saved £40!', 'order_fulfilled', NOW() - INTERVAL '1 day', NULL),
('223e4567-e89b-12d3-a456-426614174000', 'customer', '423e4567-e89b-12d3-a456-426614174000', 'Price Alert', 'iPhone 16 Pro is getting closer to your target price of £849. Current price: £999', 'price_alert', NOW() - INTERVAL '2 days', NULL),
('223e4567-e89b-12d3-a456-426614174004', 'customer', '423e4567-e89b-12d3-a456-426614174007', 'Order Expired', 'Your buy order for iPhone 16 Pro at £750 has expired', 'order_expired', NOW() - INTERVAL '5 days', NOW() - INTERVAL '4 days');

-- Display summary of inserted data
DO $$
BEGIN
    RAISE NOTICE 'Seed data inserted successfully!';
    RAISE NOTICE 'Merchants: %', (SELECT COUNT(*) FROM merchants);
    RAISE NOTICE 'Customers: %', (SELECT COUNT(*) FROM customers);
    RAISE NOTICE 'Products: %', (SELECT COUNT(*) FROM products);
    RAISE NOTICE 'Buy Orders: %', (SELECT COUNT(*) FROM buy_orders);
    RAISE NOTICE 'Price History Records: %', (SELECT COUNT(*) FROM price_history);
    RAISE NOTICE 'Notifications: %', (SELECT COUNT(*) FROM notifications);
END $$;
