from flask import Flask, request, jsonify, send_from_directory
import requests
import os
import logging
from flask_cors import CORS
import sqlite3

# Настройка логирования
logging.basicConfig(level=logging.DEBUG)

app = Flask(
    __name__,
    static_folder="build",
    static_url_path=""
)

@app.route('/images/<path:filename>')
def serve_image(filename):
    return send_from_directory('images', filename)

CORS(app, resources={r"/*": {"origins": "*"}})

TOKEN = os.getenv('TELEGRAM_BOT_TOKEN')
CHAT_ID = os.getenv('TELEGRAM_CHAT_ID')

DB_PATH = 'cart.db'

def init_db():
    with sqlite3.connect(DB_PATH) as conn:
        # Таблица товаров в корзине
        conn.execute('''
            CREATE TABLE IF NOT EXISTS cart (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                quantity INTEGER NOT NULL,
                comment TEXT
            )
        ''')

        # Таблица избранных товаров
        conn.execute('''
            CREATE TABLE IF NOT EXISTS favorites (
                product_id TEXT PRIMARY KEY
            )
        ''')

        # Таблица всех продуктов
        conn.execute('''
            CREATE TABLE IF NOT EXISTS products (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                image_url TEXT
            )
        ''')

        # Таблица общего комментария к корзине (одна строка)
        conn.execute('''
            CREATE TABLE IF NOT EXISTS general_comment (
                id INTEGER PRIMARY KEY CHECK (id = 1),
                "general-comment" TEXT
            )
        ''')

        # Гарантируем, что строка с id = 1 всегда есть
        result = conn.execute('SELECT COUNT(*) FROM general_comment').fetchone()[0]
        if result == 0:
            conn.execute('INSERT INTO general_comment (id, "general-comment") VALUES (1, "")')

        # Начальные товары (вставляются только если их ещё нет)
        existing = conn.execute('SELECT COUNT(*) FROM products').fetchone()[0]
        if existing == 0:
            initial_products = [
                ("1", "Бананы", "/images/banana.png"),
                ("2", "Вода", "/images/water3.webp"),
                ("3", "Кофе", "/images/coffee.jpg"),
                ("4", "Кофе капсулы. Вкусный и великолепный. Ароматный", ""),
                ("5", "Кофе капсулы. Вкусный и великолепный. Ароматныйаааааааааааа ааааааааа", ""),
                ("6", "Кофе капсулы. Вкусный и великолепный. Ароматныйаааааааааааа ааааааааа", ""),
            ]
            conn.executemany('INSERT INTO products (id, name, image_url) VALUES (?, ?, ?)', initial_products)

init_db()

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

@app.route('/products', methods=['GET'])
def get_products():
    conn = get_db_connection()
    cursor = conn.execute('SELECT id, name, image_url FROM products')
    products = [
        {"id": row["id"], "name": row["name"], "image_url": row["image_url"]}
        for row in cursor.fetchall()
    ]
    conn.close()
    return jsonify(products)

@app.route('/cart', methods=['GET'])
def get_cart():
    with sqlite3.connect(DB_PATH) as conn:
        cursor = conn.execute('SELECT id, name, quantity, comment FROM cart WHERE id != "general"')
        items = [
            {
                "id": row[0],
                "name": row[1],
                "quantity": row[2],
                "comment": row[3]
            }
            for row in cursor.fetchall()
        ]
    return jsonify(items)  # Flask автоматически использует UTF-8

@app.route('/cart', methods=['POST'])
def update_cart():
    data = request.json
    if not isinstance(data, list):
        return jsonify({"success": False, "message": "Неверный формат данных"}), 400

    with sqlite3.connect(DB_PATH) as conn:
        conn.execute('DELETE FROM cart WHERE id != "general"')  # Удаляем старые записи из корзины кроме общего комментария
        for item in data:
            # Пропускаем пустой "общий" объект, не являющийся товаром
            if item.get("id") == "general":
                continue

            if 'id' not in item or 'name' not in item or 'quantity' not in item:
                return jsonify({"success": False, "message": "Отсутствуют обязательные поля"}), 400
            conn.execute(
                'INSERT INTO cart (id, name, quantity, comment) VALUES (?, ?, ?, ?)',
                (item['id'], item['name'], item['quantity'], item.get('comment', ""))
            )
        conn.commit()

    return jsonify({"success": True}), 200

