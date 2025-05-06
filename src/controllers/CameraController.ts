import * as BABYLON from '@babylonjs/core'
import { ref } from 'vue'
import type { Ref } from 'vue'

export type CameraMode = 'view' | 'select'

export class CameraController {
  private scene: BABYLON.Scene
  private camera: BABYLON.ArcRotateCamera // FreeCameraからArcRotateCameraに戻す
  private canvas: HTMLCanvasElement
  public mode: Ref<CameraMode>
  private readonly CAMERA_DISTANCE = 15
  private readonly CAMERA_HEIGHT_OFFSET = 5

  constructor(scene: BABYLON.Scene, canvas: HTMLCanvasElement) {
    this.scene = scene
    this.canvas = canvas
    this.mode = ref<CameraMode>('select')
    this.camera = this.createCamera()
    this.setupModeToggle()
  }

  private createCamera(): BABYLON.ArcRotateCamera {
    const camera = new BABYLON.ArcRotateCamera(
      'camera',
      Math.PI, // 初期アングル（プレイヤーの後ろ）
      Math.PI / 3, // 仰角（60度）
      this.CAMERA_DISTANCE,
      BABYLON.Vector3.Zero(),
      this.scene,
    )

    camera.lowerRadiusLimit = 10
    camera.upperRadiusLimit = 30
    camera.wheelDeltaPercentage = 0.01
    camera.panningSensibility = 0 // パンニングを無効化

    // 回転の制限
    camera.upperBetaLimit = Math.PI / 2 - 0.1 // ほぼ真上まで
    camera.lowerBetaLimit = 0.1 // ほぼ水平まで

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
      // 視点操作モードの時のみカメラ操作を有効化
      this.camera.attachControl(this.canvas, true)
    } else {
      // それ以外は操作を無効化
      this.camera.detachControl()
    }
  }

  updateCamera(playerPosition: BABYLON.Vector3): void {
    // プレイヤーの位置を中心に設定（高さオフセット付き）
    const targetPosition = playerPosition.clone()
    targetPosition.y += this.CAMERA_HEIGHT_OFFSET / 2 // プレイヤーの少し上を見る
    this.camera.target = targetPosition
  }

  getCamera(): BABYLON.ArcRotateCamera {
    return this.camera
  }

  getDirection(): BABYLON.Vector3 {
    // カメラの向きから前方向を取得（Y成分を0にして水平方向のみ）
    const direction = this.camera.target.subtract(this.camera.position)
    direction.y = 0
    return direction.normalize()
  }

  getRightDirection(): BABYLON.Vector3 {
    const forward = this.getDirection()
    return BABYLON.Vector3.Cross(forward, BABYLON.Vector3.Up()).normalize()
  }

  dispose(): void {
    this.camera.dispose()
  }
}
