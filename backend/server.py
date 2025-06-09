import os
import threading
import logging
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import psycopg2
import psycopg2.extras
import requests

# Конфигурация
DATABASE_URL = os.getenv("DATABASE_URL")
TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
CHAT_ID = os.getenv("TELEGRAM_CHAT_ID")

# Инициализация приложения
app = Flask(__name__, static_folder="build", static_url_path="")
CORS(app, resources={r"/*": {"origins": "*"}})

# Логгирование
logging.basicConfig(level=logging.DEBUG)

# Блокировка для потокобезопасной работы с корзиной
cart_lock = threading.Lock()


# ==== УТИЛИТЫ ====

def get_db_connection():
    return psycopg2.connect(DATABASE_URL, sslmode='require', cursor_factory=psycopg2.extras.DictCursor)


def init_db():
    with get_db_connection() as conn:
        with conn.cursor() as cursor:
            # 1. Добавляем поле category в таблицу products
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS products (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    image_url TEXT,
                    category TEXT
                )
            ''')
            # 1b. Если таблица уже есть, добавляем колонку отдельно
            cursor.execute("ALTER TABLE products ADD COLUMN IF NOT EXISTS category TEXT")

            cursor.execute('''
                CREATE TABLE IF NOT EXISTS cart (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    quantity INTEGER NOT NULL,
                    comment TEXT
                )
            ''')
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS favorites (
                    product_id TEXT PRIMARY KEY
                )
            ''')
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS general_comment (
                    id INTEGER PRIMARY KEY CHECK (id = 1),
                    "general-comment" TEXT
                )
            ''')
            cursor.execute('SELECT COUNT(*) FROM general_comment')
            if cursor.fetchone()[0] == 0:
                cursor.execute('INSERT INTO general_comment (id, "general-comment") VALUES (1, %s)', ("",))

            cursor.execute('SELECT COUNT(*) FROM products')
            if cursor.fetchone()[0] == 0:
                initial_products = [
                    ("1", "Бананы", "banana.png", "Фрукты"),
                    ("2", "Вода", "water3.webp", "Напитки"),
                    ("3", "Кофе", "coffee.jpg", "Напитки"),
                    ("4", "Авокадо", "avocado.webp", "Фрукты"),
                    ("5", "Черный перец", "black_paper.jpg", "Специи"),
                    ("6", "Черный рис", "black_rice.jpg", "Крупы"),
                    ("7", "Черный чай", "black_tea.webp", "Напитки"),
                    ("8", "Голубика", "blueberry.jpg", "Ягоды"),
                    ("9", "Боржоми 1л.", "borjomi.jpg", "Напитки"),
                    ("10", "Шоколадка Bounty", "bounty.jpg", "Снеки"),
                    ("11", "Брокколи", "broccoli.jpg", "Овощи"),
                    ("12", "Гречневая крупа", "buckwheat.jpg", "Крупы"),
                    ("13", "Масло сливочное 200гр.", "butter.jpg", "Заморозки"),
                    ("14", "Морковь 500гр.", "carrot.png", "Овощи"),
                    ("15", "Ромашковый чай", "chamomile_tea.jpg", "Напитки"),
                    ("16", "Грибы шампиньоны", "champignons.jpg", "Овощи"),
                    ("17", "Куриные ножки", "chicken_legs.jpg", "Мясо"),
                    ("18", "Куриные крылья", "chicken_wings.jpg", "Мясо"),
                    ("19", "Кукуруза вареная", "corn.webp", "Овощи"),
                    ("20", "Ватные диски", "cotton_disk.jpg", "Личная гигиена"),
                    ("21", "Ватные палочки", "cotton_swabs.webp", "Личная гигиена"),
                    ("22", "Кускус крупа", "couscous.jpg", "Крупы"),
                    ("23", "Огурцы 500гр.", "cucumber.jpg", "Овощи"),
                    ("24", "Яйца 10шт.", "eggs.png", "Овощи"),
                    ("25", "Яблоки 500гр.", "apples.jpg", "Фрукты"),
                    ("26", "Фольга 50м.", "folga.jpg", "Личная гигиена"),
                    ("27", "Замороженные овощи (смесь)", "frozen_vagetables.jpeg", "Заморозки"),
                    ("28", "Blauenstein сосиски", "blauenstein_sausages.webp", "Мясо"),
                    ("29", "Blauenstein говядина", "blauenstein_beef.jpeg", "Мясо"),
                    ("30", "Сосисочки мини", "galbani_mini.jpg", "Мясо"),
                    ("31", "Пакет для мусора", "garbage_bag.jpg", "Личная гигиена"),
                    ("32", "Чеснок", "garlic.webp", "Овощи"),
                    ("33", "Зеленый чай", "green_tea.jpg", "Напитки"),
                    ("34", "Хамон", "hamon_galbani.webp", "Мясо"),
                    ("35", "Мёд", "honey.jpg", "Специи"),
                    ("36", "Шоколадка KitKat", "kitkat.webp", "Снеки"),
                    ("37", "Киви", "kiwi.jpeg", "Фрукты"),
                    ("38", "Молоко безлактозное 1л.", "lactose_free_milk.webp", "Напитки"),
                    ("39", "Лимоны 200гр.", "lemon.webp", "Фрукты"),
                    ("40", "Лайм 200гр.", "lime.jpeg", "Фрукты"),
                    ("41", "Молоко обычное 1л.", "milk.png", "Напитки"),
                    ("42", "Наггетсы", "naggets.jpg", "Мясо"),
                    ("43", "Наггетсы попкорн", "naggets_popcorn.jpeg", "Мясо"),
                    ("44", "Овсяная крупа", "oatmeal.jpg", "Крупы"),
                    ("45", "Апельсины 500гр.", "orange.webp", "Фрукты"),
                    ("46", "Апельсиновый сок 1л.", "orange_juice.jpeg", "Напитки"),
                    ("47", "Соленые огурчики маленькие 200гр.", "pickled_cucumber.webp", "Овощи"),
                    ("48", "Гранатовый сок 1л.", "pomegranate_juice.webp", "Напитки"),
                    ("49", "Картошка 1кг.", "potatoes.jpg", "Овощи"),
                    ("50", "Красный лук 200гр.", "red_onion.jpg", "Овощи"),
                    ("51", "Красный перец сладкий 200гр.", "red_peper.jpg", "Овощи"),
                    ("52", "Красное вино 1бут.", "red_wine.jpg", "Напитки"),
                    ("53", "Рис крупа", "rice.jpeg", "Крупы"),
                    ("54", "Лосось слабосоленый 200гр.", "salmon.jpeg", "Мясо"),
                    ("55", "Соль", "salt.jpg", "Специи"),
                    ("56", "Сосиски 500гр.", "sausages.jpg", "Мясо"),
                    ("57", "Шоколадка Snikers", "snikers.jpg", "Снеки"),
                    ("58", "Бумажные полотенца", "table_napkins.webp", "Личная гигиена"),
                    ("59", "Туалетная бумага", "toilet_paper.jpg", "Личная гигиена"),
                    ("60", "Томаты черри 200гр.", "tomate_cherry.jpg", "Овощи"),
                    ("61", "Шоколадка Twix", "twix.png", "Снеки"),
                    ("62", "Вода 0.5л.", "water0,5.jpg", "Напитки"),
                    ("63", "Репчатый лук 200гр.", "white_onion.jpg", "Овощи"),
                    ("64", "Белое вино 1бут.", "white_wine.jpg", "Напитки"),
                    ("65", "Влажная туалетная бумага", "zewa_paper.webp", "Личная гигиена"),
                    ("66", "Кинза", "coriander.webp", "Зелень"),
                    ("67", "Укроп", "dill.webp", "Зелень"),
                    ("68", "Зеленый лук", "green_onions.jpg", "Зелень"),
                    ("69", "Петрушка", "parsley.webp", "Зелень"),
                    ("70", "Клубника", "strawberry.webp", "Ягоды"),
                    ("71", "Кефир 0,9л.", "kefir.jpeg", "Напитки")
                ]

                # Гарантируем, что image_url содержит префикс /images/
                for i in range(len(initial_products)):
                    id_, name, image_url, category = initial_products[i]
                    if not image_url.startswith("/images/"):
                        image_url = f"/images/{image_url}"
                    initial_products[i] = (id_, name, image_url, category)

                cursor.executemany(
                    'INSERT INTO products (id, name, image_url, category) VALUES (%s, %s, %s, %s)',
                    initial_products
                )

            conn.commit()


# ==== СТАТИКА Картинки ====

@app.route('/images/<path:filename>')
def serve_image(filename):
    return send_from_directory(os.path.join(app.root_path, 'images'), filename)


@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_frontend(path):
    full_path = os.path.join(app.static_folder, path)
    if path and os.path.exists(full_path):
        return send_from_directory(app.static_folder, path)
    return send_from_directory(app.static_folder, 'index.html')


# ==== ПРОДУКТЫ ====

@app.route('/products', methods=['GET'])  
def get_products():
    with get_db_connection() as conn:
        with conn.cursor() as cursor:
            # 4. Добавить category в SELECT
            cursor.execute('SELECT id, name, image_url, category FROM products')
            products = [dict(row) for row in cursor.fetchall()]
    return jsonify(products)


@app.route('/products', methods=['POST'])
def add_product():
    data = request.get_json()
    name = data.get('name', '').strip()
    image_url = data.get('image_url', '').strip()

    if not name:
        return jsonify({"success": False, "message": "Имя обязательно"}), 400

    if image_url:
        image_url = f"/images/{image_url}"

    with get_db_connection() as conn:
        with conn.cursor() as cursor:
            cursor.execute('SELECT MAX(CAST(id AS INTEGER)) FROM products')
            next_id = str((cursor.fetchone()[0] or 0) + 1)
            cursor.execute('INSERT INTO products (id, name, image_url) VALUES (%s, %s, %s)', (next_id, name, image_url))
            conn.commit()

    return jsonify({"success": True, "id": next_id})


@app.route('/products/<product_id>', methods=['PATCH'])
def update_product(product_id):
    data = request.get_json()
    name = data.get('name', '').strip()
    if not name:
        return jsonify({"success": False, "message": "Имя товара не может быть пустым"}), 400

    with get_db_connection() as conn:
        with conn.cursor() as cursor:
            cursor.execute('UPDATE products SET name = %s WHERE id = %s', (name, product_id))
            conn.commit()
            if cursor.rowcount == 0:
                return jsonify({"success": False, "message": "Товар не найден"}), 404

    return jsonify({"success": True})


@app.route('/products/<product_id>', methods=['DELETE'])
def delete_product(product_id):
    with get_db_connection() as conn:
        with conn.cursor() as cursor:
            cursor.execute('DELETE FROM products WHERE id = %s', (product_id,))
            conn.commit()
    return jsonify({"success": True})


# ==== КОРЗИНА ====

@app.route('/cart', methods=['GET'])
def get_cart():
    with cart_lock, get_db_connection() as conn:
        with conn.cursor() as cursor:
            cursor.execute('SELECT id, name, quantity, comment FROM cart WHERE id != %s', ("general",))
            items = [dict(row) for row in cursor.fetchall()]
    return jsonify(items)


@app.route('/cart', methods=['POST'])
def merge_cart():
    data = request.json
    if not isinstance(data, list):
        return jsonify({"success": False, "message": "Неверный формат данных"}), 400

    with cart_lock, get_db_connection() as conn:
        with conn.cursor() as cursor:
            for item in data:
                if 'id' not in item or 'name' not in item or 'quantity' not in item:
                    return jsonify({"success": False, "message": "Отсутствуют обязательные поля"}), 400

                if item['id'] == "general":
                    cursor.execute(
                        'UPDATE general_comment SET "general-comment" = %s WHERE id = 1',
                        (item.get("comment", ""),)
                    )
                    continue

                if item['quantity'] <= 0:
                    cursor.execute('DELETE FROM cart WHERE id = %s', (item['id'],))
                    continue

                cursor.execute(
                    '''
                    INSERT INTO cart (id, name, quantity, comment)
                    VALUES (%s, %s, %s, %s)
                    ON CONFLICT (id) DO UPDATE
                    SET quantity = EXCLUDED.quantity,
                        comment = EXCLUDED.comment,
                        name = EXCLUDED.name
                    ''',
                    (item['id'], item['name'], item['quantity'], item.get("comment", ""))
                )

            conn.commit()

    return jsonify({"success": True})


@app.route('/cart/update', methods=['POST'])
def update_cart_incrementally():
    """
    Теперь quantity — абсолютное значение.
    Если quantity <= 0, удаляем запись.
    Если запись есть — UPDATE quantity, name, comment.
    Если нет — INSERT с переданными значениями.
    """
    data = request.json
    if not isinstance(data, list):
        return jsonify({"success": False, "message": "Неверный формат данных"}), 400

    with cart_lock, get_db_connection() as conn:
        with conn.cursor(cursor_factory=psycopg2.extras.DictCursor) as cursor:
            for item in data:
                if 'id' not in item or 'quantity' not in item:
                    return jsonify({"success": False, "message": "Отсутствуют обязательные поля"}), 400

                item_id = item['id']
                new_qty = item['quantity']

                # Если quantity <= 0, просто удаляем
                if new_qty <= 0:
                    cursor.execute("DELETE FROM cart WHERE id = %s", (item_id,))
                    continue

                # Проверим, существует ли такая запись в cart
                cursor.execute("SELECT 1 FROM cart WHERE id = %s", (item_id,))
                exists = cursor.fetchone()

                if exists:
                    # Просто обновляем точное значение quantity
                    cursor.execute(
                        "UPDATE cart SET quantity = %s, name = %s, comment = %s WHERE id = %s",
                        (new_qty, item.get('name', ''), item.get('comment', ''), item_id)
                    )
                else:
                    # Вставляем с точно тем quantity, что пришло
                    cursor.execute(
                        """
                        INSERT INTO cart (id, name, quantity, comment)
                        VALUES (%s, %s, %s, %s)
                        """,
                        (
                            item_id,
                            item.get('name', ''),
                            new_qty,
                            item.get('comment', '')
                        )
                    )

            conn.commit()

    return jsonify({"success": True})


@app.route('/cart', methods=['DELETE'])
def clear_cart():
    with cart_lock, get_db_connection() as conn:
        with conn.cursor() as cursor:
            cursor.execute('DELETE FROM cart')
            cursor.execute('UPDATE general_comment SET "general-comment" = %s WHERE id = 1', ("",))
            conn.commit()
    return jsonify({"success": True})

# ==== ОБЩИЙ КОММЕНТАРИЙ В КОРЗИНЕ ====

@app.route('/cart/general-comment', methods=['GET', 'POST', 'DELETE'])
def general_comment():
    with cart_lock, get_db_connection() as conn:
        with conn.cursor() as cursor:
            if request.method == 'GET':
                cursor.execute('SELECT "general-comment" FROM general_comment WHERE id = 1')
                return jsonify({"comment": cursor.fetchone()[0]})

            elif request.method == 'POST':
                comment = request.json.get("comment", "")
                cursor.execute('UPDATE general_comment SET "general-comment" = %s WHERE id = 1', (comment,))
                conn.commit()
                return jsonify({"success": True})

            elif request.method == 'DELETE':
                cursor.execute('UPDATE general_comment SET "general-comment" = %s WHERE id = 1', ("",))
                conn.commit()
                return jsonify({"success": True})


# ==== ИЗБРАННОЕ ====

@app.route("/favorites", methods=["GET"])
def get_favorites():
    with get_db_connection() as conn:
        with conn.cursor() as cursor:
            cursor.execute('SELECT product_id FROM favorites')
            return jsonify([row[0] for row in cursor.fetchall()])


@app.route("/favorites", methods=["POST"])
def add_favorite():
    product_id = request.json.get("product_id")
    if not product_id:
        return jsonify({"error": "product_id is required"}), 400

    try:
        with get_db_connection() as conn:
            with conn.cursor() as cursor:
                cursor.execute('INSERT INTO favorites (product_id) VALUES (%s)', (product_id,))
                conn.commit()
    except psycopg2.IntegrityError:
        return jsonify({"error": "Product already in favorites"}), 409

    return jsonify({"status": "added"}), 201


@app.route("/favorites", methods=["DELETE"])
def delete_favorite():
    product_id = request.json.get("product_id")
    if not product_id:
        return jsonify({"error": "product_id is required"}), 400

    with get_db_connection() as conn:
        with conn.cursor() as cursor:
            cursor.execute('DELETE FROM favorites WHERE product_id = %s', (product_id,))
            conn.commit()

    return jsonify({"status": "deleted"}), 200


@app.route("/favorites", methods=["PUT"])
def update_favorites():
    favorites = request.json.get("favorites", [])
    if not isinstance(favorites, list):
        return jsonify({"success": False, "message": "Неверный формат данных"}), 400

    with get_db_connection() as conn:
        with conn.cursor() as cursor:
            cursor.execute('DELETE FROM favorites')
            for product_id in favorites:
                cursor.execute('INSERT INTO favorites (product_id) VALUES (%s)', (product_id,))
            conn.commit()

    return jsonify({"success": True, "favorites": favorites})


# ==== ТЕЛЕГРАМ ====

@app.route("/send-to-telegram", methods=["POST"])
def send_to_telegram():
    data = request.json
    message = data.get("message") or data.get("cart")

    if not message:
        return jsonify({"success": False, "message": "Сообщение пустое"}), 400

    url = f"https://api.telegram.org/bot{TOKEN}/sendMessage"

    try:
        response = requests.post(url, data={
            'chat_id': CHAT_ID,
            'text': message,
            'parse_mode': data.get('parse_mode', 'HTML')
        })
        if response.ok:
            return jsonify({"success": True})
    except requests.exceptions.RequestException:
        pass

    return jsonify({"success": False, "message": "Ошибка при отправке сообщения"}), 500


# ==== ЗАПУСК ====

if __name__ == "__main__":
    init_db()
    port = int(os.environ.get("PORT", 5000))
    app.run(debug=True, host="0.0.0.0", port=port)
