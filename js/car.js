// Classe para gerenciar o carro
class Car {
    constructor(scene, carType = 'default') {
        this.scene = scene;
        this.position = { x: 0, y: 1.2, z: 0 };
        this.speed = CONFIG.car.speed;
        this.driftForce = 0;
        this.rotation = 0;
        this.mesh = null;
        this.carType = carType;
        
        this.createCarMesh();
    }

    createCarMesh() {
        // Grupo para o carro
        this.mesh = new THREE.Group();
        
        // Definir cores com base no tipo de carro
        let bodyColor, roofColor;
        
        switch(this.carType) {
            case 'beetle':
                bodyColor = 0xFFD700; // Amarelo
                roofColor = 0xE6C200; // Amarelo mais escuro
                break;
            case 'lambo':
                bodyColor = 0xFF8C00; // Laranja
                roofColor = 0xE67300; // Laranja mais escuro
                break;
            default:
                bodyColor = CONFIG.colors.car;
                roofColor = CONFIG.colors.carRoof;
        }
        
        // Criar corpo do carro
        let carGeometry;
        
        if (this.carType === 'beetle') {
            // Geometria do Fusca (mais arredondada)
            carGeometry = new THREE.BoxGeometry(CONFIG.car.width, CONFIG.car.height * 0.8, CONFIG.car.length * 0.9);
        } else if (this.carType === 'lambo') {
            // Geometria da Lamborghini (mais baixa e longa)
            carGeometry = new THREE.BoxGeometry(CONFIG.car.width, CONFIG.car.height * 0.6, CONFIG.car.length * 1.1);
        } else {
            // Geometria do carro padrão
            carGeometry = new THREE.BoxGeometry(CONFIG.car.width, CONFIG.car.height, CONFIG.car.length);
        }
        
        const carMaterial = new THREE.MeshPhongMaterial({ color: bodyColor });
        const carBody = new THREE.Mesh(carGeometry, carMaterial);
        carBody.castShadow = true;
        this.mesh.add(carBody);
        
        // Criar teto do carro (diferente para cada tipo)
        let roofGeometry;
        
        if (this.carType === 'beetle') {
            // Teto do Fusca (mais arredondado)
            roofGeometry = new THREE.BoxGeometry(CONFIG.car.width * 0.8, CONFIG.car.height * 0.5, CONFIG.car.length * 0.5);
        } else if (this.carType === 'lambo') {
            // Teto da Lamborghini (mais baixo e aerodinâmico)
            roofGeometry = new THREE.BoxGeometry(CONFIG.car.width * 0.7, CONFIG.car.height * 0.3, CONFIG.car.length * 0.6);
        } else {
            // Teto do carro padrão
            roofGeometry = new THREE.BoxGeometry(CONFIG.car.width * 0.8, CONFIG.car.height * 0.5, CONFIG.car.length * 0.6);
        }
        
        const roofMaterial = new THREE.MeshPhongMaterial({ color: roofColor });
        const roof = new THREE.Mesh(roofGeometry, roofMaterial);
        roof.position.y = CONFIG.car.height * 0.5;
        roof.position.z = -CONFIG.car.length * 0.1;
        roof.castShadow = true;
        this.mesh.add(roof);
        
        // Adicionar rodas
        const wheelGeometry = new THREE.CylinderGeometry(0.5, 0.5, 0.4, 16);
        const wheelMaterial = new THREE.MeshPhongMaterial({ color: CONFIG.colors.wheel });
        
        // Posições das rodas (ajustadas para cada tipo de carro)
        const wheelPositions = [];
        
        if (this.carType === 'beetle') {
            // Posições das rodas do Fusca
            wheelPositions.push(
                { x: -CONFIG.car.width/2 - 0.2, y: -CONFIG.car.height/2, z: CONFIG.car.length/3 },
                { x: CONFIG.car.width/2 + 0.2, y: -CONFIG.car.height/2, z: CONFIG.car.length/3 },
                { x: -CONFIG.car.width/2 - 0.2, y: -CONFIG.car.height/2, z: -CONFIG.car.length/3 },
                { x: CONFIG.car.width/2 + 0.2, y: -CONFIG.car.height/2, z: -CONFIG.car.length/3 }
            );
        } else if (this.carType === 'lambo') {
            // Posições das rodas da Lamborghini
            wheelPositions.push(
                { x: -CONFIG.car.width/2 - 0.2, y: -CONFIG.car.height/2, z: CONFIG.car.length/2.5 },
                { x: CONFIG.car.width/2 + 0.2, y: -CONFIG.car.height/2, z: CONFIG.car.length/2.5 },
                { x: -CONFIG.car.width/2 - 0.2, y: -CONFIG.car.height/2, z: -CONFIG.car.length/2.5 },
                { x: CONFIG.car.width/2 + 0.2, y: -CONFIG.car.height/2, z: -CONFIG.car.length/2.5 }
            );
        } else {
            // Posições das rodas do carro padrão
            wheelPositions.push(
                { x: -CONFIG.car.width/2 - 0.2, y: -CONFIG.car.height/2, z: CONFIG.car.length/3 },
                { x: CONFIG.car.width/2 + 0.2, y: -CONFIG.car.height/2, z: CONFIG.car.length/3 },
                { x: -CONFIG.car.width/2 - 0.2, y: -CONFIG.car.height/2, z: -CONFIG.car.length/3 },
                { x: CONFIG.car.width/2 + 0.2, y: -CONFIG.car.height/2, z: -CONFIG.car.length/3 }
            );
        }
        
        // Criar as rodas
        wheelPositions.forEach(pos => {
            const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
            wheel.position.set(pos.x, pos.y, pos.z);
            wheel.rotation.z = Math.PI / 2;
            wheel.castShadow = true;
            this.mesh.add(wheel);
        });
        
        // Adicionar faróis
        const headlightGeometry = new THREE.SphereGeometry(0.3, 16, 16);
        const headlightMaterial = new THREE.MeshPhongMaterial({ 
            color: CONFIG.colors.headlight,
            emissive: CONFIG.colors.headlight,
            emissiveIntensity: 0.5
        });
        
        const leftHeadlight = new THREE.Mesh(headlightGeometry, headlightMaterial);
        leftHeadlight.position.set(-CONFIG.car.width/3, 0, CONFIG.car.length/2);
        this.mesh.add(leftHeadlight);
        
        const rightHeadlight = new THREE.Mesh(headlightGeometry, headlightMaterial);
        rightHeadlight.position.set(CONFIG.car.width/3, 0, CONFIG.car.length/2);
        this.mesh.add(rightHeadlight);
        
        // Posicionar o carro corretamente
        this.mesh.position.set(this.position.x, this.position.y, this.position.z);
        
        // Adicionar o carro à cena
        this.scene.add(this.mesh);
    }
    
