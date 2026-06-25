import { getBuildingType } from './building-types'
import { showBuildingModal } from './ui'

export const BuildingPlacerComponent = {
  init() {
    this.citySim = this.el.components['city-sim']
    this.ground = document.getElementById('ground')
    this.ghost = null
    this.selectedCategory = null
    this.selectedType = null
    this.lastValidPos = null
    this.ghostVisible = false

    this.createGhost()

    this.ground.addEventListener('click', (e) => this.onGroundClick(e))
    this.ground.addEventListener('mousemove', (e) => this.onMove(e))
    this.ground.addEventListener('touchmove', (e) => this.onMove(e))

    this.el.sceneEl.addEventListener('building-selected', (e) => {
      this.selectedCategory = e.detail.category
      this.selectedType = e.detail.typeId
      this.updateGhostShape()
    })

    this.el.sceneEl.addEventListener('click', (e) => {
      if (e.target.classList?.contains('building')) {
        const bid = parseInt(e.target.dataset.buildingId)
        const building = this.citySim.state.buildings.find(b => b.id === bid)
        if (building) showBuildingModal(building)
      }
    })
  },

  createGhost() {
    this.ghost = document.createElement('a-entity')
    this.ghost.setAttribute('visible', 'false')
    this.ghost.setAttribute('geometry', { primitive: 'box', width: 1, height: 1, depth: 1 })
    this.ghost.setAttribute('material', {
      color: '#4CAF50',
      transparent: true,
      opacity: 0.35,
      side: 'double',
    })
    this.el.sceneEl.appendChild(this.ghost)
  },

  gridSnap(pos) {
    return { x: Math.round(pos.x), y: pos.y, z: Math.round(pos.z) }
  },

  isOccupied(pos) {
    return this.citySim.state.buildings.some(
      b => Math.abs(b.position.x - pos.x) < 0.6 && Math.abs(b.position.z - pos.z) < 0.6
    )
  },

  onMove(event) {
    if (!this.selectedType || !this.ghost) return
    const intersection = event.detail?.intersection
    if (!intersection) return

    const snap = this.gridSnap(intersection.point)
    const bt = getBuildingType(this.selectedCategory, this.selectedType)
    if (!bt) return

    const canAfford = this.citySim.canAfford(bt.cost)
    const occupied = this.isOccupied(snap)
    const valid = canAfford && !occupied

    this.ghost.setAttribute('position', snap)
    this.ghost.setAttribute('material', 'color', valid ? '#4CAF50' : '#FF5252')
    this.ghost.setAttribute('visible', 'true')
    this.ghostVisible = true
    this.lastValidPos = valid ? snap : null
  },

  updateGhostShape() {
    if (!this.selectedType) {
      if (this.ghost) this.ghost.setAttribute('visible', 'false')
      return
    }
    const bt = getBuildingType(this.selectedCategory, this.selectedType)
    if (!bt || !this.ghost) return
    this.ghost.setAttribute('geometry', {
      primitive: 'box',
      width: bt.w || 1,
      height: bt.h || 1,
      depth: bt.d || 1,
    })
  },

  onGroundClick(event) {
    const intersection = event.detail?.intersection
    if (!intersection) return

    const pos = this.gridSnap(intersection.point)
    const bt = getBuildingType(this.selectedCategory, this.selectedType)
    if (!bt || !this.citySim.canAfford(bt.cost) || this.isOccupied(pos)) return

    const building = this.citySim.placeBuilding(this.selectedCategory, this.selectedType, pos)
    if (!building) return

    const el = document.createElement('a-entity')
    el.setAttribute('position', pos)
    el.setAttribute('gltf-model', bt.model)
    el.classList.add('building')
    el.dataset.buildingId = building.id
    el.setAttribute('visible', 'false')
    el.setAttribute('scale', '0.001 0.001 0.001')
    this.el.sceneEl.appendChild(el)

    el.addEventListener('model-loaded', () => {
      el.setAttribute('visible', 'true')
      el.setAttribute('animation', {
        property: 'scale',
        to: '1 1 1',
        easing: 'easeOutElastic',
        dur: 600,
      })
    })

    building.entity = el
    this.el.sceneEl.emit('building-placed', { buildingId: building.id })
    if (this.ghost) this.ghost.setAttribute('visible', 'false')
    this.ghostVisible = false
  },
}
