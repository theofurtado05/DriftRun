// Classe principal do jogo
class Game {
    constructor(carType = 'default') {
        // Inicializar elementos do Three.js
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.clock = new THREE.Clock();
        
        // Elementos do jogo
        this.carType = carType;
        this.car = null;
        this.track = null;
        this.obstacleManager = null;
        this.mobileControls = null;

        //aceleracao e frenagem
        this.braking = false;
        this.currentSpeed = CONFIG.car.speed;
        this.targetSpeed = CONFIG.car.speed;
        this.accelerationRate = 0.1;
        this.brakingRate = 0.2;

        // Propriedades para o efeito de derrapagem
        this.skidMarks = [];
        this.skidParticles = [];
        this.skidTimer = 0;
        this.skidInterval = 0.05; // Intervalo para criar novas marcas de derrapagem
        this.maxSkidMarks = 50;
        
        // Carregar som de derrapagem
        this.skidSound = new Audio('assets/drift.mp3');
        this.skidSound.loop = true;
        this.skidSound.volume = 0;


        // Estado do jogo
        this.gameActive = false;
        this.elapsedTime = 0;
        this.coins = 0;
        this.nextCoinTime = CONFIG.game.coinInterval;
        this.inputDirection = 0;
        
        // Event Handlers
        this.keyDownHandler = this.handleKeyDown.bind(this);
        this.keyUpHandler = this.handleKeyUp.bind(this);
        this.touchStartHandler = this.handleTouchStart.bind(this);
        this.touchMoveHandler = this.handleTouchMove.bind(this);
        this.resizeHandler = this.handleResize.bind(this);
        this.touchEndHandler = this.handleTouchEnd.bind(this);



        // Inicializar
        this.init();
        this.setupEventListeners();
    }
    
    init() {
        // Inicializar cena
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(CONFIG.colors.sky);
        
        this.scene.fog = new THREE.Fog(0x87CEEB, 100, 500);
        // Inicializar câmera
        this.camera = new THREE.PerspectiveCamera(
            CONFIG.camera.fov,
            window.innerWidth / window.innerHeight,
            CONFIG.camera.near,
            CONFIG.camera.far
        );
        this.camera.position.set(
            CONFIG.camera.position.x,
            CONFIG.camera.position.y,
            CONFIG.camera.position.z
        );
        this.camera.lookAt(
            CONFIG.camera.lookAt.x,
            CONFIG.camera.lookAt.y,
            CONFIG.camera.lookAt.z
        );
        
        // Inicializar renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        document.getElementById('game-container').appendChild(this.renderer.domElement);
        
        // Adicionar luzes
        this.setupLights();

        // Inicializar gerenciador de moedas
        this.coinManager = new CoinManager(this.scene, this);
    
        
        // Inicializar elementos do jogo
        // Inicializar carro
        // Inicializar elementos do jogo
        this.car = new Car(this.scene, this.carType);
        this.track = new Track(this.scene);
        this.obstacleManager = new ObstacleManager(this.scene);
        
        // Inicializar controles móveis
        this.mobileControls = new MobileControls(this);

            // Configurar botão da loja
        document.getElementById('open-shop-btn').addEventListener('click', () => {
            document.getElementById('game-over').style.display = 'none';
            openShop();
        });
        
        // Resetar stats
        this.resetStats();
        
        // Iniciar o jogo
        this.start();
    }

