-- ============================================================
-- Riversongs Hotel - Order Management System
-- Run this once on your Railway PostgreSQL database
-- ============================================================

DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS menu_items CASCADE;
DROP TABLE IF EXISTS categories CASCADE;

CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  display_order INT DEFAULT 0,
  available_from TIME,
  available_to TIME,
  icon VARCHAR(10) DEFAULT '🍽️'
);

CREATE TABLE menu_items (
  id SERIAL PRIMARY KEY,
  category_id INT REFERENCES categories(id) ON DELETE CASCADE,
  subcategory VARCHAR(100),
  name VARCHAR(200) NOT NULL,
  description TEXT,
  price NUMERIC(10,2) NOT NULL,
  is_veg BOOLEAN DEFAULT TRUE,
  is_available BOOLEAN DEFAULT TRUE,
  size_label VARCHAR(50)
);

CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  room_number VARCHAR(20) NOT NULL,
  guest_name VARCHAR(100),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','preparing','ready','delivered','cancelled')),
  total_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  special_note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE order_items (
  id SERIAL PRIMARY KEY,
  order_id INT REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id INT REFERENCES menu_items(id),
  item_name VARCHAR(200) NOT NULL,
  unit_price NUMERIC(10,2) NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  subtotal NUMERIC(10,2) GENERATED ALWAYS AS (unit_price * quantity) STORED
);

-- ============================================================
-- CATEGORIES
-- ============================================================
INSERT INTO categories (name, display_order, available_from, available_to, icon) VALUES
  ('Breakfast',       1, '07:00', '11:00', '🌅'),
  ('Snacks',          2, '15:00', '19:00', '🍟'),
  ('Soups',           3, NULL, NULL, '🍲'),
  ('Salads',          4, NULL, NULL, '🥗'),
  ('Tandoori Zaika',  5, NULL, NULL, '🔥'),
  ('Lunch & Dinner',  6, NULL, NULL, '🍛'),
  ('Chinese',         7, NULL, NULL, '🥢'),
  ('Rice & Pulao',    8, NULL, NULL, '🍚'),
  ('Indian Breads',   9, NULL, NULL, '🫓'),
  ('Raita',          10, NULL, NULL, '🥣'),
  ('Continental',    11, NULL, NULL, '🥩'),
  ('Pasta',          12, NULL, NULL, '🍝'),
  ('Sizzlers',       13, NULL, NULL, '♨️'),
  ('Noodles',        14, NULL, NULL, '🍜'),
  ('Desserts',       15, NULL, NULL, '🍮'),
  ('Beverages',      16, NULL, NULL, '☕');

-- ============================================================
-- BREAKFAST
-- ============================================================
INSERT INTO menu_items (category_id, subcategory, name, description, price, is_veg) VALUES
  (1,'Set Menu','Continental Breakfast','Choice of Chilled Juice (Small), Toast/Slice with butter & preserves, Tea/Coffee or Hot Milk/Bournvita/Chocolate',390,TRUE),
  (1,'Set Menu','American Breakfast','Choice of Chilled Juice (Small), Toast/Slice, Cornflakes/Porridge with hot/cold milk, Eggs to Order, Coffee',450,TRUE),
  (1,'A-La-Cart','Chilled Juice (Full)','Choice of fresh chilled juice',125,TRUE),
  (1,'A-La-Cart','Chilled Juice (Small)','Choice of fresh chilled juice',80,TRUE),
  (1,'A-La-Cart','Toast with Butter & Preserves',NULL,150,TRUE),
  (1,'A-La-Cart','Cornflakes / Porridge','With hot or cold milk',150,TRUE),
  (1,'A-La-Cart','Eggs to Order','Fried / Scrambled / Boiled',125,FALSE),
  (1,'Omelette with Breads','Plain Omelette',NULL,165,FALSE),
  (1,'Omelette with Breads','Masala Omelette',NULL,190,FALSE),
  (1,'Omelette with Breads','Cheese Omelette',NULL,190,FALSE),
  (1,'Omelette with Breads','Mushroom Omelette',NULL,200,TRUE),
  (1,'Omelette with Breads','Chicken Omelette',NULL,105,FALSE),
  (1,'A-La-Cart','Boiled Egg (2 pcs.)',NULL,180,FALSE),
  (1,'A-La-Cart','Cheese Garlic Toast',NULL,180,TRUE),
  (1,'A-La-Cart','Mushroom on Toast',NULL,200,TRUE),
  (1,'A-La-Cart','Plain Prantha',NULL,55,TRUE),
  (1,'A-La-Cart','Stuffed Prantha with Pickle','1 piece',70,TRUE),
  (1,'A-La-Cart','Cheese Prantha',NULL,100,TRUE),
  (1,'A-La-Cart','Channa Bhatura','2 pieces',180,TRUE),
  (1,'A-La-Cart','Bhatura','1 piece',55,TRUE),
  (1,'A-La-Cart','Puri Bhaji','2 pieces',170,TRUE),
  (1,'A-La-Cart','Puri','1 piece',55,TRUE),
  (1,'A-La-Cart','Egg Bhurji',NULL,170,FALSE),
  (1,'A-La-Cart','Plain Slice','2 pieces',25,TRUE);

