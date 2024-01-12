import React from 'react'
import ReactDOM from 'react-dom/client'
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import "./global.css";
import "primereact/resources/themes/bootstrap4-light-blue/theme.css";
import App from './App.tsx'
import { Signup } from './routes/Signup.tsx'
import { Login } from './routes/Login.tsx'

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />
  },
  {
    path: "/sign-up",
    element: <Signup />
  },
  {
    path: "/log-in",
    element: <Login />
  }
]);

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
)
