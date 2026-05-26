-- Vinyard Burger Bar Complete Menu - Based on Provided Menu Images
-- Using Philippine Peso (₱)

USE vinyard_burger_db;

-- Clear existing menu data
DELETE FROM order_items;
DELETE FROM menu_items;
DELETE FROM categories;

-- Reset auto increment
ALTER TABLE categories AUTO_INCREMENT = 1;
ALTER TABLE menu_items AUTO_INCREMENT = 1;

-- Insert Categories
INSERT INTO categories (name, description, display_order, is_active) VALUES
('Pasta', 'Delicious pasta dishes made with premium ingredients', 1, true),
('Fries & Appetizers', 'Crispy fries and tasty appetizers perfect for sharing', 2, true),
('Sizzling Rice Meal', 'Hot sizzling plates served with rice', 3, true),
('Burgers', '100% Pure Beef Burgers - Our specialty!', 4, true),
('Flavored Chicken', 'Crispy fried chicken with various flavors', 5, true),
('Coffee', 'Premium Arabica coffee selections', 6, true),
('Frappe', 'Blended iced beverages', 7, true),
('Milk Shake', 'Creamy and refreshing milkshakes', 8, true),
('Beverages', 'Refreshing drinks and sodas', 9, true);

-- PASTA MENU
INSERT INTO menu_items (category_id, name, description, price, preparation_time, is_available) VALUES
(1, 'Classic Spaghetti Carbonara', 'Creamy classic spaghetti carbonara served with poached egg and garlic bread.', 195.00, 20, true),
(1, 'Asian Chicken Pasta', 'Sweet and spicy Asian-style pasta with tender chicken and mushrooms, served with garlic bread.', 185.00, 20, true),
(1, 'Pinoy Style Spaghetti', 'Sweet-style Filipino spaghetti topped with hotdogs and grated cheese, served with garlic bread.', 175.00, 18, true),
(1, 'Fettuccine Bolognese', 'Fettuccine pasta in rich savory Bolognese sauce, topped with parmesan cheese and basil oil, served with garlic bread.', 195.00, 22, true),
(1, 'Fettuccine Chicken Alfredo', 'Fettuccine pasta in creamy Alfredo sauce with chicken tenders, served with garlic bread.', 185.00, 20, true),
(1, 'Creamy Ham & Mushroom Fettuccine', 'Fettuccine pasta in creamy parmesan sauce with ham and mushrooms, served with garlic bread.', 185.00, 20, true);

-- FRIES & APPETIZERS
INSERT INTO menu_items (category_id, name, description, price, preparation_time, is_available) VALUES
(2, 'Classic French Fries - Solo', 'Golden crispy fries, perfectly spiced, served with tomato ketchup dip.', 85.00, 10, true),
(2, 'Classic French Fries - Sharing', 'Golden crispy fries, perfectly spiced, served with tomato ketchup dip.', 165.00, 12, true),
(2, 'Cheese Fries - Solo', 'Crispy fries topped with creamy cheddar cheese sauce, served with BBQ dip.', 95.00, 12, true),
(2, 'Cheese Fries - Sharing', 'Crispy fries topped with creamy cheddar cheese sauce, served with BBQ dip.', 185.00, 14, true),
(2, 'Mozzarella Stick - Solo', 'Creamy mozzarella coated in herbed breadcrumbs, crispy golden, served with BBQ dip.', 145.00, 15, true),
(2, 'Mozzarella Stick - Sharing', 'Creamy mozzarella coated in herbed breadcrumbs, crispy golden, served with BBQ dip.', 285.00, 18, true),
(2, 'Nacho Fries', 'Crispy fries loaded with mango salsa, chilli con carne, sour cream and cheddar cheese sauce.', 249.00, 18, true),
(2, 'Pulled Pork BBQ Fries', 'Crispy fries topped with tender BBQ pulled pork, finished with lemon garlic aioli.', 249.00, 18, true),
(2, 'Garlic Parmesan Potato Wedges', 'Homemade potato wedges tossed with garlic oil, parmesan cheese and fried garlic, served with lemon garlic aioli.', 175.00, 20, true),
(2, 'Vinyard Style Potato Wedges', 'Homemade potato wedges topped with parmesan cheese, bacon bits and our signature Vinyard sauce.', 195.00, 22, true),
(2, 'Spicy Salted Egg Potato Wedges', 'Homemade potato wedges coated in rich spicy salted egg, served with creamy sour cream.', 185.00, 20, true);

