import React, { useState, useEffect } from "react";
import { Text, View, Image, TouchableOpacity, FlatList, ScrollView } from "react-native";
import './index.css';

const products = [
  { id: "1", name: "Бананы", image: "https://via.placeholder.com/50" },
  { id: "2", name: "Вода", image: "https://via.placeholder.com/50" },
  { id: "3", name: "Кофе", image: "https://via.placeholder.com/50" },
];

const App = () => {
  const [cart, setCart] = useState([]);
  const [viewCart, setViewCart] = useState(false);

  useEffect(() => {
    fetch("https://alfa-shopping.onrender.com/cart")
      .then((res) => res.json())
      .then((data) => setCart(data))
      .catch((err) => console.error("Ошибка при загрузке корзины:", err));
  }, []);

  useEffect(() => {
    fetch("https://alfa-shopping.onrender.com/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cart),
    }).catch((err) => console.error("Ошибка при сохранении корзины:", err));
  }, [cart]);

  const getQuantity = (productId) => {
    const item = cart.find((item) => item.id === productId);
    return item ? item.quantity : 0;
  };

  const addToCart = (product) => {
    setCart((prevCart) => {
      const index = prevCart.findIndex((item) => item.id === product.id);
      if (index > -1) {
        const updated = [...prevCart];
        updated[index].quantity += 1;
        return updated;
      } else {
        return [...prevCart, { ...product, quantity: 1 }];
      }
    });
  };

  const removeFromCart = (productId) => {
    setCart((prevCart) =>
      prevCart
        .map((item) =>
          item.id === productId ? { ...item, quantity: item.quantity - 1 } : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const sendToTelegram = async () => {
    if (cart.length === 0) return alert("Корзина пуста");
    const message = cart.map((item) => `- ${item.name} x${item.quantity}`).join("\n");

    try {
      const response = await fetch("https://alfa-shopping.onrender.com/send-to-telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cart: message }),
      });
      const data = await response.json();
      alert(data.success ? "✅ Отправлено в Telegram!" : "❌ Ошибка");
    } catch (error) {
      alert("⚠️ Ошибка соединения с сервером");
    }
  };

  return (
    <View>
      {!viewCart ? (
        <>
          <View>
            <Text>Список товаров</Text>
            <TouchableOpacity onPress={() => setViewCart(true)}>
              <Text>Корзина ({cart.reduce((sum, item) => sum + item.quantity, 0)})</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={products}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => {
              const quantity = getQuantity(item.id);
              return (
                <View>
                  <Image source={{ uri: item.image }} />
                  <Text>{item.name}</Text>
                  <div className="button-container">
                    <button className="button" onClick={() => removeFromCart(item.id)}>-</button>
                    <Text>{quantity}</Text>
                    <button className="button" onClick={() => addToCart(item)}>+</button>
                  </div>
                </View>
              );
            }}
          />
        </>
      ) : (
        <ScrollView>
          <Text>Корзина</Text>
          {cart.map((item) => (
            <View key={item.id}>
              <Text>{item.name} x{item.quantity}</Text>
              <div className="button-container">
                <button className="button" onClick={() => addToCart(item)}>+</button>
                <button className="button" onClick={() => removeFromCart(item.id)}>-</button>
              </div>
            </View>
          ))}

          <TouchableOpacity onPress={sendToTelegram}>
            <Text>Отправить в Telegram</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setViewCart(false)}>
            <Text>← Назад</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </View>
  );
};

export default App;
