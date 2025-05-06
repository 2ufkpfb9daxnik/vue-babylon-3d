<template>
  <canvas ref="renderCanvas"></canvas>
  <div class="debug-panel" v-if="showDebug">
    <div class="debug-section">
      <h3>システム情報</h3>
      <p>FPS: {{ fps }}</p>
    </div>
    <div class="debug-section">
      <h3>座標情報</h3>
      <p>
        X: {{ position.x.toFixed(2) }}, Y: {{ position.y.toFixed(2) }}, Z:
        {{ position.z.toFixed(2) }}
      </p>
      <p>地形の高さ: {{ terrainHeight.toFixed(2) }}m</p>
    </div>
    <div class="debug-section">
      <h3>物理情報</h3>
      <p>ジャンプ状態: {{ isJumping ? 'ジャンプ中' : '接地中' }}</p>
      <p>移動速度: {{ moveSpeed.toFixed(2) }}m/s</p>
      <p>高度: {{ getRelativeHeight().toFixed(2) }}m</p>
    </div>
    <div class="debug-section">
      <h3>入力状態</h3>
      <div class="key-grid">
        <div></div>
        <div class="key-cell">{{ isKeyPressed('w') ? '▲' : '△' }}</div>
        <div></div>
        <div class="key-cell">{{ isKeyPressed('a') ? '◀' : '◁' }}</div>
        <div class="key-cell">{{ isKeyPressed('s') ? '▼' : '▽' }}</div>
        <div class="key-cell">{{ isKeyPressed('d') ? '▶' : '▷' }}</div>
        <div class="key-cell">Space: {{ isKeyPressed(' ') ? '■' : '□' }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, reactive } from 'vue'
import * as BABYLON from '@babylonjs/core'
import { TerrainGenerator } from '../world/TerrainGenerator'
import { Player } from '../entities/Player'
import { CameraController } from '../controllers/CameraController'
import { InputController } from '../controllers/InputController'
import { BoundaryWalls } from '../world/BoundaryWalls'
import { SPAWN_POSITION } from '../constants/world'

const renderCanvas = ref<HTMLCanvasElement | null>(null)
const showDebug = ref(true)
let engine: BABYLON.Engine
let scene: BABYLON.Scene
let player: Player
let cameraController: CameraController | null = null
let inputController: InputController
let terrainGenerator: TerrainGenerator
let boundaryWalls: BoundaryWalls

// 状態管理
const position = reactive({ x: SPAWN_POSITION.x, y: SPAWN_POSITION.y, z: SPAWN_POSITION.z })
const fps = ref(0)
const isJumping = ref(false)
const moveSpeed = ref(0)
const terrainHeight = ref(0)

const getRelativeHeight = () => {
  return position.y - terrainHeight.value
}

const isKeyPressed = (key: string): boolean => {
  return inputController?.isKeyPressed(key) || false
}

const createScene = async (canvas: HTMLCanvasElement) => {
  try {
    // 基本設定
    engine = new BABYLON.Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true })
    scene = new BABYLON.Scene(engine)

    // コンポーネントの初期化
    inputController = new InputController(scene)
    terrainGenerator = new TerrainGenerator(scene)
    cameraController = new CameraController(scene, canvas)

    // 地形の生成
    terrainGenerator.createNaturalTerrain()
    terrainGenerator.createArtificialTerrain()
    boundaryWalls = new BoundaryWalls(scene)

    // ライトの設定
    const light = new BABYLON.HemisphericLight('light', new BABYLON.Vector3(1, 1, 0), scene)
    light.intensity = 1.2
    const ambientLight = new BABYLON.HemisphericLight(
      'ambient',
      new BABYLON.Vector3(-1, -1, 0),
      scene,
    )
    ambientLight.intensity = 0.5

    // プレイヤーの作成
    player = new Player(scene, terrainGenerator)

    // ゲームループの設定
    scene.registerBeforeRender(() => {
      fps.value = Math.round(engine.getFps())

      // プレイヤーの移動と物理演算
      const forward = cameraController!.getDirection()
      const right = cameraController!.getRightDirection()
      player.move(forward, right, inputController.getInputMap())

      if (inputController.isKeyPressed(' ')) {
        player.jump()
      }
      player.applyGravity()

      // 状態の更新
      const playerPosition = player.getPosition()
      position.x = playerPosition.x
      position.y = playerPosition.y
      position.z = playerPosition.z

      isJumping.value = player.getIsJumping()
      moveSpeed.value = player.getMoveSpeed()
      terrainHeight.value = terrainGenerator.getHeightAtPosition(position.x, position.z)

      // カメラの更新
      cameraController!.updateCamera(playerPosition)
    })

    return scene
  } catch (error) {
    console.error('Scene creation error:', error)
    throw error
  }
}

onMounted(async () => {
  if (renderCanvas.value) {
    try {
      const scene = await createScene(renderCanvas.value)
      engine.runRenderLoop(() => scene.render())

      window.addEventListener('resize', () => {
        engine.resize()
      })
    } catch (error) {
      console.error('Initialization error:', error)
    }
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', () => engine?.resize())
  engine?.dispose()
  player?.dispose()
  boundaryWalls?.dispose()
})
</script>

<style scoped>
canvas {
  width: 100vw;
  height: 100vh;
  display: block;
  touch-action: none;
}

.debug-panel {
  position: fixed;
  top: 10px;
  right: 10px;
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 15px;
  border-radius: 5px;
  font-family: monospace;
  max-width: 300px;
}

.debug-section {
  margin-bottom: 15px;
}

.debug-section h3 {
  margin: 0 0 5px 0;
  font-size: 14px;
  color: #00ff00;
}

.debug-section p {
  margin: 3px 0;
  font-size: 12px;
}

.key-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 5px;
  margin-top: 5px;
  font-size: 16px;
  text-align: center;
}

.key-cell {
  background-color: rgba(255, 255, 255, 0.1);
  padding: 5px;
  border-radius: 3px;
}
</style>
