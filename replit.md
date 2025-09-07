# Overview

This is a custom map builder application designed for Shopify integration that allows customers to create black-and-white engraved-style maps. The tool provides a comprehensive customization interface where users can select locations, add text, icons, and compass elements, then configure product settings for different shapes and materials. The application is built as a full-stack TypeScript solution with a React frontend and Express backend, designed to generate high-quality images suitable for laser engraving.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **Styling**: Tailwind CSS with shadcn/ui component library for consistent design
- **State Management**: Custom context-based state management via `use-map-builder` hook
- **Data Fetching**: TanStack Query for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Animation**: Framer Motion for smooth UI transitions

## Backend Architecture
- **Framework**: Express.js with TypeScript
- **Development Setup**: Hot module replacement via Vite middleware in development
- **API Design**: RESTful endpoints for map configuration CRUD operations
- **Storage**: Abstracted storage interface with in-memory implementation (configurable for database)
- **Session Management**: Express sessions with PostgreSQL session store

## Database Layer
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema**: Centralized schema definitions in shared directory
- **Migrations**: Drizzle Kit for database migrations
- **Connection**: Neon Database serverless connection

## Data Models
- **Map Configurations**: Stores location data (lat/lng/zoom), customizations (texts, icons, compass), and product settings
- **Users**: Basic user authentication structure
- **Customizations**: JSON-based storage for flexible text, icon, and compass configurations
- **Product Settings**: Shape, size, material, and aspect ratio specifications

## Project Structure
- **Monorepo Layout**: Shared types and schemas between client and server
- **Client Directory**: React application with component-based architecture
- **Server Directory**: Express API with modular route handlers
- **Shared Directory**: Common TypeScript definitions and database schema

## Key Features
- **Interactive Map Builder**: Multi-panel interface with location, text, icons, style, and preview tabs
- **Real-time Preview**: Live preview panel showing final engraved product appearance
- **Customization Tools**: Text placement with font controls, icon library, compass options
- **Product Configuration**: Multiple shapes (rectangle, circle, stick, twig) and materials
- **Export Capabilities**: High-resolution image generation for laser engraving (300 DPI, black/white)

# External Dependencies

## Database
- **Neon Database**: Serverless PostgreSQL database for production data storage
- **Drizzle ORM**: Type-safe database access layer

## UI Components
- **Radix UI**: Comprehensive headless component library for accessibility
- **Tailwind CSS**: Utility-first CSS framework for styling
- **Lucide React**: Icon library for UI elements

## Development Tools
- **TypeScript**: Type safety across the entire stack
- **Vite**: Fast development server and build tool
- **ESBuild**: Fast JavaScript bundler for production builds

## Mapping Integration
- **Map Service**: Configurable mapping backend (currently using outdated MapBox, open to alternatives)
- **Geocoding**: Location search and coordinate resolution

## Shopify Integration
- **E-commerce Platform**: Seamless integration with Shopify checkout and order system
- **Theme Compatibility**: Works with existing Shopify Impulse theme
- **Order Processing**: Automatic image generation and email delivery upon order completion

## Image Processing
- **File Format**: High-quality JPEG export (8-30MB file size)
- **Resolution**: 300 DPI for professional engraving quality
- **Color Processing**: True black-and-white conversion (no gradients)
- **Naming Convention**: Includes Shopify order numbers for tracking

## Email Services
- **Automated Delivery**: Sends generated images to company email upon order completion
- **File Attachment**: High-resolution JPEG files with order metadata