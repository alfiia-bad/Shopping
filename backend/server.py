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

CORS(app, resources={r"/*": {"origins": "*"}})

TOKEN = os.getenv('TELEGRAM_BOT_TOKEN')
CHAT_ID = os.getenv('TELEGRAM_CHAT_ID')

DB_PATH = 'cart.db'

def init_db():
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute('''
            CREATE TABLE IF NOT EXISTS cart (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                quantity INTEGER NOT NULL
            )
        ''')
        conn.execute('''
            CREATE TABLE IF NOT EXISTS favorites (
                product_id TEXT PRIMARY KEY
            )
        ''')        
init_db()

def update_database_schema():
    with sqlite3.connect(DB_PATH) as conn:
        # Проверяем, есть ли колонка 'comment' в таблице 'cart'
        cursor = conn.execute("PRAGMA table_info(cart);")
        columns = [row[1] for row in cursor.fetchall()]
        if "comment" not in columns:
            conn.execute("ALTER TABLE cart ADD COLUMN comment TEXT;")
            print("Колонка 'comment' успешно добавлена в таблицу 'cart'.")
        # Проверяем, есть ли колонка 'general_comment' в таблице 'cart'
        if "general_comment" not in columns:
            conn.execute("ALTER TABLE cart ADD COLUMN general_comment TEXT;")
            print("Колонка 'general_comment' успешно добавлена в таблицу 'cart'.")

update_database_schema()

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

@app.route('/cart', methods=['GET'])
def get_cart():
    with sqlite3.connect(DB_PATH) as conn:
        cursor = conn.execute('SELECT id, name, quantity, comment FROM cart')
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
        conn.execute('DELETE FROM cart')  # Удаляем старые записи
        for item in data:
            if 'id' not in item or 'name' not in item or 'quantity' not in item:
                return jsonify({"success": False, "message": "Отсутствуют обязательные поля"}), 400
            conn.execute(
                'INSERT INTO cart (id, name, quantity, comment) VALUES (?, ?, ?, ?)',
                (item['id'], item['name'], item['quantity'], item.get('comment', ""))
            )
        conn.commit()

    return jsonify({"success": True}), 200


@app.route('/cart/general-comment', methods=['POST'])
def save_general_comment():
    data = request.json
    comment = data.get('comment', '').strip()

    if not comment:
        return jsonify({"success": False, "message": "Комментарий пуст"}), 400

    # Сохраняем общий комментарий в базе данных
    with sqlite3.connect(DB_PATH) as conn:
        # Проверяем, существует ли запись с id = "general"
        cursor = conn.execute('SELECT 1 FROM cart WHERE id = "general"')
        if cursor.fetchone():
            # Обновляем существующую запись
            conn.execute('UPDATE cart SET general_comment = ? WHERE id = "general"', (comment,))
        else:
            # Вставляем новую запись
            conn.execute('INSERT INTO cart (id, name, quantity, general_comment) VALUES ("general", "", 0, ?)', (comment,))
        conn.commit()

    return jsonify({"success": True, "message": "Общий комментарий сохранён"})

@app.route('/cart/general-comment', methods=['GET'])
def get_general_comment():
    with sqlite3.connect(DB_PATH) as conn:
        cursor = conn.execute('SELECT general_comment FROM cart WHERE id = "general"')
        result = cursor.fetchone()
        if result and result[0]:
            return jsonify({"comment": result[0]})
        return jsonify({"comment": ""})

@app.route('/send-to-telegram', methods=['POST'])
def send_to_telegram():
    data = request.json
    cart = data.get('cart', '')

    if not cart:
        return jsonify({"success": False, "message": "Корзина пуста"}), 400

    # Формируем сообщение
    cart_items = data.get('cartItems', [])
    general_comment = data.get('comment', '').strip()
    cart_params = data.get('cartParams', '')

    # Формируем список товаров
    cart_items_str = "\n".join([f"- {item['name']} x{item['quantity']}" for item in cart_items])

    # Формируем ссылку
    site_url = f"https://alfa-shop-ljmg.onrender.com?cart={cart_params}"
    link_text = f'<a href="{site_url}">Загрузить этот список покупок</a>'

    # Добавляем общий комментарий, если он есть
    if general_comment:
        message = f"Список покупок:\n\n{cart_items_str}\n\nКомментарий к корзине: {general_comment}\n\n{link_text}"
    else:
        message = f"Список покупок:\n\n{cart_items_str}\n\n{link_text}"

    url = f"https://api.telegram.org/bot{TOKEN}/sendMessage"

    try:
        # Отправляем сообщение в Telegram
        response = requests.post(url, data={
            'chat_id': CHAT_ID,
            'text': message,
            'parse_mode': 'HTML'  # Указываем HTML для форматирования
        })
        if response.status_code == 200:
            return jsonify({"success": True, "message": "Сообщение отправлено"})
        else:
            return jsonify({"success": False, "message": "Ошибка при отправке сообщения"}), 500
    except requests.exceptions.RequestException:
        return jsonify({"success": False, "message": "Ошибка при соединении с Telegram"}), 500

@app.route('/cart/send', methods=['POST'])
def send_cart():
    data = request.json
    cart_items = data.get('cartItems', [])
    comment = data.get('comment', '').strip()

    if not cart_items:
        return jsonify({"success": False, "message": "Корзина пуста"}), 400

    # Сохраняем общий комментарий в базе данных
    with sqlite3.connect(DB_PATH) as conn:
        conn.execute('UPDATE cart SET comment = ?', (comment,))
        conn.commit()

    # Формируем сообщение для Telegram
    cart_items_str = "\n".join([f"- {item['name']} x{item['quantity']}" for item in cart_items])
    message = f"Корзина:\n{cart_items_str}"
    if comment:
        message += f"\n\nКомментарий к корзине: {comment}"

    url = f"https://api.telegram.org/bot{TOKEN}/sendMessage"

    try:
        # Отправляем сообщение в Telegram
        response = requests.post(url, data={
            'chat_id': CHAT_ID,
            'text': message,
            'parse_mode': 'HTML'
        })
        if response.status_code == 200:
            return jsonify({"success": True, "message": "Корзина отправлена"})
        else:
            return jsonify({"success": False, "message": "Ошибка при отправке корзины"}), 500
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

@app.route('/favicon.ico', methods=['HEAD'])
def favicon():
    return '', 204

if __name__ == '__main__':
    # Обновляем схему базы данных перед запуском приложения
    update_database_schema()

    # Получаем порт из переменных окружения или используем 5000 по умолчанию
    port = int(os.environ.get("PORT", 5000))

    # Запускаем приложение
    app.run(debug=True, host="0.0.0.0", port=port)