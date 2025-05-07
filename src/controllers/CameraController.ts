import * as BABYLON from '@babylonjs/core'
import { ref } from 'vue'
import type { Ref } from 'vue'

export type CameraMode = 'view' | 'select'

export class CameraController {
  private scene: BABYLON.Scene
  private camera: BABYLON.FreeCamera
  private canvas: HTMLCanvasElement
  public mode: Ref<CameraMode>
  private cameraOffset: BABYLON.Vector3
  private initialRotationY: number
  private onModeChange: (mode: CameraMode) => void
  private isDragging: boolean = false
  private lastPointerX: number = 0
  private lastPointerY: number = 0

  constructor(
    scene: BABYLON.Scene,
    canvas: HTMLCanvasElement,
    onModeChange: (mode: CameraMode) => void
  ) {
    this.scene = scene
    this.canvas = canvas
    this.mode = ref<CameraMode>('select')
    this.onModeChange = onModeChange
    this.cameraOffset = new BABYLON.Vector3(0, 8, -15) // 後ろ上から見下ろす
    this.initialRotationY = Math.PI
    this.camera = this.createCamera()
    this.setupModeToggle()
  }

  private createCamera(): BABYLON.FreeCamera {
    const camera = new BABYLON.FreeCamera('camera', this.cameraOffset.clone(), this.scene)

    camera.rotationQuaternion = BABYLON.Quaternion.Identity()
    camera.rotation.y = this.initialRotationY

    // カメラの基本設定
    camera.minZ = 0.1
    camera.maxZ = 1000
    camera.angularSensibility = 1000 // マウス感度（値が大きいほど遅い）
    camera.inertia = 0.5 // カメラの慣性
    camera.detachControl()
    return camera
  }

  private setupModeToggle(): void {
    // マウス操作の設定
    this.scene.onPointerObservable.add((pointerInfo) => {
      if (this.mode.value === 'view') {
        switch (pointerInfo.type) {
          case BABYLON.PointerEventTypes.POINTERDOWN:
            if (pointerInfo.event.button === 0) { // 左クリック
              this.isDragging = true
              this.lastPointerX = pointerInfo.event.clientX
              this.lastPointerY = pointerInfo.event.clientY
            }
            break
          case BABYLON.PointerEventTypes.POINTERMOVE:
            if (this.isDragging) {
              const dx = pointerInfo.event.clientX - this.lastPointerX
              const dy = pointerInfo.event.clientY - this.lastPointerY
              
              this.camera.rotation.y += dx * 0.002
              this.camera.rotation.x += dy * 0.002
              
              this.lastPointerX = pointerInfo.event.clientX
              this.lastPointerY = pointerInfo.event.clientY
            }
            break
          case BABYLON.PointerEventTypes.POINTERUP:
            this.isDragging = false
            break
        }
      }
    })

    // コンテキストメニューは念のため無効化しておく
    this.canvas.addEventListener('contextmenu', (e) => {
      e.preventDefault()
    })
  }

  toggleMode(): void {
    // モードを切り替え
    this.mode.value = this.mode.value === 'view' ? 'select' : 'view'
    console.log('Camera mode changed to:', this.mode.value); // デバッグログ

    if (this.mode.value === 'view') {
      // ビューモードの設定
      this.camera.attachControl(this.canvas, true)
      this.camera.inputs.addMouseWheel()
      this.camera.keysUp = [] // WASDキーの無効化
      this.camera.keysDown = []
      this.camera.keysLeft = []
      this.camera.keysRight = []
    } else {
      // 選択モードの設定
      this.camera.detachControl()
      this.isDragging = false
      // カメラ位置と向きをリセット
      this.camera.rotation.y = this.initialRotationY
      this.camera.rotation.x = 0
    }

    // モード変更コールバックを呼び出し
    this.onModeChange(this.mode.value)
  }

  updateCamera(playerPosition: BABYLON.Vector3): void {
    // 選択モードの時のみカメラを自動更新
    if (this.mode.value === 'select') {
      // プレイヤーの位置にオフセットを加えてカメラを配置
      const targetPosition = playerPosition.add(this.cameraOffset)
      this.camera.position = targetPosition

      // プレイヤーの位置を注視点として設定
      const lookAtPosition = playerPosition.clone()
      lookAtPosition.y += 2 // プレイヤーの少し上を見る
      this.camera.setTarget(lookAtPosition)
    }
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
