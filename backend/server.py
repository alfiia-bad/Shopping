from flask import Flask, request, jsonify, send_from_directory
import requests
import os
import logging
from flask_cors import CORS

# Настройка логирования
logging.basicConfig(level=logging.DEBUG)

app = Flask(
    __name__,
    static_folder="../frontend/build",  # Путь к собранному фронтенду
    static_url_path=""  # Статика будет доступна с корня сайта
)

# Включаем CORS для всех маршрутов
CORS(app, resources={r"/send-to-telegram": {"origins": "*"}})  # Разрешаем CORS только для API

# Получаем токен и chat_id из окружения
TOKEN = os.getenv('TELEGRAM_BOT_TOKEN')
CHAT_ID = os.getenv('TELEGRAM_CHAT_ID')


@app.route('/send-to-telegram', methods=['POST'])
def send_to_telegram():
    logging.info("Получен запрос на /send-to-telegram")
    data = request.json
    print(f"📦 Получен запрос: {data}")
    print(f"🔐 TOKEN задан: {'Да' if TOKEN else 'Нет'}, CHAT_ID: {CHAT_ID}")

    if not data:
        logging.error("❌ Пустой запрос")
        return jsonify({"success": False, "message": "Пустой запрос"}), 400

    cart = data.get('cart', '')
    if not cart:
        logging.error("🛒 Корзина пуста")
        return jsonify({"success": False, "message": "Корзина пуста"}), 400

    message = f"Список покупок:\n{cart}"
    logging.debug(f"📨 Сообщение для отправки: {message}")

    url = f"https://api.telegram.org/bot{TOKEN}/sendMessage"

    try:
        response = requests.post(url, data={'chat_id': CHAT_ID, 'text': message})
        print(f"📡 Telegram ответ: {response.status_code}, {response.text}")

        if response.status_code == 200:
            logging.info("✅ Сообщение успешно отправлено в Telegram")
            return jsonify({"success": True, "message": "Сообщение отправлено"})
        else:
            logging.error(f"❌ Ошибка при отправке сообщения: {response.text}")
            return jsonify({"success": False, "message": "Ошибка при отправке сообщения"}), 500
    except requests.exceptions.RequestException as e:
        logging.error(f"💥 Ошибка при отправке запроса: {e}")
        return jsonify({"success": False, "message": "Ошибка при соединении с Telegram"}), 500


# Отдача React-фронтенда
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
