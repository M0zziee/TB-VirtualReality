import './index.css'
import {CitySimComponent} from './city-sim'
import {BuildingPlacerComponent} from './building-placer'
import {initUI, updateHUD, showResultOverlay} from './ui'

AFRAME.registerComponent('city-sim', CitySimComponent)
AFRAME.registerComponent('building-placer', BuildingPlacerComponent)

AFRAME.registerComponent('city-bootstrap', {
  init() {
    const citySim = this.el.components['city-sim']
    initUI(citySim)
    this.el.sceneEl.addEventListener('game-won', () => showResultOverlay('win'))
    this.el.sceneEl.addEventListener('game-lost', () => showResultOverlay('lose'))
    setInterval(() => updateHUD(citySim.getState()), 500)

    const refresh = () => updateHUD(citySim.getState())
    this.el.sceneEl.addEventListener('building-placed', refresh)
    this.el.sceneEl.addEventListener('building-upgraded', refresh)
    this.el.sceneEl.addEventListener('building-removed', refresh)
  },
})
