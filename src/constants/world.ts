export const TERRAIN_SIZE = 400 // より広いエリア
export const WALL_HEIGHT = 20
export const SPAWN_HEIGHT = 10

// 地形サイズ
export const NATURAL_TERRAIN_SIZE = 200
export const ARTIFICIAL_TERRAIN_SIZE = 100

// 初期スポーン位置（人工地形エリアの中心）
export const SPAWN_POSITION = {
  x: ARTIFICIAL_TERRAIN_SIZE / 2,
  y: SPAWN_HEIGHT,
  z: 0,
}

// 物理定数
export const GRAVITY = -0.015
export const JUMP_FORCE = 0.5
export const MOVE_SPEED = 0.3

// 地形生成パラメータ
export const NOISE_SCALE = 0.02 // より細かい変化
export const NOISE_AMPLITUDE = 8 // より大きな高低差
export const NOISE_OCTAVES = 4 // より多くの周波数を合成

// カメラパラメータ
export const MIN_MOVEMENT_FOR_CAMERA = 0.5 // カメラ追従の最小移動量
export const CAMERA_HEIGHT_OFFSET = 8 // カメラの高さオフセット
export const CAMERA_DISTANCE = 15 // カメラの距離
export const CAMERA_SMOOTHING = 0.1 // カメラの追従スムーズ度

// 地形オフセット
export const NATURAL_TERRAIN_OFFSET = -NATURAL_TERRAIN_SIZE / 2
export const ARTIFICIAL_TERRAIN_OFFSET = 0
