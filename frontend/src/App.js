import React, { useState, useEffect } from "react";
import "./index.css";
import { FiShoppingBag, FiHeart, FiBell, FiSearch } from "react-icons/fi";
import { FaShoppingCart } from "react-icons/fa";
import { MdArrowBackIos, MdClose } from "react-icons/md";
import { FaTelegram } from "react-icons/fa";
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
  const [searchTerm, setSearchTerm] = useState("");

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
    setViewCart(false);
  };

  const sendToTelegram = async () => {
    if (cart.length === 0) return alert("Корзина пуста");

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
        alert("❌ Не удалось отправить сообщение в Telegram");
      } else {
        alert("✅ Отправлено в Telegram!");
      }
    } catch (error) {
      console.error("Ошибка при отправке запроса:", error);
      alert("⚠️ Ошибка соединения с сервером");
    }
  };

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const filteredProducts =
    searchTerm.length >= 3
      ? products.filter((product) =>
          product.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
      : products;

  const handleClearSearch = () => {
    setSearchTerm("");
  };

  return (
    <div className="app-container">
      <header className="app-header">
        {viewCart ? (
          <>
            <div className="header-left">
              <button className="back-button" onClick={() => setViewCart(false)}>
                <MdArrowBackIos className="icon" />
              </button>
              <h2 className={`header-title ${viewCart ? 'cart-title' : 'products-title'}`}>Корзина</h2>
            </div>
            <div className="header-right">
              <button className="icon-button" onClick={clearCart}>
                <MdOutlineDelete className="icon" />
              </button>
              {totalItems > 0 && (
                <div className="item-count-badge">{totalItems}</div>
              )}
            </div>
          </>
        ) : (
          <>
            <h2 className={`header-title ${viewCart ? 'cart-title' : 'products-title'}`}>Список товаров</h2>
            <div className="cart-with-badge">
              <button className="cart-button" onClick={() => setViewCart(true)}>
                <LuShoppingCart className="icon" />
              </button>
              {totalItems > 0 && (
                <div className="item-count-badge">{totalItems}</div>
              )}
            </div>
          </>
        )}
      </header>

      <main className="main-content">
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
                filteredProducts.map((product) => {
                  const quantity = getQuantity(product.id);
                  return (
                    <div className="product-card" key={product.id}>
                      <img src={product.image} alt={product.name} />
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
                  <FaTelegram className="telegram-icon" />
                  Отправить в Telegram
                </button>
              </>
            )}
          </div>
        )}
      </main>

      {/* Нижний футер */}
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
