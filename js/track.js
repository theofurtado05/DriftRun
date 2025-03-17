// Classe para gerenciar a pista
class Track {
    constructor(scene) {
        this.scene = scene;
        this.segments = [];
        this.nextSegmentZ = 0;
        this.lastTurnDirection = 0;
        this.turnCount = 0;
        this.billboards = []; // Array para armazenar as placas de anúncio
        
        // Carregar texturas para os banners
        this.bannerTextures = [];
        
        // Carregar a textura do banner com tratamento de erro
        const textureLoader = new THREE.TextureLoader();
        textureLoader.load(
            './assets/banner1.png', // Caminho correto com ./ no início
            (texture) => {
                // Sucesso no carregamento
                this.bannerTextures.push(texture);
                console.log('Banner carregado com sucesso');
            },
            undefined, // Função de progresso (não usada)
            (error) => {
                // Erro no carregamento
                console.error('Erro ao carregar banner:', error);
                
                // Criar uma textura de fallback colorida
                const canvas = document.createElement('canvas');
                canvas.width = 512;
                canvas.height = 256;
                const ctx = canvas.getContext('2d');
                
                // Desenhar um gradiente colorido como fallback
                const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
                gradient.addColorStop(0, '#ff8800');
                gradient.addColorStop(0.5, '#ffcc00');
                gradient.addColorStop(1, '#ff8800');
                
                ctx.fillStyle = gradient;
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                
                // Adicionar texto
                ctx.fillStyle = 'black';
                ctx.font = 'bold 48px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('PATROCINE AQUI', canvas.width/2, canvas.height/2);
                
                // Criar textura a partir do canvas
                const fallbackTexture = new THREE.CanvasTexture(canvas);
                this.bannerTextures.push(fallbackTexture);
            }
        );
        
        this.initializeTrack();
    }
    
    initializeTrack() {
        // Criar segmentos iniciais
        for (let i = 0; i < CONFIG.track.maxVisibleSegments; i++) {
            this.createSegment();
        }
    }
    
    createSegment(forceTurn = false) {
        const isTurn = forceTurn || (Math.random() < CONFIG.track.turnProbability && this.lastTurnDirection === 0);
        let turnDirection = 0;
        
        if (isTurn) {
            // Gerar direção aleatória da curva (-1 = esquerda, 1 = direita)
            turnDirection = Math.random() > 0.5 ? -1 : 1;
            this.lastTurnDirection = turnDirection;
            this.turnCount++;
        } else if (this.lastTurnDirection !== 0) {
            // Resetar direção da curva após um segmento
            this.lastTurnDirection = 0;
        }
        
        // Criar geometria do segmento
        const segmentGeometry = new THREE.BoxGeometry(
            CONFIG.track.width, 
            1, 
            CONFIG.track.segmentLength
        );
        const segmentMaterial = new THREE.MeshPhongMaterial({ 
            color: CONFIG.colors.road 
        });
        const segment = new THREE.Mesh(segmentGeometry, segmentMaterial);
        
        // Definir posição do segmento
        segment.position.y = 0;
        segment.position.z = this.nextSegmentZ + CONFIG.track.segmentLength / 2;
        
        if (isTurn) {
            // Para curvas, ajustamos a posição X com base na direção
            segment.position.x = CONFIG.track.width * 0.4 * turnDirection;
            
            // Adicionar marcação visual para curva
            const markingGeometry = new THREE.BoxGeometry(CONFIG.track.width, 0.1, 1);
            const markingMaterial = new THREE.MeshPhongMaterial({ 
                color: CONFIG.colors.turnMarking 
            });
            
            for (let i = 0; i < 3; i++) {
                const marking = new THREE.Mesh(markingGeometry, markingMaterial);
                marking.position.y = 0.55;
                marking.position.z = this.nextSegmentZ + i * (CONFIG.track.segmentLength / 3) - CONFIG.track.segmentLength / 3;
                segment.add(marking);
            }
        }
        
        // Adicionar bordas da pista
        const edgeGeometry = new THREE.BoxGeometry(0.5, 1, CONFIG.track.segmentLength);
        const edgeMaterial = new THREE.MeshPhongMaterial({ 
            color: CONFIG.colors.roadEdge 
        });
        
        const leftEdge = new THREE.Mesh(edgeGeometry, edgeMaterial);
        leftEdge.position.x = -(CONFIG.track.width / 2) - 0.25;
        leftEdge.position.y = 0.5;
        leftEdge.position.z = 0;
        
        const rightEdge = new THREE.Mesh(edgeGeometry, edgeMaterial);
        rightEdge.position.x = (CONFIG.track.width / 2) + 0.25;
        rightEdge.position.y = 0.5;
        rightEdge.position.z = 0;
        
        segment.add(leftEdge);
        segment.add(rightEdge);
        
        // Adicionar placas de anúncio com probabilidade
        if (Math.random() < 0.3) { // 30% de chance de ter uma placa
            this.addBillboard(segment, true); // Lado esquerdo
        }
        
        if (Math.random() < 0.3) { // 30% de chance de ter uma placa
            this.addBillboard(segment, false); // Lado direito
        }
        
        // Adicionar faixa central
        const centerLineGeometry = new THREE.BoxGeometry(0.2, 0.1, 2);
        const centerLineMaterial = new THREE.MeshPhongMaterial({ 
            color: CONFIG.colors.centerLine 
        });
        
        for (let i = 0; i < CONFIG.track.segmentLength / 4; i++) {
            const centerLine = new THREE.Mesh(centerLineGeometry, centerLineMaterial);
            centerLine.position.y = 0.55;
            centerLine.position.z = i * 4 - CONFIG.track.segmentLength / 2 + 2;
            segment.add(centerLine);
        }
        
        segment.receiveShadow = true;
        this.scene.add(segment);
        
        // Adicionar à lista de segmentos
        this.segments.push({
            mesh: segment,
            zPosition: this.nextSegmentZ,
            isTurn: isTurn,
            turnDirection: turnDirection
        });
        
        // Atualizar posição do próximo segmento
        this.nextSegmentZ += CONFIG.track.segmentLength;
        
        return segment;
    }

