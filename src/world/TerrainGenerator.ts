import * as BABYLON from '@babylonjs/core'
import {
  NOISE_SCALE,
  NOISE_AMPLITUDE,
  NATURAL_TERRAIN_SIZE,
  ARTIFICIAL_TERRAIN_SIZE,
  NATURAL_TERRAIN_OFFSET,
  ARTIFICIAL_TERRAIN_OFFSET,
} from '../constants/world'

export class TerrainGenerator {
  private scene: BABYLON.Scene
  private seed: number
  private naturalGround: BABYLON.Mesh | null = null
  private heightMap: Float32Array | null = null
  private subdivisions: number = 100

  constructor(scene: BABYLON.Scene) {
    this.scene = scene
    this.seed = Math.random() * 10000
  }

  private generateHeight(x: number, z: number): number {
    // 複数の周波数の波を合成
    const scale1 = NOISE_SCALE
    const scale2 = NOISE_SCALE * 2
    const scale3 = NOISE_SCALE * 4

    const nx1 = x * scale1 + this.seed
    const nz1 = z * scale1 + this.seed
    const wave1 = Math.sin(nx1) * Math.cos(nz1) * NOISE_AMPLITUDE

    const nx2 = x * scale2 + this.seed * 2
    const nz2 = z * scale2 + this.seed * 2
    const wave2 = Math.sin(nx2) * Math.cos(nz2) * (NOISE_AMPLITUDE * 0.5)

    const nx3 = x * scale3 + this.seed * 3
    const nz3 = z * scale3 + this.seed * 3
    const wave3 = Math.sin(nx3) * Math.cos(nz3) * (NOISE_AMPLITUDE * 0.25)

    return wave1 + wave2 + wave3
  }

  createNaturalTerrain(): BABYLON.Mesh {
    console.log('Creating natural terrain...')

    // より細かい分割でメッシュを生成
    const step = NATURAL_TERRAIN_SIZE / this.subdivisions

    // リボンの生成（X方向のライン群）
    const ribbon: BABYLON.Vector3[][] = []
    for (let x = -NATURAL_TERRAIN_SIZE / 2; x <= NATURAL_TERRAIN_SIZE / 2; x += step) {
      const line: BABYLON.Vector3[] = []
      for (let z = -NATURAL_TERRAIN_SIZE / 2; z <= NATURAL_TERRAIN_SIZE / 2; z += step) {
        const height = this.generateHeight(x, z)
        // 高さを正の値に制限して地面より下に沈まないようにする
        const adjustedHeight = Math.max(0, height)
        line.push(new BABYLON.Vector3(x, adjustedHeight, z))
      }
      ribbon.push(line)
    }

    // リボンメッシュの生成
    const ground = BABYLON.MeshBuilder.CreateRibbon(
      'naturalGround',
      {
        pathArray: ribbon,
        sideOrientation: BABYLON.Mesh.DOUBLESIDE,
        updatable: true,
      },
      this.scene,
    )

    // 頂点の位置を保存
    const positions = ground.getVerticesData(BABYLON.VertexBuffer.PositionKind)
    if (!positions) {
      console.error('Failed to get vertex positions')
      return ground
    }

    // 高さマップの作成
    this.heightMap = new Float32Array((this.subdivisions + 1) * (this.subdivisions + 1))
    for (let i = 0; i < positions.length; i += 3) {
      this.heightMap[Math.floor(i / 3)] = positions[i + 1]
    }

    // マテリアルの設定
    const groundMaterial = new BABYLON.StandardMaterial('naturalGroundMat', this.scene)
    groundMaterial.diffuseColor = new BABYLON.Color3(0.4, 0.6, 0.3)
    groundMaterial.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1)
    groundMaterial.specularPower = 64
    groundMaterial.backFaceCulling = false

    ground.material = groundMaterial
    ground.position = new BABYLON.Vector3(NATURAL_TERRAIN_OFFSET, 0, 0)
    this.naturalGround = ground

    console.log(`Natural terrain created at position: ${ground.position}`)
    return ground
  }

  createArtificialTerrain(): BABYLON.Mesh {
    console.log('Creating artificial terrain...')

    const ground = BABYLON.MeshBuilder.CreateGround(
      'artificialGround',
      {
        width: ARTIFICIAL_TERRAIN_SIZE,
        height: ARTIFICIAL_TERRAIN_SIZE,
        subdivisions: 20,
      },
      this.scene,
    )

    const groundMaterial = new BABYLON.StandardMaterial('artificialGroundMat', this.scene)
    groundMaterial.diffuseColor = new BABYLON.Color3(0.4, 0.4, 0.4)
    groundMaterial.specularColor = new BABYLON.Color3(0.2, 0.2, 0.2)

    const textureSize = 512
    const texture = new BABYLON.DynamicTexture('gridTexture', textureSize, this.scene, true)
    const ctx = texture.getContext()

    ctx.fillStyle = '#666666'
    ctx.fillRect(0, 0, textureSize, textureSize)

    ctx.strokeStyle = '#888888'
    ctx.lineWidth = 2
    const gridSize = 32

    for (let i = 0; i <= textureSize; i += gridSize) {
      ctx.beginPath()
      ctx.moveTo(i, 0)
      ctx.lineTo(i, textureSize)
      ctx.stroke()

      ctx.beginPath()
      ctx.moveTo(0, i)
      ctx.lineTo(textureSize, i)
      ctx.stroke()
    }

    texture.update()
    groundMaterial.diffuseTexture = texture
    texture.uScale = 10
    texture.vScale = 10

    ground.material = groundMaterial
    ground.position = new BABYLON.Vector3(ARTIFICIAL_TERRAIN_OFFSET, 0, 0)

    console.log(`Artificial terrain created at position: ${ground.position}`)
    return ground
  }

  getHeightAtPosition(x: number, z: number): number {
    // 人工地形エリアの場合は0を返す
    if (x >= 0) {
      return 0
    }

    // 自然地形エリアの場合、generateHeightを使用
    const localX = x - NATURAL_TERRAIN_OFFSET
    const localZ = z
    const height = this.generateHeight(localX, localZ)
    return Math.max(0, height) // 高さを正の値に制限
  }
}
