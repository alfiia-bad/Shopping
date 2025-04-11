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
    static_folder="../frontend/build",
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
init_db()

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

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_react(path):
    full_path = os.path.join(app.static_folder, path)
    if path != "" and os.path.exists(full_path):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, 'index.html')

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(debug=True, host="0.0.0.0", port=port)

@app.route('/backup', methods=['POST'])
def send_backup_to_telegram():
    file_path = DB_PATH
    if not os.path.exists(file_path):
        return jsonify({"success": False, "message": "Файл базы данных не найден"}), 404

    url = f"https://api.telegram.org/bot{TOKEN}/sendDocument"
    with open(file_path, 'rb') as file:
        try:
            response = requests.post(
                url,
                data={'chat_id': CHAT_ID},
                files={'document': (os.path.basename(file_path), file)}
            )
            if response.status_code == 200:
                return jsonify({"success": True, "message": "Бэкап отправлен в Telegram"})
            else:
                return jsonify({"success": False, "message": "Ошибка при отправке файла"}), 500
        except requests.exceptions.RequestException as e:
            return jsonify({"success": False, "message": str(e)}), 500
