import React, { useRef, useState, useEffect } from "react";
import "./index.css";
import { FiShoppingBag, FiHeart, FiBell, FiSearch, FiPlus } from "react-icons/fi";
import { FaHeart, FaPencilAlt } from "react-icons/fa"; 
import { MdArrowBackIos, MdClose, MdOutlineHideImage } from "react-icons/md";
import { RiTelegram2Fill } from "react-icons/ri";
import { LuShoppingCart } from "react-icons/lu";
import { MdOutlineDelete, MdInfo } from "react-icons/md";

const products = [
  { id: "1", name: "Бананы", image: "/images/banana.png" },
  { id: "2", name: "Вода", image: "/images/water3.webp" },
  { id: "3", name: "Кофе", image: "/images/coffee.jpg" },
  { id: "4", name: "Кофе капсулы. Вкусный и великолепный. Ароматный", image: "" },
  { id: "5", name: "Кофе капсулы. Вкусный и великолепный. Ароматныйаааааааааааа ааааааааа", image: "" },
  { id: "6", name: "Кофе капсулы. Вкусный и великолепный. Ароматныйаааааааааааа ааааааааа", image: "" },
];

const ProductNameWithHint = ({ name, commentHint = null }) => {   // Тут хинт для продуктов, которые не помещаются в одну строку
  const nameRef = useRef(null);
  const [isTruncated, setIsTruncated] = useState(false);

  useEffect(() => {
    const el = nameRef.current;
    if (el) {
      setIsTruncated(el.scrollHeight > el.clientHeight); // Проверяем, обрезан ли текст
    }
  }, [name]);

  return (
    <div className="product-name-wrapper">
      <p
        className="product-name"
        ref={nameRef}
        title={isTruncated ? name : undefined} // хинт при обрезке
      >
        {name}
      </p>
      {commentHint && (
        <div className="info-icon-wrapper">
          <MdInfo size={16} color="rgb(165, 106, 180)" />
          <span className="info-hint">{commentHint}</span>
        </div>
      )}
    </div>
  );
};

const API_URL = "https://alfa-shop-ljmg.onrender.com";

