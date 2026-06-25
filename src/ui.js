import { CATEGORIES, BUILDING_TYPES, getBuildingType } from './building-types'

let selectedCategory = 'residential'
let selectedType = null
let citySimRef = null
let sceneEl = null

export function initUI(citySim) {
  citySimRef = citySim
  sceneEl = citySim.el.sceneEl
  renderHUD()
  renderCategories()
  renderBuildings()
  selectCategory('residential')
}

export function selectCategory(categoryId) {
  selectedCategory = categoryId
  selectedType = BUILDING_TYPES[categoryId]?.[0]?.id || null
  renderCategories()
  renderBuildings()
  emitSelection()
}

export function selectType(typeId) {
  selectedType = typeId
  renderBuildings()
  emitSelection()
}

export function getSelectedBuilding() {
  if (!selectedCategory || !selectedType) return null
  return BUILDING_TYPES[selectedCategory]?.find(t => t.id === selectedType)
}

function emitSelection() {
  sceneEl?.emit('building-selected', { category: selectedCategory, typeId: selectedType })
}

export function updateHUD(state) {
  const hud = document.getElementById('hud')
  if (!hud) return
  const popStr = `${state.population}/${state.maxPopulation}`
  hud.innerHTML = `
    <div class="hud-stat">
      <span class="hud-label">MONEY</span>
      <span class="hud-value hud-money"><img class="hud-icon" src="assets/icons/dollar-sign.svg">${fmt(state.money)}</span>
    </div>
    <div class="hud-stat">
      <span class="hud-label">POP</span>
      <span class="hud-value hud-pop"><img class="hud-icon" src="assets/icons/users.svg">${popStr}</span>
    </div>
    <div class="hud-stat">
      <span class="hud-label">HAPPY</span>
      <span class="hud-value hud-happy"><img class="hud-icon" src="assets/icons/smile.svg">${state.happiness}%</span>
    </div>
    <div class="hud-stat">
      <span class="hud-label">RATE</span>
      <span class="hud-value hud-income">+${fmt(state.incomeRate)}/s</span>
    </div>
  `
  renderBuildings()
}

export function showBuildingModal(building) {
  hideModal()
  const bt = getBuildingType(building.category, building.typeId)
  if (!bt) return
  const upgradeCost = citySimRef?.getUpgradeCost(building.id)
  const refundValue = citySimRef?.getRefundValue(building.id)
  const canUpgrade = upgradeCost > 0 && upgradeCost < Infinity && citySimRef?.canAfford(upgradeCost)

  const overlay = document.createElement('div')
  overlay.className = 'modal-overlay'
  overlay.id = 'building-modal'

  const levelStars = '★'.repeat(building.level) + '☆'.repeat(3 - building.level)

  overlay.innerHTML = `
    <div class="modal-box">
      <button class="modal-close">✕</button>
      <div class="modal-title">${bt.name}</div>
      <div class="modal-level">${levelStars}</div>
      <div class="modal-stats">
        <span><span class="stat-label">Cost</span><span class="stat-value">$${bt.cost}</span></span>
        ${building.category === 'residential' ? `<span><span class="stat-label">Population</span><span class="stat-value">+${bt.pop * building.level}</span></span>` : ''}
        ${bt.income ? `<span><span class="stat-label">Income</span><span class="stat-value">+${fmt(bt.income * building.level)}/s</span></span>` : ''}
        <span><span class="stat-label">Refund</span><span class="stat-value">+$${fmt(refundValue)}</span></span>
      </div>
      <div class="modal-actions">
        ${upgradeCost < Infinity ? `<button class="modal-btn upgrade-btn" ${canUpgrade ? '' : 'disabled'}>
          UPGRADE $${fmt(upgradeCost)}
        </button>` : ''}
        <button class="modal-btn remove-btn">
          REMOVE
        </button>
      </div>
    </div>
  `

  document.body.appendChild(overlay)

  overlay.querySelector('.modal-close').addEventListener('click', hideModal)
  overlay.querySelector('.upgrade-btn')?.addEventListener('click', () => {
    if (citySimRef?.upgradeBuilding(building.id)) {
      hideModal()
      sceneEl?.emit('building-upgraded', { buildingId: building.id })
    }
  })
  overlay.querySelector('.remove-btn')?.addEventListener('click', () => {
    citySimRef?.removeBuilding(building.id)
    hideModal()
    sceneEl?.emit('building-removed', { buildingId: building.id })
  })
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) hideModal()
  })
}

function hideModal() {
  const existing = document.getElementById('building-modal')
  existing?.parentNode?.removeChild(existing)
}

export function showResultOverlay(type) {
  const overlay = document.createElement('div')
  overlay.className = 'modal-overlay'
  overlay.id = 'result-overlay'
  const isWin = type === 'win'
  overlay.innerHTML = `
    <div class="modal-box result-box">
      <img class="result-icon" src="assets/icons/${isWin ? 'party-popper' : 'skull'}.svg">
      <div class="result-title">${isWin ? 'City Thriving!' : 'City Abandoned!'}</div>
      <div class="result-sub">${isWin ? 'You built a thriving metropolis!' : 'Your city ran out of funds.'}</div>
      <button class="modal-btn result-btn">Play Again</button>
    </div>
  `
  document.body.appendChild(overlay)
  overlay.querySelector('.result-btn').addEventListener('click', () => {
    location.reload()
  })
}

function renderHUD() {
  if (!document.getElementById('hud')) {
    const el = document.createElement('div')
    el.id = 'hud'
    document.body.appendChild(el)
  }
}

function renderCategories() {
  let container = document.getElementById('categories')
  if (!container) {
    container = document.createElement('div')
    container.id = 'categories'
    document.body.appendChild(container)
  }
  container.innerHTML = CATEGORIES.map(c => `
    <button class="cat-btn ${selectedCategory === c.id ? 'active' : ''}"
            data-cat="${c.id}" style="--cat:${c.color}">
      <img class="cat-icon" src="${c.icon}">
      <span class="cat-label">${c.label}</span>
    </button>
  `).join('')
  container.querySelectorAll('.cat-btn').forEach(btn => {
    btn.addEventListener('click', () => selectCategory(btn.dataset.cat))
  })
}

function renderBuildings() {
  let container = document.getElementById('buildings')
  if (!container) {
    container = document.createElement('div')
    container.id = 'buildings'
    document.body.appendChild(container)
  }
  const types = BUILDING_TYPES[selectedCategory] || []
  const state = citySimRef?.getState()
  container.innerHTML = types.map(t => {
    const affordable = state ? state.money >= t.cost : false
    const active = selectedType === t.id
    const stars = '★'.repeat(t.tier || 1)
    return `<button class="bld-btn ${active ? 'active' : ''} ${affordable ? '' : 'locked'}"
            data-type="${t.id}" ${affordable ? '' : 'disabled'}>
      <span class="bld-name">${t.name}</span>
      <span class="bld-cost">$${t.cost}</span>
      <span class="bld-tier">${stars}</span>
    </button>`
  }).join('')
  container.querySelectorAll('.bld-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (!btn.disabled) selectType(btn.dataset.type)
    })
  })
}

function fmt(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M'
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K'
  return Math.floor(n).toString()
}
