import React from 'react'
import './App.css'
import { BrowserRouter, Routes, Route } from "react-router-dom";
import SigninPage from './Pages/SigninPage';


function App() {

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<SigninPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