-- ============================================================
-- SNACKS
-- ============================================================
INSERT INTO menu_items (category_id, subcategory, name, price, is_veg) VALUES
  (2,'Vegetarian','Paneer 65',335,TRUE),
  (2,'Vegetarian','Finger Chips',200,TRUE),
  (2,'Vegetarian','Veg Sandwich',145,TRUE),
  (2,'Vegetarian','Veg Club Sandwich',325,TRUE),
  (2,'Vegetarian','Cheese Sandwich',200,TRUE),
  (2,'Vegetarian','Cheese Cutlet',270,TRUE),
  (2,'Vegetarian','Vegetable Cutlet',200,TRUE),
  (2,'Vegetarian','Veg Manchurian Dry',335,TRUE),
  (2,'Vegetarian','Cheese Finger',335,TRUE),
  (2,'Vegetarian','Cheese Processed',180,TRUE),
  (2,'Vegetarian','Peanut Masala',180,TRUE),
  (2,'Vegetarian','Peanut Kabab',200,TRUE),
  (2,'Vegetarian','Papad Roll',210,TRUE),
  (2,'Vegetarian','Cheese Corn Roll',270,TRUE),
  (2,'Vegetarian','Crumbed Fried Mushroom',300,TRUE),
  (2,'Vegetarian','Veg Spring Roll',270,TRUE),
  (2,'Vegetarian','Baby Corn Chilly',290,TRUE),
  (2,'Vegetarian','Baby Corn Fried',300,TRUE),
  (2,'Vegetarian','Veg Bullets',245,TRUE),
  (2,'Vegetarian','Veg Cocktail Kabab',210,TRUE),
  (2,'Vegetarian','Chilly Chulbuli',270,TRUE),
  (2,'Vegetarian','Cheese Cocktail Kabab',325,TRUE),
  (2,'Vegetarian','Veg Kathi Roll',270,TRUE),
  (2,'Vegetarian','Mushroom Chatpate',325,TRUE),
  (2,'Vegetarian','Paneer Chatpate',335,TRUE),
  (2,'Vegetarian','Hara Bhara Kabab',200,TRUE),
  (2,'Vegetarian','Veg Crispy',280,TRUE),
  (2,'Vegetarian','Chilli Honey Cauliflower',280,TRUE),
  (2,'Vegetarian','Mushroom Duplex',325,TRUE),
  (2,'Vegetarian','Veg Pakoda',225,TRUE),
  (2,'Vegetarian','Paneer Pakoda',335,TRUE),
  (2,'Non-Vegetarian','Chicken Sandwich',325,FALSE),
  (2,'Non-Vegetarian','Egg Sandwich',225,FALSE),
  (2,'Non-Vegetarian','Club Sandwich (Chicken)',400,FALSE),
  (2,'Non-Vegetarian','Chicken Cutlet',400,FALSE),
  (2,'Non-Vegetarian','Fish Finger with Tartar Sauce',420,FALSE),
  (2,'Non-Vegetarian','Chicken Pakora',420,FALSE),
  (2,'Non-Vegetarian','Fish Pakora',420,FALSE),
  (2,'Non-Vegetarian','Fish Amritsari',420,FALSE);

-- ============================================================
-- SOUPS
-- ============================================================
INSERT INTO menu_items (category_id, subcategory, name, price, is_veg) VALUES
  (3,'Vegetarian','Lemon Coriander Soup',130,TRUE),
  (3,'Vegetarian','Veg Manchow Soup',130,TRUE),
  (3,'Vegetarian','Veg Hot N Sour Soup',130,TRUE),
  (3,'Vegetarian','Veg Sweet Corn Soup',130,TRUE),
  (3,'Vegetarian','Veg Talumein Soup',130,TRUE),
  (3,'Vegetarian','Cream of Mushroom',140,TRUE),
  (3,'Vegetarian','Cream of Almond',185,TRUE),
  (3,'Vegetarian','Cream of Tomato',130,TRUE),
  (3,'Vegetarian','Cream of Vegetable',130,TRUE),
  (3,'Vegetarian','Tomato Dhaniya Shorba',130,TRUE),
  (3,'Vegetarian','Veg Clear Soup',130,TRUE),
  (3,'Non-Vegetarian','Chicken Manchow Soup',210,FALSE),
  (3,'Non-Vegetarian','Chicken Hot N Sour Soup',210,FALSE),
  (3,'Non-Vegetarian','Chicken Sweet Corn Soup',210,FALSE),
  (3,'Non-Vegetarian','Chicken Talumein Soup',225,FALSE),
  (3,'Non-Vegetarian','Cream of Chicken',210,FALSE),
  (3,'Non-Vegetarian','Chicken Clear Soup',210,FALSE);

