import React, { useState, useEffect } from "react";
import "./index.css";
import { FiShoppingBag, FiHeart, FiBell, FiSearch } from "react-icons/fi";
import { FaHeart, FaRegHeart } from "react-icons/fa"; 
import { MdArrowBackIos, MdClose } from "react-icons/md";
import { RiTelegram2Fill } from "react-icons/ri";
import { LuShoppingCart } from "react-icons/lu";
import { MdOutlineDelete } from "react-icons/md";

const products = [
  { id: "1", name: "Бананы", image: "/images/banana.png" },
  { id: "2", name: "Вода", image: "/images/water3.webp" },
  { id: "3", name: "Кофе", image: "/images/coffee.jpg" },
];

const API_URL = "https://alfa-shopping.onrender.com";

const App = () => {
  const [cart, setCart] = useState([]);
  const [viewCart, setViewCart] = useState(false);
  const [viewNotifications, setViewNotifications] = useState(false);
  const [viewFavorites, setViewFavorites] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationTimeout, setNotificationTimeout] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [favoritesInput, setFavoritesInput] = useState("");

  useEffect(() => {
    fetch(`${API_URL}/cart`)
      .then((res) => res.json())
      .then((data) => setCart(data))
      .catch((error) => console.error("Ошибка загрузки корзины:", error));
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [viewCart, viewFavorites, viewNotifications]);
  
  useEffect(() => {
    // Загружаем избранное с сервера при загрузке страницы
    fetch(`${API_URL}/favorites`)
      .then((res) => res.json())
      .then((data) => setFavorites(data))
      .catch((err) => console.error("Ошибка загрузки избранного:", err));
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

  const addToFavorites = async (productId) => {
    try {
      await fetch(`${API_URL}/favorites`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_id: productId }),
      });
      setFavorites((prev) => [...prev, productId]); // Обновляем локальное состояние
    } catch (err) {
      console.error("Ошибка при добавлении в избранное:", err);
    }
  };

  const removeFromFavorites = async (productId) => {
    try {
      await fetch(`${API_URL}/favorites`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_id: productId }),
      });
      setFavorites((prev) => prev.filter((id) => id !== productId)); // Обновляем локальное состояние
    } catch (err) {
      console.error("Ошибка при удалении из избранного:", err);
    }
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

  const sendUpdateRequest = async () => {
    try {
      const response = await fetch(`${API_URL}/send-to-telegram`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cart: "🚨 Прошу обновить список покупок 🚨" }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        setShowNotification(true);
        setNotificationTimeout(setTimeout(() => setShowNotification(false), 5000));
      } else {
        setShowNotification(true);
        setNotificationTimeout(setTimeout(() => setShowNotification(false), 5000));
      }
    } catch (error) {
      console.error("Ошибка при отправке запроса:", error);
      setShowNotification(true);
      setNotificationTimeout(setTimeout(() => setShowNotification(false), 5000));
    }
  };

  const sendFavoritesToTelegram = async () => {
    if (favorites.length === 0) return;

    const message = `Список избранных товаров:\n${products
      .filter((product) => favorites.includes(product.id))
      .map((product) => product.name)
      .join("\n")}`;

    try {
      const response = await fetch(`${API_URL}/send-to-telegram`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cart: message, include_header: false }), // Передаем include_header: false
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

  const updateFavorites = async () => {
    const lines = favoritesInput.split("\n").map((line) => line.trim());
    const header = "Список избранных товаров:";
    const newFavorites = lines.filter((line) => line && line !== header);

    try {
      const response = await fetch(`${API_URL}/favorites`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ favorites: newFavorites }),
      });

      if (response.ok) {
        const updatedFavorites = await response.json();
        setFavorites(updatedFavorites); // Обновляем локальное состояние
        setFavoritesInput(""); // Очищаем инпут
      } else {
        console.error("Ошибка обновления избранного");
      }
    } catch (error) {
      console.error("Ошибка при обновлении избранного:", error);
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
        {viewCart || viewNotifications || viewFavorites ? (
          <>
            <div className="header-left">
              <button
                className="back-button"
                onClick={() => {
                  setViewCart(false);
                  setViewNotifications(false);
                  setViewFavorites(false);
                }}
              >
                <MdArrowBackIos className="icon" />
              </button>
              <h2 className="header-title">
                {viewFavorites ? "Избранное" : viewNotifications ? "Уведомления" : "Корзина"}
              </h2>
            </div>
            <div className="header-right">
              {viewCart && (
                <button
                  className="icon-button"
                  onClick={() => setIsModalOpen(true)}
                >
                  <MdOutlineDelete className="icon" />
                </button>
              )}
              {viewCart && totalItems > 0 && (
                <div className="item-count-badge">{totalItems}</div>
              )}
            </div>
          </>
        ) : (
          <>
            <h2 className="header-title">Список товаров</h2>
            <div className="cart-with-badge">
              <button
                className="cart-button"
                onClick={() => setViewCart(true)}
              >
                <LuShoppingCart className="icon" />
              </button>
              {!viewCart && totalItems > 0 && (
                <div className="item-count-badge">{totalItems}</div>
              )}
            </div>
          </>
        )}
      </header>

      <main className="main-content">
        {!viewCart && !viewNotifications && !viewFavorites ? (
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
                  <button
                    className="clear-search-button"
                    onClick={handleClearSearch}
                  >
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
                      <button
                        className="favorite-button"
                        onClick={() =>
                          favorites.includes(product.id)
                            ? removeFromFavorites(product.id)
                            : addToFavorites(product.id)
                        }
                      >
                        {favorites.includes(product.id) ? (
                          <FaHeart className="icon active" /> // Фиолетовый лайк
                        ) : (
                          <FiHeart className="icon" /> // Серый лайк
                        )}
                      </button>
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
        ) : viewFavorites ? (
          <div className="favorites-view">
            {favorites.length > 0 ? (
              products
                .filter((product) => favorites.includes(product.id))
                .map((product) => {
                  const quantity = getQuantity(product.id); // Получаем текущее количество товара
                  return (
                    <div className="product-card" key={product.id}>
                      <button
                        className="favorite-button"
                        onClick={() => removeFromFavorites(product.id)}
                      >
                        <FaHeart className="icon active" />
                      </button>
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
              <p className="no-results formatted-text">Нет избранных товаров</p>
            )}
            <div className="update-favorites">
              <textarea
                className="favorites-input"
                placeholder="Вставьте сообщение со списком избранных товаров..."
                value={favoritesInput}
                onChange={(e) => setFavoritesInput(e.target.value)}
              />
              <button className="update-button" onClick={updateFavorites}>
                Обновить избранное
              </button>
            </div>
          </div>
        ) : viewNotifications ? (
          <div className="notifications-view">
            <p style={{ fontSize: "16px", fontWeight: "normal", marginTop: "8px", marginBottom: "16px" }}>
              Для отправки уведомления в Telegram о необходимости обновления списка покупок нажми кнопку ниже
            </p>
            <button className="send-button" onClick={sendUpdateRequest}>
              <RiTelegram2Fill className="telegram-icon" />
              Запросить обновление
            </button>
            <button className="send-button" onClick={sendFavoritesToTelegram}>
              <RiTelegram2Fill className="telegram-icon" />
              Выгрузить избранное
            </button>
          </div>
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
              <button onClick={clearCart} className="modal-confirm">
                Удалить
              </button>
              <button
                onClick={() => setIsModalOpen(false)}
                className="modal-cancel"
              >
                Отмена
              </button>
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
          className={`nav-item ${!viewCart && !viewNotifications && !viewFavorites ? "active" : ""}`}
          onClick={() => {
            setViewCart(false);
            setViewNotifications(false);
            setViewFavorites(false);
          }}
        >
          <FiShoppingBag className="icon" />
          <span className="label">Товары</span>
        </button>
        <button
          className={`nav-item ${viewFavorites ? "active" : ""}`}
          onClick={() => {
            setViewFavorites(true);
            setViewCart(false);
            setViewNotifications(false);
          }}
        >
          <FiHeart className="icon" />
          <span className="label">Избранное</span>
        </button>
        <button
          className={`nav-item ${viewCart ? "active" : ""}`}
          onClick={() => {
            setViewCart(true);
            setViewNotifications(false);
            setViewFavorites(false);
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
            setViewFavorites(false);
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