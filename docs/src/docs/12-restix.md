# Restix - Manual de Desarrollo Paso a Paso

Este manual te permite replicar el proyecto Restix desde cero. Restix es un cliente TUI (Terminal User Interface) para Redis construido con Rust y la librería ratatui.

## Requisitos Previos

- Rust instalado (https://rustup.rs)
- Acceso a una instancia de Redis (local o remota)

---

## Paso 1: Crear el Proyecto

```bash
cargo new restix
cd restix
```

---

## Paso 2: Configurar Cargo.toml

El archivo `Cargo.toml` define las dependencias del proyecto. Reemplaza el contenido completo:

```toml
[package]
name = "restix"
version = "0.1.0"
edition = "2024"

[dependencies]
ratatui = "0.30.0"
redis = "0.25"        
tokio = { version = "1", features = ["full"] } 
crossterm = "0.27"    
serde = { version = "1", features = ["derive"] } 
serde_json = "1"      
anyhow = "1"          
thiserror = "1"       
chrono = "0.4"        
```

**Dependencias explicadas:**
- `ratatui`: Librería para crear interfaces de terminal en Rust
- `redis`: Cliente para conectar a Redis
- `tokio`: Runtime asíncrono para Rust
- `crossterm`: Manejo de terminal cruzado (permite capturar teclas individuales)
- `serde`/`serde_json`: Serialización de datos (para formatear JSON)
- `anyhow`: Manejo de errores simplificado
- `thiserror`: Definición de errores personalizados
- `chrono`: Manejo de fechas y tiempos

---

## Paso 3: Estructura de Archivos

Crea la siguiente estructura de directorios en `src/`:

```
src/
├── main.rs
├── controllers/
│   ├── mod.rs
│   └── keyboard.rs
├── models/
│   ├── mod.rs
│   └── redis_model.rs
├── services/
│   ├── mod.rs
│   └── redis_service.rs
├── utils/
│   ├── mod.rs
│   └── formatting.rs
└── views/
    ├── mod.rs
    ├── layout.rs
    ├── keys_list_view.rs
    ├── key_info_view.rs
    ├── value_view.rs
    └── status_view.rs
```

---

## Paso 4: Módulos del Proyecto

### 4.1 controllers/mod.rs

```rust
pub mod keyboard;
```

**Propósito:** Define el módulo de controladores. Por ahora solo contiene el controlador de teclado.

---

### 4.2 controllers/keyboard.rs

```rust
use crossterm::event::{KeyCode, KeyEvent};

#[derive(Debug, Clone, PartialEq)]
pub enum NavigationAction {
    Quit,
    None,
}

pub struct KeyboardController;

impl KeyboardController {
    pub fn map_key_event(event: KeyEvent) -> NavigationAction {
        match event.code {
            KeyCode::Char('q') => NavigationAction::Quit,
            _ => NavigationAction::None,
        }
    }
}
```

**Propósito:** Maneja los eventos del teclado. Define acciones de navegación:
- `Quit`: Salir de la aplicación (cuando se presiona 'q')
- `None`: Ninguna acción (tecla no reconocida)

 Usa `crossterm::event` para capturar teclas. Crucial: Necesitas habilitar modo raw en main.rs para que esto funcione.

---

### 4.3 models/mod.rs

```rust
pub mod redis_model;
```

**Propósito:** Define el módulo de modelos de datos.

---

### 4.4 models/redis_model.rs

```rust
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RedisData {
    pub keys: Vec<KeyInfo>,
    pub total_memory: u64,
    pub connected: bool,
    pub error: Option<String>,
}

impl Default for RedisData {
    fn default() -> Self {
        Self {
            keys: Vec::new(),
            total_memory: 0,
            connected: false,
            error: None,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct KeyInfo {
    pub name: String,
    pub key_type: String,
    pub ttl: i64,
    pub memory_bytes: u64,
    pub value_preview: String,
}

#[derive(Debug, Clone, PartialEq)]
pub enum TtlStatus {
    NoExpiration,
    Expired,
    Urgent(i64),
    Warning(i64),
    Normal(i64),
}

impl TtlStatus {
    pub fn from_ttl(ttl: i64) -> Self {
        match ttl {
            -1 => TtlStatus::NoExpiration,
            ttl if ttl < 60 => TtlStatus::Urgent(ttl),
            ttl if ttl < 3600 => TtlStatus::Warning(ttl),
            _ => TtlStatus::Normal(ttl),
        }
    }
}
```

**Propósito:** Define las estructuras de datos para representar la información de Redis:

- `RedisData`: Estructura principal que contiene todas las keys, memoria total, estado de conexión y errores
- `KeyInfo`: Información individual de cada key (nombre, tipo, TTL, memoria, vista previa del valor)
- `TtlStatus`: Enum que clasifica el TTL en niveles de urgencia para mostrar visualmente

Usa `serde` para permitir serialización/deserialización (útil si quieres exportar datos a JSON).

---

### 4.5 services/mod.rs

```rust
pub mod redis_service;
```

**Propósito:** Define el módulo de servicios.

---

### 4.6 services/redis_service.rs

```rust
use crate::{
    models::redis_model::{KeyInfo, RedisData},
    utils::formatting::try_format_as_json,
};
use anyhow::{Context, Result};
use redis::{Client, Commands, Connection};

pub struct RedisService {
    client: Client,
    connection: Option<Connection>,
    pub total_memory: u64,
}

impl RedisService {
    pub fn new(url: &str) -> Result<Self> {
        let client = Client::open(url).context("Failed to create Redis client")?;
        Ok(Self {
            client,
            connection: None,
            total_memory: 0,
        })
    }

    pub fn connect(&mut self) -> Result<()> {
        self.connection = Some(
            self.client
                .get_connection()
                .context("Failed to connect to Redis")?,
        );
        Ok(())
    }

    pub fn is_connected(&self) -> bool {
        self.connection.is_some()
    }

    pub fn fetch_keys(&mut self) -> Result<RedisData> {
        let conn = self.connection.as_mut().context("Not connected to Redis")?;

        let keys: Vec<String> = conn.keys("*")?;
        let mut key_infos = Vec::new();
        let mut total_memory = 0u64;

        for key_name in keys.iter().take(1000) {
            let key_type: String = redis::cmd("TYPE").arg(key_name).query(conn)?;

            let ttl: i64 = conn.ttl(key_name)?;

            let memory: u64 = redis::cmd("MEMORY")
                .arg("USAGE")
                .arg(key_name)
                .query(conn)
                .unwrap_or(0);

            let value_preview = match key_type.as_str() {
                "string" => {
                    let val: String = conn.get(key_name).unwrap_or_default();
                    if val.len() > 50 {
                        format!("{}...", &val[..47.min(val.len())])
                    } else {
                        val
                    }
                }
                "list" => {
                    let len: usize = conn.llen(key_name).unwrap_or(0);
                    format!("[{} items]", len)
                }
                "hash" => {
                    let len: usize = conn.hlen(key_name).unwrap_or(0);
                    format!("{{{} fields}}", len)
                }
                "set" => {
                    let len: usize = conn.scard(key_name).unwrap_or(0);
                    format!("[{} items]", len)
                }
                _ => "[binary data]".to_string(),
            };

            total_memory += memory;
            key_infos.push(KeyInfo {
                name: key_name.clone(),
                key_type,
                ttl,
                memory_bytes: memory,
                value_preview,
            });
        }

        self.total_memory = total_memory;

        Ok(RedisData {
            keys: key_infos,
            total_memory,
            connected: true,
            error: None,
        })
    }

    /// Get the full value of a key (not just preview)
    pub fn get_full_value(&mut self, key_name: &str, key_type: &str) -> Result<String> {
        let conn = self.connection.as_mut().context("Not connected to Redis")?;

        let value = match key_type {
            "string" => {
                let val: String = conn.get(key_name).unwrap_or_default();
                if val.is_empty() {
                    "(empty string)".to_string()
                } else {
                    // Try to format as JSON if it looks like JSON
                    try_format_as_json(&val)
                }
            }
            "list" => {
                let items: Vec<String> = conn.lrange(key_name, 0, -1).unwrap_or_default();
                if items.is_empty() {
                    "(empty list)".to_string()
                } else {
                    // Format each item, try to parse as JSON
                    items
                        .iter()
                        .enumerate()
                        .map(|(i, v)| {
                            let formatted = try_format_as_json(v);
                            if formatted.contains('\n') {
                                // If it has newlines after formatting, indent it
                                let indented: Vec<String> = formatted
                                    .lines()
                                    .map(|line| format!("    {}", line))
                                    .collect();
                                format!("[{}]\n{}", i, indented.join("\n"))
                            } else {
                                format!("[{}] {}", i, formatted)
                            }
                        })
                        .collect::<Vec<_>>()
                        .join("\n")
                }
            }
            "hash" => {
                let fields: Vec<(String, String)> = conn.hgetall(key_name).unwrap_or_default();
                if fields.is_empty() {
                    "(empty hash)".to_string()
                } else {
                    fields
                        .iter()
                        .map(|(k, v)| {
                            let formatted = try_format_as_json(v);
                            if formatted.contains('\n') {
                                // If value is JSON/object, pretty print it
                                format!("{}:\n{}", k, formatted)
                            } else {
                                format!("{}: {}", k, formatted)
                            }
                        })
                        .collect::<Vec<_>>()
                        .join("\n")
                }
            }
            "set" => {
                let members: Vec<String> = conn.smembers(key_name).unwrap_or_default();
                if members.is_empty() {
                    "(empty set)".to_string()
                } else {
                    members
                        .iter()
                        .enumerate()
                        .map(|(i, m)| {
                            let formatted = try_format_as_json(m);
                            if formatted.contains('\n') {
                                format!("[{}]\n{}", i, formatted)
                            } else {
                                format!("[{}] {}", i, formatted)
                            }
                        })
                        .collect::<Vec<_>>()
                        .join("\n")
                }
            }
            "zset" => {
                let members: Vec<(String, f64)> =
                    conn.zrange_withscores(key_name, 0, -1).unwrap_or_default();
                if members.is_empty() {
                    "(empty sorted set)".to_string()
                } else {
                    members
                        .iter()
                        .map(|(m, s)| {
                            let formatted = try_format_as_json(m);
                            if formatted.contains('\n') {
                                format!("{} (score: {})\n{}", formatted, s, formatted)
                            } else {
                                format!("{} (score: {})", formatted, s)
                            }
                        })
                        .collect::<Vec<_>>()
                        .join("\n")
                }
            }
            _ => "(unsupported type)".to_string(),
        };

        Ok(value)
    }
}
```

**Propósito:** Servicio para conectar y comunicarse con Redis:

- `RedisService`: Struct principal que maneja la conexión
- `new(url)`: Crea un nuevo cliente Redis desde una URL (ej: "redis://127.0.0.1:6379")
- `connect()`: Establece la conexión física a Redis
- `is_connected()`: Verifica si hay conexión activa
- `fetch_keys()`: Obtiene todas las keys de Redis (máximo 1000). Para cada key obtiene:
  - Tipo (string, list, hash, set, zset)
  - TTL (tiempo de expiración)
  - Memoria usada
  - Vista previa del valor
- `get_full_value()`: Obtiene el valor completo de una key por su nombre y tipo. Soporta todos los tipos de datos de Redis y intenta formatear como JSON cuando es posible.

Usa el comando `redis::cmd()` para ejecutar comandos Redis crudos cuando el cliente no tiene método directo.

---

### 4.7 utils/mod.rs

```rust
pub mod formatting;
```

**Propósito:** Define el módulo de utilidades.

---

### 4.8 utils/formatting.rs

```rust
/// Format JSON with indentation for readability
pub fn format_json(value: &str) -> String {
    // Try to parse as JSON and pretty print
    if let Ok(json) = serde_json::from_str::<serde_json::Value>(value) {
        serde_json::to_string_pretty(&json).unwrap_or_else(|_| value.to_string())
    } else {
        value.to_string()
    }
}

/// Try to format value as JSON if it looks like JSON
pub fn try_format_as_json(value: &str) -> String {
    // Check if it looks like JSON (starts with { or [)
    let trimmed = value.trim();
    if (trimmed.starts_with('{') && trimmed.ends_with('}'))
        || (trimmed.starts_with('[') && trimmed.ends_with(']'))
    {
        format_json(value)
    } else {
        value.to_string()
    }
}

pub fn format_bytes(bytes: u64) -> String {
    const KB: u64 = 1024;
    const MB: u64 = KB * 1024;
    const GB: u64 = MB * 1024;

    if bytes >= GB {
        format!("{:.2} GB", bytes as f64 / GB as f64)
    } else if bytes >= MB {
        format!("{:.2} MB", bytes as f64 / MB as f64)
    } else if bytes >= KB {
        format!("{:.2} KB", bytes as f64 / KB as f64)
    } else {
        format!("{} B", bytes)
    }
}

pub fn format_ttl(ttl: i64) -> String {
    if ttl == -1 {
        "No expiration".to_string()
    } else if ttl < 0 {
        "Expired".to_string()
    } else if ttl < 60 {
        format!("{}s", ttl)
    } else if ttl < 3600 {
        format!("{}m {}s", ttl / 60, ttl % 60)
    } else {
        format!("{}h {}m", ttl / 3600, (ttl % 3600) / 60)
    }
}

pub fn get_type_badge(key_type: &str) -> &'static str {
    match key_type.to_lowercase().as_str() {
        "string" => "S",
        "list" => "L",
        "hash" => "H",
        "set" => "U",
        "zset" => "Z",
        _ => "?",
    }
}
```

**Propósito:** Funciones de utilidad para formatear datos:

- `format_json()`: Convierte JSON minificado a formato legible con indentación
- `try_format_as_json()`: Detecta si un string parece JSON (comienza con `{` o `[`) y lo formatea
- `format_bytes()`: Convierte bytes a formato legible (B, KB, MB, GB)
- `format_ttl()`: Convierte TTL de segundos a formato legible (s, m, h)
- `get_type_badge()`: Retorna una letra representativa del tipo de dato Redis (S=string, L=list, H=hash, U=set, Z=zset)

---

### 4.9 views/mod.rs

```rust
pub mod key_info_view;
pub mod keys_list_view;
pub mod layout;
pub mod status_view;
pub mod value_view;
```

**Propósito:** Define el módulo de vistas. Cada archivo es una vista diferente de la interfaz.

---

### 4.10 views/layout.rs

```rust
use ratatui::layout::{Constraint, Direction, Layout, Rect};

#[derive(Debug)]
pub struct MainLayout {
    pub main_content: Rect,
    pub footer: Rect,
}

impl MainLayout {
    // Crea el layout principal de la app(arriba el contenido y abajo el footer con los comandos)
    pub fn new(area: Rect) -> Self {
        let chunks = Layout::default()
            .direction(Direction::Vertical)
            .constraints([Constraint::Min(0), Constraint::Length(3)])
            .split(area);

        Self {
            main_content: chunks[0],
            footer: chunks[1],
        }
    }

    // Separa el contenido que tendra la app en 2, parte izquierda y derecha(cada parte tendra sus
    // paneles)
    pub fn split_content(&self, area: Rect) -> (Rect, Rect) {
        let chunks = Layout::default()
            .direction(Direction::Horizontal)
            .constraints([Constraint::Percentage(50), Constraint::Percentage(50)])
            .split(area);

        (chunks[0], chunks[1])
    }

    // Reorganiza el contenido, en la parte derecha se divide en 2
    pub fn split_panels(&self, area: Rect) -> (Rect, Rect, Rect) {
        let (content_left, content_right) = self.split_content(area);

        let right_panels = Layout::default()
            .direction(Direction::Vertical)
            .constraints([Constraint::Percentage(25), Constraint::Percentage(75)])
            .split(content_right);

        (content_left, right_panels[0], right_panels[1])
    }
}
```

**Propósito:** Define el layout principal de la aplicación usando ratatui:

- `MainLayout`: Estructura que contiene las áreas (rectángulos) de la interfaz
- `new()`: Crea el layout principal dividiendo la terminal en contenido principal (arriba) y footer (abajo, 3 líneas de alto)
- `split_content()`: Divide el contenido en dos partes iguales (izquierda y derecha, 50% cada una)
- `split_panels()`: Divide el contenido en 3 paneles: uno izquierdo (lista de keys) ydos derechos (info arriba 25%, valor abajo 75%)

Usa `Constraint` de ratatui para definir proporciones. El layout final queda así:

```
┌────────────────┬────────────────┐
│                │   Key Info     │
│  Keys List     │   (25%)       │
│   (50%)        ├────────────────┤
│                │               │
│                │  Value View   │
│                │   (75%)       │
├────────────────┴────────────────┤
│         Status / Footer          │
└───────────────────────────────┘
```

---

### 4.11 views/keys_list_view.rs

```rust
use ratatui::{
    Frame,
    layout::{Constraint, Rect},
    style::{Style, Stylize},
    widgets::{Block, Borders, Cell, Row, Table},
};

use crate::{
    models::redis_model::KeyInfo,
    utils::formatting::{format_bytes, format_ttl, get_type_badge},
};

pub struct KeysListView {
    pub state: ratatui::widgets::ListState,
    pub items: Vec<KeyInfo>,
    pub focused: bool, // true cuando este panel tiene el foco
}

impl KeysListView {
    pub fn new() -> Self {
        Self {
            state: ratatui::widgets::ListState::default(),
            items: Vec::new(),
            focused: false,
        }
    }

    // Activa o desactiva el foco del componente
    pub fn set_focus(&mut self, focused: bool) {
        self.focused = focused
    }

    // Actualizar datos
    pub fn update(&mut self, items: Vec<KeyInfo>) {
        self.items = items;

        if let Some(selected) = self.state.selected() {
            if selected >= self.items.len() {
                self.state.select(Some(self.items.len().saturating_sub(1)));
            }
        }
    }

    pub fn next(&mut self) {
        let i = match self.state.selected() {
            Some(i) => {
                if i >= self.items.len() - 1 {
                    0
                } else {
                    i + 1
                }
            }
            None => 0,
        };
        self.state.select(Some(i));
    }

    pub fn previous(&mut self) {
        let i = match self.state.selected() {
            Some(i) => {
                if i == 0 {
                    self.items.len().saturating_sub(1)
                } else {
                    i - 1
                }
            }
            None => 0,
        };
        self.state.select(Some(i));
    }

    pub fn render(&self, frame: &mut Frame, area: Rect) {
        let rows: Vec<Row> = self
            .items
            .iter()
            .enumerate()
            .map(|(idx, key)| {
                let is_selected = self.state.selected() == Some(idx);

                // Estilo base depende de si está enfocado y seleccionado
                let row_style = if self.focused && is_selected {
                    Style::default()
                        .bg(ratatui::style::Color::Blue)
                        .fg(ratatui::style::Color::White)
                } else if is_selected {
                    Style::default().bg(ratatui::style::Color::DarkGray)
                } else if self.focused {
                    Style::default()
                } else {
                    Style::default().dim()
                };

                Row::new([
                    Cell::from(format!("{}", idx + 1)).style(row_style),
                    Cell::from({
                        let name = &key.name;
                        if name.len() > 30 {
                            format!("{}...", &name[..27.min(name.len())])
                        } else {
                            name.clone()
                        }
                    })
                    .style(row_style),
                    Cell::from(get_type_badge(&key.key_type)).style(row_style),
                    Cell::from(format_ttl(key.ttl)).style(row_style),
                    Cell::from(format_bytes(key.memory_bytes)).style(row_style),
                ])
            })
            .collect();

        let widths = [
            Constraint::Percentage(5),
            Constraint::Percentage(45),
            Constraint::Percentage(10),
            Constraint::Percentage(20),
            Constraint::Percentage(20),
        ];

        // Borde más grueso cuando está enfocado
        let borders = if self.focused {
            Borders::ALL
        } else {
            Borders::ALL
        };

        let title = if self.focused {
            "Redis Keys ◄"
        } else {
            "Redis Keys"
        };

        // Background diferente cuando está enfocado
        let block = if self.focused {
            Block::default()
                .borders(borders)
                .title(title)
                .border_style(Style::default().fg(ratatui::style::Color::Blue))
        } else {
            Block::default()
                .borders(borders)
                .title(title)
                .border_style(Style::default().dim())
        };

        let table = Table::new(rows, widths)
            .block(block)
            .style(if self.focused {
                Style::default()
            } else {
                Style::default().dim()
            });

        frame.render_widget(table, area);
    }
}

impl Default for KeysListView {
    fn default() -> Self {
        Self::new()
    }
}
```

**Propósito:** Vista que muestra la lista de keys de Redis en una tabla:

- `KeysListView`: Componente principal querenderiza la lista
- `state`: Mantiene el estado de selección (ítem seleccionada)
- `items`: Vector de KeyInfo a mostrar
- `focused`: Indica si el panel tiene el foco (para resaltar)
- `set_focus()`: Activa/desactiva el foco visual
- `update()`: Actualiza los datos de la lista
- `next()` / `previous()`: Navegación entre items (con wrapping)
- `render()`: Dibuja la tabla con las columns: #, Nombre, Tipo, TTL, Memoria

La tabla muestra cada key con su número, nombre (truncado a 30 caracteres), tipo (badge), TTL formateado, y memoria. El estilo cambia según si está enfocada y seleccionada:
- Enfocada + seleccionada: fondo azul, texto blanco
- Solo seleccionada: fondo gris oscuro
- Solo enfocada: estilo normal
- Ninguna: estilo tenue (dim)

---

### 4.12 views/key_info_view.rs

```rust
use ratatui::{Frame, layout::Rect, style::Style, widgets::Block};

pub struct KeyInfoView {
    pub state: ratatui::widgets::ListState,
}

impl KeyInfoView {
    pub fn new() -> Self {
        Self {
            state: ratatui::widgets::ListState::default(),
        }
    }

    pub fn render(&self, frame: &mut Frame, area: Rect) {
        let block = Block::default().style(Style::default().bg(ratatui::style::Color::Green));

        frame.render_widget(block, area);
    }
}

impl Default for KeyInfoView {
    fn default() -> Self {
        Self::new()
    }
}
```

**Propósito:** Vista de información de la key seleccionada (panel superior derecho). Por ahora solo muestra un bloque con fondo verde como placeholder. Este panel está diseñado para mostrar metadatos de la key seleccionada.

---

### 4.13 views/value_view.rs

```rust
use ratatui::{Frame, layout::Rect, style::Style, widgets::Block};

pub struct ValueView {
    pub state: ratatui::widgets::ListState,
}

impl ValueView {
    pub fn new() -> Self {
        Self {
            state: ratatui::widgets::ListState::default(),
        }
    }

    pub fn render(&self, frame: &mut Frame, area: Rect) {
        let block = Block::default().style(Style::default().bg(ratatui::style::Color::Magenta));

        frame.render_widget(block, area);
    }
}

impl Default for ValueView {
    fn default() -> Self {
        Self::new()
    }
}
```

**Propósito:** Vista del valor de la key seleccionada (panel inferior derecho). Por ahora solo muestra un bloque con fondo magenta como placeholder. Este panel está diseñado para mostrar el valor completo de la key.

---

### 4.14 views/status_view.rs

```rust
use ratatui::{Frame, layout::Rect, style::Style, widgets::Block};

pub struct StatusView {
    pub state: ratatui::widgets::ListState,
}

impl StatusView {
    pub fn new() -> Self {
        Self {
            state: ratatui::widgets::ListState::default(),
        }
    }

    pub fn render(&self, frame: &mut Frame, area: Rect) {
        let block = Block::default().style(Style::default().bg(ratatui::style::Color::Yellow));

        frame.render_widget(block, area);
    }
}

impl Default for StatusView {
    fn default() -> Self {
        Self::new()
    }
}
```

**Propósito:** Vista de estado/footer de la aplicación. Por ahora solo muestra un bloque con fondo amarillo como placeholder. Este panel está diseñado para mostrar comandos disponibles y estado de conexión.

---

### 4.15 main.rs

```rust
mod controllers;
mod models;
mod services;
mod utils;
mod views;

use std::io::{self, Stdout};

use anyhow::Result;
use crossterm::{
    event::{self, DisableMouseCapture, EnableMouseCapture, Event, KeyEventKind},
    execute,
    terminal::{EnterAlternateScreen, LeaveAlternateScreen, disable_raw_mode, enable_raw_mode},
};
use ratatui::{Terminal, prelude::CrosstermBackend};

use crate::{
    controllers::keyboard::{KeyboardController, NavigationAction},
    views::{
        key_info_view::KeyInfoView, keys_list_view::KeysListView, layout::MainLayout,
        status_view::StatusView, value_view::ValueView,
    },
};

#[derive(Debug, Clone, PartialEq)]
pub enum FocusPanel {
    KeysList,
    Details,
    Value,
}

pub struct App {
    pub terminal: Terminal<CrosstermBackend<Stdout>>,

    // Views
    pub keys_list_view: KeysListView,
    pub key_info_view: KeyInfoView,
    pub value_view: ValueView,
    pub status_view: StatusView,

    pub last_key_name: String,
    pub auto_refresh: bool,
    pub last_refresh_time: std::time::Instant,
}

impl App {
    pub fn new() -> Result<Self> {
        Ok(Self {
            terminal: Terminal::new(CrosstermBackend::new(io::stdout()))?,
            keys_list_view: KeysListView::new(),
            key_info_view: KeyInfoView::new(),
            value_view: ValueView::new(),
            status_view: StatusView::new(),
            last_key_name: String::new(),
            auto_refresh: true,
            last_refresh_time: std::time::Instant::now(),
        })
    }

    pub fn run(&mut self) -> Result<()> {
        // habilitamos modo raw(significa capturar teclas individuales)
        enable_raw_mode()?;

        // crear una pantalla nueva, no modificar la terminal actual
        let mut stdout: Stdout = io::stdout();

        execute!(stdout, EnterAlternateScreen, EnableMouseCapture)?;

        let backend = CrosstermBackend::new(stdout);
        let mut terminal = Terminal::new(backend)?;

        loop {
            terminal.draw(|frame| {
                let area = frame.area();
                let layout = MainLayout::new(area);

                let (keys_list_area, key_info_area, value_area) =
                    layout.split_panels(layout.main_content);
                let status_area = layout.footer;

                self.keys_list_view.render(frame, keys_list_area);
                self.key_info_view.render(frame, key_info_area);
                self.value_view.render(frame, value_area);
                self.status_view.render(frame, status_area);
            });

            if event::poll(std::time::Duration::from_millis(100))? {
                if let Event::Key(key) = event::read()? {
                    if key.kind == KeyEventKind::Press {
                        let action = KeyboardController::map_key_event(key);

                        match action {
                            NavigationAction::Quit => break,
                            _ => {}
                        }
                    }
                }
            }
        }

        disable_raw_mode()?;

        execute!(
            terminal.backend_mut(),
            LeaveAlternateScreen,
            DisableMouseCapture
        )?;
        Ok(())
    }
}

fn main() -> Result<()> {
    let mut app = App::new()?;
    app.run()?;

    Ok(())
}
```

**Propósito:** Punto de entrada principal de la aplicación:

- Define los módulos a usar (`mod controllers`, `mod models`, etc.)
- Enum `FocusPanel`: Define qué panel tiene el foco actualmente (KeysList, Details, Value)
- Struct `App`: Struct principal que contiene todas las vistas y estado de la aplicación
- `App::new()`: Constructor que inicializa la terminal y todas las vistas
- `App::run()`: Loop principal de la aplicación:
  1. Habilita modo raw (captura teclas sin esperar Enter)
  2.Entra en pantalla alterna (pantalla nueva, no modifica la actual)
  3. Loop infinito que:
     - Dibuja todas las vistas en sus áreas correspondientes
     - Espera eventos de teclado (timeout 100ms)
     - Procesa las teclas y ejecuta acciones
  4. Sale del loop al presionar 'q'
  5. Restaura la terminal al estado original

El flujo de renderizado usa `MainLayout` para calcular las áreas:
- keys_list_area: Panel izquierdo (lista de keys)
- key_info_area: Panel derecho superior (info de key)
- value_area: Panel derecho inferior (valor)
- status_area: Footer (barra inferior)

Para salir de la aplicación, el usuario presiona 'q'. La aplicación maneja el evento KeyEventKind::Press para evitar repeticiones.

---

## Paso 5: Compilar y Ejecutar

```bash
cargo build
cargo run
```

Opcionalmente, especifica la variable de entorno para Redis:

```bash
REDIS_URL=redis://tu-servidor:6379 cargo run
```