-- ============================================================
-- SALADS
-- ============================================================
INSERT INTO menu_items (category_id, subcategory, name, price, is_veg) VALUES
  (4,'Vegetarian','Cucumber with Hung Curd Salad',185,TRUE),
  (4,'Vegetarian','Green Salad',145,TRUE),
  (4,'Vegetarian','Cucumber Salad',125,TRUE),
  (4,'Vegetarian','Russian Salad',215,TRUE),
  (4,'Vegetarian','Cheese Macaroni Salad',200,TRUE),
  (4,'Vegetarian','Fruit Salad',270,TRUE),
  (4,'Vegetarian','Aloo Chana Chat',210,TRUE),
  (4,'Vegetarian','Kachumber Salad',180,TRUE),
  (4,'Vegetarian','Papad',35,TRUE),
  (4,'Vegetarian','Papad Masala',70,TRUE),
  (4,'Vegetarian','Summer Fresh Salad',160,TRUE),
  (4,'Vegetarian','Greek Salad',160,TRUE),
  (4,'Non-Vegetarian','Egg Chat',210,FALSE),
  (4,'Non-Vegetarian','Chicken Chat',325,FALSE);

-- ============================================================
-- TANDOORI ZAIKA
-- ============================================================
INSERT INTO menu_items (category_id, subcategory, name, price, is_veg) VALUES
  (5,'Vegetarian','Paneer Malai Tikka',335,TRUE),
  (5,'Vegetarian','Paneer Lashooni Tikka',310,TRUE),
  (5,'Vegetarian','Paneer Tikka',335,TRUE),
  (5,'Vegetarian','Paneer Tikka Do Ranga',350,TRUE),
  (5,'Vegetarian','Paneer Tikka Lahouri',350,TRUE),
  (5,'Vegetarian','Makhmali Seekh',310,TRUE),
  (5,'Vegetarian','Shabnam Mushroom',325,TRUE),
  (5,'Vegetarian','Paneer Achari Tikka',325,TRUE),
  (5,'Vegetarian','Paneer Hariyali Tikka',325,TRUE),
  (5,'Vegetarian','Veg Seekh Kabab',270,TRUE),
  (5,'Vegetarian','Cheese Seekh Kabab',350,TRUE),
  (5,'Vegetarian','Mushroom Kabab',350,TRUE),
  (5,'Vegetarian','Mushroom Tikka Achari',335,TRUE),
  (5,'Vegetarian','Aloo Nazakat',270,TRUE),
  (5,'Vegetarian','Tandoori Sangam (Veg)',540,TRUE),
  (5,'Vegetarian','Tandoori Gobhi Achari',270,TRUE),
  (5,'Vegetarian','Pineapple Tikka',335,TRUE),
  (5,'Non-Vegetarian','Chicken Tikka',530,FALSE),
  (5,'Non-Vegetarian','Chicken Malai Tikka',550,FALSE),
  (5,'Non-Vegetarian','Chicken Afgani',730,FALSE),
  (5,'Non-Vegetarian','Chicken Achari Tikka',550,FALSE),
  (5,'Non-Vegetarian','Chicken Hariyali Tikka',540,FALSE),
  (5,'Non-Vegetarian','Karella Kabab',500,FALSE),
  (5,'Non-Vegetarian','Chicken Lashooni Tikka',530,FALSE),
  (5,'Non-Vegetarian','Chicken Sheekh Kabab',530,FALSE),
  (5,'Non-Vegetarian','Chicken Tandoori (Full)',670,FALSE),
  (5,'Non-Vegetarian','Chicken Tandoori (Half)',400,FALSE),
  (5,'Non-Vegetarian','Khati Meethi Seekh',530,FALSE),
  (5,'Non-Vegetarian','Kalami Kabab (4 pcs.)',600,FALSE),
  (5,'Non-Vegetarian','Tangri Kabab (4 pcs.)',600,FALSE),
  (5,'Non-Vegetarian','Stuffed Tangri (4 pcs.)',625,FALSE),
  (5,'Non-Vegetarian','Fish Tikka (Seasonal)',490,FALSE),
  (5,'Non-Vegetarian','Fish Achari Tikka (Seasonal)',490,FALSE),
  (5,'Non-Vegetarian','Fish Ajwaini Tikka (Seasonal)',490,FALSE),
  (5,'Non-Vegetarian','Tandoori Sangam (Non Veg.)',880,FALSE);

