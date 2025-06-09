import { useRef, useState, useEffect, useCallback } from "react";
import "./index.css";
import { FiShoppingBag, FiHeart, FiBell, FiSearch, FiPlus } from "react-icons/fi";
import { FaHeart } from "react-icons/fa"; 
import { MdArrowBackIos, MdClose, MdOutlineHideImage } from "react-icons/md";
import { RiTelegram2Fill } from "react-icons/ri";
import { LuShoppingCart, LuPencil } from "react-icons/lu";
import { MdOutlineDelete, MdInfo } from "react-icons/md";

const API_URL = process.env.REACT_APP_API_URL;  // URL вашего бэкенда

const ProductNameWithHint = ({ name, commentHint = null, align = "center" }) => {   // Тут хинт для продуктов, которые не помещаются в одну строку
  const nameRef = useRef(null);
  const [showFullText, setShowFullText] = useState(false);

  return (
    <div
      className="product-name-wrapper"
      onClick={() => setShowFullText((prev) => !prev)} // Переключение по тапу
      style={{ textAlign: align }} // Это выравнивание всей обёртки
    >
      <p
        className="product-name"
        ref={nameRef}
        style={{
          WebkitLineClamp: showFullText ? 'unset' : 2,
          overflow: showFullText ? 'visible' : 'hidden',
          display: '-webkit-box',
          WebkitBoxOrient: 'vertical',
          textAlign: align, // Вот оно! Центр или влево
        }}
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

const App = () => {
  const [products, setProducts] = useState([]); 
  const [cart, setCart] = useState([]);
  const [searchTermProducts, setSearchTermProducts] = useState('');
  const [searchTermEdit, setSearchTermEdit] = useState('');
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
  const [productsLoaded, setProductsLoaded] = useState(false);
  const [newProductImage, setNewProductImage] = useState("");
  const [activeTab, setActiveTab] = useState("products");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newProductName, setNewProductName] = useState("");
  const [newProductNameError, setNewProductNameError] = useState(false);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editedName, setEditedName] = useState("");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false); 
  const [productToDelete, setProductToDelete] = useState(null);
  const [newProductCategory, setNewProductCategory] = useState("Без категории");
  const [isCartCommentFocused, setIsCartCommentFocused] = useState(false);

  const hasGeneralCommentFromUrl = useRef(false);
  const generalCommentFromUrl = useRef("");

  const pollingId = useRef(null);

  const setTab = useCallback((tab) => {   // Устанавливаем активную вкладку
    setActiveTab(tab);
    localStorage.setItem("activeTab", tab);
    const url = new URL(window.location);
    url.searchParams.set("tab", tab);
    window.history.replaceState({}, "", url);
  }, []);

  const fetchData = async () => { // Загрузка товаров с бэкенда
    try {
      const res = await fetch(`${API_URL}/products`);
      const data = await res.json();
      console.log("Товары с бэкенда:", data);
      setProducts(data);
      setProductsLoaded(true);
    } catch (error) {
      console.error("Ошибка загрузки товаров:", error);
    }
  };
  
  useEffect(() => {   // Загрузка товаров при первом рендере
    fetchData();
  }, []);

  const fetchCart = async () => {
    try {
      const res = await fetch(`${API_URL}/cart`);
      const data = await res.json();
      setCart(data);

      // --- ДОБАВЛЕНО: обновляем общий комментарий ---
      const commentRes = await fetch(`${API_URL}/cart/general-comment`);
      if (commentRes.ok) {
        const commentData = await commentRes.json();
        setCartComment(commentData.comment || "");
      }
      // --- КОНЕЦ ДОБАВЛЕНИЯ ---
    } catch (error) {
      console.error("Ошибка загрузки корзины:", error);
    }
  };

  const startPolling = () => {
    if (pollingId.current) return;
    pollingId.current = setInterval(fetchCart, 5000);
  };

  const stopPolling = () => {
    if (pollingId.current) {
      clearInterval(pollingId.current);
      pollingId.current = null;
    }
  };

  useEffect(() => { // Загрузка корзины при первом рендере
  if (isCartCommentFocused) {
    stopPolling();
    return;
  }
  fetchCart();
  startPolling();
  return () => stopPolling();
}, [isCartCommentFocused]);

  useEffect(() => {   // Загрузка избранного при первом рендере
    const fetchFavorites = async () => {
      try {
        const res = await fetch(`${API_URL}/favorites`);
        const data = await res.json();
        setFavorites(data);
      } catch (error) {
        console.error("Ошибка загрузки избранного:", error);
      }
    };
    fetchFavorites();
  }, []);

  useEffect(() => {  // Обработка URL-параметров при загрузке страницы
    if (!productsLoaded) return;

    console.log("Товары загружены:", products);  // Логируем товары после загрузки

    const urlParams = new URLSearchParams(window.location.search);
    const favoritesParam = urlParams.get("favorites");
    const cartParam = urlParams.get("cart");
    const generalCommentParam = urlParams.get("general-comment");

    if (favoritesParam) {
      setTab("favorites");
      setTimeout(() => {
        setFavoritesInput(favoritesParam.split(",").join("\n"));
        setIsFavoritesModalOpen(true);
        window.history.replaceState(null, "", window.location.origin);
      }, 100);
      return;
    }

    if (cartParam) {
      setTab("cart");
      setTimeout(() => {
        const items = cartParam.split(",").map((item) => {
          const [id, quantity, comment] = item.split(":");
          const product = products.find((p) => Number(p.id) === Number(id));
          return {
            id: Number(id),
            name: product?.name || "Неизвестный товар",
            quantity: Number(quantity) || 1,
            comment: comment ? decodeURIComponent(comment) : "",
          };
        });

        if (generalCommentParam) {
          const decoded = decodeURIComponent(generalCommentParam);
          generalCommentFromUrl.current = decoded;
          setCartComment(decoded);
          hasGeneralCommentFromUrl.current = true;
        }

        setPendingCart(items);
        setIsCartModalOpen(true);
        window.history.replaceState(null, "", window.location.origin);
      }, 100);
      return;
    }

    // fallback: tab from URL or localStorage
    const tabFromUrl = urlParams.get("tab") || localStorage.getItem("activeTab") || "products";
    setTab(tabFromUrl);
  }, [productsLoaded, products, setTab]);

  useEffect(() => { // Прокрутка страницы вверх при переключении между вкладками
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [activeTab]);

  const viewCart = activeTab === "cart";
  const viewFavorites = activeTab === "favorites";
  const viewNotifications = activeTab === "notifications";

  useEffect(() => { // Прокрутка страницы вверх при переключении между вкладками
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [viewCart, viewFavorites, viewNotifications]);

  useEffect(() => { // Прокрутка страницы вверх при открытии модального окна
    if (isEditModalOpen) {
      document.body.style.overflow = 'hidden'; // запретить скролл фона
    } else {
      document.body.style.overflow = 'auto'; // включить обратно
    }
  
    return () => {
      document.body.style.overflow = 'auto'; // на всякий случай при размонтировании
    };
  }, [isEditModalOpen]);

  useEffect(() => {   // Инициализация избранного при первом рендере
    const fetchFavorites = async () => {
      try {
        const res = await fetch(`${API_URL}/favorites`);
        const data = await res.json();
        setFavorites(data); // Обновляем локальное состояние с сервера
      } catch (err) {
        console.error("Ошибка загрузки избранного:", err);
      }
    };
  
    fetchFavorites(); // Первая загрузка
  }, []);

  useEffect(() => {  // Загрузка общего комментария из базы данных
    if (hasGeneralCommentFromUrl.current) return; // 💥 Не загружаем повторно, если уже был из URL

    const fetchGeneralComment = async () => { // Получаем общий комментарий из базы данных
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


  const getQuantity = (id) => { // Получаем количество товара в корзине
    const item = cart.find((item) => item.id === id);
    return item ? item.quantity : 0;
  };

  const updateCart = async (newCart) => { // Обновляем корзину на сервере
    setCart(newCart);
  
    try {
      await fetch(`${API_URL}/cart`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newCart),
      });
      console.log("Корзина успешно обновлена");
    } catch (error) {
      console.error("Ошибка при обновлении корзины:", error);
    }
  };

  // НОВЫЙ КУУУУСООООООООООКК

const updateQueue = useRef([]);
const isProcessing = useRef(false);

// Обработка очереди обновлений
const processQueue = async () => {
  stopPolling();
  if (isProcessing.current || updateQueue.current.length === 0) {
    startPolling();
    return;
  }
  isProcessing.current = true;
  const nextUpdate = updateQueue.current.shift();
  if (!nextUpdate) {
    isProcessing.current = false;
    startPolling();
    return;
  }
  const { productId, name, quantity, comment } = nextUpdate;
  const updatedItem = {
    id: productId,
    name,
    quantity,
    comment: comment || ""
  };
  try {
    const response = await fetch(`${API_URL}/cart/update`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify([updatedItem]),
    });
    if (!response.ok) {
      console.error("Ошибка при обновлении корзины");
    }
  } catch (err) {
    console.error("Ошибка сети при обновлении корзины", err);
  } finally {
    isProcessing.current = false;
    if (updateQueue.current.length > 0) {
      processQueue();
    } else {
      startPolling();
    }
  }
};

// Обновление UI и постановка в очередь для бэкенда
const incrementCart = (productId, name, delta) => {
  setCart((prevCart) => {
    const updatedCart = [...prevCart];
    const index = updatedCart.findIndex((item) => item.id === productId);

    let newQty = delta;
    if (index !== -1) {
      newQty = updatedCart[index].quantity + delta;
      if (newQty > 0) {
        updatedCart[index].quantity = newQty;
      } else {
        updatedCart.splice(index, 1);
      }
    } else if (delta > 0) {
      updatedCart.push({ id: productId, name, quantity: delta, comment: "" });
    }

    // Кладём в очередь абсолютное значение quantity
    updateQueue.current.push({
      productId,
      name,
      quantity: newQty > 0 ? newQty : 0,
      comment: ""
    });
    processQueue();

    return updatedCart;
  });
};

  const addToCart = (product) => { // Добавляем товар в корзину
    incrementCart(product.id, product.name, +1);
  };

  const removeFromCart = (productId) => {
    const product = cart.find((item) => item.id === productId);
  
    if (product) {
      if (product.quantity > 1) {
        incrementCart(productId, product.name, -1);
      } else {
        incrementCart(productId, product.name, -1); // удаление, если 1
      }
  
      // Проверяем, останутся ли товары после удаления
      const newCart = cart
        .map((item) =>
          item.id === productId
            ? { ...item, quantity: item.quantity - 1 }
            : item
        )
        .filter((item) => item.quantity > 0 && item.id !== "general");
    
      const hasProducts = newCart.length > 0;
    
      if (!hasProducts) {
        setCartComment("");
        generalCommentFromUrl.current = "";
    
        // 🔥 Удаляем общий комментарий с сервера
        fetch(`${API_URL}/cart/general-comment`, {
          method: "DELETE",
        })
          .then((res) => {
            if (!res.ok) {
              console.error("Ошибка при удалении общего комментария:", res.statusText);
            } else {
              console.log("Общий комментарий успешно удалён");
            }
          })
          .catch((err) => console.error("Ошибка при удалении комментария:", err));
      }

      //updateCart(newCart.filter(item => item.id !== "general")); // Убираем из корзины элементы с id "general"
    }
  };

  const clearCart = async () => { // Очищаем корзину
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

  const addToFavorites = async (productId) => { // Добавляем товар в избранное
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

  const removeFromFavorites = async (productId) => { // Удаляем товар из избранного
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

  const updateFavorites = async () => { // Обновляем избранное
    if (!products.length) {
      console.error("Товары ещё не загружены. Подождите.");
      return;
    }
  
    const lines = favoritesInput.split("\n").map((line) => line.trim());
  
    const validFavorites = lines.filter((line) =>
      products.some((product) => product.id === line)
    );
  
    const invalidFavorites = lines.filter(
      (line) => !products.some((product) => product.id === line)
    );
  
    if (invalidFavorites.length > 0) {
      setShowInvalidFavoritesBadge(true);
      setTimeout(() => setShowInvalidFavoritesBadge(false), 5000);
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
        setFavorites(updatedFavorites.favorites);
        setFavoritesInput("");
      } else {
        console.error("Ошибка обновления избранного");
      }
    } catch (error) {
      console.error("Ошибка при обновлении избранного:", error);
    }
  };

  const handleSendAllProductsToTelegram = async () => { // Отправляем все товары в Telegram
    const formattedMessage =
      '🖥🐍 Список всех товаров:\n\n' +
      products
        .map((item, index) => `("${item.id || index + 1}", "${item.name}", "${item.image || ''}")`)
        .join(',\n');
  
    try {
      const response = await fetch('/send-to-telegram', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: formattedMessage }),
      });
  
      if (response.ok) {
        setShowNotification(true);
        const timeout = setTimeout(() => setShowNotification(false), 5000);
        setNotificationTimeout(timeout);
      } else {
        console.error('Ошибка при отправке в Telegram');
      }
    } catch (error) {
      console.error('Ошибка при отправке:', error);
    }
  };
  
  const handleCloseNotification = () => { // Закрываем уведомление
    setShowNotification(false);
    if (notificationTimeout) {
      clearTimeout(notificationTimeout);
    }
  };

  const startEdit = (id, name) => { // Начинаем редактировать товар
    setEditingId(id);
    setEditedName(name);
  };
  
  const saveEdit = async () => { // Сохраняем изменения в товаре
    if (editingId === null) return;
    const trimmed = editedName.trim();
    if (!trimmed) return;
  
    try {
      const res = await fetch(`${API_URL}/products/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });
  
      const result = await res.json();
      if (result.success) {
        setProducts((prev) =>
          prev.map((item) =>
            item.id === editingId ? { ...item, name: trimmed } : item
          )
        );
      } else {
        showToast("Ошибка: " + result.message, "error");
      }
    } catch (error) {
      showToast("Ошибка при сохранении", "error");
    } finally {
      setEditingId(null);
      setEditedName("");
    }
  };

  const sendToTelegram = async () => { // Отправляем список покупок в Telegram
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

  const sendUpdateRequest = async () => { // Отправляем запрос на обновление списка покупок в Telegram
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

  const sendFavoritesToTelegram = async () => { // Отправляем избранное в Telegram
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
    setTab("favorites"); // Переключаемся на вкладку "Избранное"

    // Убираем параметры из URL
    window.history.replaceState(null, "", window.location.origin);
  };

  const handleOpenExportModal = () => {
    setIsExportModalOpen(true); // Открываем модальное окно экспорта
  };

  const handleCloseExportModal = () => {
    setIsExportModalOpen(false); // Закрываем модальное окно экспорта
  };

  const handleUpdateCart = async () => {
    try {
      // 1. Обновляем корзину на сервере (без general-комментария)
      await updateCart(pendingCart.filter(item => item.id !== "general"));
  
      // 2. Сохраняем общий комментарий на сервере
      await saveGeneralComment();
  
      // 3. Обновляем локальное состояние
      setCart(pendingCart);
      setPendingCart([]);
      setIsCartModalOpen(false);
    } catch (err) {
      console.error("Ошибка при обновлении корзины и общего комментария:", err);
    }
  };

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  const allCategories = Array.from(
    new Set(products.map((p) => p.category || "Без категории"))
  );

  const handleSearchChange = (e) => {  // Поиск по товарам
    const input = e.target.value;
    setSearchTermProducts(input); 
  
    const convertedInput = switchLayout(input);
  
    const filtered = products.filter((product) =>
      product.name.toLowerCase().includes(input.toLowerCase()) ||
      product.name.toLowerCase().includes(convertedInput.toLowerCase())
    );
  
    console.log("Отфильтрованные товары:", filtered);
    setFilteredProducts(filtered); // сохранение отфильтрованных результатов
  };
  
  const handleClearSearch = () => { // Очистка поля поиска
    setSearchTermProducts(""); 
    setFilteredProducts([]);
  };
 
  const handleOpenCommentModal = (id) => {
    const product = cart.find((item) => item.id === id); // Находим товар в корзине
    setCurrentProductId(id); // Устанавливаем текущий ID товара
    setCurrentComment(product?.comment || ""); // Устанавливаем текущий комментарий (если есть)
    setIsCommentModalOpen(true); // Открываем модальное окно
  };

  const saveComment = async () => {
    try {
      let updatedCart;

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
        updatedCart = cart.map((item) =>
          item.id === "general" ? { ...item, comment: currentComment } : item
        );
        setCart(updatedCart);
      } else {
        updatedCart = cart.map((item) =>
          item.id === currentProductId ? { ...item, comment: currentComment } : item
        );
        // УБРАТЬ setCart(updatedCart);
        await updateCart(updatedCart.filter((item) => item.id !== "general"));
      }
  
      // Если корзина (без general) стала пустой — удаляем общий комментарий
      const cartWithoutGeneral = updatedCart.filter((item) => item.id !== "general");
      if (cartWithoutGeneral.length === 0) {
        try {
          await fetch(`${API_URL}/general-comment`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ comment: "" }),
          });
          setCartComment("");
        } catch (error) {
          console.error("Ошибка при удалении общего комментария:", error);
        }
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

  const saveGeneralComment = async () => {              // Сохраняем общий комментарий в корзине
    const commentToSave = hasGeneralCommentFromUrl.current
      ? generalCommentFromUrl.current
      : cartComment;
  
    try {
      const response = await fetch(`${API_URL}/cart/general-comment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comment: commentToSave.trim() }),
      });
  
      if (!response.ok) {
        console.error("Ошибка при сохранении общего комментария:", await response.text());
      } else {
        console.log("Общий комментарий к корзине успешно сохранён");
  
        // 👉 ОБНОВЛЯЕМ локальное состояние, чтобы отобразилось в инпуте:
        setCartComment(commentToSave.trim());
      }
    } catch (error) {
      console.error("Ошибка при сохранении общего комментария к корзине:", error);
    }
  };

  function showToast(message, type = "success") {  // Создаём кастомный тост
    const toast = document.createElement("div");
    toast.className = `custom-toast ${type}`;
    toast.innerHTML = `
      <span>${message}</span>
      <button class="close-toast">&times;</button>
    `;
    document.body.appendChild(toast);
  
    const removeToast = () => {
      toast.classList.add("fade-out");
      setTimeout(() => toast.remove(), 300); // Плавное исчезновение
    };
  
    const closeBtn = toast.querySelector(".close-toast");
    closeBtn.addEventListener("click", removeToast);
  
    setTimeout(removeToast, 5000);
  }

  
  
  function switchLayout(str) {  // Функция для переключения раскладки клавиатуры
    const en = "`qwertyuiop[]asdfghjkl;'zxcvbnm,."
    const ru = "ёйцукенгшщзхъфывапролджэячсмитьбю"
    
    return str
      .split('')
      .map(char => {
        const lowerChar = char.toLowerCase();
        const index = en.indexOf(lowerChar);
        if (index === -1) return char;
  
        const isUpper = char !== lowerChar;
        const translated = ru[index] || char;
        return isUpper ? translated.toUpperCase() : translated;
      })
      .join('');
  }

  const handleAddProduct = async () => { // Добавляем новый товар
    if (!newProductName.trim()) {
      setNewProductNameError(true);
      return;
    }
  
    setNewProductNameError(false);
  
    const newProduct = {
      name: newProductName.trim(),
      category: newProductCategory,
      // image_url: newProductImage, // больше не нужен
    };
  
    try {
      const res = await fetch(`${API_URL}/products`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newProduct),
      });
  
      const data = await res.json();
      if (data.success) {
        showToast("Товар добавлен");
        setNewProductName("");
        setNewProductImage("");
        setIsAddModalOpen(false);
        fetchData();
      } else {
        showToast("Ошибка: " + data.message, "error");
      }
    } catch (err) {
      showToast("Ошибка при добавлении", "error");
    }
  }; 
  
  const handleDeleteProduct = async (productId) => { // Удаляем товар
    try {
      await fetch(`${API_URL}/products/${productId}`, {
        method: "DELETE",
      });
      setProducts((prev) => prev.filter((item) => item.id !== productId));
    } catch (err) {
      showToast("Ошибка при удалении", "error");
    }
  };

  const handleCancelComment = () => {
    // Сбрасываем текущий комментарий и закрываем модальное окно
    setCurrentComment("");
    setIsCommentModalOpen(false);
  };

  // Группировка и сортировка товаров по категориям с приоритетом
