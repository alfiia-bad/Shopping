// Импорты
import React, { useState, useEffect } from 'react';
import { FiSearch, FiShoppingBag, FiHeart, FiBell } from 'react-icons/fi';
import { MdClose } from 'react-icons/md';
import { LuShoppingCart } from 'react-icons/lu';

// Определите API_URL с адресом вашего сервера
const API_URL = 'https://alfa-shopping.onrender.com';

// Основной компонент
const App = () => {
  const [cart, setCart] = useState([]);
  const [viewCart, setViewCart] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationTimeout, setNotificationTimeout] = useState(null);
  const [products, setProducts] = useState([]); // Добавил состояние для продуктов

  // Загрузка корзины и продуктов
  useEffect(() => {
    // Загружаем корзину
    fetch(`${API_URL}/cart`)
      .then((res) => res.json())
      .then((data) => setCart(data))
      .catch((error) => console.error("Ошибка загрузки корзины:", error));

    // Загружаем продукты
    fetch(`${API_URL}/products`)
      .then((res) => res.json())
      .then((data) => setProducts(data))
      .catch((error) => console.error("Ошибка загрузки продуктов:", error));
  }, []);

  // Обработчик отправки уведомления
  const sendToTelegram = async () => {
    if (cart.length === 0) return;
    const message = cart
      .map((item) => `- ${item.name} x${item.quantity}`)
      .join("\n");

    try {
      const response = await fetch(`${API_URL}/send-to-telegram`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cart: message }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        console.error("Ошибка отправки в Telegram");
      } else {
        setShowNotification(true);
        const timeout = setTimeout(() => setShowNotification(false), 5000);
        setNotificationTimeout(timeout);
      }
    } catch (error) {
      console.error("Ошибка при отправке запроса:", error);
    }
  };

  // Поиск товаров
  const handleSearchChange = (e) => setSearchTerm(e.target.value);
  const handleClearSearch = () => setSearchTerm("");

  // Отображение продуктов по поиску
  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Очистка корзины (функция для модального окна)
  const clearCart = () => setCart([]);

  // Закрытие уведомления
  const handleCloseNotification = () => {
    setShowNotification(false);
    if (notificationTimeout) {
      clearTimeout(notificationTimeout);
    }
  };

  return (
    <div className="app-container">
      <header className="app-header">
        {/* Логика отображения корзины */}
      </header>

      <main className="main-content">
        {/* Если не корзина, то список товаров */}
        {!viewCart ? (
          <>
            <div className="search-bar">
              <div className="search-input-wrapper">
                <FiSearch className="search-icon" />
                <input
                  type="text"
                  placeholder="Поиск товаров..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                />
                {searchTerm && (
                  <button className="clear-button-icon" onClick={handleClearSearch}>
                    <MdClose className="icon" />
                  </button>
                )}
              </div>
            </div>
            <div className="product-list">
              {filteredProducts.length > 0 ? (
                filteredProducts.map((product) => (
                  <div className="product-card" key={product.id}>
                    <div className="image-container">
                      <img src={product.image} alt={product.name} />
                    </div>
                    <p className="product-name">{product.name}</p>
                    <div className="quantity-controls">
                      {/* Кнопки добавления и удаления товара */}
                    </div>
                  </div>
                ))
              ) : (
                <p className="no-results">Ничего не найдено</p>
              )}
            </div>
          </>
        ) : (
          <div className="cart-list">
            {/* Содержимое корзины */}
          </div>
        )}
      </main>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <p>Удаление безвозвратно. Вы уверены?</p>
            <div className="modal-actions">
              <button onClick={clearCart} className="modal-confirm">Удалить</button>
              <button onClick={() => setIsModalOpen(false)} className="modal-cancel">Отмена</button>
            </div>
          </div>
        </div>
      )}

      {showNotification && (
        <div className="telegram-notification">
          Отправлено в Telegram!
          <button className="close-notification" onClick={handleCloseNotification}>
            <MdClose className="icon" />
          </button>
        </div>
      )}

      <nav className="bottom-nav">
        <button className={`nav-item ${!viewCart ? "active" : ""}`} onClick={() => setViewCart(false)}>
          <FiShoppingBag className="icon" />
          <span className="label">Товары</span>
        </button>
        <button className="nav-item" disabled>
          <FiHeart className="icon" />
          <span className="label">Избранное</span>
        </button>
        <button className={`nav-item ${viewCart ? "active" : ""}`} onClick={() => setViewCart(true)}>
          <LuShoppingCart className="icon" />
          <span className="label">Корзина</span>
        </button>
        <button className="nav-item" disabled>
          <FiBell className="icon" />
          <span className="label">Уведомления</span>
        </button>
      </nav>
    </div>
  );
};

export default App;