-- ============================================================
-- LUNCH & DINNER
-- ============================================================
INSERT INTO menu_items (category_id, subcategory, name, description, price, is_veg) VALUES
  (6,'Vegetarian','Riviera Special','Chef''s special recipe',475,TRUE),
  (6,'Vegetarian','Paneer Pasanda','Stuffed paneer pieces cooked in royal khoya gravy',350,TRUE),
  (6,'Vegetarian','Cheese Tomato','Cottage cheese cooked in tomato gravy with butter & cream',335,TRUE),
  (6,'Vegetarian','Shahi Paneer','Diced cottage cheese cooked in rich creamy gravy',365,TRUE),
  (6,'Vegetarian','Kadhai Paneer','Cottage cheese tossed with fresh herbs tempered with onion & capsicum, cooked & served in Kadai',385,TRUE),
  (6,'Vegetarian','Paneer Bhujia','Chopped paneer, tomato & onion cooked with Indian style',350,TRUE),
  (6,'Vegetarian','Cheese Chatniwala','Cottage cheese cooked with mint sauce',370,TRUE),
  (6,'Vegetarian','Mutter Paneer','Cubes of cottage cheese cooked with green peas',335,TRUE),
  (6,'Vegetarian','Paneer Tikka Butter Masala','Roasted cottage cheese cooked in butter, onion tomato gravy',385,TRUE),
  (6,'Vegetarian','Paneer Malai Methi','Cottage cheese cooked in kasoori methi & creamy gravy',400,TRUE),
  (6,'Vegetarian','Paneer Handi','Cottage cheese diced, onion stued butter cooked in veg. gravy',350,TRUE),
  (6,'Vegetarian','Paneer Lababdar','Cooked with kaju & makhani gravy',390,TRUE),
  (6,'Vegetarian','Paneer Makhani','Cottage cheese cooked with tomato gravy & rich butter',375,TRUE),
  (6,'Vegetarian','Paneer Methi Mirch Masala','Dry kasuri methi saak cooked with fresh cottage cheese, green chillies and brown gravy',375,TRUE),
  (6,'Vegetarian','Palak Paneer','Cottage cheese & spinach cooked in Indian style',375,TRUE),
  (6,'Vegetarian','Paneer Taka-Tak','Cubes of cheese cooked with rich Indian herbs',335,TRUE),
  (6,'Vegetarian','Paneer Baby Corn Balchow','Cottage cheese and baby corn cooked with Indian spices',350,TRUE),
  (6,'Vegetarian','Mushroom Do Pyaza','Dice pieces of mushroom, onion tempered with garlic cooked with Indian spices',350,TRUE),
  (6,'Vegetarian','Kadhai Mushroom','Khumb, capsicum, onion tempered with whole dhanya, red chilly, cooked with red & brown gravy',350,TRUE),
  (6,'Vegetarian','Mushroom Masala','Dice mushroom cooked with Indian spices',350,TRUE),
  (6,'Vegetarian','Mushroom Mutter','Fresh green peas & mushroom cooked with brown & red gravy',385,TRUE),
  (6,'Vegetarian','Khumb Hara Dhania','Mushroom stuffed with cheese & coriander roasted in tandoor & cooked with Indian special gravy',370,TRUE),
  (6,'Vegetarian','Mushroom Makhani','Fresh khumb cooked in makhani gravy',365,TRUE),
  (6,'Vegetarian','Mushroom Takatak','Mushroom cooked with fine chopped capsicum',375,TRUE),
  (6,'Vegetarian','Palak Kofta','Fresh spinach cooked with Indian spices',390,TRUE),
  (6,'Vegetarian','Mutter Malai Methi','The taste from mughlai cuisine',370,TRUE),
  (6,'Vegetarian','Malai Kofta','Potato balls stuffed with minced cottage cheese, sultanas',280,TRUE),
  (6,'Vegetarian','Vegetable Jalfrezi','Diamond cuts vegetable with sweet and sour taste',385,TRUE),
  (6,'Vegetarian','Lahori Paneer',NULL,375,TRUE),
  (6,'Vegetarian','Mix Veg.','Mixed seasonal veg. with cheese small cubes',295,TRUE),
  (6,'Vegetarian','Veg Kolhapuri','Mixed veg. tempered with curry leaves and Indian whole spices',310,TRUE),
  (6,'Vegetarian','Veg Makhani','Fresh veg. makhani gravy',325,TRUE),
  (6,'Vegetarian','Gobhi Masala','Fresh cauliflower cooked with whole spices',295,TRUE),
  (6,'Vegetarian','Achari Gobhi','Cauliflower cooked with pickle',295,TRUE),
  (6,'Vegetarian','Aloo Mutter','Peas and potato in brown and red gravy',270,TRUE),
  (6,'Vegetarian','Zeera Aloo','Boiled potato tempered with zeera',260,TRUE),
  (6,'Vegetarian','Channa Masala','White channa cooked with Indian spices',335,TRUE),
  (6,'Vegetarian','Pindi Channa','White channa cottage cheese cooked in red and brown gravy',335,TRUE),
  (6,'Vegetarian','Dal Makhani','Urd and rajmaha mixed cooked overnight and flavoured with desi makhan',295,TRUE),
  (6,'Vegetarian','Dal Black Punjabi Tadka',NULL,295,TRUE),
  (6,'Vegetarian','Dal Tadka Yellow','Moong and masoor dal cooked with Indian spices',280,TRUE),
  (6,'Vegetarian','Dum Aloo Amritsari','Elegantly sauteed potatoes, scented & sauced in an exquisite cream curry gravy',310,TRUE),
  (6,'Vegetarian','Navratan Korma','A combination of nuts, dry fruit & vegetable',390,TRUE),
  (6,'Vegetarian','Green Peas Masala','Garden green peas cooked in Indian spices',270,TRUE),
  (6,'Vegetarian','Palak Corn','Spinach & corn cooked in creamy gravy',375,TRUE),
  (6,'Vegetarian','Veg Kabab Curry',NULL,335,TRUE),
  (6,'Vegetarian','Veg Gravy',NULL,95,TRUE),
  (6,'Non-Vegetarian','Lemon Chicken Indian Style (Full)',NULL,795,FALSE),
  (6,'Non-Vegetarian','Lemon Chicken Indian Style (Half)',NULL,475,FALSE),
  (6,'Non-Vegetarian','Chicken Riviera Special','Chef''s special',840,FALSE),
  (6,'Non-Vegetarian','Chicken Malai Methi','Cubes of boneless chicken cooked in methi & creamy gravy',640,FALSE),
  (6,'Non-Vegetarian','Butter Chicken (Full)','Roasted chicken with butter & tomato gravy',795,FALSE),
  (6,'Non-Vegetarian','Butter Chicken (Half)','Roasted chicken with butter & tomato gravy',475,FALSE),
  (6,'Non-Vegetarian','Chicken Masala (Full)','Tender pieces of chicken cooked with masala & topped with eggs',795,FALSE),
  (6,'Non-Vegetarian','Chicken Masala (Half)','Tender pieces of chicken cooked with masala & topped with eggs',475,FALSE),
  (6,'Non-Vegetarian','Chicken Kadhai (Full)','Chicken tossed with fresh herbs tempered with tomato/onion & green chillies, cooked and served in Kadai',795,FALSE),
  (6,'Non-Vegetarian','Chicken Kadhai (Half)','Chicken tossed with fresh herbs tempered with tomato/onion & green chillies, cooked and served in Kadai',475,FALSE),
  (6,'Non-Vegetarian','Chicken Curry','Chicken cooked with Indian curry style',370,FALSE),
  (6,'Non-Vegetarian','Chicken Tikka Lababdar','Chicken cubes cooked with red Indian gravy',600,FALSE),
  (6,'Non-Vegetarian','Chicken Bharta','Cubes of chicken roast with spices',475,FALSE),
  (6,'Non-Vegetarian','Chicken Do Pyaza','Fille & drums cooked with ring''s onion & chicken gravy',500,FALSE),
  (6,'Non-Vegetarian','Chicken Saagwala','Chicken cooked with curd flavour',500,FALSE),
  (6,'Non-Vegetarian','Chicken Tikka Butter Masala','Chicken tikka in red butter masala gravy',630,FALSE),
  (6,'Non-Vegetarian','Chicken Handi (Full)','Chicken cooked in masala gravy served in handi',795,FALSE),
  (6,'Non-Vegetarian','Kabab Kadai Masala',NULL,475,FALSE),
  (6,'Non-Vegetarian','Chicken Lukhnavi (Half)',NULL,475,FALSE),
  (6,'Non-Vegetarian','Chicken Lukhnavi (Full)',NULL,795,FALSE),
  (6,'Non-Vegetarian','Chicken Kali Mirch (Full)',NULL,795,FALSE),
  (6,'Non-Vegetarian','Chicken Kali Mirch (Half)',NULL,475,FALSE),
  (6,'Non-Vegetarian','Chicken Rara (Full)',NULL,795,FALSE),
  (6,'Non-Vegetarian','Chicken Rara (Half)',NULL,475,FALSE),
  (6,'Non-Vegetarian','Chicken Handi (Half)','Chicken cooked in masala gravy served in handi',475,FALSE),
  (6,'Non-Vegetarian','Chicken Chatniwala','Roasted boneless chicken cooked with mint sauce',630,FALSE),
  (6,'Non-Vegetarian','Chicken Patiala','Revealed chicken rolled with egg and then cooked with thick tomato gravy',700,FALSE),
  (6,'Non-Vegetarian','Mutton Rogan Josh','Fresh meat overnight cooked in Indian herbs',540,FALSE),
  (6,'Non-Vegetarian','Mutton Curry','Fresh meat cooked in Indian curry',540,FALSE),
  (6,'Non-Vegetarian','Mutton Do Payaza','Fresh mutton & cubes of onion cooked in Indian spices',540,FALSE),
  (6,'Non-Vegetarian','Mutton Sagwala','Fresh mutton cooked in palak & Indian herbs',540,FALSE),
  (6,'Non-Vegetarian','Mutton Rara','Fresh meat cooked in Indian spicy thick gravy',540,FALSE),
  (6,'Non-Vegetarian','Mutton Dahiwala','Fresh meat cooked in curd flavour',540,FALSE),
  (6,'Non-Vegetarian','Fried Fish in Tomato Gravy','Fried cubes of fish cooked in tomato gravy. Seasonal',550,FALSE),
  (6,'Non-Vegetarian','Egg Curry','Boiled egg cooked in Indian curry',310,FALSE),
  (6,'Non-Vegetarian','Fish Curry','Seasonal',550,FALSE),
  (6,'Non-Vegetarian','Non Veg Gravy',NULL,125,FALSE);

