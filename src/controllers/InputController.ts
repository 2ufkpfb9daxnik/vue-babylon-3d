import * as BABYLON from '@babylonjs/core'

export class InputController {
  private scene: BABYLON.Scene
  private inputMap: { [key: string]: boolean }

  constructor(scene: BABYLON.Scene) {
    this.scene = scene
    this.inputMap = {}
    this.setupKeyboardControls()
  }

  private setupKeyboardControls(): void {
    this.scene.onKeyboardObservable.add((kbInfo) => {
      switch (kbInfo.type) {
        case BABYLON.KeyboardEventTypes.KEYDOWN:
          this.inputMap[kbInfo.event.key.toLowerCase()] = true
          break
        case BABYLON.KeyboardEventTypes.KEYUP:
          this.inputMap[kbInfo.event.key.toLowerCase()] = false
          break
      }
    })
  }

  isKeyPressed(key: string): boolean {
    return this.inputMap[key.toLowerCase()] || false
  }

  getInputMap(): { [key: string]: boolean } {
    return this.inputMap
  }

  dispose(): void {
    // キーボードイベントのクリーンアップが必要な場合はここで行う
    this.inputMap = {}
  }
}
