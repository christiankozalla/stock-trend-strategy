import React from 'react'
import ReactDOM from 'react-dom/client'
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import App from './App.tsx'
import { Signup } from './routes/Signup.tsx'
import { Login } from './routes/Login.tsx'

import '@fontsource/inter';

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
