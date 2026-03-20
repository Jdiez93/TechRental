# 📸 TechRental | Enterprise Equipment Marketplace

[![Vercel Deployment](https://img.shields.io/badge/Vercel-Deployed-success?logo=vercel)](TU_URL_DE_VERCEL_AQUÍ)
[![React](https://img.shields.io/badge/React-18-blue?logo=react)](https://react.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-FullStack-green?logo=supabase)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-UI-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)

> **TechRental** es una plataforma SaaS de alto rendimiento diseñada para la gestión y alquiler de equipamiento técnico profesional (audiovisual, IT y herramientas). No es solo un eCommerce; es una solución integral que resuelve la logística de inventario, validación legal y asistencia inteligente.

---

## 🚀 Características Principales (Core Features)

### 1. Gestión de Disponibilidad en Tiempo Real
A diferencia de un carrito de compras tradicional, TechRental implementa una **lógica de colisión de fechas**. 
- El sistema valida el inventario consultando solapamientos en la base de datos de Supabase.
- El usuario visualiza la disponibilidad mediante un calendario dinámico que bloquea días ya reservados.

### 2. Concierge IA (Asistente Inteligente)
Integración de un **Chatbot avanzado** capaz de entender necesidades de producción.
- Si el usuario solicita un "kit para podcast" o "grabación de boda", el asistente sugiere automáticamente los componentes necesarios (Cámara + Micrófono + Trípode) y permite añadirlos al carrito con un solo clic.

### 3. Flujo Legal con Firma Digital
Para garantizar la profesionalidad del servicio, el proceso de checkout incluye un **módulo de firma biométrica** (Canvas API). 
- El contrato generado se vincula a la reserva y se almacena encriptado, permitiendo al usuario descargar su comprobante firmado desde su dashboard.

### 4. Arquitectura de Roles (RBAC)
- **Dashboard de Cliente:** Visualización de gastos mensuales, historial de alquileres y notificaciones de devolución.
- **Dashboard de Admin:** Métricas de ingresos reales, gestión de stock y monitoreo de actividad global.

---

## 🛠️ Stack Tecnológico

| Capa | Tecnología |
| :--- | :--- |
| **Frontend** | React 18 + Vite + TypeScript |
| **Estilos & UI** | Tailwind CSS + Framer Motion + Shadcn/ui |
| **Backend (BaaS)** | Supabase (PostgreSQL, Auth, Storage) |
| **Estado Global** | TanStack Query (React Query) |
| **Formularios** | React Hook Form + Zod (Validación estricta) |
| **Notificaciones** | Sonner |

---

## 📐 Decisiones de Ingeniería y Clean Code

Como programador web, este proyecto se ha desarrollado bajo los siguientes principios:
- **Modularidad:** Componentes atómicos reutilizables (UI Components de Radix).
- **Type Safety:** Uso riguroso de TypeScript para evitar errores en tiempo de ejecución.
- **Performance:** Optimización de renders mediante el uso estratégico de Hooks y eliminación de dependencias innecesarias de desarrollo.
- **UX Adaptativa:** Splash screens dinámicas, esqueletos de carga (Skeletons) y micro-interacciones para reducir el tiempo de espera percibido.

---

## 🛠️ Instalación y Configuración Local

1. Clona el repositorio:
   ```bash
   git clone [https://github.com/Jdiez93/TechRental.git](https://github.com/Jdiez93/TechRental.git)