-- ============================================================
-- CHINESE
-- ============================================================
INSERT INTO menu_items (category_id, subcategory, name, description, price, is_veg) VALUES
  (7,'Vegetarian','Cheese Chilly','Cottage cheese sauteed with green chillies, tossed with green pepper in a thick gravy',350,TRUE),
  (7,'Vegetarian','Veg Manchurian','Soft balls of vegetables, deep fried & cooked in manchurian sauce',350,TRUE),
  (7,'Vegetarian','Veg Choupasy','Vegetable cooked with Chinese style with sweet & sour taste',365,TRUE),
  (7,'Vegetarian','Mushroom Chilly','Mushroom sauteed with green chillies, onion topped with green pepper in a thick gravy',435,TRUE),
  (7,'Vegetarian','Chinese Choupasy','Cubes of capsicum, onion, pineapple cooked in Chinese style garnished with fried noodles',350,TRUE),
  (7,'Vegetarian','Veg Sweet N Sour','Fresh sauteed veg. & tossed in sweet-n-sour sauce',350,TRUE),
  (7,'Vegetarian','Channa Chilly','Well cooked white channa, deep fried and sauted with onion and capsicum',270,TRUE),
  (7,'Vegetarian','Potato Chilly','Cubes of potatoes, buttered with Chinese spices, tossed with capsicum & onion',270,TRUE),
  (7,'Non-Vegetarian','Chicken Chilly (Full)','Diced chicken with bone well marinated in typical Chinese herbs cooked in hot chilli garlic sauce',795,FALSE),
  (7,'Non-Vegetarian','Chicken Chilly (Half)','Diced chicken with bone well marinated in typical Chinese herbs cooked in hot chilli garlic sauce',475,FALSE),
  (7,'Non-Vegetarian','Chicken Manchurian','Ball''s of chicken marinated and deep fried cooked in garlic sauce',500,FALSE),
  (7,'Non-Vegetarian','American Choupasy','Cubes of mutton chicken cooked sweet & sour sauce garnished with fried egg and fried noodles',500,FALSE),
  (7,'Non-Vegetarian','Chicken Sweet N Sour','Chicken cooked in sweet & sour sauce',500,FALSE),
  (7,'Non-Vegetarian','Chicken Hong-Kong',NULL,500,FALSE),
  (7,'Non-Vegetarian','Chicken Ginger (Full)','Crispy chicken sauteed in chef''s special ginger chilly sauce',795,FALSE),
  (7,'Non-Vegetarian','Chicken Ginger (Half)','Crispy chicken sauteed in chef''s special ginger chilly sauce',475,FALSE),
  (7,'Non-Vegetarian','Chicken Garlic (Full)','Chicken cooked in garlic sauce',795,FALSE),
  (7,'Non-Vegetarian','Chicken Garlic (Half)','Chicken cooked in garlic sauce',475,FALSE),
  (7,'Non-Vegetarian','Chicken Lemon (Full)','Boiled chicken cooked and marinated with lemon sauce',795,FALSE),
  (7,'Non-Vegetarian','Chicken Lemon (Half)','Boiled chicken cooked and marinated with lemon sauce',475,FALSE),
  (7,'Non-Vegetarian','Chicken 65','Boneless chicken marinated with curd flavored with curry leaves',500,FALSE);

