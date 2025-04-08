from flask import Flask, request, jsonify
import requests
import os

app = Flask(__name__)

# Получаем токен и chat_id из окружения
TOKEN = os.getenv('TELEGRAM_BOT_TOKEN')
CHAT_ID = os.getenv('TELEGRAM_CHAT_ID')

@app.route('/send-to-telegram', methods=['POST'])
def send_to_telegram():
    data = request.json
    cart = data.get('cart', '')
    if not cart:
        return jsonify({"success": False, "message": "Корзина пуста"}), 400

    message = f"Список покупок:\n{cart}"

    url = f"https://api.telegram.org/bot{TOKEN}/sendMessage"
    response = requests.post(url, data={'chat_id': CHAT_ID, 'text': message})

    if response.status_code == 200:
        return jsonify({"success": True, "message": "Сообщение отправлено"})
    else:
        return jsonify({"success": False, "message": "Ошибка при отправке сообщения"}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
