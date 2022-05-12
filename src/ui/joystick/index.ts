import * as THREE from 'three'
import Control from '../../control'
import { Mode } from '../../player'
import { htmlToDom } from '../../utils'
import UI from './joystick.html?raw'

enum ActionKey {
  FRONT = 'front',
  LEFT = 'left',
  RIGHT = 'right',
  BACK = 'back',
  MODE = 'mode',
  JUMP = 'jump',
  UP = 'up',
  DOWN = 'down'
}

export default class Joystick {
  constructor(control: Control) {
    this.control = control
    this.euler = new THREE.Euler(0, 0, 0, 'YXZ')
  }

  control: Control
  pageX = 0
  pageY = 0
  clickX = 0
  clickY = 0
  euler: THREE.Euler
  clickTimeStamp = 0

  // emit keyboard event
  private emitKeyboardEvent = (key: string) => {
    return {
      key
    } as KeyboardEvent
  }

  // emit click event
  private emitClickEvent = (button: number) => {
    return {
      button,
      preventDefault: () => {}
    } as MouseEvent
  }

  // init joystick button
  private initButton = ({
    actionKey,
    key
  }: {
    actionKey: ActionKey
    key: string
  }) => {
    const button = document.querySelector(
      `#action-${actionKey}`
    ) as HTMLButtonElement
    button.addEventListener('pointerenter', e => {
      this.control.setMovementHandler(this.emitKeyboardEvent(key))
      e.stopPropagation()
    })
    button.addEventListener('pointerleave', e => {
      this.control.resetMovementHandler(this.emitKeyboardEvent(key))
      e.stopPropagation()
    })
    button.addEventListener('pointermove', e => {
      e.stopPropagation()
    })
    button.addEventListener('pointerup', e => {
      e.stopPropagation()
    })
    // extra config for mode switch button
    if (actionKey === ActionKey.MODE && key === 'q') {
      this.initButton({ actionKey: ActionKey.MODE, key: ' ' })
      button.addEventListener('pointerenter', () => {
        if (this.control.player.mode === Mode.flying) {
          document.querySelector('#action-down')?.classList.remove('hidden')
        } else {
          document.querySelector('#action-down')?.classList.add('hidden')
        }
      })
    }
  }

  init = () => {
    htmlToDom(UI)

    this.initButton({ actionKey: ActionKey.FRONT, key: 'w' })
    this.initButton({ actionKey: ActionKey.LEFT, key: 'a' })
    this.initButton({ actionKey: ActionKey.RIGHT, key: 'd' })
    this.initButton({ actionKey: ActionKey.BACK, key: 's' })
    this.initButton({ actionKey: ActionKey.MODE, key: 'q' })
    this.initButton({ actionKey: ActionKey.UP, key: ' ' })
    this.initButton({ actionKey: ActionKey.DOWN, key: 'Shift' })

    // camera control
    document.addEventListener('pointermove', e => {
      if (this.pageX !== 0 || this.pageY !== 0) {
        this.euler.setFromQuaternion(this.control.camera.quaternion)
        this.euler.y -= 0.01 * (e.pageX - this.pageX)
        this.euler.x -= 0.01 * (e.pageY - this.pageY)
        this.euler.x = Math.max(
          -Math.PI / 2,
          Math.min(Math.PI / 2, this.euler.x)
        )
        this.control.camera.quaternion.setFromEuler(this.euler)
      }
      this.pageX = e.pageX
      this.pageY = e.pageY
    })
    document.addEventListener('pointerout', () => {
      this.pageX = 0
      this.pageY = 0
    })

    document.addEventListener('pointerdown', e => {
      this.clickX = e.pageX
      this.clickY = e.pageY
      this.clickTimeStamp = performance.now()
    })

    // remove block
    document.addEventListener('pointerup', e => {
      if (e.pageX === this.clickX && e.pageY === this.clickY) {
        this.control.clickHandler(this.emitClickEvent(0))
      }
    })
  }
}