    // Modifique o método updateSpeed para incluir o efeito de derrapagem
updateSpeed() {
    if (this.braking) {
        // Frear gradualmente
        this.currentSpeed = Math.max(
            this.targetSpeed, 
            this.currentSpeed - this.brakingRate
        );
        
        // Ativar luzes de freio, se existirem
        if (this.car && this.car.brakeLights) {
            this.car.brakeLights.visible = true;
        }
        
        // Adicionar efeito de derrapagem
        if (this.car && this.currentSpeed > this.targetSpeed * 1.5) {
            this.createSkidEffect(this.car.mesh.position, this.car.rotation);
            
            // Aumentar volume do som de derrapagem gradualmente
            if (this.skidSound.volume < 0.8) {
                this.skidSound.volume = Math.min(0.8, this.skidSound.volume + 0.05);
            }
            if (this.skidSound.paused) {
                this.skidSound.play();
            }
        }
    } else {
        // Acelerar gradualmente
        this.currentSpeed = Math.min(
            this.targetSpeed, 
            this.currentSpeed + this.accelerationRate
        );
        
        // Desativar luzes de freio
        if (this.car && this.car.brakeLights) {
            this.car.brakeLights.visible = false;
        }

        // Diminuir volume do som de derrapagem gradualmente
        if (this.skidSound.volume > 0) {
            this.skidSound.volume = Math.max(0, this.skidSound.volume - 0.1);
            if (this.skidSound.volume === 0) {
                this.skidSound.pause();
            }
        }
    }
    
    // Atualizar a velocidade do carro
    if (this.car) {
        this.car.speed = this.currentSpeed;
    }
}

// Método para criar o efeito de derrapagem
createSkidEffect(position, rotation) {
    // Incrementar o timer de derrapagem
    this.skidTimer += this.deltaTime;
    
    // Criar novas marcas de derrapagem em intervalos regulares
    if (this.skidTimer >= this.skidInterval) {
        this.skidTimer = 0;
        
        // Criar marcas de pneu na pista
        this.createSkidMark(position, rotation);
        
        // Criar partículas de fumaça
        this.createSkidParticles(position);
    }
    
    // Atualizar e remover partículas antigas
    this.updateSkidEffects();
}

// Método para criar marcas de pneu
createSkidMark(position, rotation) {
    // Calcular a posição das rodas traseiras
    const wheelOffset = 1.5; // Distância das rodas traseiras em relação ao centro do carro
    const wheelWidth = 0.8; // Largura entre as rodas
    
    // Criar uma geometria para a marca de derrapagem (um retângulo plano)
    const geometry = new THREE.PlaneGeometry(0.3, 0.8);
    
    // Material para a marca de derrapagem (preto semi-transparente)
    const material = new THREE.MeshBasicMaterial({
        color: 0x000000,
        transparent: true,
        opacity: 0.7,
        depthWrite: false
    });
    
    // Criar duas marcas de derrapagem (uma para cada roda traseira)
    for (let i = -1; i <= 1; i += 2) {
        const skidMark = new THREE.Mesh(geometry, material);
        
        // Posicionar a marca de derrapagem um pouco acima do solo para evitar z-fighting
        skidMark.position.x = position.x + Math.sin(rotation.y) * wheelOffset + i * (wheelWidth / 2) * Math.cos(rotation.y);
        skidMark.position.y = 0.01; // Ligeiramente acima do solo
        skidMark.position.z = position.z + Math.cos(rotation.y) * wheelOffset - i * (wheelWidth / 2) * Math.sin(rotation.y);
        
        // Rotacionar a marca de derrapagem para alinhar com a direção do carro
        skidMark.rotation.y = rotation.y;
        skidMark.rotation.x = -Math.PI / 2; // Rotacionar para ficar plano no chão
        
        // Adicionar à cena
        this.scene.add(skidMark);
        
        // Adicionar à lista de marcas de derrapagem
        this.skidMarks.push({
            mesh: skidMark,
            life: 3.0 // Tempo de vida em segundos
        });
        
        // Remover a marca de derrapagem mais antiga se exceder o limite
        if (this.skidMarks.length > this.maxSkidMarks) {
            const oldestMark = this.skidMarks.shift();
            this.scene.remove(oldestMark.mesh);
            oldestMark.mesh.geometry.dispose();
            oldestMark.mesh.material.dispose();
        }
    }
}

// Método para criar partículas de fumaça
createSkidParticles(position) {
    // Número de partículas a criar
    const particleCount = 5;
    
    // Criar partículas de fumaça para cada roda traseira
    for (let i = -1; i <= 1; i += 2) {
        for (let j = 0; j < particleCount; j++) {
            // Criar uma geometria para a partícula (um pequeno plano)
            const geometry = new THREE.PlaneGeometry(0.5, 0.5);
            
            // Material para a partícula (branco semi-transparente)
            const material = new THREE.MeshBasicMaterial({
                color: 0xDDDDDD,
                transparent: true,
                opacity: 0.3 + Math.random() * 0.3,
                depthWrite: false
            });
            
            const particle = new THREE.Mesh(geometry, material);
            
            // Posição inicial da partícula (próxima à roda traseira)
            const wheelOffset = 1.5;
            const wheelWidth = 0.8;
            
            particle.position.x = position.x + Math.sin(this.car.rotation.y) * wheelOffset + i * (wheelWidth / 2) * Math.cos(this.car.rotation.y);
            particle.position.y = 0.2 + Math.random() * 0.3; // Altura aleatória
            particle.position.z = position.z + Math.cos(this.car.rotation.y) * wheelOffset - i * (wheelWidth / 2) * Math.sin(this.car.rotation.y);
            
            // Velocidade aleatória para a partícula
            const velocity = {
                x: (Math.random() - 0.5) * 0.3,
                y: 0.1 + Math.random() * 0.2,
                z: (Math.random() - 0.5) * 0.3
            };
            
            // Rotação aleatória
            particle.rotation.z = Math.random() * Math.PI * 2;
            
            // Adicionar à cena
            this.scene.add(particle);
            
            // Adicionar à lista de partículas
            this.skidParticles.push({
                mesh: particle,
                velocity: velocity,
                life: 1.0 + Math.random() * 0.5, // Tempo de vida aleatório
                rotationSpeed: (Math.random() - 0.5) * 0.1 // Velocidade de rotação aleatória
            });
        }
    }
}

// Método para atualizar os efeitos de derrapagem
updateSkidEffects() {
    // Atualizar marcas de derrapagem
    for (let i = this.skidMarks.length - 1; i >= 0; i--) {
        const mark = this.skidMarks[i];
        mark.life -= this.deltaTime;
        
        // Diminuir a opacidade gradualmente
        if (mark.life < 1.0) {
            mark.mesh.material.opacity = mark.life * 0.7;
        }
        
        // Remover marca expirada
        if (mark.life <= 0) {
            this.scene.remove(mark.mesh);
            mark.mesh.geometry.dispose();
            mark.mesh.material.dispose();
            this.skidMarks.splice(i, 1);
        }
    }
    
    // Atualizar partículas de fumaça
    for (let i = this.skidParticles.length - 1; i >= 0; i--) {
        const particle = this.skidParticles[i];
        particle.life -= this.deltaTime;
        
        // Mover a partícula
        particle.mesh.position.x += particle.velocity.x * this.deltaTime;
        particle.mesh.position.y += particle.velocity.y * this.deltaTime;
        particle.mesh.position.z += particle.velocity.z * this.deltaTime;
        
        // Expandir a partícula gradualmente
        const scale = 1.0 + (1.0 - particle.life) * 2.0;
        particle.mesh.scale.set(scale, scale, scale);
        
        // Rotacionar a partícula
        particle.mesh.rotation.z += particle.rotationSpeed;
        
        // Diminuir a opacidade gradualmente
        particle.mesh.material.opacity = particle.life * 0.6;
        
        // Remover partícula expirada
        if (particle.life <= 0) {
            this.scene.remove(particle.mesh);
            particle.mesh.geometry.dispose();
            particle.mesh.material.dispose();
            this.skidParticles.splice(i, 1);
        }
    }
}