-- ============================================================
-- RICE & PULAO
-- ============================================================
INSERT INTO menu_items (category_id, subcategory, name, price, is_veg) VALUES
  (8,'Vegetarian','Plain Rice',190,TRUE),
  (8,'Vegetarian','Vegetable Biryani',300,TRUE),
  (8,'Vegetarian','Hydrabadi Biryani (Veg.)',335,TRUE),
  (8,'Vegetarian','Jeera Pulao',210,TRUE),
  (8,'Vegetarian','Peas Pulao',210,TRUE),
  (8,'Vegetarian','Veg Pulao',210,TRUE),
  (8,'Vegetarian','Cheese Pulao',235,TRUE),
  (8,'Vegetarian','Mushroom Fried Rice',310,TRUE),
  (8,'Vegetarian','Vegetable Fried Rice',280,TRUE),
  (8,'Non-Vegetarian','Chicken Biryani',475,FALSE),
  (8,'Non-Vegetarian','Egg Biryani',360,FALSE),
  (8,'Non-Vegetarian','Hydrabadi Biryani (Mutton)',560,FALSE),
  (8,'Non-Vegetarian','Chicken Fried Rice',480,FALSE),
  (8,'Non-Vegetarian','Egg Fried Rice',350,FALSE);

-- ============================================================
-- INDIAN BREADS
-- ============================================================
INSERT INTO menu_items (category_id, subcategory, name, price, is_veg) VALUES
  (9,'Breads','Butter Roti',30,TRUE),
  (9,'Breads','Missi Roti',35,TRUE),
  (9,'Breads','Lachha Prantha',55,TRUE),
  (9,'Breads','Butter Naan',70,TRUE),
  (9,'Breads','Plain Naan',95,TRUE),
  (9,'Breads','Pudina Prantha',75,TRUE),
  (9,'Breads','Stuffed Prantha',75,TRUE),
  (9,'Breads','Garlic Naan',80,TRUE),
  (9,'Breads','Onion Kulcha',95,TRUE),
  (9,'Breads','Potato Kulcha',100,TRUE),
  (9,'Breads','Amritsari Kulcha',90,TRUE),
  (9,'Breads','Cheese Naan',125,TRUE),
  (9,'Breads','Chapatti Tawa',125,TRUE),
  (9,'Breads','Cheese Naan with Gravy',33,TRUE),
  (9,'Breads','Keema Naan with Gravy',270,FALSE),
  (9,'Breads','Cheese Prantha with Chinese Gravy',475,TRUE);

