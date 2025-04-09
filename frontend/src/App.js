import React, { useState, useEffect } from "react";
import './index.css';

const products = [
  { id: "1", name: "Бананы", image: "/images/banana.png" },
  { id: "2", name: "Вода", image: "/images/water3.webp" },
  { id: "3", name: "Кофе", image: "/images/coffee.jpg" },
];

const App = () => {
  const [cart, setCart] = useState([]);
  const [viewCart, setViewCart] = useState(false);

  useEffect(() => {
    fetch("https://alfa-shopping.onrender.com/cart")
      .then(res => res.json())
      .then(data => setCart(data))
      .catch(error => console.error("Ошибка загрузки корзины:", error));
  }, []);

  const getQuantity = (productId) => {
    const item = cart.find((item) => item.id === productId);
    return item ? item.quantity : 0;
  };

  const updateCart = (newCart) => {
    setCart(newCart);
    fetch("https://alfa-shopping.onrender.com/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newCart),
    }).catch(err => console.error("Ошибка сохранения:", err));
  };

  const addToCart = (product) => {
    const itemIndex = cart.findIndex((item) => item.id === product.id);
    let newCart;
    if (itemIndex > -1) {
      newCart = [...cart];
      newCart[itemIndex].quantity += 1;
    } else {
      newCart = [...cart, { ...product, quantity: 1 }];
    }
    updateCart(newCart);
  };

  const removeFromCart = (productId) => {
    const newCart = cart
      .map((item) =>
        item.id === productId ? { ...item, quantity: item.quantity - 1 } : item
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
      const response = await fetch("https://alfa-shopping.onrender.com/send-to-telegram", {
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

  return (
    <div id="root">
      <header className="header">
        {viewCart ? (
          <>
            <div className="header-left">
              <button className="back-button" onClick={() => setViewCart(false)}>←</button>
              <span className="gap" />
              <h2 className="title">Корзина</h2>
            </div>
            <div className="header-right">
              <div className="clear-button-wrapper">
                <img
                  src="/images/delete.svg"
                  alt="Очистить"
                  className="icon-button"
                  onClick={clearCart}
                />
              </div>
            </div>
          </>
        ) : (
          <>
            <h2 className="title">Список товаров</h2>
            <button
              className="cart-button"
              onClick={() => setViewCart(true)}
            >
              Корзина ({cart.reduce((sum, item) => sum + item.quantity, 0)})
            </button>
          </>
        )}
      </header>

      {!viewCart ? (
        <div className="product-list">
          {products.map((item) => {
            const quantity = getQuantity(item.id);
            return (
              <div className="product-item" key={item.id}>
                <img src={item.image} alt={item.name} loading="lazy" />
                <p className="name">{item.name}</p>
                <div className="quantity">
                  <button onClick={() => removeFromCart(item.id)} disabled={quantity === 0} className={quantity === 0 ? "disabled" : ""}>-</button>
                  <p>{quantity}</p>
                  <button onClick={() => addToCart(item)}>+</button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="cart">
          {cart.length === 0 ? (
            <p className="cart-empty">Корзина пуста</p>
          ) : (
            <>
              {cart.map((item) => (
                <div className="item" key={item.id}>
                  <p className="name">{item.name}</p>
                  <div className="quantity">
                    <button onClick={() => removeFromCart(item.id)}>-</button>
                    <p>{item.quantity}</p>
                    <button onClick={() => addToCart(item)}>+</button>
                  </div>
                </div>
              ))}
              <button className="button" onClick={sendToTelegram}>
                <img
                  src="/images/icons_tg.svg"
                  alt="Telegram"
                  style={{ width: "20px", height: "20px", marginRight: "8px", verticalAlign: "middle" }}
                />
                Отправить в Telegram
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default App;