const App = () => {
  const [viewCart, setViewCart] = useState(false);
  const [viewFavorites, setViewFavorites] = useState(false);
  const [viewNotifications, setViewNotifications] = useState(false);
  const [cart, setCart] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFavoritesModalOpen, setIsFavoritesModalOpen] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationTimeout, setNotificationTimeout] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [favoritesInput, setFavoritesInput] = useState("");
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [showInvalidFavoritesBadge, setShowInvalidFavoritesBadge] = useState(false);
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
  const [currentComment, setCurrentComment] = useState("");
  const [currentProductId, setCurrentProductId] = useState(null);
  const [pendingCart, setPendingCart] = useState([]);
  const [isCartModalOpen, setIsCartModalOpen] = useState(false);
  const [cartComment, setCartComment] = useState("");

  const hasGeneralCommentFromUrl = useRef(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const favoritesParam = urlParams.get("favorites");
    const cartParam = urlParams.get("cart");
    
    if (favoritesParam) {
      // Переключаемся на вкладку "Избранное"
      setViewFavorites(true);
      setViewCart(false);
      setViewNotifications(false);

      // Открываем модальное окно
      setTimeout(() => {
        const favoritesArray = favoritesParam.split(",");
        setFavoritesInput(favoritesArray.join("\n")); // Заполняем инпут
        setIsFavoritesModalOpen(true); // Открываем модалку

        // Убираем параметры из URL
        window.history.replaceState(null, "", window.location.origin);
      }, 100); // Даем время для рендера вкладки
      return; // Прерываем выполнение, чтобы не использовать localStorage
    }

    if (cartParam) {
      // Переключаемся на вкладку "Корзина"
      setViewCart(true);
      setViewFavorites(false);
      setViewNotifications(false);

      // Открываем модальное окно
      setTimeout(() => {
        const newCart = cartParam.split(",").map((item) => {
          const [id, quantity, comment] = item.split(":"); // Разделяем id, quantity и comment
          const product = products.find((p) => p.id === id); // Ищем товар в массиве products
          return {
            id,
            name: product ? product.name : "Неизвестный товар", // Используем название из products
            quantity: parseInt(quantity, 10),
            comment: comment ? decodeURIComponent(comment) : "", // Декодируем комментарий, если он есть
          };
        });

        const generalCommentParam = urlParams.get("general-comment");

        if (generalCommentParam) {
          const decodedComment = decodeURIComponent(generalCommentParam);
          setCartComment(decodedComment);
          hasGeneralCommentFromUrl.current = true;

          // Сохраняем общий комментарий в базу
          fetch(`${API_URL}/cart/general-comment`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ comment: decodedComment }),
          }).then((res) => {
            if (!res.ok) {
              console.error("Ошибка при сохранении общего комментария из URL");
            }
          }).catch((err) => {
            console.error("Ошибка сети при сохранении общего комментария из URL", err);
          });
        }        

        setPendingCart(newCart); // Сохраняем данные для модалки
        setIsCartModalOpen(true); // Открываем модалку

        // Убираем параметры из URL
        window.history.replaceState(null, "", window.location.origin);
      }, 100); // Даем время для рендера вкладки
      return; // Прерываем выполнение, чтобы не использовать localStorage
    }

    // Если параметров в URL нет, используем localStorage
    const activeTab = localStorage.getItem("activeTab");
    if (activeTab === "cart") {
      setViewCart(true);
      setViewFavorites(false);
      setViewNotifications(false);
    } else if (activeTab === "favorites") {
      setViewFavorites(true);
      setViewCart(false);
      setViewNotifications(false);
    } else if (activeTab === "notifications") {
      setViewNotifications(true);
      setViewCart(false);
      setViewFavorites(false);
    } else {
      setViewCart(false);
      setViewFavorites(false);
      setViewNotifications(false);
    }
  }, []);

  useEffect(() => {
    // Сохраняем активную вкладку в localStorage
    if (viewCart) {
      localStorage.setItem("activeTab", "cart");
    } else if (viewFavorites) {
      localStorage.setItem("activeTab", "favorites");
    } else if (viewNotifications) {
      localStorage.setItem("activeTab", "notifications");
    } else {
      localStorage.setItem("activeTab", "products");
    }
  }, [viewCart, viewFavorites, viewNotifications]);

  useEffect(() => {
    const fetchCart = async () => {
      try {
        const response = await fetch(`${API_URL}/cart`);
        const data = await response.json();
        setCart(data); // Устанавливаем корзину из базы данных
      } catch (error) {
        console.error("Ошибка загрузки корзины:", error);
      }
    };

    fetchCart();
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

  useEffect(() => {
    if (hasGeneralCommentFromUrl.current) return; // 💥 Не загружаем повторно, если уже был из URL

    const fetchGeneralComment = async () => {
      try {
        const response = await fetch(`${API_URL}/cart/general-comment`);
        if (response.ok) {
          const data = await response.json();
          setCartComment(data.comment || ""); // Устанавливаем общий комментарий из базы данных
        } else {
          console.error("Ошибка при загрузке общего комментария:", await response.text());
        }
      } catch (error) {
        console.error("Ошибка при загрузке общего комментария:", error);
      }
    };

    fetchGeneralComment();
  }, []);

  const getQuantity = (id) => {
    const item = cart.find((item) => item.id === id);
    return item ? item.quantity : 0;
  };

  const updateCart = async (newCart) => {
    setCart(newCart);

    try {
      await fetch(`${API_URL}/cart`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newCart), // Отправляем всю корзину, включая комментарии
      });
      console.log("Корзина успешно обновлена");
    } catch (error) {
      console.error("Ошибка при обновлении корзины:", error);
    }
  };

  const updateCartOnServer = async (newCart) => {
    try {
      await fetch(`${API_URL}/cart`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newCart),
      });
      console.log("Корзина успешно обновлена на сервере");
    } catch (error) {
      console.error("Ошибка обновления корзины на сервере:", error);
    }
  };

  const addToCart = (product) => {
    const index = cart.findIndex((item) => item.id === product.id);
    const newCart =
      index > -1
        ? cart.map((item, i) =>
            i === index ? { ...item, quantity: item.quantity + 1 } : item
          )
        : [...cart, { ...product, quantity: 1 }];
        updateCart(newCart.filter(item => item.id !== "general")); // Убираем из корзины элементы с id "general"
  };

  const removeFromCart = (productId) => {
    const newCart = cart
      .map((item) =>
        item.id === productId
          ? { ...item, quantity: item.quantity - 1 }
          : item
      )
      .filter((item) => item.quantity > 0);
      updateCart(newCart.filter(item => item.id !== "general")); // Убираем из корзины элементы с id "general"
  };

  // const clearCart = () => {
  //   updateCart([]);  // Очищаем корзину 
  //   setCart([]); // Обновляем локальное состояние
  //   setIsModalOpen(false); // Закрываем модалку
  //   // Убираем переключение на вкладку "Товары"
  // };

  const clearCart = async () => {
    try {
      const response = await fetch(`${API_URL}/cart`, {
        method: 'DELETE',
      });
      const result = await response.json();
      if (result.success) {
        setCart([]);            // Очищаем корзину
        setCartComment("");     // Очищаем общий комментарий
      } else {
        console.error("Ошибка при очистке корзины:", result.message);
      }
    } catch (error) {
      console.error("Ошибка сети при очистке корзины:", error);
    } finally {
      setIsModalOpen(false); // Закрываем модалку
    }
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

  const updateFavorites = async () => {
    const lines = favoritesInput.split("\n").map((line) => line.trim());
    const validFavorites = lines.filter((line) =>
      products.some((product) => product.id === line)
    );

    const invalidFavorites = lines.filter(
      (line) => !products.some((product) => product.id === line)
    );

    if (invalidFavorites.length > 0) {
      setShowInvalidFavoritesBadge(true); // Показываем бейдж
      setTimeout(() => setShowInvalidFavoritesBadge(false), 5000); // Скрываем бейдж через 5 секунд
    }

    if (validFavorites.length === 0) {
      console.error("Некорректные данные: ни один из товаров не найден.");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/favorites`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ favorites: validFavorites }),
      });

      if (response.ok) {
        const updatedFavorites = await response.json();
        setFavorites(updatedFavorites.favorites); // Обновляем локальное состояние
        setFavoritesInput(""); // Очищаем инпут
      } else {
        console.error("Ошибка обновления избранного");
      }
    } catch (error) {
      console.error("Ошибка при обновлении избранного:", error);
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

    // Формируем сообщение для каждого товара
    const messageBody = cart
      .map((item) => {
        const product = products.find((p) => p.id === item.id);
        if (!product) return `- Неизвестный товар x${item.quantity}`;
        const comment = item.comment?.trim(); // Берём комментарий из item.comment
        return comment
          ? `- ${product.name} x${item.quantity} [${comment}]`
          : `- ${product.name} x${item.quantity}`;
      })
      .join("\n");

    // Формируем параметры корзины для ссылки
    const cartParams = cart
      .map(
        (item) =>
          `${item.id}:${item.quantity}:${item.comment ? encodeURIComponent(item.comment) : ""}`
      )
      .join(",");
    const encodedGeneralComment = encodeURIComponent(cartComment.trim());
    const siteUrl = `${window.location.origin}?cart=${cartParams}${
      cartComment.trim() ? `&general-comment=${encodedGeneralComment}` : ""
    }`;

    // Добавляем общий комментарий к корзине
    const generalComment = cartComment.trim()
      ? `\n\nКомментарий к корзине: ${cartComment.trim()}`
      : "";

    // Итоговое сообщение
    const linkText = `<a href="${siteUrl}">🛒 Загрузить этот список покупок</a>`;
    const message = `Список покупок:\n\n${messageBody}${generalComment}\n\n${linkText}`;

    try {
      const response = await fetch(`${API_URL}/send-to-telegram`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cart: message, parse_mode: "HTML" }),
      });

      if (!response.ok) {
        console.error("Ошибка отправки в Telegram");
      } else {
        console.log("Список покупок успешно отправлен в Telegram");
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
      const siteUrl = `${window.location.origin}`; // Ссылка на главную страницу (вкладка Товары)
      const message = `🚨 Обнови список покупок 🚨\n\n<a href="${siteUrl}">Перейти в приложение</a>`;

      const response = await fetch(`${API_URL}/send-to-telegram`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cart: message, parse_mode: "HTML" }), // Передаём HTML-разметку
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        console.error("Ошибка при отправке запроса:", await response.text());
        setShowNotification(true);
        setNotificationTimeout(setTimeout(() => setShowNotification(false), 5000));
      } else {
        console.log("Запрос на обновление списка успешно отправлен в Telegram");
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

    // Формируем список товаров с названиями
    const messageBody = favorites
      .map((productId, index) => {
        const product = products.find((p) => p.id === productId);
        return product ? `- ${product.name}` : null;
      })
      .filter(Boolean)
      .join("\n"); // Используем \n для переноса строк

    // Формируем ссылку на сайт с модальным окном
    const siteUrl = `${window.location.origin}?favorites=${favorites.join(",")}`;
    const message = `Список избранных товаров:\n\n${messageBody}\n\n💟 <a href="${siteUrl}">Загрузить это избранное</a>`;

    try {
      const response = await fetch(`${API_URL}/send-to-telegram`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cart: message, parse_mode: "HTML" }), // Передаём HTML-разметку
      });

      if (!response.ok) {
        console.error("Ошибка отправки в Telegram");
      } else {
        console.log("Избранное успешно отправлено в Telegram");
        setShowNotification(true);
        const timeout = setTimeout(() => setShowNotification(false), 5000);
    setNotificationTimeout(timeout);
      }
    } catch (error) {
      console.error("Ошибка при отправке запроса:", error);
    }
  };

  const handleOpenFavoritesModal = () => {
    setIsFavoritesModalOpen(true);
  };

  const handleCloseFavoritesModal = () => {
    setIsFavoritesModalOpen(false); // Закрываем модальное окно
    setViewFavorites(true); // Переключаемся на вкладку "Избранное"
    setViewCart(false);
    setViewNotifications(false);

    // Убираем параметры из URL
    window.history.replaceState(null, "", window.location.origin);
  };

  const handleOpenExportModal = () => {
    setIsExportModalOpen(true); // Открываем модальное окно экспорта
  };

  const handleCloseExportModal = () => {
    setIsExportModalOpen(false); // Закрываем модальное окно экспорта
  };

  const handleUpdateCart = () => {
    setCart(pendingCart); // Обновляем локальное состояние корзины
    updateCartOnServer(pendingCart.filter(item => item.id !== "general")); // Отправляем данные на сервер
    setIsCartModalOpen(false); // Закрываем модалку
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

  const handleOpenCommentModal = (id) => {
    const product = cart.find((item) => item.id === id); // Находим товар в корзине
    setCurrentProductId(id); // Устанавливаем текущий ID товара
    setCurrentComment(product?.comment || ""); // Устанавливаем текущий комментарий (если есть)
    setIsCommentModalOpen(true); // Открываем модальное окно
  };

  // const handleCommentChange = (id, comment) => {
  //   const updatedCart = cart.map((item) =>
  //     item.id === id ? { ...item, comment } : item
  //   );
  //   updateCart(updatedCart.filter(item => item.id !== "general")); // Сохраняем изменения на сервере
  // };

  const saveComment = async () => {
    try {
      if (currentProductId === "general") {
        // Если редактируем общий комментарий — отдельный API-запрос
        await fetch("/comment", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: "general",
            comment: currentComment,
          }),
        });
  
        // Обновляем локальное состояние
        const updatedCart = cart.map((item) =>
          item.id === "general" ? { ...item, comment: currentComment } : item
        );
        setCart(updatedCart);
      } else {
        // Иначе — обновляем комментарий у товара
        const updatedCart = cart.map((item) =>
          item.id === currentProductId ? { ...item, comment: currentComment } : item
        );
        setCart(updatedCart);
        updateCart(updatedCart.filter(item => item.id !== "general"));
      }
  
      // Закрываем модалку
      setIsCommentModalOpen(false);
  
      // 💡 iOS scroll fix
      setTimeout(() => {
        document.activeElement?.blur();
        document.body.style.height = "101vh";
        setTimeout(() => {
          document.body.style.height = "100vh";
        }, 50);
  
        const meta = document.querySelector("meta[name=viewport]");
        if (meta) {
          const original = meta.getAttribute("content");
          meta.setAttribute("content", "width=393");
          setTimeout(() => {
            meta.setAttribute("content", original || "width=device-width, initial-scale=1");
          }, 200);
        }
  
        window.dispatchEvent(new Event("resize"));
      }, 300);
  
    } catch (error) {
      console.error("Ошибка при сохранении комментария:", error);
    }
  };

  const saveGeneralComment = async () => {
    try {
      const response = await fetch(`${API_URL}/cart/general-comment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comment: cartComment.trim() }), // Отправляем общий комментарий
      });

      if (!response.ok) {
        console.error("Ошибка при сохранении общего комментария:", await response.text());
      } else {
        console.log("Общий комментарий к корзине успешно сохранён");
      }
    } catch (error) {
      console.error("Ошибка при сохранении общего комментария к корзине:", error);
    }
  };

  const handleCancelComment = () => {
    // Сбрасываем текущий комментарий и закрываем модальное окно
    setCurrentComment("");
    setIsCommentModalOpen(false);
  };

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
              {viewFavorites && (
                <>
                  <button
                    className={`icon-button ${favorites.length === 0 ? "disabled" : "purple"}`}
                    onClick={favorites.length > 0 ? handleOpenExportModal : null}
                    disabled={favorites.length === 0} // Делаем кнопку неактивной, если нет избранных товаров
                  >
                    <RiTelegram2Fill className="icon" />
                  </button>
{/* Условие для скрытия кнопки */}
                  {false && (
                  <button
                    className="icon-button purple"
                    onClick={handleOpenFavoritesModal} // Открываем модалку для обновления избранного
                    style={{ marginLeft: "12px" }} // Отступ между кнопками
                  >
                    <FiPlus className="icon" />
                  </button>
)}
                </>
              )}
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
                        {product.image ? (
                          <img
                            src={product.image}
                            alt="" // Пустой alt для декоративного изображения
                          />
                        ) : (
                          <MdOutlineHideImage className="no-image-icon" />
                        )}
                      </div>
                      <ProductNameWithHint name={product.name} />
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
              favorites.map((productId) => {
                const product = products.find((p) => p.id === productId);

                // Если товар не найден, пропускаем его
                if (!product) {
                  console.warn(`Товар с идентификатором ${productId} не найден.`);
                  return null;
                }

                const quantity = getQuantity(product.id); // Получаем текущее количество товара

                return (
                  <div className="product-card" key={productId}>
                    <button
                      className="favorite-button"
                      onClick={() => removeFromFavorites(productId)}
                    >
                      <FaHeart className="icon active" />
                    </button>
                    <div className="image-container">
                      {product.image ? (
                        <img
                          src={product.image}
                          alt="" // Пустой alt для декоративного изображения
                        />
                      ) : (
                        <MdOutlineHideImage className="no-image-icon" />
                      )}
                    </div>
                    <ProductNameWithHint name={product.name} />
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
              <p className="cart-empty">Нет избранных товаров</p>
            )}
          </div>
        ) : viewNotifications ? (
          <div className="notifications-view">
            <p style={{ fontSize: "16px", fontWeight: "normal", marginTop: "8px", marginBottom: "16px" }}>
              Для отправки уведомления в Telegram о необходимости обновления списка покупок нажми кнопку ниже
            </p>
            <button className="send-button full-width" onClick={sendUpdateRequest}>
              <RiTelegram2Fill className="telegram-icon" />
              Запросить обновление
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
                    <div className="cart-item-header">
                      <FaPencilAlt
                        className="edit-icon"
                        onClick={() => handleOpenCommentModal(item.id)} // Открываем модальное окно
                      />
                      <ProductNameWithHint
                        name={item.name}
                        commentHint={item.comment?.trim() ? "Есть комментарий" : null}
                      />
                    </div>
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
{/* Новый инпут для комментария к корзине */}
                <div className="cart-comment-wrapper">                
                  <textarea
                    className={`cart-comment-input ${
                      cartComment.length >= 200 ? "input-error" : ""
                    }`}
                    placeholder="Добавьте комментарий к корзине..."
                    value={cartComment}
                    maxLength={200} // Ограничиваем ввод до 200 символов
                    onChange={(e) => setCartComment(e.target.value)}
                    onBlur={saveGeneralComment} // Сохраняем комментарий при потере фокуса
                  />
                  <div
                    className={`char-counter ${
                      cartComment.length >= 200 ? "limit-reached" : ""
                    }`}
                  >
                    {cartComment.length}/200
                  </div>
                </div>
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

      {isFavoritesModalOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <h3 className="modal-title">Избранное обновится безвозвратно. Вы уверены?</h3>
            <textarea
              className="favorites-input"
              placeholder="Вставьте идентификаторы избранных товаров..."
              value={favoritesInput}
              onChange={(e) => setFavoritesInput(e.target.value)}
              style={{ display: "none" }} // Скрываем инпут
            />
            <div className="modal-actions">
              <button
                className="modal-confirm"
                onClick={() => {
                  updateFavorites(); // Обновляем избранное
                  setIsFavoritesModalOpen(false); // Закрываем модальное окно
                  setViewFavorites(true); // Переключаемся на вкладку "Избранное"
                  setViewCart(false);
                  setViewNotifications(false);
                  handleCloseFavoritesModal(); // Закрываем модалку и очищаем URL
                }}
              >
                Обновить
              </button>
              <button
                className="modal-cancel"
                onClick={handleCloseFavoritesModal} // Закрываем модальное окно
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}

      {isExportModalOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <p>Выгрузить текущие избранные товары в Telegram?</p>
            <div className="modal-actions">
              <button
                className="modal-confirm"
                onClick={() => {
                  sendFavoritesToTelegram(); // Выгружаем избранное
                  handleCloseExportModal(); // Закрываем модалку
                }}
              >
                Выгрузить
              </button>
              <button
                className="modal-cancel"
                onClick={handleCloseExportModal} // Закрываем модалку
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}

      {isCommentModalOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <h3 className="modal-title">Комментарий для товара:</h3>
<p className="modal-product-name">{products.find((p) => p.id === currentProductId)?.name || "Неизвестный товар"}</p>
            <div className="comment-wrapper">
              <textarea
                className={`comment-input ${currentComment.length >= 50 ? "input-error" : ""}`}
                value={currentComment}
                maxLength={50} // Ограничение на 50 символов
                onChange={(e) => setCurrentComment(e.target.value)} // Обновляем локальное состояние
                placeholder="Введите комментарий..."
              />
              <div
                className={`char-counter ${currentComment.length >= 50 ? "limit-reached" : ""}`}
              >
                {currentComment.length}/50
              </div>
            </div>
            <div className="modal-actions">
              <button className="modal-confirm" onClick={saveComment}>
                Сохранить
              </button>
              <button className="modal-cancel" onClick={handleCancelComment}>
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}

      {isCartModalOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <h3 className="modal-title">Вы собираетесь обновить корзину. Действие безвозвратно. Уверены?</h3>
            <div className="modal-actions">
              <button
                className="modal-confirm"
                onClick={handleUpdateCart} // Вызываем обновление корзины
              >
                Обновить
              </button>
              <button
                className="modal-cancel"
                onClick={() => setIsCartModalOpen(false)} // Закрываем модалку
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}

      {showNotification && (
        <div className="telegram-notification">
<a 
            href="https://t.me/+IV3rD9KvL5UxYWRi" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="notification-link"
          >
          Отправлено в Telegram!
</a>
          <button className="close-notification" onClick={handleCloseNotification}>
            <MdClose className="icon" />
          </button>
        </div>
      )}

      {showInvalidFavoritesBadge && (
        <div className="telegram-notification">
          Некоторые товары не найдены и не загружены!
          <button
            className="close-notification"
            onClick={() => setShowInvalidFavoritesBadge(false)}
          >
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
      </nav>
    </div>
  );
};

export default App;