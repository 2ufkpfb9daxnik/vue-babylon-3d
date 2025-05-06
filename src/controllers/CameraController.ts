import * as BABYLON from '@babylonjs/core'
import { ref } from 'vue'
import type { Ref } from 'vue'

export type CameraMode = 'view' | 'select'

export class CameraController {
  private scene: BABYLON.Scene
  private camera: BABYLON.FreeCamera // ArcRotateCameraからFreeCameraに変更
  private canvas: HTMLCanvasElement
  public mode: Ref<CameraMode>
  private cameraOffset: BABYLON.Vector3
  private initialRotationY: number

  constructor(scene: BABYLON.Scene, canvas: HTMLCanvasElement) {
    this.scene = scene
    this.canvas = canvas
    this.mode = ref<CameraMode>('select')
    this.cameraOffset = new BABYLON.Vector3(0, 8, -15) // 後ろ上から見下ろす
    this.initialRotationY = Math.PI
    this.camera = this.createCamera()
    this.setupModeToggle()
  }

  private createCamera(): BABYLON.FreeCamera {
    const camera = new BABYLON.FreeCamera('camera', this.cameraOffset.clone(), this.scene)

    camera.rotationQuaternion = BABYLON.Quaternion.Identity()
    camera.rotation.y = this.initialRotationY

    camera.minZ = 0.1
    camera.maxZ = 1000

    camera.detachControl()
    return camera
  }

  private setupModeToggle(): void {
    this.scene.onPointerObservable.add((pointerInfo) => {
      if (pointerInfo.event.button === 2) {
        this.toggleMode()
        pointerInfo.event.preventDefault()
      }
    }, BABYLON.PointerEventTypes.POINTERDOWN)

    this.canvas.addEventListener('contextmenu', (e) => {
      e.preventDefault()
    })
  }

  toggleMode(): void {
    this.mode.value = this.mode.value === 'view' ? 'select' : 'view'
    if (this.mode.value === 'view') {
      this.camera.attachControl(this.canvas, true)
    } else {
      this.camera.detachControl()
      // 選択モードに戻るときは初期の向きに戻す
      this.camera.rotation.y = this.initialRotationY
    }
  }

  updateCamera(playerPosition: BABYLON.Vector3): void {
    // プレイヤーの位置にオフセットを加えてカメラを配置
    const targetPosition = playerPosition.add(this.cameraOffset)
    this.camera.position = targetPosition

    // プレイヤーの位置を注視点として設定
    const lookAtPosition = playerPosition.clone()
    lookAtPosition.y += 2 // プレイヤーの少し上を見る
    this.camera.setTarget(lookAtPosition)
  }

  getCamera(): BABYLON.FreeCamera {
    return this.camera
  }

  getDirection(): BABYLON.Vector3 {
    return this.camera.getDirection(BABYLON.Vector3.Forward())
  }

  getRightDirection(): BABYLON.Vector3 {
    return this.camera.getDirection(BABYLON.Vector3.Right())
  }

  dispose(): void {
    this.camera.dispose()
  }
}
