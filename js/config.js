// Configurações do jogo
const CONFIG = {
    // Configurações do carro
    car: {
        speed: 16,
        maxSpeed: 20,
        acceleration: 0.5,
        maxDriftForce: 2,
        driftRecoveryRate: 0.98,
        rotationSpeed: 0.03,
        damping: 0.95,
        width: 2,
        length: 4,
        height: 1,
        lateralSpeed: 4,
    },
    
    // Configurações da pista
    track: {
        width: 10,
        segmentLength: 20,
        maxVisibleSegments: 20,
        visibilityDistance: 300,
        turnProbability: 0.2,
        turnAmount: 5, // Quantidade de deslocamento lateral para curvas
        maxTurnAngle: Math.PI / 8
    },
    
    // Configurações do jogo
    game: {
        coinInterval: 10, // segundos
        difficultyIncrease: 0.01, // Aumento base de velocidade por frame
        initialObstacleInterval: 2,  // segundos
        maxObstacleInterval: 0.5,    // segundos (intervalo mínimo entre obstáculos)
        maxDifficultyLevel: 10
    },
    
    // Configurações da câmera
    camera: {
        fov: 75,
        near: 0.1,
        far: 1000,
        position: { x: 0, y: 8, z: -10 },
        lookAt: { x: 0, y: 0, z: 10 }
    },
    
    // Configurações de cores
    colors: {
        sky: 0x87CEEB,
        road: 0x555555,
        roadEdge: 0xFFFFFF,
        car: 0xFF0000,
        carRoof: 0xDD0000,
        wheel: 0x333333,
        headlight: 0xFFFF00,
        barrier: 0xFF8C00,
        barrierStripe: 0x000000,
        cone: 0xFF4500,
        rock: 0x8B4513,
        turnMarking: 0xFFFF00,
        centerLine: 0xFFFFFF
    }
};