    create() {
        // Criar grupo para o carro
        this.mesh = new THREE.Group();
        
        // Corpo do carro
        const carBodyGeometry = new THREE.BoxGeometry(
            CONFIG.car.width, 
            CONFIG.car.height, 
            CONFIG.car.length
        );
        const carBodyMaterial = new THREE.MeshPhongMaterial({ 
            color: CONFIG.colors.car 
        });
        const carBody = new THREE.Mesh(carBodyGeometry, carBodyMaterial);
        carBody.position.y = 0.5;
        carBody.castShadow = true;
        this.mesh.add(carBody);
        
        // Teto do carro
        const carRoofGeometry = new THREE.BoxGeometry(
            CONFIG.car.width * 0.9, 
            CONFIG.car.height * 0.7, 
            CONFIG.car.length * 0.5
        );
        const carRoofMaterial = new THREE.MeshPhongMaterial({ 
            color: CONFIG.colors.carRoof 
        });
        const carRoof = new THREE.Mesh(carRoofGeometry, carRoofMaterial);
        carRoof.position.y = 1.35;
        carRoof.position.z = -0.5;
        carRoof.castShadow = true;
        this.mesh.add(carRoof);
        
        // Rodas
        const wheelGeometry = new THREE.CylinderGeometry(0.5, 0.5, 0.4, 16);
        const wheelMaterial = new THREE.MeshPhongMaterial({ 
            color: CONFIG.colors.wheel 
        });
        
        const wheelPositions = [
            { x: -1.2, y: 0.5, z: -1.3 },
            { x: 1.2, y: 0.5, z: -1.3 },
            { x: -1.2, y: 0.5, z: 1.3 },
            { x: 1.2, y: 0.5, z: 1.3 }
        ];
        
        wheelPositions.forEach(pos => {
            const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
            wheel.position.set(pos.x, pos.y, pos.z);
            wheel.rotation.z = Math.PI / 2;
            wheel.castShadow = true;
            this.mesh.add(wheel);
        });
        
        // Faróis
        const headlightGeometry = new THREE.BoxGeometry(0.4, 0.4, 0.1);
        const headlightMaterial = new THREE.MeshPhongMaterial({ 
            color: CONFIG.colors.headlight, 
            emissive: CONFIG.colors.headlight 
        });
        
        const leftHeadlight = new THREE.Mesh(headlightGeometry, headlightMaterial);
        leftHeadlight.position.set(-0.8, 0.7, 2);
        this.mesh.add(leftHeadlight);
        
        const rightHeadlight = new THREE.Mesh(headlightGeometry, headlightMaterial);
        rightHeadlight.position.set(0.8, 0.7, 2);
        this.mesh.add(rightHeadlight);
        
        // Posicionar o carro
        this.mesh.position.set(this.position.x, this.position.y, this.position.z);
        this.scene.add(this.mesh);
    }
    
