// Modificar a classe CoinManager para gerar moedas individuais
class CoinManager {
    constructor(scene, game) {
        this.scene = scene;
        this.game = game;
        this.coins = [];
        this.coinGeometry = null;
        this.coinMaterial = null;
        this.coinPool = []; // Pool de moedas para reutilização
        this.lastCoinTime = 0;
        this.coinInterval = 0.5; // Intervalo entre moedas individuais (em segundos)
        
        // Inicializar geometria e material das moedas
        this.initCoinGeometry();
    }
    
    // Inicializar geometria e material das moedas
    initCoinGeometry() {
        // Criar geometria da moeda (cilindro fino)
        this.coinGeometry = new THREE.CylinderGeometry(0.5, 0.5, 0.1, 16);
        
        // Criar material dourado brilhante
        this.coinMaterial = new THREE.MeshPhongMaterial({
            color: 0xFFD700, // Dourado
            specular: 0xFFFFFF,
            shininess: 100,
            emissive: 0xFFAA00,
            emissiveIntensity: 0.3
        });
    }
    
    // Criar uma nova moeda
    createCoin(position) {
        let coin;
        
        // Verificar se há moedas na pool para reutilização
        if (this.coinPool.length > 0) {
            coin = this.coinPool.pop();
            coin.position.copy(position);
            coin.visible = true;
        } else {
            // Criar nova moeda
            coin = new THREE.Mesh(this.coinGeometry, this.coinMaterial);
            coin.position.copy(position);
            
            // Configurar sombras
            coin.castShadow = true;
            coin.receiveShadow = true;
            
            // Rotacionar para ficar de frente para o jogador
            coin.rotation.x = Math.PI / 2;
            
            this.scene.add(coin);
        }
        
        // Adicionar à lista de moedas ativas
        this.coins.push({
            mesh: coin,
            position: position,
            collected: false,
            rotationSpeed: 0.05 + Math.random() * 0.05 // Velocidade de rotação aleatória
        });
        
        return coin;
    }
    
    // Atualizar moedas (rotação, colisão, etc.)
    update(deltaTime, carPosition) {
        // Adicionar novas moedas com base no intervalo
    this.lastCoinTime += deltaTime;
    
    if (this.lastCoinTime > this.coinInterval) {
        this.lastCoinTime = 0;
        
        // Decidir aleatoriamente se vamos criar uma moeda individual ou um pequeno padrão
        const patternChance = 0.2; // 20% de chance de criar um padrão
        
        if (Math.random() < patternChance) {
            // Criar um pequeno padrão de moedas
            this.createCoinPattern(carPosition);
        } else {
            // Gerar uma nova moeda individual à frente do carro
            const position = {
                // Posição X aleatória dentro dos limites da pista
                x: (Math.random() * 8) - 4,
                // Altura da moeda (flutuando acima do chão)
                y: 1,
                // Posição Z à frente do carro
                z: carPosition.z + 100 + Math.random() * 50
            };
            
            // Criar a moeda
            this.createCoin(position);
        }
    }
        
        // Verificar moedas para colisão e remoção
        const coinsToRemove = [];
        
        for (let i = 0; i < this.coins.length; i++) {
            const coin = this.coins[i];
            
            // Rotacionar a moeda
            coin.mesh.rotation.y += coin.rotationSpeed;
            
            // Fazer a moeda flutuar suavemente
            coin.mesh.position.y = 1 + Math.sin(Date.now() * 0.003) * 0.2;
            
            // Verificar colisão com o carro
            if (!coin.collected) {
                const dx = coin.position.x - carPosition.x;
                const dz = coin.position.z - carPosition.z;
                const distance = Math.sqrt(dx * dx + dz * dz);
                
                if (distance < 2) { // Raio de coleta
                    // Marcar como coletada
                    coin.collected = true;
                    
                    // Adicionar moeda ao contador
                    this.game.collectCoin();
                    
                    // Efeito visual de coleta
                    this.playCoinCollectEffect(coin.mesh.position);
                    
                    // Esconder a moeda
                    coin.mesh.visible = false;
                    
                    // Marcar para remoção
                    coinsToRemove.push(i);
                }
            }
            
            // Se a moeda ficou muito para trás, marcar para remoção
            if (coin.position.z < carPosition.z - 50) {
                coinsToRemove.push(i);
            }
        }
        
        // Remover moedas (do último para o primeiro para não afetar os índices)
        for (let i = coinsToRemove.length - 1; i >= 0; i--) {
            const index = coinsToRemove[i];
            const coin = this.coins[index];
            
            // Adicionar à pool para reutilização
            this.coinPool.push(coin.mesh);
            
            // Remover da lista de moedas ativas
            this.coins.splice(index, 1);
        }
    }
    