    // Adicionar método para coletar moeda
collectCoin() {
    // Adicionar uma moeda ao contador
    addCoins(1);
    
    // Reproduzir som de moeda
    this.playCoinSound();
}

// Adicionar método para reproduzir som de moeda
playCoinSound() {
    // Verificar se o áudio está disponível
    if (!this.coinSound) {
        // Criar elemento de áudio
        this.coinSound = new Audio('assets/coin.mp3');
        this.coinSound.volume = 0.3;
    }
    
    // Clonar o som para permitir sobreposição
    const sound = this.coinSound.cloneNode();
    sound.play();
}

    // Adicionar método para configurar luzes
setupLights() {
    // Luz ambiente
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);
    
    // Luz direcional (sol)
    const sunLight = new THREE.DirectionalLight(0xffffff, 0.8);
    sunLight.position.set(100, 100, 0);
    sunLight.castShadow = true;
    
    // Configurar sombras
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 500;
    sunLight.shadow.camera.left = -100;
    sunLight.shadow.camera.right = 100;
    sunLight.shadow.camera.top = 100;
    sunLight.shadow.camera.bottom = -100;
    
    this.scene.add(sunLight);
    
    // Luz hemisférica para iluminação natural
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.6);
    hemiLight.position.set(0, 300, 0);
    this.scene.add(hemiLight);
}

    // Adicionar método para atualizar o modelo do carro
