// Classe para gerenciar controles móveis
class MobileControls {
    constructor(game) {
        this.game = game;
        this.isMobile = this.checkMobile();
        this.isActive = false;
        this.steeringWheel = null;
        this.steeringKnob = null;
        this.centerX = 0;
        this.centerY = 0;
        this.touchX = 0;
        this.touchY = 0;
        this.angle = 0;
        this.maxRotation = 90;
        this.sensitivity = 2.5; // Aumentado para melhor resposta
        this.touchId = null;
        
        // Inicializar apenas se for dispositivo móvel
        if (this.isMobile) {
            this.init();
        }
    }
    
    checkMobile() {
        // return false
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }
    
    init() {
        // Criar o elemento do volante
        this.steeringWheel = document.createElement('div');
        this.steeringWheel.className = 'steering-wheel';
        document.getElementById('game-container').appendChild(this.steeringWheel);
        
        // Criar a bolinha do volante
        this.steeringKnob = document.createElement('div');
        this.steeringKnob.className = 'steering-knob';
        this.steeringWheel.appendChild(this.steeringKnob);
        
        // Adicionar eventos de toque
        this.steeringWheel.addEventListener('touchstart', this.handleTouchStart.bind(this));
        document.addEventListener('touchmove', this.handleTouchMove.bind(this));
        document.addEventListener('touchend', this.handleTouchEnd.bind(this));
        document.addEventListener('touchcancel', this.handleTouchEnd.bind(this));
        
        // Adicionar botão de aceleração
        this.createAccelerateButton();
        
        // Ativar controles
        this.isActive = true;
        
        // Adicionar texto de instrução
        const instructions = document.createElement('div');
        instructions.className = 'mobile-instructions';
        instructions.textContent = 'Gire o volante para dirigir';
        document.getElementById('game-container').appendChild(instructions);
        
        // Esconder após 5 segundos
        setTimeout(() => {
            instructions.style.opacity = '0';
            setTimeout(() => {
                instructions.remove();
            }, 1000);
        }, 5000);
    }
    
    createAccelerateButton() {
        // Criar botão de aceleração (opcional)
        this.accelerateButton = document.createElement('div');
        this.accelerateButton.className = 'accelerate-button';
        this.accelerateButton.textContent = '🏁';
        document.getElementById('game-container').appendChild(this.accelerateButton);
        
        // Adicionar evento de toque
        this.accelerateButton.addEventListener('touchstart', (e) => {
            e.preventDefault();
            // Aumentar velocidade do carro
            if (this.game && this.game.car) {
                this.game.car.speed *= 1.5; // Aumentar velocidade em 50%
            }
        });
        
        this.accelerateButton.addEventListener('touchend', (e) => {
            e.preventDefault();
            // Voltar à velocidade normal
            if (this.game && this.game.car) {
                this.game.car.speed /= 1.5;
            }
        });
    }
    
    handleTouchStart(e) {
        e.preventDefault();
        
        // Armazenar o ID do toque para rastreamento
        this.touchId = e.touches[0].identifier;
        
        const touch = e.touches[0];
        const rect = this.steeringWheel.getBoundingClientRect();
        
        this.centerX = rect.left + rect.width / 2;
        this.centerY = rect.top + rect.height / 2;
        this.touchX = touch.clientX;
        this.touchY = touch.clientY;
        
        // Posicionar a bolinha na posição inicial do toque
        this.updateKnobPosition(touch.clientX, touch.clientY);
    }
    
