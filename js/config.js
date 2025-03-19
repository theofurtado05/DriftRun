const CONFIG = {
    // Configurações do carro
    car: {
        width: 2,
        height: 1,
        length: 4,
        speed: 20, // Velocidade base
        maxSpeed: 50,
        lateralSpeed: 3, // Aumentado para melhor resposta
        rotationSpeed: 0.02, // Aumentado para curvas mais responsivas
        driftRecoveryRate: 0.9, // Ajustado para drift mais persistente
        maxDriftForce: 0.5 // Aumentado para efeito visual mais forte
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
        coinInterval: 2, // segundos entre grupos de moedas
        coinValue: 1,    // valor de cada moeda
        difficultyIncrease: 0.001, // Aumento base de velocidade por frame
        initialObstacleInterval: 2.5,  // segundos
        maxObstacleInterval: 0.8,    // segundos
        maxDifficultyLevel: 10
    },
    
    // Configurações de obstáculos
    obstacles: {
        minLateralDistance: 6, // Distância mínima lateral entre obstáculos
        minLongitudinalDistance: 5, // Distância mínima na direção Z entre obstáculos
        maxWidth: 3, // Largura máxima de um obstáculo
        spawnDistance: 30, // Distância à frente do carro onde os obstáculos aparecem
        randomSpawnRange: 30 // Variação aleatória na distância de spawn
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