import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

function SafeApp() {
  return (
    <React.StrictMode>
      <App />
    </React.StrictMode>
  )
}

// حماية من crash كامل
const rootElement = document.getElementById('root')

if (rootElement) {
  ReactDOM.createRoot(rootElement).render(<SafeApp />)
} else {
  document.body.innerHTML = `
    <div style="color:white;background:black;padding:20px">
      App failed to mount (root not found)
    </div>
  `
}
