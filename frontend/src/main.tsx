import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './i18n'
import './index.css'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import CreatePage from './pages/CreatePage'
import InterviewPage from './pages/InterviewPage'
import ResultsPage from './pages/ResultsPage'
import PricingPage from './pages/PricingPage'
import PaymentSuccessPage from './pages/PaymentSuccessPage'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="create" element={<CreatePage />} />
          <Route path="interview/:id" element={<InterviewPage />} />
          <Route path="results/:id" element={<ResultsPage />} />
          <Route path="pricing" element={<PricingPage />} />
          <Route path="payment/success" element={<PaymentSuccessPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
)
