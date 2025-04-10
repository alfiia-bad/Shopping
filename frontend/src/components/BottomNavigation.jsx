import React from "react";
import { NavLink } from "react-router-dom";
import { FiShoppingBag, FiHeart, FiBell } from "react-icons/fi";
import { LuShoppingCart } from "react-icons/lu";

const BottomNavigation = ({ currentPage, onPageChange }) => {
  return (
    <div className="bottom-nav">
      <button
        className={`nav-item ${currentPage === "products" ? "active" : ""}`}
        onClick={() => onPageChange("products")}
      >
        <FiShoppingBag className="icon" />
        <span className="label">Товары</span>
      </button>
      <button
        className={`nav-item ${currentPage === "favorites" ? "active" : ""}`}
        onClick={() => onPageChange("favorites")}
      >
        <FiHeart className="icon" />
        <span className="label">Избранное</span>
      </button>
      <button
        className={`nav-item ${currentPage === "cart" ? "active" : ""}`}
        onClick={() => onPageChange("cart")}
      >
        <LuShoppingCart className="icon" />
        <span className="label">Корзина</span>
      </button>
      <button
        className={`nav-item ${currentPage === "notifications" ? "active" : ""}`}
        onClick={() => onPageChange("notifications")}
      >
        <FiBell className="icon" />
        <span className="label">Уведомления</span>
      </button>
    </div>
  );
};

export default BottomNavigation;