    // Modificar o método handleTouchMove
    handleTouchMove(e) {
        if (!this.touchId) return;
        
        // Encontrar o toque que estamos rastreando
        let touch = null;
        for (let i = 0; i < e.touches.length; i++) {
            if (e.touches[i].identifier === this.touchId) {
                touch = e.touches[i];
                break;
            }
        }
        
        if (!touch) return;
        
        e.preventDefault();
        
        this.touchX = touch.clientX;
        this.touchY = touch.clientY;
        
        // Atualizar posição da bolinha
        this.updateKnobPosition(this.touchX, this.touchY);
        
        // Calcular a direção com base na posição do toque
        const deltaX = this.touchX - this.centerX;
        const deltaY = this.touchY - this.centerY;
        
        // Calcular distância do centro
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        const maxDistance = this.steeringWheel.offsetWidth / 2;
        const normalizedDistance = Math.min(distance / maxDistance, 1);
        
        // Calcular ângulo do volante
        this.angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);
        
        // Ajustar para que a rotação horizontal seja a principal
        if (this.angle > 90) this.angle = 180 - this.angle;
        if (this.angle < -90) this.angle = -180 - this.angle;
        
        // Limitar rotação
        this.angle = Math.max(-this.maxRotation, Math.min(this.maxRotation, this.angle));
        
        // Aplicar rotação ao volante
        this.steeringWheel.style.transform = `rotate(${this.angle}deg)`;
        
        // Converter ângulo para direção (-1 a 1) com sensibilidade aumentada
        const direction = (this.angle / this.maxRotation) * normalizedDistance * this.sensitivity;
        
        // Atualizar direção no jogo apenas se estivermos no mobile
        if (this.game && this.isActive) {
            this.game.inputDirection = direction;
        }
    }
    
    updateKnobPosition(x, y) {
        // Calcular posição relativa ao centro do volante
        const deltaX = x - this.centerX;
        const deltaY = y - this.centerY;
        
        // Calcular distância do centro
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        
        // Limitar a distância máxima (raio do volante)
        const maxDistance = this.steeringWheel.offsetWidth / 2 - this.steeringKnob.offsetWidth / 2;
        const limitedDistance = Math.min(distance, maxDistance);
        
        // Calcular a posição limitada
        const angle = Math.atan2(deltaY, deltaX);
        const limitedX = Math.cos(angle) * limitedDistance;
        const limitedY = Math.sin(angle) * limitedDistance;
        
        // Aplicar a posição à bolinha
        this.steeringKnob.style.transform = `translate(${limitedX}px, ${limitedY}px)`;
    }
    
    handleTouchEnd(e) {
        // Verificar se o toque que terminou é o que estamos rastreando
        let touchFound = false;
        for (let i = 0; i < e.touches.length; i++) {
            if (e.touches[i].identifier === this.touchId) {
                touchFound = true;
                break;
            }
        }
        
        // Se o toque que estamos rastreando terminou
        if (!touchFound) {
            e.preventDefault();
            
            // Resetar o ID do toque
            this.touchId = null;
            
            // Retornar volante à posição central com animação
            this.angle = 0;
            this.steeringWheel.style.transform = 'rotate(0deg)';
            this.steeringWheel.style.transition = 'transform 0.3s ease-out';
            
            // Retornar a bolinha ao centro
            this.steeringKnob.style.transform = 'translate(0px, 0px)';
            this.steeringKnob.style.transition = 'transform 0.3s ease-out';
            
            // Remover a transição após a animação
            setTimeout(() => {
                this.steeringWheel.style.transition = '';
                this.steeringKnob.style.transition = '';
            }, 300);
            
            // Resetar direção apenas se estivermos no mobile
            if (this.game && this.isActive) {
                this.game.inputDirection = 0;
            }
        }
    }
    
    remove() {
        if (this.steeringWheel) {
            this.steeringWheel.removeEventListener('touchstart', this.handleTouchStart);
            document.removeEventListener('touchmove', this.handleTouchMove);
            document.removeEventListener('touchend', this.handleTouchEnd);
            document.removeEventListener('touchcancel', this.handleTouchEnd);
            
            document.getElementById('game-container').removeChild(this.steeringWheel);
            this.steeringWheel = null;
        }
        
        if (this.accelerateButton) {
            document.getElementById('game-container').removeChild(this.accelerateButton);
            this.accelerateButton = null;
        }
        
        this.isActive = false;
    }
}