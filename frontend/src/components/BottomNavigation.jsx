import React from 'react';
import { NavLink } from 'react-router-dom';
import { FiShoppingBag, FiHeart, FiBell } from 'react-icons/fi';
import { FaShoppingCart } from 'react-icons/fa';
import './BottomNavigation.css';

const BottomNavigation = () => {
  return (
    <nav className="bottom-nav">
      <NavLink to="/" className="nav-item">
        <FiShoppingBag className="icon" />
        <span className="label">Товары</span>
      </NavLink>
      <NavLink to="/favorites" className="nav-item">
        <FiHeart className="icon" />
        <span className="label">Избранное</span>
      </NavLink>
      <NavLink to="/cart" className="nav-item">
        <FiShoppingCart className="icon" />
        <span className="label">Корзина</span>
      </NavLink>
      <NavLink to="/notifications" className="nav-item">
        <FiBell className="icon" />
        <span className="label">Уведомления</span>
      </NavLink>
    </nav>
  );
};

export default BottomNavigation;