-- SIZZLING RICE MEAL
INSERT INTO menu_items (category_id, name, description, price, preparation_time, is_available) VALUES
(3, 'Sizzling Burger Steak with Egg', 'Homemade beef patties smothered in rich mushroom gravy, served hot with rice.', 145.00, 20, true),
(3, 'Sizzling Luncheon Meat with Egg', 'Three slices of savory luncheon meat with sunny side-up egg, drizzled with teriyaki sauce, served hot with rice.', 125.00, 15, true),
(3, 'Pulled Pork BBQ with Egg', 'Savory BBQ pulled pork with sunny side up egg, served hot with rice.', 145.00, 18, true),
(3, 'Smoked BBQ Pork Belly', 'Savory smoked BBQ pork belly, served hot with rice.', 185.00, 20, true),
(3, 'Sizzling Hungarian Sausage with Egg', 'Juicy Hungarian sausage with sunny side up egg and gravy, served hot with rice.', 125.00, 15, true);

-- BURGERS (100% Pure Beef)
INSERT INTO menu_items (category_id, name, description, price, preparation_time, is_available) VALUES
(4, 'Vinyard Classic Burger', 'Home-made pure beef patty topped with cheddar cheese sauce, fresh lettuce, onions, and our signature Vinyard burger sauce.', 175.00, 18, true),
(4, 'Vinyard Cheese Burger', 'Home-made pure beef patty topped with sliced cheese & cheddar cheese sauce, caramelized onions, fresh lettuce, fresh tomato and our signature Vinyard burger sauce.', 185.00, 20, true),
(4, 'Chef\'s Choice Burger', 'Home-made pure beef patty topped with bacon, sliced cheese, onions, fresh lettuce, fresh tomato, and our signature Vinyard sauce.', 215.00, 22, true),
(4, 'Double CC Burger', 'Double home-made beef patties topped with bacon, sliced cheese, onions, fresh lettuce, fresh tomato, and our signature Vinyard sauce.', 295.00, 25, true),
(4, 'Bacon BBQ Burger', 'Home-made beef patty topped with bacon, sliced cheese, fresh lettuce, fresh tomato, onions, garlic aioli, and BBQ sauce.', 215.00, 22, true),
(4, 'BLT Burger', 'Home-made beef patty loaded with bacon, sliced cheese & cheddar sauce, fresh lettuce, fresh tomato, and our signature Vinyard sauce.', 215.00, 22, true),
(4, 'Double BLT Burger', 'Double home-made beef patty loaded with bacon, sliced cheese & cheddar sauce, fresh lettuce, fresh tomato, and our signature Vinyard sauce.', 295.00, 25, true),
(4, 'Hawaiian BBQ Burger', 'Home-made beef patty topped with sweet pineapple, sliced cheese, fresh tomato, caramelized onions, lettuce, garlic aioli, and BBQ sauce.', 185.00, 20, true),
(4, 'Titan Ultimate Burger', 'Triple layer home-made beef patties loaded with 3 cheese slices, bacon, cheddar cheese sauce, caramelized onions, fresh lettuce, tomato, and our signature Vinyard sauce.', 379.00, 30, true);

-- FLAVORED CHICKEN
INSERT INTO menu_items (category_id, name, description, price, preparation_time, is_available) VALUES
(5, 'Classic Fried Chicken - 3 Pieces', 'Crispy fried chicken with your choice of flavor: Classic, Garlic Parmesan, Ranch BBQ, Sweet Chilli, or Spicy Sriracha Mayo.', 175.00, 20, true),
(5, 'Classic Fried Chicken - 6 Pieces', 'Crispy fried chicken with your choice of flavor: Classic, Garlic Parmesan, Ranch BBQ, Sweet Chilli, or Spicy Sriracha Mayo.', 350.00, 25, true),
(5, 'Classic Fried Chicken - 9 Pieces', 'Crispy fried chicken with your choice of flavor: Classic, Garlic Parmesan, Ranch BBQ, Sweet Chilli, or Spicy Sriracha Mayo.', 515.00, 30, true),
(5, 'Flavored Chicken w/ Drinks - Solo', 'Choice of flavored chicken with rice or fries and drinks.', 165.00, 20, true),
(5, 'Flavored Chicken w/ Drinks - Double', 'Choice of flavored chicken with rice or fries and drinks for 2 persons.', 310.00, 25, true),
(5, 'Flavored Chicken w/ Drinks - Family', 'Choice of flavored chicken with rice or fries and drinks for family.', 485.00, 30, true);

