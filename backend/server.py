from flask import Flask, request, jsonify
import requests
import os
import logging
from flask_cors import CORS

# Настройка логирования
logging.basicConfig(level=logging.DEBUG)

app = Flask(__name__)

# Включаем CORS для всех маршрутов
CORS(app)

# Получаем токен и chat_id из окружения
TOKEN = os.getenv('TELEGRAM_BOT_TOKEN')
CHAT_ID = os.getenv('TELEGRAM_CHAT_ID')

@app.route('/send-to-telegram', methods=['POST'])
def send_to_telegram():
    data = request.json
    cart = data.get('cart', '')
    if not cart:
        logging.error("Корзина пуста")
        return jsonify({"success": False, "message": "Корзина пуста"}), 400

    message = f"Список покупок:\n{cart}"
    logging.debug(f"Сообщение для отправки: {message}")

    url = f"https://api.telegram.org/bot{TOKEN}/sendMessage"
    try:
        response = requests.post(url, data={'chat_id': CHAT_ID, 'text': message})
        if response.status_code == 200:
            logging.info("Сообщение успешно отправлено в Telegram")
            return jsonify({"success": True, "message": "Сообщение отправлено"})
        else:
            logging.error(f"Ошибка при отправке сообщения: {response.text}")
            return jsonify({"success": False, "message": "Ошибка при отправке сообщения"}), 500
    except requests.exceptions.RequestException as e:
        logging.error(f"Ошибка при отправке запроса: {e}")
        return jsonify({"success": False, "message": "Ошибка при отправке сообщения"}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
