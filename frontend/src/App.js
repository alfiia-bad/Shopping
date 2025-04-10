import React, { useState, useEffect } from "react";
import "./index.css";
import { FiShoppingBag, FiHeart, FiBell, FiSearch } from "react-icons/fi";
import { MdArrowBackIos, MdClose } from "react-icons/md";
import { RiTelegram2Fill } from "react-icons/ri";
import { LuShoppingCart } from "react-icons/lu";
import { MdOutlineDelete } from "react-icons/md";

const products = [
  { id: "1", name: "Бананы", image: "/images/banana.png" },
  { id: "2", name: "Вода", image: "/images/water3.webp" },
  { id: "3", name: "Кофе", image: "/images/coffee.jpg" },
];

const API_URL = "";

const App = () => {
  const [cart, setCart] = useState([]);
  const [viewCart, setViewCart] = useState(false);
  const [viewNotifications, setViewNotifications] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationTimeout, setNotificationTimeout] = useState(null);

  useEffect(() => {
    fetch(`${API_URL}/cart`)
      .then((res) => res.json())
      .then((data) => setCart(data))
      .catch((error) => console.error("Ошибка загрузки корзины:", error));
  }, []);

  const getQuantity = (id) => {
    const item = cart.find((item) => item.id === id);
    return item ? item.quantity : 0;
  };

  const updateCart = (newCart) => {
    setCart(newCart);
    fetch(`${API_URL}/cart`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newCart),
    }).catch((err) => console.error("Ошибка сохранения:", err));
  };

  const addToCart = (product) => {
    const index = cart.findIndex((item) => item.id === product.id);
    const newCart =
      index > -1
        ? cart.map((item, i) =>
            i === index ? { ...item, quantity: item.quantity + 1 } : item
          )
        : [...cart, { ...product, quantity: 1 }];
    updateCart(newCart);
  };

  const removeFromCart = (productId) => {
    const newCart = cart
      .map((item) =>
        item.id === productId
          ? { ...item, quantity: item.quantity - 1 }
          : item
      )
      .filter((item) => item.quantity > 0);
    updateCart(newCart);
  };

  const clearCart = () => {
    updateCart([]);
    setIsModalOpen(false);
    setViewCart(false);
  };

  const handleCloseNotification = () => {
    setShowNotification(false);
    if (notificationTimeout) {
      clearTimeout(notificationTimeout);
    }
  };

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

  const handleBackupDownload = async () => {
    try {
      const response = await fetch(`${API_URL}/backup`, {
        method: "POST",
      });
      const data = await response.json();
      if (data.success) {
        setShowNotification(true);
        const timeout = setTimeout(() => setShowNotification(false), 5000);
        setNotificationTimeout(timeout);
      } else {
        alert("Не удалось отправить бэкап в Telegram");
      }
    } catch (error) {
      console.error("Ошибка при отправке бэкапа:", error);
    }
  };

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleClearSearch = () => {
    setSearchTerm("");
  };

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="app-container">
      <header className="app-header">
        {viewCart ? (
          <>
            <div className="header-left">
              <button className="back-button" onClick={() => setViewCart(false)}>
                <MdArrowBackIos className="icon" />
              </button>
              <h2 className="header-title">Корзина</h2>
            </div>
            <div className="header-right">
              <button className="icon-button" onClick={() => setIsModalOpen(true)}>
                <MdOutlineDelete className="icon" />
              </button>
              {totalItems > 0 && <div className="item-count-badge">{totalItems}</div>}
            </div>
          </>
        ) : (
          <h2 className="header-title">
            {viewNotifications ? "Уведомления" : "Список товаров"}
          </h2>
        )}
      </header>

      <main className="main-content">
        {viewNotifications ? (
          <div className="notifications-page">
            <h3 className="section-title">Уведомления</h3>
            <button className="backup-button" onClick={handleBackupDownload}>
              📦 Выгрузить и отправить бэкап в Telegram
            </button>
          </div>
        ) : !viewCart ? (
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
                filteredProducts.map((product) => {
                  const quantity = getQuantity(product.id);
                  return (
                    <div className="product-card" key={product.id}>
                      <div className="image-container">
                        <img src={product.image} alt={product.name} />
                      </div>
                      <p className="product-name">{product.name}</p>
                      <div className="quantity-controls">
                        <button
                          onClick={() => removeFromCart(product.id)}
                          disabled={quantity === 0}
                          className={`qty-button minus ${quantity === 0 ? "disabled" : ""}`}
                        >
                          -
                        </button>
                        <span className="quantity">{quantity}</span>
                        <button
                          onClick={() => addToCart(product)}
                          className="qty-button plus"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="no-results">Ничего не найдено</p>
              )}
            </div>
          </>
        ) : (
          <div className="cart-list">
            {cart.length === 0 ? (
              <p className="cart-empty">Корзина пуста</p>
            ) : (
              <>
                {cart.map((item) => (
                  <div className="cart-item" key={item.id}>
                    <p className="product-name">{item.name}</p>
                    <div className="quantity-controls">
                      <button
                        onClick={() => removeFromCart(item.id)}
                        disabled={item.quantity === 0}
                        className={`qty-button minus ${item.quantity === 0 ? "disabled" : ""}`}
                      >
                        -
                      </button>
                      <span className="quantity">{item.quantity}</span>
                      <button
                        onClick={() => addToCart(item)}
                        className="qty-button plus"
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))}
                <button className="send-button" onClick={sendToTelegram}>
                  <RiTelegram2Fill className="telegram-icon" />
                  Отправить в Telegram
                </button>
              </>
            )}
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
        <button
          className={`nav-item ${!viewCart && !viewNotifications ? "active" : ""}`}
          onClick={() => {
            setViewCart(false);
            setViewNotifications(false);
          }}
        >
          <FiShoppingBag className="icon" />
          <span className="label">Товары</span>
        </button>
        <button className="nav-item" disabled>
          <FiHeart className="icon" />
          <span className="label">Избранное</span>
        </button>
        <button
          className={`nav-item ${viewCart ? "active" : ""}`}
          onClick={() => {
            setViewCart(true);
            setViewNotifications(false);
          }}
        >
          <LuShoppingCart className="icon" />
          <span className="label">Корзина</span>
        </button>
        <button
          className={`nav-item ${viewNotifications ? "active" : ""}`}
          onClick={() => {
            setViewCart(false);
            setViewNotifications(true);
          }}
        >
          <FiBell className="icon" />
          <span className="label">Уведомления</span>
        </button>
      </nav>
    </div>
  );
};

export default App;
