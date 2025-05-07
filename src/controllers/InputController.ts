import * as BABYLON from '@babylonjs/core'

export class InputController {
  private scene: BABYLON.Scene
  private inputMap: { [key: string]: boolean }
  private onCKeyPress?: () => void

  constructor(scene: BABYLON.Scene) {
    this.scene = scene
    this.inputMap = {}
    this.setupKeyboardControls()
  }

  private setupKeyboardControls(): void {
    // シーンにActionManagerを設定
    if (!this.scene.actionManager) {
      this.scene.actionManager = new BABYLON.ActionManager(this.scene);
    }

    // キーボードイベントの監視を追加
    this.scene.onKeyboardObservable.add((kbInfo) => {
      const key = kbInfo.event.key.toLowerCase();
      console.log('Key event:', key, kbInfo.type);

      if (kbInfo.type === BABYLON.KeyboardEventTypes.KEYDOWN) {
        this.inputMap[key] = true;
        if (key === 'c' && this.onCKeyPress) {
          this.onCKeyPress();
        }
      } else if (kbInfo.type === BABYLON.KeyboardEventTypes.KEYUP) {
        this.inputMap[key] = false;
      }

      console.log('Current input map:', this.inputMap);
    });

    // フォーカスの設定
    const canvas = this.scene.getEngine().getRenderingCanvas();
    if (canvas) {
      canvas.tabIndex = 1;
      canvas.focus();
    }
  }

  setOnCKeyPress(callback: () => void): void {
    this.onCKeyPress = callback
  }

  isKeyPressed(key: string): boolean {
    return this.inputMap[key.toLowerCase()] || false
  }

  getInputMap(): { [key: string]: boolean } {
    return this.inputMap
  }

  // キー入力のシミュレート
  simulateKeyPress(key: string): void {
    this.inputMap[key.toLowerCase()] = true
  }

  simulateKeyRelease(key: string): void {
    this.inputMap[key.toLowerCase()] = false
  }

  dispose(): void {
    // キーボードイベントのクリーンアップが必要な場合はここで行う
    this.inputMap = {}
  }
}
