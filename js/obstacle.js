// Classe para gerenciar os obstáculos
class ObstacleManager {
    constructor(scene) {
        this.scene = scene;
        this.obstacles = [];
        this.lastObstacleTime = 0;
        this.obstacleInterval = CONFIG.game.initialObstacleInterval;
        this.avoidedCount = 0;
        this.difficultyLevel = 1;
    }
    
    createObstacle(zPosition) {
        const obstacleTypes = [
            {
                // Barreira
                create: () => {
                    const barrierGeometry = new THREE.BoxGeometry(3, 1.5, 1);
                    const barrierMaterial = new THREE.MeshPhongMaterial({ 
                        color: CONFIG.colors.barrier 
                    });
                    const barrier = new THREE.Mesh(barrierGeometry, barrierMaterial);
                    
                    const stripeGeometry = new THREE.BoxGeometry(3, 1.5, 0.1);
                    const stripeMaterial = new THREE.MeshPhongMaterial({ 
                        color: CONFIG.colors.barrierStripe 
                    });
                    
                    for (let i = 0; i < 3; i++) {
                        const stripe = new THREE.Mesh(stripeGeometry, stripeMaterial);
                        stripe.position.z = -0.2 - i * 0.3;
                        barrier.add(stripe);
                    }
                    
                    return barrier;
                }
            },
            {
                // Cones
                create: () => {
                    const group = new THREE.Group();
                    
                    for (let i = 0; i < 3; i++) {
                        const coneGeometry = new THREE.ConeGeometry(0.5, 1.5, 16);
                        const coneMaterial = new THREE.MeshPhongMaterial({ 
                            color: CONFIG.colors.cone 
                        });
                        const cone = new THREE.Mesh(coneGeometry, coneMaterial);
                        cone.position.x = (i - 1) * 1;
                        group.add(cone);
                    }
                    
                    return group;
                }
            },
            {
                // Rochas
                create: () => {
                    const group = new THREE.Group();
                    
                    for (let i = 0; i < 2; i++) {
                        const rockGeometry = new THREE.DodecahedronGeometry(0.8, 0);
                        const rockMaterial = new THREE.MeshPhongMaterial({ 
                            color: CONFIG.colors.rock,
                            flatShading: true 
                        });
                        const rock = new THREE.Mesh(rockGeometry, rockMaterial);
                        rock.position.x = (i === 0) ? -1 : 1;
                        rock.rotation.set(
                            Math.random() * Math.PI, 
                            Math.random() * Math.PI, 
                            Math.random() * Math.PI
                        );
                        rock.scale.set(
                            0.7 + Math.random() * 0.6, 
                            0.7 + Math.random() * 0.6, 
                            0.7 + Math.random() * 0.6
                        );
                        group.add(rock);
                    }
                    
                    return group;
                }
            }
        ];
        
        // Escolher tipo de obstáculo aleatoriamente
        const obstacleType = obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)];
        const obstacle = obstacleType.create();
        
        // Posicionar obstáculo
        const trackHalfWidth = CONFIG.track.width / 2 - 1;
        const randomX = (Math.random() * trackHalfWidth * 2) - trackHalfWidth;
        
        obstacle.position.set(randomX, 1, zPosition);
        obstacle.castShadow = true;
        this.scene.add(obstacle);
        
        // Adicionar à lista de obstáculos
        this.obstacles.push({
            mesh: obstacle,
            position: { x: randomX, y: 1, z: zPosition },
            passed: false,
            size: { width: 3, height: 1.5, depth: 1 } // Tamanho aproximado para colisão
        });
        
        return obstacle;
    }
    
    update(deltaTime, carPosition) {
         // Aumentar a dificuldade com base no tempo ou pontuação
         this.increaseDifficulty(this.avoidedCount);
        
         // Adicionar novo obstáculo com base no intervalo
         this.lastObstacleTime += deltaTime;
         
         if (this.lastObstacleTime > this.obstacleInterval) {
             // Zerar contador
             this.lastObstacleTime = 0;
             
             // Criar novo obstáculo
             const nextZ = carPosition.z + 100 + Math.random() * 50;
             this.createObstacle(nextZ);
             
             // Chance de criar obstáculos adicionais com base na dificuldade
             if (Math.random() < this.getDifficultyMultiplier() * 0.2) {
                 const offsetX = (Math.random() > 0.5) ? 4 : -4;
                 const additionalZ = nextZ + (Math.random() * 10) - 5;
                 const obstacle = this.createObstacle(additionalZ);
                 obstacle.position.x += offsetX;
             }
         }
         
         // Verificar obstáculos para remoção
         const obstaclesToRemove = [];
         
         for (let i = 0; i < this.obstacles.length; i++) {
             const obstacle = this.obstacles[i];
             
             // Verificar se o carro já passou do obstáculo
             if (!obstacle.passed && obstacle.position.z < carPosition.z - 5) {
                 obstacle.passed = true;
                 this.avoidedCount++;
             }
             
             // Se o obstáculo está muito atrás do carro, marcamos para remoção
             if (obstacle.position.z < carPosition.z - 50) {
                 obstaclesToRemove.push(i);
             }
         }
         
         // Remover obstáculos antigos (do último para o primeiro para não afetar os índices)
         for (let i = obstaclesToRemove.length - 1; i >= 0; i--) {
             const index = obstaclesToRemove[i];
             const obstacle = this.obstacles[index];
             
             // Remover o mesh da cena
             this.scene.remove(obstacle.mesh);
             
             // Remover da lista de obstáculos
             this.obstacles.splice(index, 1);
         }
    }

     // Aumentar a dificuldade com base na pontuação
     increaseDifficulty(score) {
        // Calcular o nível de dificuldade com base na pontuação
        this.difficultyLevel = 1 + Math.floor(score / 10);
        
        // Ajustar o intervalo de obstáculos com base na dificuldade
        this.obstacleInterval = Math.max(
            0.5, 
            CONFIG.game.initialObstacleInterval - (this.difficultyLevel * 0.1)
        );
    }
    
    // Obter multiplicador de dificuldade para outros cálculos
    getDifficultyMultiplier() {
        return Math.min(3, this.difficultyLevel / 2);
    }
    
    checkCollisions(carPosition) {
        // Verificar colisões com o carro
        for (const obstacle of this.obstacles) {
            const dx = Math.abs(carPosition.x - obstacle.position.x);
            const dz = Math.abs(carPosition.z - obstacle.position.z);
            
            // Dimensões aproximadas do carro
            const carWidth = CONFIG.car.width;
            const carLength = CONFIG.car.length;
            
            // Verificar colisão
            if (dx < (carWidth / 2 + obstacle.size.width / 2) * 0.8 &&
                dz < (carLength / 2 + obstacle.size.depth / 2) * 0.8) {
                return true; // Colisão detectada
            }
        }
        
        return false;
    }
    
    reset() {
        // Remover todos os obstáculos
        for (const obstacle of this.obstacles) {
            this.scene.remove(obstacle.mesh);
        }
        
        // Limpar array
        this.obstacles = [];
        
        // Resetar variáveis
        this.lastObstacleTime = 0;
        this.obstacleInterval = CONFIG.game.initialObstacleInterval;
        this.avoidedCount = 0;
    }
    
    getAvoidedCount() {
        return this.avoidedCount;
    }
}