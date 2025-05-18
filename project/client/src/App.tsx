// client/src/App.tsx
//import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';

// Components
import Header from './components/Header';
import ProductList from './pages/ProductList';
import AttributeList from './pages/AttributeList';
//import NotFound from './pages/NotFound';

function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <ToastContainer position="top-right" />
        <Header />
        <main className="container">
          <Routes>
            <Route path="/" element={<ProductList />} />
            <Route path="/attributes" element={<AttributeList />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;