    update(deltaTime, inputDirection) {
        // Atualizar posição do carro com base na velocidade
        const currentSegment = this.position
        const forwardDistance = this.speed * deltaTime;

        this.position.z += this.speed * deltaTime;

        console.log("This: ", this)

        let segmentAngle = 0;
        if(currentSegment){
            segmentAngle = this.rotation || 0;
        }

        // Mover o carro para frente na direção da pista
        this.position.x += Math.sin(segmentAngle) * forwardDistance;
        this.position.z += Math.cos(segmentAngle) * forwardDistance;

        // Aplicar movimento lateral com base no input do jogador
        if (inputDirection !== 0) {
            // Aumentar a velocidade lateral para controles móveis
            const mobileMultiplier = 1.5;
            const lateralDistance = inputDirection * CONFIG.car.lateralSpeed * deltaTime * mobileMultiplier;
            this.position.x += Math.sin(segmentAngle + Math.PI/2) * lateralDistance;
            this.position.z += Math.cos(segmentAngle + Math.PI/2) * lateralDistance;
            
            // Aumentar o drift para feedback visual
            this.driftForce += inputDirection * CONFIG.car.rotationSpeed * 1.2;
        } else {
            // Reduzir o drift gradualmente quando não há input
            this.driftForce *= CONFIG.car.driftRecoveryRate;
        }
        
        // Limitar a força de drift
        this.driftForce = Math.max(
            -CONFIG.car.maxDriftForce, 
            Math.min(CONFIG.car.maxDriftForce, this.driftForce)
        );
        
        // Atualizar rotação baseada na direção do input
        if (inputDirection !== 0) {
            // Rotação mais acentuada na direção do movimento
            this.rotation = this.driftForce * 3;
        } else {
            // Retornar gradualmente à posição normal
            this.rotation *= 0.9;
        }
        
        // Limitar a rotação a 195 graus (3.4 radianos) em cada direção
        const maxRotation = 2.0; // 195 graus em radianos
        this.rotation = Math.max(-maxRotation, Math.min(maxRotation, this.rotation));
        
        // Limitar posição X (para não sair da pista)
        const trackHalfWidth = CONFIG.track.width / 2 - CONFIG.car.width / 2;
        this.position.x = Math.max(-trackHalfWidth, Math.min(trackHalfWidth, this.position.x));
        
        // Atualizar o mesh do carro
        this.mesh.position.x = this.position.x;
        this.mesh.position.z = this.position.z;
        this.mesh.rotation.y = this.rotation;
        
        // Simular efeito de drift nas rodas
        const wheelTilt = Math.min(Math.abs(this.driftForce * 10), 0.3) * Math.sign(this.driftForce);
        for (let i = 0; i < this.mesh.children.length; i++) {
            if (i >= 1 && i <= 4) { // Rodas
                this.mesh.children[i].rotation.x = wheelTilt;
            }
        }
    }
    
    increaseDifficulty(score) {
        // Aumentar a velocidade com base na pontuação ou no tempo
        const baseIncrease = CONFIG.game.difficultyIncrease;
        const scoreMultiplier = Math.floor(score / 5) * 0.1;
        
        // Aplicar aumento de velocidade
        this.speed += baseIncrease + scoreMultiplier;
        
        // Limitar a velocidade máxima
        this.speed = Math.min(this.speed, CONFIG.car.maxSpeed);
    }
    
    reset() {
        this.position = { x: 0, y: 1, z: 0 };
        this.speed = CONFIG.car.speed;
        this.driftForce = 0;
        this.rotation = 0;
        this.mesh.position.set(this.position.x, this.position.y, this.position.z);
        this.mesh.rotation.y = this.rotation;
    }
    
    isOffTrack(track) {
        let currentSegment;
        // Obter o segmento atual onde o carro está
        if(track){
            currentSegment = track.getSegmentAt(this.position.z);
            
            if (!currentSegment) {
                return true; // Se não encontrar um segmento, está fora da pista
            }

            // Calcular a largura efetiva da pista neste segmento
            const trackHalfWidth = CONFIG.track.width / 2;

            // Se for uma curva, ajustar a posição central da pista
            let trackCenterX = 0;
            if (currentSegment.isTurn) {
                trackCenterX = CONFIG.track.width * 0.4 * currentSegment.turnDirection;
            }

            // Verificar se o carro está fora da pista
            const distanceFromCenter = Math.abs(this.position.x - trackCenterX);
            return distanceFromCenter > trackHalfWidth - CONFIG.car.width / 2;
        } else {
            return false
        }
        

        // Verificar se o carro está fora da pista
        // const trackHalfWidth = CONFIG.track.width / 2;
        return Math.abs(this.position.x) > trackHalfWidth;
    }
}