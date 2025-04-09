import React, { useState, useEffect } from "react";
import './index.css';  // Обновленные стили

const products = [
  { id: "1", name: "Бананы", image: "https://via.placeholder.com/50" },
  { id: "2", name: "Вода", image: "https://via.placeholder.com/50" },
  { id: "3", name: "Кофе", image: "https://via.placeholder.com/50" },
];

const App = () => {
  const [cart, setCart] = useState([]);
  const [viewCart, setViewCart] = useState(false);

  // Подгружаем корзину при загрузке страницы
  useEffect(() => {
    fetch("https://alfa-shopping.onrender.com/cart")
      .then(res => res.json())
      .then(data => {
        console.log("🛒 Получено с сервера:", data.cart);
        setCart(data.cart);
      })
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
      body: JSON.stringify({ cart: newCart }),
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
      {!viewCart ? (
        <>
          <h2>Список товаров</h2>
          <button className="button" onClick={() => setViewCart(true)}>
            Корзина ({cart.reduce((sum, item) => sum + item.quantity, 0)})
          </button>

          <div className="product-list">
            {products.map((item) => {
              const quantity = getQuantity(item.id);
              return (
                <div className="product-item" key={item.id}>
                  <img src={item.image} alt={item.name} />
                  <p className="name">{item.name}</p>
                  <div className="quantity">
                    <button onClick={() => removeFromCart(item.id)}>-</button>
                    <p>{quantity}</p>
                    <button onClick={() => addToCart(item)}>+</button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <div className="cart">
          <h3>Корзина</h3>
          {cart.map((item) => (
            <div className="item" key={item.id}>
              <p className="name">{item.name}</p>
              <div className="quantity">
                <button onClick={() => addToCart(item)}>+</button>
                <button onClick={() => removeFromCart(item.id)}>-</button>
              </div>
            </div>
          ))}

          <button className="button" onClick={sendToTelegram}>
            Отправить в Telegram
          </button>

          <button className="button" onClick={() => setViewCart(false)}>
            ← Назад
          </button>
        </div>
      )}
    </div>
  );
};

export default App;