    // Efeito visual quando uma moeda é coletada
    playCoinCollectEffect(position) {
        // Criar partículas douradas
        const particleCount = 10;
        const particleGeometry = new THREE.BufferGeometry();
        const particlePositions = new Float32Array(particleCount * 3);
        
        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            particlePositions[i3] = position.x;
            particlePositions[i3 + 1] = position.y;
            particlePositions[i3 + 2] = position.z;
        }
        
        particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
        
        const particleMaterial = new THREE.PointsMaterial({
            color: 0xFFD700,
            size: 0.5,
            transparent: true,
            opacity: 1
        });
        
        const particles = new THREE.Points(particleGeometry, particleMaterial);
        this.scene.add(particles);
        
        // Animar partículas
        const particleVelocities = [];
        for (let i = 0; i < particleCount; i++) {
            particleVelocities.push({
                x: (Math.random() - 0.5) * 0.2,
                y: Math.random() * 0.2,
                z: (Math.random() - 0.5) * 0.2
            });
        }

        
        
        // Função de animação
        const animate = () => {
            const positions = particles.geometry.attributes.position.array;
            
            for (let i = 0; i < particleCount; i++) {
                const i3 = i * 3;
                positions[i3] += particleVelocities[i].x;
                positions[i3 + 1] += particleVelocities[i].y;
                positions[i3 + 2] += particleVelocities[i].z;
            }
            
            particles.geometry.attributes.position.needsUpdate = true;
            
            // Reduzir opacidade
            particleMaterial.opacity -= 0.02;
            
            if (particleMaterial.opacity > 0) {
                requestAnimationFrame(animate);
            } else {
                // Remover partículas quando a animação terminar
                this.scene.remove(particles);
            }
        };
        
        // Iniciar animação
        animate();
        
        // Reproduzir som de moeda (se disponível)
        if (this.game.playCoinSound) {
            this.game.playCoinSound();
        }
    }
    
    // Resetar todas as moedas
    reset() {
        // Remover todas as moedas ativas
        for (const coin of this.coins) {
            // Adicionar à pool para reutilização
            this.coinPool.push(coin.mesh);
        }
        
        // Limpar array de moedas ativas
        this.coins = [];
        
        // Resetar temporizador
        this.lastCoinTime = 0;
    }

    // Método para criar padrões de moedas mais interessantes
createCoinPattern(carPosition) {
    // Tipos de padrões
    const patterns = [
        'curve',     // Curva suave
        'zigzag',    // Zigue-zague
        'jump'       // Padrão para pular
    ];
    
    // Escolher um padrão aleatoriamente
    const pattern = patterns[Math.floor(Math.random() * patterns.length)];
    
    // Posição base para o padrão (à frente do carro)
    const basePosition = {
        x: (Math.random() * 6) - 3, // Posição X aleatória na pista
        y: 1, // Altura da moeda
        z: carPosition.z + 100 + Math.random() * 50 // À frente do carro
    };
    
    switch (pattern) {
        case 'curve':
            // Criar uma curva suave de moedas
            const curvePoints = 5;
            const curveRadius = 3;
            const curveAngle = Math.PI / 2; // 90 graus
            
            for (let i = 0; i < curvePoints; i++) {
                const angle = (i / (curvePoints - 1)) * curveAngle;
                const position = {
                    x: basePosition.x + Math.sin(angle) * curveRadius,
                    y: basePosition.y,
                    z: basePosition.z + Math.cos(angle) * curveRadius
                };
                this.createCoin(position);
            }
            break;
            
        case 'zigzag':
            // Criar um padrão zigue-zague
            const zigPoints = 5;
            const zigWidth = 2;
            
            for (let i = 0; i < zigPoints; i++) {
                const position = {
                    x: basePosition.x + ((i % 2 === 0) ? zigWidth : -zigWidth),
                    y: basePosition.y,
                    z: basePosition.z + i * 3
                };
                this.createCoin(position);
            }
            break;
            
        case 'jump':
            // Criar um padrão para incentivar pulos (se o jogo tiver mecânica de pulo)
            const jumpPoints = 3;
            const jumpHeight = 3;
            
            for (let i = 0; i < jumpPoints; i++) {
                const height = basePosition.y + (i === 1 ? jumpHeight : 0);
                const position = {
                    x: basePosition.x,
                    y: height,
                    z: basePosition.z + i * 3
                };
                this.createCoin(position);
            }
            break;
    }
}
}