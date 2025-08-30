import { useState, useContext } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
// import './App.css';
import { ApiContext } from '../context/apiContext.jsx'; // import context
import Register from './components/Register.jsx';
import Login from './components/Login.jsx';
import Welcome from './components/Welcome.jsx';


function App() {
   const { api } = useContext(ApiContext);
  return (
   <Routes>
        <Route path={`/`} element={<Welcome/>}></Route>
        <Route path={`/create`} element={<Register/>}></Route>
        <Route path={`/login`} element={<Login/>}></Route>
   </Routes>
  );
}

export default App;
