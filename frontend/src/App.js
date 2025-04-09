import React, { useState, useEffect } from "react";
import "./index.css";

const products = [
  { id: "1", name: "Бананы", image: "https://via.placeholder.com/50" },
  { id: "2", name: "Вода", image: "https://via.placeholder.com/50" },
  { id: "3", name: "Кофе", image: "https://via.placeholder.com/50" },
];

const App = () => {
  const [cart, setCart] = useState([]);
  const [viewCart, setViewCart] = useState(false);

  useEffect(() => {
    fetch("/cart")
      .then((res) => res.json())
      .then((data) => setCart(data))
      .catch((err) => console.error("Ошибка загрузки корзины:", err));
  }, []);

  const getQuantity = (id) => cart.find((item) => item.id === id)?.quantity || 0;

  const updateCart = (newCart) => {
    setCart(newCart);
    fetch("/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newCart),
    }).catch((err) => console.error("Ошибка сохранения:", err));
  };

  const addToCart = (product) => {
    const itemIndex = cart.findIndex((item) => item.id === product.id);
    const newCart = [...cart];
    if (itemIndex > -1) {
      newCart[itemIndex].quantity += 1;
    } else {
      newCart.push({ ...product, quantity: 1 });
    }
    updateCart(newCart);
  };

  const removeFromCart = (id) => {
    const newCart = cart
      .map((item) =>
        item.id === id ? { ...item, quantity: item.quantity - 1 } : item
      )
      .filter((item) => item.quantity > 0);
    updateCart(newCart);
  };

  const sendToTelegram = async () => {
    if (cart.length === 0) return alert("Корзина пуста");
    const message = cart.map((item) => `- ${item.name} x${item.quantity}`).join("\n");
    try {
      const res = await fetch("/send-to-telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cart: message }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        alert("❌ Не удалось отправить сообщение");
      } else {
        alert("✅ Отправлено в Telegram!");
      }
    } catch {
      alert("⚠️ Ошибка соединения");
    }
  };

  return (
    <div className="container">
      {!viewCart ? (
        <>
          <h2>Список товаров</h2>
          <button onClick={() => setViewCart(true)}>Корзина ({cart.reduce((sum, i) => sum + i.quantity, 0)})</button>
          <div className="products">
            {products.map((item) => (
              <div key={item.id} className="product">
                <img src={item.image} alt={item.name} />
                <p>{item.name}</p>
                <div className="button-container">
                  <button className="button" onClick={() => removeFromCart(item.id)}>-</button>
                  <span>{getQuantity(item.id)}</span>
                  <button className="button" onClick={() => addToCart(item)}>+</button>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <>
          <h2>Корзина</h2>
          {cart.map((item) => (
            <div key={item.id} className="product">
              <p>{item.name} x{item.quantity}</p>
              <div className="button-container">
                <button className="button" onClick={() => addToCart(item)}>+</button>
                <button className="button" onClick={() => removeFromCart(item.id)}>-</button>
              </div>
            </div>
          ))}
          <button onClick={sendToTelegram}>Отправить в Telegram</button>
          <button onClick={() => setViewCart(false)}>← Назад</button>
        </>
      )}
    </div>
  );
};

export default App;