@app.route('/cart', methods=['DELETE'])
def clear_cart():
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute('DELETE FROM cart')  # Удаляем все товары из корзины
        conn.execute('UPDATE general_comment SET "general-comment" = "" WHERE id = 1') # Очищаем общий комментарий
        conn.commit()
    return jsonify({"success": True, "message": "Корзина и общий комментарий очищены"}), 200

@app.route('/cart/general-comment', methods=['POST'])
def save_general_comment():
    data = request.json
    comment = data.get('comment', '').strip()

    with sqlite3.connect(DB_PATH) as conn:
        conn.execute('UPDATE general_comment SET "general-comment" = ? WHERE id = 1', (comment,))
        conn.commit()

    return jsonify({"success": True, "message": "Общий комментарий сохранён"})

@app.route('/cart/general-comment', methods=['GET'])
def get_general_comment():
    with sqlite3.connect(DB_PATH) as conn:
        cursor = conn.execute('SELECT "general-comment" FROM general_comment WHERE id = 1')
        result = cursor.fetchone()
        return jsonify({"comment": result[0] if result else ""})

@app.route('/send-to-telegram', methods=['POST'])
def send_to_telegram():
    data = request.json
    message = data.get('cart', '')

    if not message:
        return jsonify({"success": False, "message": "Сообщение пустое"}), 400

    url = f"https://api.telegram.org/bot{TOKEN}/sendMessage"

    try:
        response = requests.post(url, data={
            'chat_id': CHAT_ID,
            'text': message,
            'parse_mode': data.get('parse_mode', 'HTML')  # Оставим поддержку HTML
        })
        if response.status_code == 200:
            return jsonify({"success": True, "message": "Сообщение отправлено"})
        else:
            return jsonify({"success": False, "message": "Ошибка при отправке сообщения"}), 500
    except requests.exceptions.RequestException:
        return jsonify({"success": False, "message": "Ошибка при соединении с Telegram"}), 500

@app.route("/favorites", methods=["GET"])
def get_favorites():
    conn = get_db_connection()
    favorites = conn.execute('SELECT product_id FROM favorites').fetchall()
    conn.close()
    return jsonify([row['product_id'] for row in favorites])

@app.route('/favorites', methods=['POST'])
def add_favorite():
    data = request.json
    product_id = data.get('product_id')
    if not product_id:
        return jsonify({'error': 'product_id is required'}), 400

    conn = get_db_connection()
    try:
        conn.execute('INSERT INTO favorites (product_id) VALUES (?)', (product_id,))
        conn.commit()
    except sqlite3.IntegrityError:
        return jsonify({'error': 'Product already in favorites'}), 409
    finally:
        conn.close()

    return jsonify({'status': 'added'}), 201

@app.route('/favorites', methods=['DELETE'])
def delete_favorite():
    data = request.json
    product_id = data.get('product_id')
    if not product_id:
        return jsonify({'error': 'product_id is required'}), 400

    conn = get_db_connection()
    conn.execute('DELETE FROM favorites WHERE product_id = ?', (product_id,))
    conn.commit()
    conn.close()

    return jsonify({'status': 'deleted'}), 200

@app.route('/favorites', methods=['PUT'])
def update_favorites():
    data = request.json
    favorites = data.get('favorites', [])

    if not isinstance(favorites, list):
        return jsonify({"success": False, "message": "Неверный формат данных"}), 400

    conn = get_db_connection()
    try:
        conn.execute('DELETE FROM favorites')  # Удаляем старые записи
        for product_id in favorites:
            conn.execute('INSERT INTO favorites (product_id) VALUES (?)', (product_id,))
        conn.commit()
    finally:
        conn.close()

    return jsonify({"success": True, "favorites": favorites}), 200

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    full_path = os.path.join(app.static_folder, path)
    if path != "" and os.path.exists(full_path):
        return send_from_directory(app.static_folder, path)
    return send_from_directory(app.static_folder, "index.html")

if __name__ == '__main__':
    # Обновляем схему базы данных перед запуском приложения
#    update_database_schema()

    # Получаем порт из переменных окружения или используем 5000 по умолчанию
    port = int(os.environ.get("PORT", 5000))

    # Запускаем приложение
    app.run(debug=True, host="0.0.0.0", port=port)