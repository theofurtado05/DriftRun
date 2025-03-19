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
            
            // Opcional: Adicionar efeito de derrapagem
            if (this.car && this.currentSpeed > this.targetSpeed * 1.5) {
                // Criar efeito de derrapagem aqui
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
        }
        
        // Atualizar a velocidade do carro
        if (this.car) {
            this.car.speed = this.currentSpeed;
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
        
        // Event listeners para touch (apenas se não estiver usando controles móveis)
        if (!this.mobileControls || !this.mobileControls.isActive) {
            window.addEventListener('touchstart', this.touchStartHandler);
            window.addEventListener('touchmove', this.touchMoveHandler);
        }
        
        // Event listener para redimensionamento da janela
        window.addEventListener('resize', this.resizeHandler);
        
        // Event listener para botão de reinício
        document.getElementById('restart-button').addEventListener('click', () => this.restart());
    }
    
    removeEventListeners() {
        window.removeEventListener('keydown', this.keyDownHandler);
        window.removeEventListener('keyup', this.keyUpHandler);
        
        if (!this.mobileControls || !this.mobileControls.isActive) {
            window.removeEventListener('touchstart', this.touchStartHandler);
            window.removeEventListener('touchmove', this.touchMoveHandler);
        }
        
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
        }
    }
    
    handleTouchMove(event) {
        event.preventDefault();
        if (event.touches.length > 0) {
            const touchX = event.touches[0].clientX;
            const diffX = touchX - this.lastTouchX;
            
            if (diffX > 5) {
                this.inputDirection = 1;
            } else if (diffX < -5) {
                this.inputDirection = -1;
            } else {
                this.inputDirection = 0;
            }
            
            this.lastTouchX = touchX;
        }
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