-- ICED COFFEE (12oz)
INSERT INTO menu_items (category_id, name, description, price, preparation_time, is_available) VALUES
(6, 'Vanilla Cold Brew - 12oz', 'Smooth cold brew coffee with vanilla flavor.', 85.00, 5, true),
(6, 'Iced Coffee Latte - 12oz', 'Espresso with milk over ice.', 109.00, 5, true),
(6, 'Iced Spanish Latte - 12oz', 'Espresso with condensed milk over ice.', 115.00, 5, true),
(6, 'Iced Caramel Macchiato - 12oz', 'Espresso with vanilla and caramel over ice.', 125.00, 5, true),
(6, 'Iced Mocha - 12oz', 'Espresso with chocolate and milk over ice.', 145.00, 5, true);

-- ICED COFFEE (16oz)
INSERT INTO menu_items (category_id, name, description, price, preparation_time, is_available) VALUES
(6, 'Vanilla Cold Brew - 16oz', 'Smooth cold brew coffee with vanilla flavor.', 95.00, 5, true),
(6, 'Iced Coffee Latte - 16oz', 'Espresso with milk over ice.', 119.00, 5, true),
(6, 'Iced Spanish Latte - 16oz', 'Espresso with condensed milk over ice.', 125.00, 5, true),
(6, 'Iced Caramel Macchiato - 16oz', 'Espresso with vanilla and caramel over ice.', 135.00, 5, true),
(6, 'Iced Mocha - 16oz', 'Espresso with chocolate and milk over ice.', 155.00, 5, true);

-- FRAPPE (12oz)
INSERT INTO menu_items (category_id, name, description, price, preparation_time, is_available) VALUES
(7, 'Vanilla Frappe - 12oz', 'Blended vanilla cream frappe.', 125.00, 8, true),
(7, 'Caramel Frappe - 12oz', 'Blended caramel cream frappe.', 160.00, 8, true),
(7, 'Chocolate Frappe - 12oz', 'Blended chocolate cream frappe.', 165.00, 8, true),
(7, 'Mocha Frappe - 12oz', 'Blended mocha coffee frappe.', 175.00, 8, true);

-- FRAPPE (16oz)
INSERT INTO menu_items (category_id, name, description, price, preparation_time, is_available) VALUES
(7, 'Vanilla Frappe - 16oz', 'Blended vanilla cream frappe.', 135.00, 8, true),
(7, 'Caramel Frappe - 16oz', 'Blended caramel cream frappe.', 170.00, 8, true),
(7, 'Chocolate Frappe - 16oz', 'Blended chocolate cream frappe.', 175.00, 8, true),
(7, 'Mocha Frappe - 16oz', 'Blended mocha coffee frappe.', 185.00, 8, true);

-- MILK SHAKE
INSERT INTO menu_items (category_id, name, description, price, preparation_time, is_available) VALUES
(8, 'Mango Shake', 'Creamy mango milkshake.', 105.00, 8, true),
(8, 'Strawberry Shake', 'Creamy strawberry milkshake.', 105.00, 8, true);

-- BEVERAGES
INSERT INTO menu_items (category_id, name, description, price, preparation_time, is_available) VALUES
(9, 'Coke', 'Classic Coca-Cola.', 35.00, 2, true),
(9, 'Sprite', 'Refreshing lemon-lime soda.', 35.00, 2, true),
(9, 'Lemon Iced Tea', 'Refreshing lemon iced tea.', 35.00, 2, true),
(9, 'Mineral Water', 'Bottled mineral water.', 25.00, 1, true);

-- Verify menu items count
SELECT c.name as category, COUNT(mi.id) as item_count 
FROM categories c 
LEFT JOIN menu_items mi ON c.id = mi.category_id 
GROUP BY c.id, c.name 
ORDER BY c.id;