-- ============================================================
-- RAITA
-- ============================================================
INSERT INTO menu_items (category_id, subcategory, name, price, is_veg) VALUES
  (10,'Raita','Curd (Processed)',100,TRUE),
  (10,'Raita','Mix Raita',145,TRUE),
  (10,'Raita','Mint Raita',145,TRUE),
  (10,'Raita','Aloo Raita',145,TRUE),
  (10,'Raita','Pineapple Raita',170,TRUE),
  (10,'Raita','Cucumber Raita',145,TRUE),
  (10,'Raita','Boondi Raita',145,TRUE),
  (10,'Raita','Fruit Raita',170,TRUE);

-- ============================================================
-- CONTINENTAL
-- ============================================================
INSERT INTO menu_items (category_id, subcategory, name, description, price, is_veg) VALUES
  (11,'Main Course','Baked Special Riviera','Peas, carrot, beans, potato, broccoli and baked with cheese',325,TRUE),
  (11,'Main Course','Boiled Veg.','Seasonal veg. boiled',475,TRUE),
  (11,'Main Course','Cottage Cheese Shashlik','Cheese, capsicum, onion & saffron rice',475,TRUE),
  (11,'Main Course','Chicken Shashlik','With saffron rice',540,FALSE),
  (11,'Main Course','Imperial Chicken','Saute chicken cooked in wine & served on the bed of noodles',600,FALSE),
  (11,'Main Course','Grilled Chicken','Two breast piece of chicken with boiled veg. & french fries',600,FALSE),
  (11,'Main Course','Chicken Steak in Pepper Sauce',NULL,475,FALSE);

