// Classe para gerenciar controles móveis
class MobileControls {
    constructor(game) {
        this.game = game;
        this.isMobile = this.checkMobile();
        this.isActive = false;
        this.leftButton = null;
        this.rightButton = null;
        this.brakeButton = null;
        this.touchIdLeft = null;
        this.touchIdRight = null;
        this.touchIdBrake = null;
        
        // Inicializar apenas se for dispositivo móvel
        if (this.isMobile) {
            this.init();
        }
    }
    
    checkMobile() {
        // Detecção de dispositivos móveis ou telas pequenas
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }
    
    init() {
        console.log("Inicializando controles móveis");
        
        // Criar container dos controles móveis para direção (setas)
        this.directionsContainer = document.createElement('div');
        this.directionsContainer.className = 'directions-container';
        document.getElementById('game-container').appendChild(this.directionsContainer);
        
        // Criar botão para esquerda
        this.leftButton = document.createElement('div');
        this.leftButton.className = 'direction-button left-button';
        this.leftButton.innerHTML = '&#9664;'; // Seta para esquerda
        this.directionsContainer.appendChild(this.leftButton);
        
        // Criar botão para direita
        this.rightButton = document.createElement('div');
        this.rightButton.className = 'direction-button right-button';
        this.rightButton.innerHTML = '&#9654;'; // Seta para direita
        this.directionsContainer.appendChild(this.rightButton);
        
        // Criar botão de freio (separado do container de setas)
        this.brakeButton = document.createElement('div');
        this.brakeButton.className = 'brake-button';
        this.brakeButton.innerHTML = '&#128721;'; // Símbolo de freio
        document.getElementById('game-container').appendChild(this.brakeButton);
        
        // Adicionar estilos CSS para os controles
        this.addStyles();
        
        // Adicionar eventos de toque
        this.addTouchEvents();
        
        // Adicionar eventos de mouse (para testes em desktop)
        this.addMouseEvents();
        
        // Ativar controles
        this.isActive = true;
        
        console.log("Controles móveis inicializados");
    }
    
    addStyles() {
        // Verificar se os estilos já foram adicionados
        if (document.getElementById('mobile-controls-styles')) return;
        
        // Adicionar estilos CSS dinamicamente
        const styleElement = document.createElement('style');
        styleElement.id = 'mobile-controls-styles';
        styleElement.textContent = `
            .directions-container {
                position: fixed;
                bottom: 55px;
                left: 20px;
                z-index: 1000;
                display: flex;
                flex-direction: row;
                gap: 15px;
            }
            
            .direction-button {
                width: 70px;
                height: 70px;
                background-color: rgba(0, 0, 0, 0.5);
                border-radius: 50%;
                display: flex;
                justify-content: center;
                align-items: center;
                color: white;
                font-size: 32px;
                touch-action: none;
                user-select: none;
                -webkit-user-select: none;
                cursor: pointer;
            }
            
            .left-button:active, .left-button.active {
                background-color: rgba(0, 0, 255, 0.6);
            }
            
            .right-button:active, .right-button.active {
                background-color: rgba(0, 0, 255, 0.6);
            }
            
            .brake-button {
                width: 70px;
                height: 70px;
                background-color: rgba(255, 0, 0, 0.6);
                border-radius: 50%;
                display: flex;
                justify-content: center;
                align-items: center;
                color: white;
                font-size: 28px;
                position: fixed;
                bottom: 55px;
                right: 20px;
                touch-action: none;
                user-select: none;
                -webkit-user-select: none;
                cursor: pointer;
                z-index: 1000;
            }
            
            .brake-button:active, .brake-button.active {
                background-color: rgba(255, 0, 0, 0.8);
            }
            
            @media (min-width: 769px) {
                /* Esconder em dispositivos não-móveis */
                .directions-container, .brake-button {
                    display: none;
                }
            }
        `;
        document.head.appendChild(styleElement);
    }
    
