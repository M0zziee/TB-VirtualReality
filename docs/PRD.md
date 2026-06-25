# Product Requirements Document — A-Frame City Building Simulator

## 1. Overview

### 1.1 Product Name
**AFrame City Builder** (working title)

### 1.2 Description
An interactive augmented-reality / desktop city building simulator built on top of the 8th Wall A-Frame "World Effects" codebase. Users place buildings, manage resources, and grow a population in real-time on a 3D ground plane across mobile AR, desktop 3D, and VR headsets.

### 1.3 Goals
- Transform the existing cactus-tap demo into a full city-building game with economic simulation
- Reuse existing low-poly GLB models (Quaternius assets) for buildings and props
- Support Desktop + Mobile AR + VR with responsive UI
- Demonstrate A-Frame capabilities: raycasting, spawning, upgrading, game state

---

## 2. Target Audience

| Persona | Device | Use Case |
|---------|--------|----------|
| Casual gamer | Mobile AR browser | Tap to place buildings, grow city in real-world space |
| Hobbyist / Developer | Desktop browser | Test city mechanics, modify building stats |
| VR enthusiast | VR headset | Immersive city walkthrough |

---

## 3. Features & Requirements

### 3.1 Building System

#### 3.1.1 Categories

| Category | Color | Icon | Purpose |
|----------|-------|------|---------|
| Residential | `#4CAF50` (Green) | 🏠 | Provides population capacity |
| Commercial | `#2196F3` (Blue) | 🏪 | Generates income per second |
| Industrial | `#FF9800` (Orange) | 🏭 | Generates income but adds pollution |
| Parks & Decor | `#8BC34A` (Light Green) | 🌳 | Boosts happiness |

#### 3.1.2 Building Definitions

All buildings are backed by existing GLB models in `src/assets/`.

**Residential:**
| Name | Model | Cost | Pop Capacity | Income/s | Tier |
|------|-------|------|-------------|----------|------|
| House | `quaternius_house.glb` | $100 | 4 | $1 | 1 |
| Small Apartments | `quaternius_small-building1.glb` | $300 | 10 | $2 | 1 |
| Medium Apartments | `quaternius_small-building2.glb` | $500 | 16 | $3 | 2 |
| Apartment Block | `quaternius_building.glb` | $1,000 | 30 | $5 | 2 |
| Mansion | `quaternius_large-building.glb` | $3,000 | 80 | $12 | 3 |

**Commercial:**
| Name | Model | Cost | Income/s | Tier |
|------|-------|------|----------|------|
| Market Stall | `low_poly_market_stall_1.glb` | $150 | $5 | 1 |
| Post Office | `post_office_building.glb` | $1,000 | $35 | 2 |
| Village Hall | `village_hall.glb` | $3,500 | $100 | 3 |

**Industrial:**
| Name | Model | Cost | Income/s | Pollution | Tier |
|------|-------|------|----------|-----------|------|
| Workshop | `quaternius_small-barn.glb` | $250 | $10 | -2 | 1 |
| Factory | `quaternius_big-barn.glb` | $900 | $30 | -5 | 2 |
| Windmill | `quaternius_windmill.glb` | $1,200 | $20 | 0 | 2 |
| Power Plant | `quaternius_tower-windmill.glb` | $3,000 | $75 | -15 | 3 |

**Parks & Decor:**
| Name | Model | Cost | Happiness | Tier |
|------|-------|------|-----------|------|
| Dumpster | `low_poly_-_dumpster.glb` | $20 | -1 | 1 |
| Rock Garden | `basic_rock_low_poly.glb` | $50 | +3 | 1 |

#### 3.1.3 Placement Rules
- Buildings snap to a **1m × 1m grid**
- Cannot overlap existing buildings
- Must be placed on the ground plane within the scene
- Minimum distance from camera spawn: 1m

---

### 3.2 Simulation Engine

#### 3.2.1 Game Loop
Runs on a **1-second tick** using `setInterval`/AFRAME scene tick.