    addBillboard(segment, isLeft) {
    // Verificar se temos texturas disponíveis
    if (this.bannerTextures.length === 0) {
        // Criar uma textura temporária se ainda não temos nenhuma
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');
        
        // Desenhar um gradiente colorido como fallback
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
        gradient.addColorStop(0, '#ff8800');
        gradient.addColorStop(0.5, '#ffcc00');
        gradient.addColorStop(1, '#ff8800');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Adicionar texto
        ctx.fillStyle = 'black';
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('PATROCINE AQUI', canvas.width/2, canvas.height/2);
        
        // Criar textura a partir do canvas
        const tempTexture = new THREE.CanvasTexture(canvas);
        this.bannerTextures.push(tempTexture);
    }

    // Criar geometria para a placa
    const billboardWidth = 8;
    const billboardHeight = 4;
    const billboardGeometry = new THREE.PlaneGeometry(billboardWidth, billboardHeight);

    // Escolher uma textura aleatória do array de texturas
    const textureIndex = Math.floor(Math.random() * this.bannerTextures.length);
    const bannerTexture = this.bannerTextures[textureIndex];

    // Criar material com a textura do banner
    const billboardMaterial = new THREE.MeshPhongMaterial({ 
        map: bannerTexture,
        side: THREE.DoubleSide,
        transparent: true
    });

    // Criar a placa
    const billboard = new THREE.Mesh(billboardGeometry, billboardMaterial);

    // Posicionar a placa
    const distanceFromRoad = 10; // Distância da borda da pista
    const xPosition = isLeft 
        ? -(CONFIG.track.width / 2 + distanceFromRoad) 
        : (CONFIG.track.width / 2 + distanceFromRoad);

    billboard.position.set(
        xPosition, 
        billboardHeight / 2 + 1, // Altura da placa
        0 // Posição Z relativa ao segmento
    );

    // Rotacionar a placa para ficar virada para a câmera (frente)
    // Não rotacionamos no eixo Y para que fique de frente para a câmera
    // Apenas inclinamos levemente para melhor visibilidade
    const angleToCenter = Math.atan2(xPosition, -180); // Ângulo em direção ao centro da pista
    billboard.rotation.y = angleToCenter;

    // Adicionar suportes para a placa
    const supportGeometry = new THREE.BoxGeometry(0.3, billboardHeight + 1, 0.3);
    const supportMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 });

    // Suporte esquerdo
    const leftSupport = new THREE.Mesh(supportGeometry, supportMaterial);
    leftSupport.position.set(-billboardWidth/2 + 0.5, -billboardHeight/2 - 0.5, 0);
    billboard.add(leftSupport);

    // Suporte direito
    const rightSupport = new THREE.Mesh(supportGeometry, supportMaterial);
    rightSupport.position.set(billboardWidth/2 - 0.5, -billboardHeight/2 - 0.5, 0);
    billboard.add(rightSupport);

    // Adicionar a placa ao segmento
    segment.add(billboard);

    // Adicionar ao array de placas
    this.billboards.push(billboard);

    return billboard;
}
    
    update(carPosition) {
        // Verificar se precisamos remover segmentos antigos
        const segmentsToRemove = [];
        
        for (let i = 0; i < this.segments.length; i++) {
            const segment = this.segments[i];
            
            // Se o segmento está muito atrás do carro, marcamos para remoção
            if (segment.zPosition + CONFIG.track.segmentLength < carPosition.z - 30) {
                segmentsToRemove.push(i);
            }
        }
        
        // Remover segmentos antigos (do último para o primeiro para não afetar os índices)
        for (let i = segmentsToRemove.length - 1; i >= 0; i--) {
            const index = segmentsToRemove[i];
            const segment = this.segments[index];
            
            // Remover o mesh da cena
            this.scene.remove(segment.mesh);
            
            // Remover da lista de segmentos
            this.segments.splice(index, 1);
        }
        
        // Adicionar novos segmentos se necessário
        while (this.segments.length < CONFIG.track.maxVisibleSegments) {
            this.createSegment();
        }
    }
    
    getSegmentAt(zPosition) {
        // Encontrar o segmento na posição Z
        for (const segment of this.segments) {
            if (zPosition >= segment.zPosition && 
                zPosition < segment.zPosition + CONFIG.track.segmentLength) {
                return segment;
            }
        }
        return null;
    }
    
    reset() {
        // Remover todos os segmentos
        for (const segment of this.segments) {
            this.scene.remove(segment.mesh);
        }
        
        // Limpar arrays
        this.segments = [];
        
        // Resetar variáveis
        this.nextSegmentZ = 0;
        this.lastTurnDirection = 0;
        this.turnCount = 0;

        // Limpar array de placas
        this.billboards = [];
        
        // Recriar segmentos iniciais
        this.initializeTrack();
    }
    
    getTurnCount() {
        return this.turnCount;
    }
}