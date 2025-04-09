import React, { useState, useEffect } from "react";
import { Text, View, Image, TouchableOpacity, FlatList, ScrollView } from "react-native";
import './index.css';  // Этот файл стоит оставить для общих стилей

const products = [
  { id: "1", name: "Бананы", image: "https://via.placeholder.com/50" },
  { id: "2", name: "Вода", image: "https://via.placeholder.com/50" },
  { id: "3", name: "Кофе", image: "https://via.placeholder.com/50" },
];

const App = () => {
  const [cart, setCart] = useState([]);
  const [viewCart, setViewCart] = useState(false);

  // 👇 Подгружаем корзину при загрузке страницы
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
    <View style={{ padding: 20 }}>
      {!viewCart ? (
        <>
          <Text>Список товаров</Text>
          <TouchableOpacity onPress={() => setViewCart(true)}>
            <Text>Корзина ({cart.reduce((sum, item) => sum + item.quantity, 0)})</Text>
          </TouchableOpacity>

          <FlatList
            data={products}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => {
              const quantity = getQuantity(item.id);
              return (
                <View style={{ marginBottom: 20 }}>
                  <Image source={{ uri: item.image }} style={{ width: 50, height: 50 }} />
                  <Text>{item.name}</Text>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                    <TouchableOpacity onPress={() => removeFromCart(item.id)} style={{ backgroundColor: '#4CAF50', padding: 10 }}>
                      <Text style={{ color: 'white' }}>-</Text>
                    </TouchableOpacity>
                    <Text>{quantity}</Text>
                    <TouchableOpacity onPress={() => addToCart(item)} style={{ backgroundColor: '#4CAF50', padding: 10 }}>
                      <Text style={{ color: 'white' }}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            }}
          />
        </>
      ) : (
        <ScrollView>
          <Text>Корзина</Text>
          {cart.map((item) => (
            <View key={item.id} style={{ marginBottom: 20 }}>
              <Text>{item.name} x{item.quantity}</Text>
              <View style={{ flexDirection: "row", gap: 10 }}>
                <TouchableOpacity onPress={() => addToCart(item)} style={{ backgroundColor: '#4CAF50', padding: 10 }}>
                  <Text style={{ color: 'white' }}>+</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => removeFromCart(item.id)} style={{ backgroundColor: '#4CAF50', padding: 10 }}>
                  <Text style={{ color: 'white' }}>-</Text>
                </TouchableOpacity>
              </View>
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
