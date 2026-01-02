# Deployment Guide

This project is a monorepo containing both the Frontend (Next.js) and Backend (Laravel). You will deploy them separately by pointing each service to its respective directory.

## 1. Deploying Backend to Railway (Laravel)

1.  **Login to Railway**: Go to [railway.app](https://railway.app/) and login/signup.
2.  **New Project**: Click "New Project" -> "Deploy from GitHub repo".
3.  **Select Repository**: Choose this repository.
4.  **Configure Service**:
    *   Click on the newly created service card.
    *   Go to **Settings** -> **General**.
    *   Scroll down to **Root Directory**.
    *   Enter: `backend`
    *   Railway will likely detect the Nixpacks/PHP configuration automatically.
5.  **Environment Variables**:
    *   Go to the **Variables** tab.
    *   Add your app keys (copy values from your local `backend/.env`):
        *   `APP_KEY`: (Your generated key)
        *   `APP_DEBUG`: `false` (for production)
        *   `APP_URL`: (The domain Railway assigns you, e.g., `https://backend-production.up.railway.app`)
6.  **Database (Optional)**:
    *   If you need a database, right-click the canvas in Railway -> Create -> Database -> MySQL (or PostgreSQL).
    *   Connect it to your backend service variables.
7.  **CORS**:
    *   Once deployed, update your `APP_URL` variable.
    *   **Crucial**: You might need to update `config/cors.php` or `CORS_ALLOWED_ORIGINS` to allow your Vercel frontend domain once you have it.

## 2. Deploying Frontend to Vercel (Next.js)

1.  **Login to Vercel**: Go to [vercel.com](https://vercel.com/) and login.
2.  **Add New Project**: click "Add New..." -> "Project".
3.  **Import Repository**: Select this repository.
4.  **Configure Project**:
    *   **Framework Preset**: Next.js
    *   **Root Directory**: Click "Edit" and select `frontend`.
5.  **Environment Variables**:
    *   Expand "Environment Variables".
    *   Add `NEXT_PUBLIC_API_URL`.
    *   Value: Your Railway Backend URL (e.g., `https://web-production-1234.up.railway.app/api`).
        *   *Note: Ensure you include `/api` if your frontend expects it, or just the base URL depending on your code.*
6.  **Deploy**: Click "Deploy".

## 3. Final Connection

1.  Once Vercel gives you a frontend URL (e.g., `https://beyondchats-assignment.vercel.app`), go back to **Railway**.
2.  Update your Backend's `CORS` settings (if you used a variable like `FRONTEND_URL` or directly in `config/cors.php`) to allow this new Vercel domain.
3.  Redeploy the Backend if necessary.

## Troubleshooting

*   **Railway Build Failed?** Check the "Build Log". If it complains about missing files, ensure `Root Directory` is set to `backend`.
*   **Vercel 404 on API?** Check your Browser Console (F12). If fetch requests are failing, verify `NEXT_PUBLIC_API_URL` is correct and does *not* have a trailing slash if your code adds one manually.