    addTouchEvents() {
        // Botão esquerda
        this.leftButton.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.touchIdLeft = e.touches[0].identifier;
            this.leftButton.classList.add('active');
            if (this.game && this.isActive) {
                this.game.inputDirection = -1;
            }
        });
        
        this.leftButton.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.touchIdLeft = null;
            this.leftButton.classList.remove('active');
            if (this.game && this.isActive && this.touchIdRight === null) {
                this.game.inputDirection = 0;
            }
        });
        
        this.leftButton.addEventListener('touchcancel', (e) => {
            e.preventDefault();
            this.touchIdLeft = null;
            this.leftButton.classList.remove('active');
            if (this.game && this.isActive && this.touchIdRight === null) {
                this.game.inputDirection = 0;
            }
        });
        
        // Botão direita
        this.rightButton.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.touchIdRight = e.touches[0].identifier;
            this.rightButton.classList.add('active');
            if (this.game && this.isActive) {
                this.game.inputDirection = 1;
            }
        });
        
        this.rightButton.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.touchIdRight = null;
            this.rightButton.classList.remove('active');
            if (this.game && this.isActive && this.touchIdLeft === null) {
                this.game.inputDirection = 0;
            }
        });
        
        this.rightButton.addEventListener('touchcancel', (e) => {
            e.preventDefault();
            this.touchIdRight = null;
            this.rightButton.classList.remove('active');
            if (this.game && this.isActive && this.touchIdLeft === null) {
                this.game.inputDirection = 0;
            }
        });
        
        // Botão de freio
        this.brakeButton.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.touchIdBrake = e.touches[0].identifier;
            this.brakeButton.classList.add('active');
            if (this.game && this.isActive) {
                this.game.braking = true;
                this.game.targetSpeed = CONFIG.car.speed * 0.4;
            }
        });
        
        this.brakeButton.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.touchIdBrake = null;
            this.brakeButton.classList.remove('active');
            if (this.game && this.isActive) {
                this.game.braking = false;
                this.game.targetSpeed = CONFIG.car.speed;
            }
        });
        
        this.brakeButton.addEventListener('touchcancel', (e) => {
            e.preventDefault();
            this.touchIdBrake = null;
            this.brakeButton.classList.remove('active');
            if (this.game && this.isActive) {
                this.game.braking = false;
                this.game.targetSpeed = CONFIG.car.speed;
            }
        });
    }
    
    // Adicionar suporte a mouse para testes em desktop
    addMouseEvents() {
        // Botão esquerda
        this.leftButton.addEventListener('mousedown', (e) => {
            this.leftButton.classList.add('active');
            if (this.game && this.isActive) {
                this.game.inputDirection = -1;
            }
        });
        
        // Botão direita
        this.rightButton.addEventListener('mousedown', (e) => {
            this.rightButton.classList.add('active');
            if (this.game && this.isActive) {
                this.game.inputDirection = 1;
            }
        });
        
        // Botão de freio
        this.brakeButton.addEventListener('mousedown', (e) => {
            this.brakeButton.classList.add('active');
            if (this.game && this.isActive) {
                this.game.braking = true;
                this.game.targetSpeed = CONFIG.car.speed * 0.4;
            }
        });
        
        // Eventos globais de mouseup
        document.addEventListener('mouseup', (e) => {
            this.leftButton.classList.remove('active');
            this.rightButton.classList.remove('active');
            this.brakeButton.classList.remove('active');
            
            if (this.game && this.isActive) {
                this.game.inputDirection = 0;
                this.game.braking = false;
                this.game.targetSpeed = CONFIG.car.speed;
            }
        });
        
        // Evitar arrasto de elementos
        [this.leftButton, this.rightButton, this.brakeButton].forEach(btn => {
            btn.addEventListener('dragstart', (e) => e.preventDefault());
        });
    }
    
    remove() {
        if (this.directionsContainer) {
            // Remover o container de direções
            document.getElementById('game-container').removeChild(this.directionsContainer);
            this.directionsContainer = null;
        }
        
        if (this.brakeButton && this.brakeButton.parentNode) {
            // Remover o botão de freio
            document.getElementById('game-container').removeChild(this.brakeButton);
            this.brakeButton = null;
        }
        
        this.leftButton = null;
        this.rightButton = null;
        this.isActive = false;
        
        console.log("Controles móveis removidos");
    }
}