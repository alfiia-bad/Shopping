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
    static_folder="static",
    static_url_path=""
)

CORS(app)

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

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

@app.route('/cart', methods=['GET'])
def get_cart():
    with sqlite3.connect(DB_PATH) as conn:
        cursor = conn.execute('SELECT id, name, quantity FROM cart')
        items = [{"id": row[0], "name": row[1], "quantity": row[2]} for row in cursor.fetchall()]
    return jsonify(items)

@app.route('/cart', methods=['POST'])
def update_cart():
    items = request.json
    if not isinstance(items, list):
        return jsonify({"error": "Неверный формат данных"}), 400

    with sqlite3.connect(DB_PATH) as conn:
        conn.execute('DELETE FROM cart')  # удалим старые записи
        for item in items:
            conn.execute('INSERT INTO cart (id, name, quantity) VALUES (?, ?, ?)',
                         (item["id"], item["name"], item["quantity"]))
    return jsonify({"success": True})

@app.route('/send-to-telegram', methods=['POST'])    
def send_to_telegram():
    data = request.json
    cart = data.get('cart', '')
    if not cart:
        return jsonify({"success": False, "message": "Корзина пуста"}), 400

    message = f"Список покупок:\n{cart}"
    url = f"https://api.telegram.org/bot{TOKEN}/sendMessage"

    try:
        response = requests.post(url, data={'chat_id': CHAT_ID, 'text': message})
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