const groupByCategory = (productsList) => {
  const priority = ["Напитки", "Овощи", "Мясо"];
  const map = {};
  productsList.forEach((product) => {
    const cat = product.category || "Без категории";
    if (!map[cat]) map[cat] = [];
    map[cat].push(product);
  });

  // Сортируем товары внутри каждой категории по имени
  Object.values(map).forEach((arr) =>
    arr.sort((a, b) => a.name.localeCompare(b.name, "ru"))
  );

  // Категории в нужном порядке: сначала из priority, потом остальные
  const sorted = {};
  priority.forEach((cat) => {
    if (map[cat]) {
      sorted[cat] = map[cat];
      delete map[cat];
    }
  });
  // Остальные категории — в случайном порядке (или по алфавиту, если хотите)
  Object.keys(map).forEach((cat) => {
    sorted[cat] = map[cat];
  });

  return sorted;
};

const displayedProducts = searchTermProducts.trim() ? filteredProducts : products;
const productsByCategory = groupByCategory(displayedProducts);

  return (
    <div className="app-container">
      <header className="app-header">
        {viewCart || viewNotifications || viewFavorites ? (
          <>
            <div className="header-left">
              <button
                className="back-button"
                onClick={() => setTab("products")}
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
                  <div className="tooltip-wrapper tooltip-left">
                    <button
                      className={`icon-button ${favorites.length === 0 ? "disabled" : "purple"}`}
                      onClick={favorites.length > 0 ? handleOpenExportModal : null}
                      disabled={favorites.length === 0} // Делаем кнопку неактивной, если нет избранных товаров
                    >
                      <RiTelegram2Fill className="icon" />
                    </button>
                    <span className="tooltip">отправить избранное</span>
                  </div>
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
                <>
                  {/* КНОПКА "ДОБАВИТЬ ТОВАР" */}
                  <div className="tooltip-wrapper tooltip-left">
                    <button
                      className="icon-button purple"
                      style={{ marginRight: "8px" }}
                      onClick={() => setIsAddModalOpen(true)}
                    >
                      <FiPlus className="icon" />
                    </button>
                    <span className="tooltip">добавить товар</span>
                  </div>
                  <div className="tooltip-wrapper tooltip-left">
                    <button
                      className="icon-button"
                      onClick={() => setIsModalOpen(true)}
                    >
                      <MdOutlineDelete className="icon" />
                    </button>
                    <span className="tooltip">очистить корзину</span>
                  </div>
                </>
              )}
              {viewCart && totalItems > 0 && (
                <div className="item-count-badge">{totalItems}</div>
              )}
            </div>
          </>
        ) : (
          <>
            <h2 className="header-title">Список товаров</h2> 
            <div className="header-actions">
              <div className="tooltip-wrapper">
                <button
                  className="add-button custom-add-button"
                  onClick={() => {
                    setIsEditModalOpen(true);
                  }}
                >
                  <LuPencil className="icon black-icon" />
                </button>
                <span className="tooltip">редактировать товары</span>
              </div> 
              <div className="tooltip-wrapper">
                <button    // Добавляем кнопку для добавления товара
                  className="add-button custom-add-button"
                  onClick={() => setIsAddModalOpen(true)}
                >
                  <FiPlus className="icon black-icon" />
                </button>
                <span className="tooltip">добавить товар</span>
              </div>
              <div className="cart-with-badge tooltip-wrapper">
                <button  // Кнопка для перехода в корзину
                  className="cart-button"
                  onClick={() => setTab("cart")}
                >
                  <LuShoppingCart className="icon" />
                </button>
                <span className="tooltip">перейти в корзину</span>
                {!viewCart && totalItems > 0 && (
                  <div className="item-count-badge">{totalItems}</div>
                )}
              </div>
            </div>
          </>
        )}
      </header>

      <main className="main-content">
        {!viewCart && !viewNotifications && !viewFavorites ? (
          <div className="swipe-container">
            <div className="search-bar">
              <div className="search-input-wrapper">
                <FiSearch className="search-icon" />
                <input
                  type="text"
                  placeholder="Поиск товаров..."
                  value={searchTermProducts}
                  onChange={handleSearchChange}
                />
                {searchTermProducts && (
                  <button className="clear-search-button" onClick={handleClearSearch}>
                    <MdClose className="icon" />
                  </button>
                )}
              </div>
            </div>

            <div className="product-list">
              {Object.keys(productsByCategory).length > 0 ? (
                Object.entries(productsByCategory).map(([category, items]) => (
                  <div key={category} className="category-section">
                    <div className="category-title">{category}</div>
                    <div
                      className={
                        items.length === 1
                          ? "category-products single-product"
                          : "category-products"
                      }
                    >
                      {items.map((product) => {
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
                                <FaHeart className="icon active" />
                              ) : (
                                <FiHeart className="icon" />
                              )}
                            </button>

                            <div className="product-content">
                              <div className="image-container">
                                {product.image_url ? (
                                  <img src={product.image_url} alt="" />
                                ) : (
                                  <MdOutlineHideImage className="no-image-icon" />
                                )}
                              </div>
                              <ProductNameWithHint name={product.name} />
                            </div>

                            <div className="quantity-controls-wrapper">
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
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              ) : (
                <p className="no-results">Ничего не найдено</p>
              )}
            </div>
          </div>
        ) : viewFavorites ? (
          <div className="swipe-container" >
            <div className="favorites-view">
              {favorites.length > 0 ? (
                favorites.map((productId) => {
                  const product = products.find((p) => p.id === productId);
                  if (!product) {
                    console.warn(`Товар с идентификатором ${productId} не найден.`);
                    return null;
                  }

                  const quantity = getQuantity(product.id);

                  return (
                    <div className="product-card" key={productId}>
                      <button
                        className="favorite-button"
                        onClick={() => removeFromFavorites(productId)}
                      >
                        <FaHeart className="icon active" />
                      </button>
                      <div className="image-container">
                        {product.image_url ? (
                          <img src={product.image_url} alt="" />
                        ) : (
                          <MdOutlineHideImage className="no-image-icon" />
                        )}
                      </div>
                      <ProductNameWithHint name={product.name} />
                      <div className="quantity-controls-wrapper">
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
                    </div>
                  );
                })
              ) : (
                <p className="cart-empty">Нет избранных товаров</p>
              )}
            </div>
          </div>
        ) : viewNotifications ? (
          <div className="swipe-container" >
            <div className="notifications-view">
              <p style={{ fontSize: "16px", fontWeight: "normal", marginTop: "8px", marginBottom: "16px" }}>
                Для отправки уведомления в Telegram о необходимости обновления списка покупок нажми кнопку ниже
              </p>
              <button className="send-button full-width" onClick={sendUpdateRequest}>
                <RiTelegram2Fill className="telegram-icon" />
                Запросить обновление
              </button>
            </div>
          </div>
        ) : viewCart ? (
          <div className="swipe-container">
            {cart.length === 0 ? (
              <p className="cart-empty">Корзина пуста</p>
            ) : (
              <div className="cart-list">
                {cart.map((item) => (
                  <div className="cart-item" key={item.id}>
                    <div className="cart-item-header">
                      <LuPencil
                        className="edit-icon"
                        onClick={() => handleOpenCommentModal(item.id)}
                      />
                      <ProductNameWithHint
                        name={item.name}
                        commentHint={item.comment?.trim() ? "Есть комментарий" : null}
                        align="left"
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

                <div className="cart-comment-wrapper">
                  <textarea
                    className={`cart-comment-input ${cartComment.length >= 200 ? "input-error" : ""}`}
                    placeholder="Добавьте комментарий к корзине..."
                    value={cartComment}
                    maxLength={200}
                    onChange={(e) => setCartComment(e.target.value)}
                    onBlur={(e) => {
                      setIsCartCommentFocused(false);
                      saveGeneralComment();
                    }}
                    onFocus={() => setIsCartCommentFocused(true)}
                  />
                  <div className={`char-counter ${cartComment.length >= 200 ? "limit-reached" : ""}`}>
                    {cartComment.length}/200
                  </div>
                </div>

                <button className="send-button" onClick={sendToTelegram}>
                  <RiTelegram2Fill className="telegram-icon" />
                  Отправить в Telegram
                </button>
              </div>
            )}
          </div>
        ) : null}
      </main>

      {isAddModalOpen && ( // Модальное окно для добавления товара
        <div
          className="modal-overlay"
          onClick={(e) => {
            if (e.target.classList.contains("modal-overlay")) setIsAddModalOpen(false);
          }}
        >
          <div className="modal-container">
            <h2 className="modal-header">Добавить товар</h2>

            <input
              type="text"
              placeholder="Название товара"
              value={newProductName}
              onChange={(e) => setNewProductName(e.target.value)}
              className={`input-field ${newProductNameError ? 'input-error' : ''}`}
            />
            {newProductNameError && (
              <p className="input-error-text">* обязательное поле</p>
            )}

            {/* Дропдаун выбора категории */}
            <select
              className="input-field"
              value={newProductCategory}
              onChange={(e) => setNewProductCategory(e.target.value)}
            >
              <option value="Без категории">Без категории</option>
              {allCategories.map((cat) =>
                cat !== "Без категории" ? (
                  <option key={cat} value={cat}>{cat}</option>
                ) : null
              )}
            </select>

            <div className="modal-actions">
              <button
                onClick={handleAddProduct}
                className="modal-confirm"
              >
                Добавить
              </button>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="modal-cancel"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}

      {isEditModalOpen && ( // Модальное окно для редактирования товаров
        <div
          className="modal-overlay"
          onClick={() => {
            saveEdit(); // сохраняем, если редактируется
            setIsEditModalOpen(false);
            setSearchTermEdit('');
          }}
        >
          <div
            className="modal-container"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header-with-close">
              <h2 className="modal-header">Редактировать товары</h2>
              <button className="close-button" onClick={() => setIsEditModalOpen(false)}>
                <MdClose className="icon close-icon" />
              </button>
            </div>

            {/* 🔍 Поиск */}
            <div className="search-input-wrapper">
              <FiSearch className="search-icon" />
              <input
                type="text"
                placeholder="Поиск товара"
                value={searchTermEdit}
                onChange={(e) => setSearchTermEdit(e.target.value)}
              />
              {searchTermEdit && (
                <button className="clear-search-button" onClick={() => setSearchTermEdit('')}>
                  <MdClose className="icon" />
                </button>
              )}
            </div>

            {/* 📦 Список товаров */}
            {products.length > 0 ? (
              <div className="cart-list scrollable">
                {products
                  .filter((item) => item.name.toLowerCase().includes(searchTermEdit.toLowerCase()))
                  .map((item) => (
                    <div key={item.id} className="edit-cart-item">
                      {editingId === item.id ? (
                        <input
                          autoFocus
                          value={editedName}
                          onChange={(e) => setEditedName(e.target.value)}
                          onBlur={saveEdit}
                          className="edit-input"
                        />
                      ) : (
                        <>
                          <ProductNameWithHint name={item.name} align="left" />
                          <div className="edit-cart-item-header">
                            <button
                              className="edit-icon-product"
                              onClick={() => startEdit(item.id, item.name)}
                            >
                              <LuPencil />
                            </button>
                            <button
                              className="edit-icon-product"
                              onClick={() => {
                                setProductToDelete(item.id); // Устанавливаем товар для удаления
                                setIsDeleteModalOpen(true); // Открываем модалку
                              }}
                            >
                              <MdOutlineDelete />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
              </div>
            ) : (
              <p className="cart-empty">Список пуст</p>
            )}

            {/* 📤 Кнопка отправки в Telegram */}
            <div className="send-to-telegram-wrapper">
              <button className="send-to-telegram-button full-width" onClick={handleSendAllProductsToTelegram}>
                <RiTelegram2Fill className="icon" />
                Отправить в Telegram
              </button>
            </div>

            {/* ✅ Нотификация */}
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
          </div>
        </div>
      )}

      {isDeleteModalOpen && (  // Модальное окно подтверждения удаления
        <div
          className="modal-overlay"
          onClick={() => setIsDeleteModalOpen(false)}  // Клик по фону — закрыть модалку
        >
          <div
            className="modal"
            onClick={(e) => e.stopPropagation()}  // Клик внутри модалки — не закрывать
          >
            <p>Действие безвозвратно. Удалить товар из базы данных?</p>
            <div className="modal-actions">
              <button
                onClick={() => {
                  handleDeleteProduct(productToDelete);  // Функция удаления товара
                  setIsDeleteModalOpen(false);  // Закрытие модалки
                }}
                className="modal-confirm"
              >
                Удалить
              </button>
              <button
                onClick={() => setIsDeleteModalOpen(false)}  // Закрыть модалку
                className="modal-cancel"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (   // Модальное окно для очистки корзины
        <div
          className="modal-overlay"
          onClick={() => setIsModalOpen(false)} // Клик по фону — закрыть модалку
        >
          <div
            className="modal"
            onClick={(e) => e.stopPropagation()} // Клик внутри модалки — не закрывать
          > 
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

      {isFavoritesModalOpen && (  // Модальное окно для обновления избранного
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
                  setTab("favorites"); // Переключаемся на вкладку "Избранное"
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

      {isExportModalOpen && (  // Модальное окно для экспорта избранного в Telegram
        <div
          className="modal-overlay"
          onClick={(e) => {
            if (e.target.classList.contains("modal-overlay")) {
              handleCloseExportModal();
            }
          }}
        >
          <div className="modal">
            <p>Выгрузить текущие избранные товары в Telegram?</p>
            <div className="modal-actions">
              <button
                className="modal-confirm"
                onClick={() => {
                  sendFavoritesToTelegram();
                  handleCloseExportModal();
                }}
              >
                Выгрузить
              </button>
              <button className="modal-cancel" onClick={handleCloseExportModal}>
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}

      {isCommentModalOpen && ( // Модальное окно для редактирования комментария к товару
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
          onClick={() => setTab("")}
        >
          <FiShoppingBag className="icon" />
          <span className="label">Товары</span>
        </button>
        <button
          className={`nav-item ${viewFavorites ? "active" : ""}`}
          onClick={() => setTab("favorites")}
        >
          <FiHeart className="icon" />
          <span className="label">Избранное</span>
        </button>
        <button
          className={`nav-item ${viewNotifications ? "active" : ""}`}
          onClick={() => setTab("notifications")}
        >
          <FiBell className="icon" />
          <span className="label">Уведомления</span>
        </button>
        <button
          className={`nav-item ${viewCart ? "active" : ""}`}
          onClick={() => setTab("cart")}
        >
          <LuShoppingCart className="icon" />
          <span className="label">Корзина</span>
        </button>
      </nav>
    </div>
  );
};

export default App;