#### 3.2.2 State Variables

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `money` | number | 1000 | Current balance |
| `population` | number | 0 | Current citizens |
| `maxPopulation` | number | 0 | Total housing capacity |
| `happiness` | number | 50 | 0–100% citizen satisfaction |
| `incomeRate` | number | 0 | $/s earned this tick |
| `expenseRate` | number | 0 | $/s spent this tick |
| `totalBuildings` | number | 0 | Count of placed buildings |
| `tickCount` | number | 0 | Elapsed seconds since start |

#### 3.2.3 Tick Logic

```
incomeRate   = sum(commercial.revenue) + (population * 0.05)
expenseRate  = sum(industrial.pollution_effect) + (totalBuildings * 0.5)
money       += max(0, incomeRate - abs(expenseRate))

happiness    = clamp(50 + totalParkHappiness + totalIndustrialPollution, 0, 100)

growthRate   = 0.02 + (happiness / 100) * 0.08   // 2–10% growth per tick
population   = min(maxPopulation, population + ceil(maxPopulation * growthRate))
```

#### 3.2.4 Upgrades
- Tap an existing building you own → upgrade modal appears
- Upgrade cost: **60% of original building cost**
- Effect: doubles the building's stats (pop capacity, revenue, happiness)
- Visual: building scale increases by 1.2×
- Max upgrades per building: **3 levels**

#### 3.2.5 Removal
- Right-click (desktop) or long-press (mobile) a building
- Refund: **50% of total invested cost** (original + upgrades)
- Building is removed from scene and state

#### 3.2.6 Win / Lose Conditions
| Condition | Trigger | Effect |
|-----------|---------|--------|
| Win | Population ≥ 2000 and money ≥ $10,000 | Victory screen with stats |
| Lose | Money drops below $0 and no buildings | Game over prompt, option to restart |

---

### 3.3 UI / UX

#### 3.3.1 HUD (Top Bar)

```
┌──────────────────────────────────────────────┐
│ MONEY          POP       HAPPY       RATE    │
│ $1,250      45/200      78%       +$12/s    │
└──────────────────────────────────────────────┘
```

- Full-width top bar, dark solid background (`#151515`) dengan border bawah (`#333`)
- 4 stat panel (MONEY, POP, HAPPY, RATE) dengan warna masing-masing (green, blue, amber, green)
- Setiap panel memiliki label (uppercase, 8px) dan value (15px bold) dengan icon SVG putih
- Updates every tick (1s)
- Font: `Courier New` monospace

#### 3.3.2 Category Tabs (Bottom Bar)

```
┌──────────┬──────────┬──────────┬──────────┐
│  🏠 Res  │  🏪 Com  │  🏭 Ind  │  🌳 Park │
└──────────┴──────────┴──────────┴──────────┘
```

- Fixed to bottom of screen, dark solid background (`#151515`)
- Border top 2px, antar tab dipisah border tipis
- Active tab memiliki **color bar 2px di atas** sesuai kategori (green/blue/orange/light-green)
- Icon SVG putih, di-inactive dim `brightness(0.6)`, active `brightness(1)`
- Background active tab: `#222`
- Tap to switch

#### 3.3.3 Building Options (Scrollable Row)

```
┌──────────────────────────────────────────────────────────────┐
│ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐               │
│ │House │ │S.Apt │ │Block │ │Mans. │ │M.Apt │  →             │
│ │$100  │ │$300  │ │$1000 │ │$3000 │ │$500  │               │
│ │★     │ │★     │ │★★    │ │★★★   │ │★★    │               │
│ └──────┘ └──────┘ └──────┘ └──────┘ └──────┘               │
└──────────────────────────────────────────────────────────────┘
```

- Horizontal scrollable list above the category tabs
- Background: gradient transparan ke hitam
- Setiap kartu: **border 2px solid**, nama uppercase, cost hijau, **tier badge (★)** emas
- Selected: border putih, background lebih terang
- Disabled: opacity 0.3, cursor not-allowed

#### 3.3.4 Building Selection Preview
- When a building is selected from the toolbar, a ghost/semi-transparent model follows the cursor/touch point on the ground
- Shows valid (green) / invalid (red) placement
- On tap/click: place building at ghost location

