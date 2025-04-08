import React from "react";
import ReactDOM from "react-dom/client";  // Для React 18+ используется ReactDOM.createRoot
import App from "./App";  // Импорт вашего основного компонента App.js
import "./index.css";  // Если у вас есть стили для всего приложения (по желанию)

const root = ReactDOM.createRoot(document.getElementById("root"));  // Находим элемент с id "root" в HTML
root.render(
  <React.StrictMode>
    <App />  {/* Рендерим компонент App, который является главным */}
  </React.StrictMode>
);