updateCarModel(carType) {
    // Salvar a posição e velocidade atuais
    const position = this.car ? { ...this.car.position } : { x: 0, y: 0, z: 0 };
    const speed = this.car ? this.car.speed : CONFIG.car.speed;
    
    // Remover o carro atual da cena
    if (this.car && this.car.mesh) {
        this.scene.remove(this.car.mesh);
    }
    
    // Criar novo carro com o tipo selecionado
    this.car = new Car(this.scene, carType);
    
    // Restaurar posição e velocidade
    this.car.position = position;
    this.car.speed = speed;
    this.car.mesh.position.x = position.x;
    this.car.mesh.position.z = position.z;
}
    
    setupLights() {
        // Luz ambiente
        const ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.5);
        this.scene.add(ambientLight);
        
        // Luz direcional (sol)
        const directionalLight = new THREE.DirectionalLight(0xFFFFFF, 0.8);
        directionalLight.position.set(100, 100, 50);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 1024;
        directionalLight.shadow.mapSize.height = 1024;
        directionalLight.shadow.camera.far = 500;
        directionalLight.shadow.camera.left = -100;
        directionalLight.shadow.camera.right = 100;
        directionalLight.shadow.camera.top = 100;
        directionalLight.shadow.camera.bottom = -100;
        this.scene.add(directionalLight);
    }
    
    setupEventListeners() {
        // Event listeners para teclado
        window.addEventListener('keydown', this.keyDownHandler);
        window.addEventListener('keyup', this.keyUpHandler);
        
        // Event listeners para touch (mesmo se estiver usando controles móveis)
        document.getElementById('game-container').addEventListener('touchstart', this.touchStartHandler, { passive: false });
        document.getElementById('game-container').addEventListener('touchmove', this.touchMoveHandler, { passive: false });
        document.getElementById('game-container').addEventListener('touchend', this.touchEndHandler, { passive: false });
        
        // Event listener para redimensionamento da janela
        window.addEventListener('resize', this.resizeHandler);
        
        // Event listener para botão de reinício
        document.getElementById('restart-button').addEventListener('click', () => this.restart());
    }
    
    removeEventListeners() {
        window.removeEventListener('keydown', this.keyDownHandler);
        window.removeEventListener('keyup', this.keyUpHandler);
        
        document.getElementById('game-container').removeEventListener('touchstart', this.touchStartHandler);
        document.getElementById('game-container').removeEventListener('touchmove', this.touchMoveHandler);
        document.getElementById('game-container').removeEventListener('touchend', this.touchEndHandler);
        
        window.removeEventListener('resize', this.resizeHandler);
    }

    
    
    handleKeyDown(e) {
        if (!this.gameActive) return;
        
        // Verificar se estamos usando controles móveis
        if (this.mobileControls && this.mobileControls.isActive) {
            // Se estamos no mobile, não processar teclas
            return;
        }
        
        switch(e.key) {
            case 'ArrowLeft':
                this.inputDirection = -1;
                break;
            case 'ArrowRight':
                this.inputDirection = 1;
                break;
            case 'ArrowDown':
                this.braking = true;
                this.targetSpeed = CONFIG.car.speed * 0.4; // Reduzir para 40% da velocidade durante a frenagem
            break;
        }
    }
    
    handleKeyUp(e) {
        if (!this.gameActive) return;
        
        // Verificar se estamos usando controles móveis
        if (this.mobileControls && this.mobileControls.isActive) {
            // Se estamos no mobile, não processar teclas
            return;
        }
        
        switch(e.key) {
            case 'ArrowLeft':
                if (this.inputDirection === -1) this.inputDirection = 0;
                break;
            case 'ArrowRight':
                if (this.inputDirection === 1) this.inputDirection = 0;
                break;
            case 'ArrowDown':
                this.braking = false;
                this.targetSpeed = CONFIG.car.speed; // Voltar à velocidade normal quando soltar a tecla
                break;
        }
    }
    
    handleTouchStart(event) {
        event.preventDefault();
        if (event.touches.length > 0) {
            this.lastTouchX = event.touches[0].clientX;
            this.touchActive = true;
        }
    }
    
    handleTouchMove(event) {
        if (!this.gameActive || !this.touchActive) return;

        event.preventDefault();

        if (event.touches.length > 0) {
            const touchX = event.touches[0].clientX;
            const diffX = touchX - this.lastTouchX;
            
            // Usar um threshold maior para movimentos no mobile
            const threshold = 3;

            if (diffX > threshold) {
                this.inputDirection = 1;
            } else if (diffX < -threshold) {
                this.inputDirection = -1;
            } else {
                // Não resetar para 0 em movimentos pequenos para evitar game over acidental
                // this.inputDirection = 0;
            }
            
            this.lastTouchX = touchX;
        }
    }
    

    // Adicionar um novo método para encerrar o toque
    handleTouchEnd(event) {
        if (!this.gameActive) return;
        
        event.preventDefault();
        this.touchActive = false;
        this.inputDirection = 0; // Resetar direção quando soltar
    }

    handleResize() {
        // Atualizar câmera e renderer quando a janela for redimensionada
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
    
    start() {
        this.gameActive = true;
        this.animate();
    }
    
    stop() {
        this.gameActive = false;
        this.showGameOver();
    }
    
    restart() {
        // Esconder game over
        document.getElementById('game-over').style.display = 'none';

        removeLogoutButton()

        // Resetar elementos do jogo
        this.car.reset();
        this.track.reset();
        this.obstacleManager.reset();
        
        // Resetar stats
        this.resetStats();

        if (this.coinManager) {
            this.coinManager.reset();
        }
        
        // Reiniciar o jogo
        this.start();
    }
    
    resetStats() {
        this.elapsedTime = 0;
        this.coins = 0;
        this.nextCoinTime = CONFIG.game.coinInterval;
        
        // Atualizar UI
        document.getElementById('time').textContent = '0';
        document.getElementById('coins').textContent = '0';
        document.getElementById('turns').textContent = '0';
        document.getElementById('obstacles').textContent = '0';
    }
    
    // Modificar a função showGameOver para atualizar estatísticas
    showGameOver() {
        // Adicionar botão de logout
        addLogoutButton();
        // Atualizar estatísticas finais
        const gameTime = Math.floor(this.elapsedTime);
        const gameCoins = this.coins;
        const gameTurns = this.track.getTurnCount();
        const gameObstacles = this.obstacleManager.getAvoidedCount();
        
        document.getElementById('total-time').textContent = gameTime;
        document.getElementById('total-coins').textContent = gameCoins;
        document.getElementById('total-turns').textContent = gameTurns;
        document.getElementById('total-obstacles').textContent = gameObstacles;
        
        // Atualizar o recorde na tela
        const bestTimeElement = document.getElementById('best-time');
        if (bestTimeElement) {
            bestTimeElement.textContent = bestGameTime;
        }
        // Atualizar estatísticas globais
        totalTimePlayed += gameTime;
        totalObstaclesPassed += gameObstacles;
        totalTurnsMade += gameTurns;
        gamesPlayed += 1;
        
        // Verificar se é um novo recorde de tempo
        if (gameTime > bestGameTime) {
            bestGameTime = gameTime;
            
            // Mostrar mensagem de novo recorde
            const recordMessage = document.createElement('p');
            recordMessage.textContent = '🏆 NOVO RECORDE DE TEMPO! 🏆';
            recordMessage.style.color = 'gold';
            recordMessage.style.fontWeight = 'bold';
            recordMessage.style.fontSize = '1.2em';
            recordMessage.style.marginTop = '10px';
            
            // Inserir a mensagem no início do game-over
            const gameOverDiv = document.getElementById('game-over');
            gameOverDiv.insertBefore(recordMessage, gameOverDiv.firstChild.nextSibling);
            
            // Remover a mensagem após alguns segundos
            setTimeout(() => {
                if (recordMessage.parentNode) {
                    recordMessage.parentNode.removeChild(recordMessage);
                }
            }, 5000);
        }
        
        // Adicionar moedas coletadas ao total
        addCoins(gameCoins);
        
        // Salvar dados no Firestore
        saveUserData();
        
        // Mostrar modal de game over
        document.getElementById('game-over').style.display = 'block';
        
        // Verificar se o botão da loja já existe
        if (!document.getElementById('open-shop-btn')) {
            // Adicionar botão para abrir a loja
            const shopButton = document.createElement('button');
            shopButton.id = 'open-shop-btn';
            shopButton.textContent = 'Loja de Carros';
            shopButton.style.marginTop = '10px';
            shopButton.style.backgroundColor = '#FFC107';
            shopButton.style.color = 'black';
            shopButton.style.border = 'none';
            shopButton.style.padding = '10px 20px';
            shopButton.style.borderRadius = '5px';
            shopButton.style.cursor = 'pointer';
            
            // Adicionar evento de clique para abrir a loja
            shopButton.addEventListener('click', () => {
                document.getElementById('game-over').style.display = 'none';
                openShop();
            });
            
            // Adicionar botão ao modal de game over
            document.getElementById('game-over').appendChild(shopButton);
        }

        // Parar o carro
        this.car.speed = 0;
    }
    
    update(deltaTime) {
        if (!this.gameActive) return;

        // Salvar o deltaTime para uso nos efeitos de derrapagem
        this.deltaTime = deltaTime;
    
        // Atualizar elementos do jogo
        this.elapsedTime += deltaTime;
        
        // Atualizar carro
        this.car.update(deltaTime, this.inputDirection);
        
        // Atualizar pista e paisagem
        this.track.update(this.car.position);
        
        // Atualizar obstáculos
        this.obstacleManager.update(deltaTime, this.car.position);

        // Atualizar moedas
        this.coinManager.update(deltaTime, this.car.position);
    

        document.getElementById('time').textContent = Math.floor(this.elapsedTime);
        
        // Verificar se é hora de adicionar moeda
        if (this.elapsedTime >= this.nextCoinTime) {
            this.coins++;
            this.nextCoinTime += CONFIG.game.coinInterval;
            document.getElementById('coins').textContent = this.coins;
        }

        // Verificar se o carro saiu da pista
        if (this.car.isOffTrack(this.track)) {
            this.stop();
            return; // Importante: retornar imediatamente para não continuar a atualização
        }
        
        // Atualizar contador de curvas
        document.getElementById('turns').textContent = this.track.getTurnCount();
        
        // Atualizar contador de obstáculos
        document.getElementById('obstacles').textContent = this.obstacleManager.getAvoidedCount();
        
        // Atualizar a velocidade baseada no estado de frenagem/aceleração
        this.updateSpeed();
        
        // Atualizar efeitos de derrapagem mesmo quando não está freando
        this.updateSkidEffects();
        
        // Aumentar dificuldade gradualmente com base na pontuação
        this.car.increaseDifficulty(this.obstacleManager.getAvoidedCount());
        
        // Atualizar câmera para seguir o carro
        this.camera.position.z = this.car.position.z - 10;
        this.camera.lookAt(
            this.car.position.x,
            this.car.position.y,
            this.car.position.z + 10
        );
        
        // Atualizar pista gerando novos segmentos conforme necessário
        this.track.update(this.car.position);
        
        // Atualizar obstáculos
        this.obstacleManager.update(deltaTime, this.car.position);
        
        // Verificar colisões com obstáculos
        if (this.obstacleManager.checkCollisions(this.car.position)) {
            this.stop();
            return; // Importante: retornar imediatamente para não continuar a atualização
        }
    }
    
    animate() {
        if (!this.gameActive) return;
        
        const deltaTime = this.clock.getDelta();
        
        // Atualizar lógica do jogo
        this.update(deltaTime);
        
        // Renderizar cena
        this.renderer.render(this.scene, this.camera);
        
        // Chamar próximo frame
        requestAnimationFrame(() => this.animate());
    }
    
    cleanup() {
        // Remover event listeners
        this.removeEventListeners();
        
        // Remover controles móveis
        if (this.mobileControls && this.mobileControls.isActive) {
            this.mobileControls.remove();
        }
        
        // Remover renderer
        this.renderer.dispose();
        document.getElementById('game-container').removeChild(this.renderer.domElement);
    }

    
}