#### 3.3.5 Upgrade / Remove Overlay
- Tap existing building → modal overlay muncul:
  - **Title:** Nama building uppercase dengan border bawah
  - **Level:** ★★☆ star rating (warna emas)
  - **Stats panel:** Dark solid (`#0f0f0f`) dengan border, label-value tiap baris (Cost, Population, Income, Refund)
  - **Tombol:** "UPGRADE $" (green) atau "REMOVE" (red) — uppercase, border 2px solid
  - Close (✕) button pojok kanan atas
- Animasi: `scaleIn` (0.85 → 1) 0.2s

#### 3.3.6 Win / Lose Screens
- Centered overlay dengan backdrop gelap
- Panel dengan **border 3px double**
- Icon animasi **pulse** 1.5s (scale 1 → 1.08)
- Win: "CITY THRIVING!" — party-popper icon
- Lose: "CITY ABANDONED!" — skull icon
- "PLAY AGAIN" button

#### 3.3.7 Global UI Style
- **Font:** `Courier New, Courier, monospace` — classic game terminal vibe
- **Warna:** Dark solid (`#0a0a0a` bg, `#151515` panel, `#333` border, `#ccc` text)
- **Ikon SVG:** Semua menggunakan `stroke="#fff"` agar putih cerah (bukan `currentColor`)
- **Animasi:** `fadeIn` (0.2s), `modalIn` (scale 0.85→1, 0.2s), `resultPulse` (1.5s infinite)

---

### 3.4 Platform Support

| Platform | Input | Notes |
|----------|-------|-------|
| Desktop Chrome/Firefox | Mouse click + right-click | Full UI visible |
| Mobile AR (8th Wall) | Touch tap + long-press | Smaller toolbar, swipe to scroll |
| VR Headsets | Gaze + controller | Simplified UI, larger hit targets |

---

## 4. Technical Architecture

### 4.1 File Structure

```
src/
├── app.js                    Entry point — register all components
├── index.html                Scene markup + UI overlay + asset preloading
├── index.css                 All styles (toolbar, HUD, overlays)
├── building-types.js         Building definitions array (name, model, cost, stats)
├── city-sim.js               A-Frame component: game tick, economy, state
├── building-placer.js        A-Frame component: grid-snapped placement + upgrade
└── ui.js                     DOM updates: render toolbar, HUD, overlays
```

### 4.2 Components

| Component | Attribute | Purpose |
|-----------|-----------|---------|
| `city-sim` | (on `<a-scene>`) | Runs simulation tick, manages global game state |
| `building-placer` | (on `<a-scene>`) | Handles ground clicks, grid snap, spawn, upgrade, remove |

### 4.3 Data Flow

```
User taps ground
  → building-placer reads selectedBuildingType from ui.js state
  → checks affordability via city-sim.getState()
  → deducts cost
  → spawns entity with GLB model at snapped grid position
  → adds entity to city-sim building registry
  → ui.js re-renders HUD

Simulation tick (1s)
  → city-sim iterates building registry
  → calculates income, expenses, happiness, population
  → updates state
  → ui.js reads state and updates HUD display
```

### 4.4 State Management

- Global state object held in `city-sim` component
- Exposed via `AFRAME.scenes[0].components['city-sim'].state`
- `ui.js` reads from this state on each tick to update DOM
- `building-placer` writes to this state on place/upgrade/remove

---

## 5. Non-Functional Requirements

| Requirement | Target |
|-------------|--------|
| Performance | Maintain 30+ FPS on mobile AR with up to 100 buildings |
| Load time | Initial scene load < 5s on 4G |
| Accessibility | Minimum tap target size 44×44px on mobile |
| Code quality | No console errors, clean separation of concerns |

---

## 6. Out of Scope (v1)

- Roads / path network with pathfinding
- Multiplayer / shared city state
- Save/load city persistence (localStorage — possible v1.1)
- Sound effects / background music
- Weather or day/night cycle
- Terrain editing (hills, water)

---

## 7. Glossary

| Term | Definition |
|------|------------|
| Tick | One iteration of the simulation loop (1 second) |
| GLB | Graphics Library Transmission Format (binary 3D model format) |
| HUD | Heads-Up Display — top-bar stats overlay |
| Grid snap | Alignment of placed objects to a fixed-size grid |
| Pollution | Negative happiness modifier from industrial buildings |
