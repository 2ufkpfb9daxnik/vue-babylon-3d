import * as BABYLON from '@babylonjs/core'
import {
  WALL_HEIGHT,
  NATURAL_TERRAIN_SIZE,
  ARTIFICIAL_TERRAIN_SIZE,
  NATURAL_TERRAIN_OFFSET,
  ARTIFICIAL_TERRAIN_OFFSET,
} from '../constants/world'

export class BoundaryWalls {
  private scene: BABYLON.Scene
  private walls: BABYLON.Mesh[] = []

  constructor(scene: BABYLON.Scene) {
    this.scene = scene
    this.createWalls()
  }

  private createWalls(): void {
    // 全体の地形の幅を計算
    const totalWidth = NATURAL_TERRAIN_SIZE + ARTIFICIAL_TERRAIN_SIZE

    const wallConfigs = [
      // 左端の壁（自然地形）
      {
        position: new BABYLON.Vector3(
          NATURAL_TERRAIN_OFFSET - NATURAL_TERRAIN_SIZE / 2,
          WALL_HEIGHT / 2,
          0,
        ),
        scaling: new BABYLON.Vector3(1, WALL_HEIGHT, NATURAL_TERRAIN_SIZE),
      },
      // 右端の壁（人工地形）
      {
        position: new BABYLON.Vector3(
          ARTIFICIAL_TERRAIN_OFFSET + ARTIFICIAL_TERRAIN_SIZE / 2,
          WALL_HEIGHT / 2,
          0,
        ),
        scaling: new BABYLON.Vector3(1, WALL_HEIGHT, ARTIFICIAL_TERRAIN_SIZE),
      },
      // 奥の壁（両地形をカバー）
      {
        position: new BABYLON.Vector3(0, WALL_HEIGHT / 2, totalWidth / 2),
        scaling: new BABYLON.Vector3(totalWidth, WALL_HEIGHT, 1),
      },
      // 手前の壁（両地形をカバー）
      {
        position: new BABYLON.Vector3(0, WALL_HEIGHT / 2, -totalWidth / 2),
        scaling: new BABYLON.Vector3(totalWidth, WALL_HEIGHT, 1),
      },
    ]

    wallConfigs.forEach(({ position, scaling }, index) => {
      const wall = BABYLON.MeshBuilder.CreateBox(
        `wall${index}`,
        { height: 1, width: 1, depth: 1 },
        this.scene,
      )
      wall.position = position
      wall.scaling = scaling
      wall.visibility = 0.2

      const wallMaterial = new BABYLON.StandardMaterial(`wallMat${index}`, this.scene)
      wallMaterial.diffuseColor = new BABYLON.Color3(0.5, 0.5, 1)
      wallMaterial.alpha = 0.2
      wallMaterial.backFaceCulling = false
      wall.material = wallMaterial

      this.walls.push(wall)
    })

    console.log('Boundary walls created')
  }

  dispose(): void {
    this.walls.forEach((wall) => wall.dispose())
    this.walls = []
  }
}
