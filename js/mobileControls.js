// Classe para gerenciar controles móveis
class MobileControls {
    constructor(game) {
        this.game = game;
        this.isMobile = this.checkMobile();
        this.isActive = false;
        this.steeringWheel = null;
        this.centerX = 0;
        this.centerY = 0;
        this.touchX = 0;
        this.touchY = 0;
        this.angle = 0;
        this.maxRotation = 90; // Rotação máxima em graus
        
        if (this.isMobile) {
            this.init();
        }
    }
    
    checkMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }
    
    init() {
        // Criar o elemento do volante
        this.steeringWheel = document.createElement('div');
        this.steeringWheel.className = 'steering-wheel';
        document.getElementById('game-container').appendChild(this.steeringWheel);
        
        // Adicionar eventos de toque
        this.steeringWheel.addEventListener('touchstart', this.handleTouchStart.bind(this));
        this.steeringWheel.addEventListener('touchmove', this.handleTouchMove.bind(this));
        this.steeringWheel.addEventListener('touchend', this.handleTouchEnd.bind(this));
        
        // Ativar controles
        this.isActive = true;
    }
    
    handleTouchStart(e) {
        e.preventDefault();
        
        const touch = e.touches[0];
        const rect = this.steeringWheel.getBoundingClientRect();
        
        this.centerX = rect.left + rect.width / 2;
        this.centerY = rect.top + rect.height / 2;
        this.touchX = touch.clientX;
        this.touchY = touch.clientY;
    }
    
    handleTouchMove(e) {
        e.preventDefault();
        
        const touch = e.touches[0];
        const deltaX = touch.clientX - this.centerX;
        const deltaY = touch.clientY - this.centerY;
        
        // Calcular ângulo do volante
        this.angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI);
        
        // Ajustar para que a rotação horizontal seja a principal
        // 0 graus é para a direita, 180/-180 é para a esquerda
        if (this.angle > 90) this.angle = 180 - this.angle;
        if (this.angle < -90) this.angle = -180 - this.angle;
        
        // Limitar rotação
        this.angle = Math.max(-this.maxRotation, Math.min(this.maxRotation, this.angle));
        
        // Aplicar rotação ao volante
        this.steeringWheel.style.transform = `rotate(${this.angle}deg)`;
        
        // Converter ângulo para direção (-1 a 1)
        const direction = this.angle / this.maxRotation;
        
        // Atualizar direção no jogo
        if (this.game) {
            this.game.inputDirection = direction;
        }
    }
    
    handleTouchEnd(e) {
        e.preventDefault();
        
        // Retornar volante à posição central
        this.angle = 0;
        this.steeringWheel.style.transform = 'rotate(0deg)';
        
        // Resetar direção
        if (this.game) {
            this.game.inputDirection = 0;
        }
    }
    
    remove() {
        if (this.steeringWheel) {
            this.steeringWheel.removeEventListener('touchstart', this.handleTouchStart);
            this.steeringWheel.removeEventListener('touchmove', this.handleTouchMove);
            this.steeringWheel.removeEventListener('touchend', this.handleTouchEnd);
            
            document.getElementById('game-container').removeChild(this.steeringWheel);
            this.steeringWheel = null;
        }
        
        this.isActive = false;
    }
}