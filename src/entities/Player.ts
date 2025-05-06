import * as BABYLON from '@babylonjs/core'
import { TextBlock, AdvancedDynamicTexture } from '@babylonjs/gui'
import { MOVE_SPEED, SPAWN_POSITION } from '../constants/world'
import type { TerrainGenerator } from '../world/TerrainGenerator'

export class Player {
  private scene: BABYLON.Scene
  private mesh: BABYLON.Mesh
  private directionArrow: BABYLON.Mesh | null = null
  private isJumping: boolean = false
  private movementDirection: BABYLON.Vector3 = BABYLON.Vector3.Zero()
  private currentMoveSpeed: number = 0
  private verticalVelocity: number = 0
  private readonly JUMP_INITIAL_VELOCITY = 0.5
  private readonly GRAVITY_ACCELERATION = -0.015
  private terrain: TerrainGenerator

  constructor(scene: BABYLON.Scene, terrain: TerrainGenerator) {
    this.scene = scene
    this.terrain = terrain
    this.mesh = this.createPlayerMesh()
    this.addPlayerLabel()
  }

  private createPlayerMesh(): BABYLON.Mesh {
    const player = BABYLON.MeshBuilder.CreateBox(
      'player',
      { height: 2, width: 1, depth: 1 },
      this.scene,
    )
    const material = new BABYLON.StandardMaterial('playerMat', this.scene)
    material.diffuseColor = new BABYLON.Color3(1, 0.5, 0)
    player.material = material

    player.position = new BABYLON.Vector3(SPAWN_POSITION.x, SPAWN_POSITION.y, SPAWN_POSITION.z)

    return player
  }

  private addPlayerLabel(): void {
    const plane = BABYLON.MeshBuilder.CreatePlane(
      'playerLabel',
      { width: 4, height: 1 },
      this.scene,
    )
    plane.parent = this.mesh
    plane.position.y = 1.5
    plane.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL

    const texture = AdvancedDynamicTexture.CreateForMesh(plane, 512, 128)
    const text = new TextBlock('playerText')
    text.text = 'あなた'
    text.color = 'white'
    text.fontSize = 100
    text.fontWeight = 'bold'
    texture.addControl(text)
  }

  private updateDirectionArrow(): void {
    if (this.movementDirection.lengthSquared() < 0.01) {
      if (this.directionArrow) {
        this.directionArrow.dispose()
        this.directionArrow = null
      }
      this.currentMoveSpeed = 0
      return
    }

    if (!this.directionArrow) {
      this.directionArrow = BABYLON.MeshBuilder.CreateCylinder(
        'directionArrow',
        { height: 2, diameterTop: 0, diameterBottom: 0.3 },
        this.scene,
      )
      const material = new BABYLON.StandardMaterial('arrowMat', this.scene)
      material.diffuseColor = new BABYLON.Color3(1, 1, 0)
      material.backFaceCulling = false
      this.directionArrow.material = material
    }

    const direction = this.movementDirection.normalize()
    this.directionArrow.position = this.mesh.position.add(direction.scale(2))
    this.directionArrow.position.y = this.mesh.position.y + 1

    const rotationMatrix = BABYLON.Matrix.RotationAlignToRef(
      BABYLON.Vector3.Up(),
      direction,
      BABYLON.Matrix.Zero(),
    )
    this.directionArrow.rotationQuaternion = BABYLON.Quaternion.FromRotationMatrix(rotationMatrix)

    if (this.currentMoveSpeed > 0.01) {
      const targetRotation = Math.atan2(direction.x, direction.z)
      const currentRotation = this.mesh.rotation.y
      const rotationDiff = targetRotation - currentRotation
      const normalizedDiff = Math.atan2(Math.sin(rotationDiff), Math.cos(rotationDiff))
      this.mesh.rotation.y += normalizedDiff * 0.1
    }

    this.currentMoveSpeed = this.movementDirection.length()
  }

  move(
    forward: BABYLON.Vector3,
    right: BABYLON.Vector3,
    inputMap: { [key: string]: boolean },
  ): void {
    this.movementDirection = BABYLON.Vector3.Zero()

    if (inputMap['w']) {
      this.movementDirection.addInPlace(forward.scale(MOVE_SPEED))
    }
    if (inputMap['s']) {
      this.movementDirection.addInPlace(forward.scale(-MOVE_SPEED))
    }
    if (inputMap['a']) {
      this.movementDirection.addInPlace(right.scale(-MOVE_SPEED)) // 左方向
    }
    if (inputMap['d']) {
      this.movementDirection.addInPlace(right.scale(MOVE_SPEED)) // 右方向
    }

    if (this.movementDirection.lengthSquared() > 0.01) {
      const nextPosition = this.mesh.position.add(this.movementDirection)
      const groundHeight = this.terrain.getHeightAtPosition(nextPosition.x, nextPosition.z)

      if (!this.isJumping) {
        nextPosition.y = groundHeight + 1
      }
      this.mesh.position = nextPosition
      this.updateDirectionArrow()
    }
  }

  jump(): void {
    if (!this.isJumping) {
      this.isJumping = true
      this.verticalVelocity = this.JUMP_INITIAL_VELOCITY
    }
  }

  applyGravity(): void {
    if (
      this.isJumping ||
      this.mesh.position.y >
        this.terrain.getHeightAtPosition(this.mesh.position.x, this.mesh.position.z) + 1
    ) {
      this.verticalVelocity += this.GRAVITY_ACCELERATION
      this.mesh.position.y += this.verticalVelocity

      const groundHeight =
        this.terrain.getHeightAtPosition(this.mesh.position.x, this.mesh.position.z) + 1
      if (this.mesh.position.y <= groundHeight) {
        this.mesh.position.y = groundHeight
        this.verticalVelocity = 0
        this.isJumping = false
      }
    }
  }

  getPosition(): BABYLON.Vector3 {
    return this.mesh.position
  }

  getRotation(): number {
    return this.mesh.rotation.y
  }

  getIsJumping(): boolean {
    return this.isJumping
  }

  getMoveSpeed(): number {
    return this.currentMoveSpeed
  }

  getVerticalVelocity(): number {
    return this.verticalVelocity
  }

  dispose(): void {
    this.mesh.dispose()
    if (this.directionArrow) {
      this.directionArrow.dispose()
    }
  }
}
