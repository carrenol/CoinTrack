# MonaBit Crypto Dashboard

Dashboard moderno de criptomonedas con autenticación, favoritos y datos en tiempo real.

## Descripción General

**MonaBit** es un dashboard web para visualizar información del mercado de criptomonedas. Permite a los usuarios autenticarse (Email o Google), ver precios en tiempo real, consultar el top de monedas y gestionar sus criptomonedas favoritas.

---

## Arquitectura del Proyecto

### Tecnologías Utilizadas

- **Frontend**: React + Vite + TypeScript + Tailwind CSS + TanStack Query
- **Backend**: Node.js + Express + TypeScript
- **Base de Datos y Auth**: Supabase (PostgreSQL + Auth)
- **Datos de Criptomonedas**: CoinGecko API

### Diagrama de Arquitectura

```mermaid
flowchart TD
    subgraph Cliente
        Browser["Navegador (React App)"]
    end
    
    subgraph Supabase
        Auth["Auth Service\n(Email + Google)"]
        DB[("PostgreSQL + RLS")]
    end

    subgraph "API Externa"
        CoinGecko["CoinGecko API"]
    end

    Browser <-->|HTTPS| Frontend
    Frontend <-->|API Calls| Backend
    Backend <-->|JWT| Auth
    Backend <-->|Queries| DB
    Backend <-->|Proxy + Caching| CoinGecko