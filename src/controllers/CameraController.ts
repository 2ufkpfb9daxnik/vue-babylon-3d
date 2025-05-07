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
  private orbitAngleX: number = 0
  private orbitAngleY: number = Math.PI
  private orbitRadius: number = 15
  private currentTargetPosition: BABYLON.Vector3
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
    this.currentTargetPosition = BABYLON.Vector3.Zero()
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

              // 水平回転（Y軸）
              this.orbitAngleY += dx * 0.002
              // 垂直回転（X軸）- 上下の回転を制限
              this.orbitAngleX = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, this.orbitAngleX + dy * 0.002))

              // カメラ位置の更新
              this.updateOrbitCamera()
              
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
    this.currentTargetPosition = playerPosition.clone()
    this.currentTargetPosition.y += 2 // プレイヤーの少し上を見る

    if (this.mode.value === 'select') {
      // プレイヤーの位置にオフセットを加えてカメラを配置
      const targetPosition = playerPosition.add(this.cameraOffset)
      this.camera.position = targetPosition
      this.camera.setTarget(this.currentTargetPosition)
    } else {
      // 軌道カメラの更新
      this.updateOrbitCamera()
    }
  }

  private updateOrbitCamera(): void {
    // 球面座標から直交座標への変換
    const x = this.orbitRadius * Math.cos(this.orbitAngleX) * Math.sin(this.orbitAngleY)
    const y = this.orbitRadius * Math.sin(this.orbitAngleX)
    const z = this.orbitRadius * Math.cos(this.orbitAngleX) * Math.cos(this.orbitAngleY)

    // カメラ位置の更新（プレイヤーの位置を基準に）
    this.camera.position = this.currentTargetPosition.add(new BABYLON.Vector3(x, y, z))
    this.camera.setTarget(this.currentTargetPosition)
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