-- ============================================================
-- PASTA
-- ============================================================
INSERT INTO menu_items (category_id, subcategory, name, description, price, is_veg) VALUES
  (12,'Pasta','Spaghetti with Cheese','Spaghetti / butter / grated cheese / salt / pepper',415,TRUE),
  (12,'Pasta','Spaghetti with Tomato Sauce','Spaghetti / butter / tomato sauce and tomato concasses',415,TRUE),
  (12,'Pasta','Baked Macaroni','Macaroni cooked in white sauce cheese & baked',415,TRUE);

-- ============================================================
-- SIZZLERS
-- ============================================================
INSERT INTO menu_items (category_id, subcategory, name, price, is_veg) VALUES
  (13,'Sizzlers','Veg Sizzler',400,TRUE),
  (13,'Sizzlers','Cheese Sizzler',475,TRUE),
  (13,'Sizzlers','Chicken Sizzler',570,FALSE),
  (13,'Sizzlers','Chicken Stick Sizzler',570,FALSE);

-- ============================================================
-- NOODLES
-- ============================================================
INSERT INTO menu_items (category_id, subcategory, name, price, is_veg) VALUES
  (14,'Vegetarian','Riviera Special Noodles',350,TRUE),
  (14,'Vegetarian','Mushroom Noodles',310,TRUE),
  (14,'Vegetarian','Vegetable Noodles',280,TRUE),
  (14,'Vegetarian','Singapori Noodles',300,TRUE),
  (14,'Vegetarian','Cheese Noodles (Cottage Cheese)',315,TRUE),
  (14,'Vegetarian','Hakka Noodles',300,TRUE),
  (14,'Non-Vegetarian','Egg Noodles',310,FALSE),
  (14,'Non-Vegetarian','Chicken Noodles',375,FALSE);

-- ============================================================
-- DESSERTS
-- ============================================================
INSERT INTO menu_items (category_id, subcategory, name, price, is_veg) VALUES
  (15,'Frozen Desserts','Kaju Pista Ice Cream',135,TRUE),
  (15,'Frozen Desserts','Vanilla Ice Cream',95,TRUE),
  (15,'Frozen Desserts','Strawberry Ice Cream',95,TRUE),
  (15,'Frozen Desserts','Chocolate Ice Cream',95,TRUE),
  (15,'Frozen Desserts','Butter Scotch Ice Cream',105,TRUE),
  (15,'Frozen Desserts','Tooty Frooty Ice Cream',160,TRUE),
  (15,'Desserts','Gulab Jamun (2 pcs.)',80,TRUE),
  (15,'Desserts','Gajjar Halwa',125,TRUE);

-- ============================================================
-- BEVERAGES
-- ============================================================
INSERT INTO menu_items (category_id, subcategory, name, price, is_veg) VALUES
  (16,'Tea & Coffee','Tea (Full Set)',160,TRUE),
  (16,'Tea & Coffee','Tea (Half Set)',80,TRUE),
  (16,'Tea & Coffee','Lemon Tea',40,TRUE),
  (16,'Tea & Coffee','Tea (Per Cup)',45,TRUE),
  (16,'Tea & Coffee','Coffee',70,TRUE),
  (16,'Cold Beverages','Flavoured Milk',100,TRUE),
  (16,'Cold Beverages','Cold Coffee',140,TRUE),
  (16,'Cold Beverages','Cold Coffee with Ice Cream',150,TRUE),
  (16,'Cold Beverages','Lassi (Sweet / Salted)',90,TRUE),
  (16,'Cold Beverages','Milk Shake',140,TRUE),
  (16,'Cold Beverages','Milk Shake with Ice Cream',150,TRUE),
  (16,'Cold Beverages','Fresh Lime Soda (Sweet / Salted)',60,TRUE),
  (16,'Cold Beverages','Fresh Lime Water',45,TRUE),
  (16,'Cold Beverages','Jal Jeera',70,TRUE),
  (16,'Cold Beverages','Milk',70,TRUE),
  (16,'Soft Drinks','Packed Water',30,TRUE),
  (16,'Soft Drinks','Aerated Drinks',45,TRUE),
  (16,'Soft Drinks','Soda',45,TRUE);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_menu_category ON menu_items(category_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_room ON orders(room_number);
CREATE INDEX idx_order_items_order ON order_items(order_id);

SELECT 'Schema and seed data loaded successfully!' AS result;