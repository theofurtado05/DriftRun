// Classe para gerenciar a pista
class Track {
    constructor(scene) {
        this.scene = scene;
        this.segments = [];
        this.nextSegmentZ = 0;
        this.lastTurnDirection = 0;
        this.turnCount = 0;
        this.billboards = []; // Array para armazenar as placas de anúncio
        
        // Adicionar elementos de paisagem
        this.landscapeElements = [];
        this.landscapePool = []; // Pool de objetos reutilizáveis
        
        // Armazenar a última posição do carro para cálculos relativos
        this.lastCarPosition = { x: 0, z: 0 };
    

        // Inicializar a paisagem
        this.initializeLandscape();

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

    // Adicionar método para inicializar a paisagem
// Modificar o método initializeLandscape na classe Track
initializeLandscape() {
    // Criar o chão (grama) de forma mais simples
    this.createSimpleGround();
    
    // Criar montanhas ao fundo
    this.createMountains();
    
    // Adicionar elementos iniciais de paisagem
    this.populateLandscape();
}

// Método simplificado para criar o chão
createSimpleGround() {
    // Remover qualquer terreno existente
    if (this.ground) {
        this.scene.remove(this.ground);
    }
    
    // Criar um plano grande para o chão
    const groundSize = 2000; // Tamanho muito grande para cobrir toda a área visível
    const groundGeometry = new THREE.PlaneGeometry(groundSize, groundSize);
    const groundMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x4CAF50, // Verde para grama
        side: THREE.DoubleSide
    });
    
    this.ground = new THREE.Mesh(groundGeometry, groundMaterial);
    this.ground.rotation.x = Math.PI / 2; // Rotacionar para ficar horizontal
    this.ground.position.y = -0.5; // Posicionar logo abaixo da pista
    
    // Adicionar à cena
    this.scene.add(this.ground);
    
    // Adicionar textura para parecer mais natural
    const textureSize = 100;
    const textureGeometry = new THREE.PlaneGeometry(textureSize, textureSize, 10, 10);
    const textureMaterial = new THREE.MeshPhongMaterial({
        color: 0x3E8E41, // Verde um pouco mais escuro
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.7
    });
    
    // Criar uma grade de texturas para dar mais detalhe ao chão
    for (let x = -groundSize/2; x < groundSize/2; x += textureSize) {
        for (let z = -groundSize/2; z < groundSize/2; z += textureSize) {
            const textureMesh = new THREE.Mesh(textureGeometry, textureMaterial);
            textureMesh.rotation.x = Math.PI / 2;
            textureMesh.position.set(
                x + textureSize/2 + Math.random() * 10 - 5,
                -0.49, // Ligeiramente acima do chão principal
                z + textureSize/2 + Math.random() * 10 - 5
            );
            textureMesh.scale.set(
                0.8 + Math.random() * 0.4,
                0.8 + Math.random() * 0.4,
                1
            );
            this.scene.add(textureMesh);
        }
    }
}

createTerrain() {
    // Remover a criação do plano único grande
    // Em vez disso, vamos criar um sistema de "tiles" de terreno que seguem o jogador
    
    // Configurações do terreno
    this.terrainConfig = {
        tileSize: 200,         // Tamanho de cada tile de terreno
        tilesPerSide: 3,       // Número de tiles em cada direção (3x3 grid)
        centerTileIndex: 1,    // Índice do tile central (onde o jogador está)
        tiles: []              // Array para armazenar os tiles
    };
    
    // Criar os tiles iniciais
    for (let z = -1; z <= 1; z++) {
        for (let x = -1; x <= 1; x++) {
            this.createTerrainTile(x, z);
        }
    }
}

// Método para criar um tile de terreno
createTerrainTile(gridX, gridZ) {
    const tileSize = this.terrainConfig.tileSize;
    
    // Criar geometria do terreno
    const terrainGeometry = new THREE.PlaneGeometry(tileSize, tileSize, 8, 8);
    
    // Adicionar variação de altura para terreno não ser totalmente plano
    const vertices = terrainGeometry.attributes.position.array;
    for (let i = 0; i < vertices.length; i += 3) {
        // Não modificar os vértices próximos à estrada
        const x = vertices[i];
        const z = vertices[i + 2];
        const distanceFromCenter = Math.sqrt(x * x + z * z);
        
        if (distanceFromCenter > 15) { // Não modificar próximo à estrada
            vertices[i + 1] = -0.5 + Math.random() * 0.3; // Pequena variação de altura
        } else {
            vertices[i + 1] = -0.5; // Manter plano próximo à estrada
        }
    }
    
    // Atualizar a geometria
    terrainGeometry.attributes.position.needsUpdate = true;
    terrainGeometry.computeVertexNormals();
    
    // Criar material com textura de grama
    const terrainMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x4CAF50, // Verde para grama
        side: THREE.DoubleSide,
        flatShading: true // Para dar um aspecto mais natural
    });
    
    // Criar mesh
    const terrainMesh = new THREE.Mesh(terrainGeometry, terrainMaterial);
    terrainMesh.rotation.x = Math.PI / 2; // Rotacionar para ficar horizontal
    
    // Posicionar o tile na grade
    terrainMesh.position.x = gridX * tileSize;
    terrainMesh.position.z = gridZ * tileSize;
    
    // Adicionar à cena
    this.scene.add(terrainMesh);
    
    // Armazenar referência ao tile
    this.terrainConfig.tiles.push({
        mesh: terrainMesh,
        gridX: gridX,
        gridZ: gridZ
    });
    
    return terrainMesh;
}

// Modificar o método createMountains
createMountains() {
    // Remover montanhas existentes
    if (this.mountains) {
        for (const mountain of this.mountains) {
            this.scene.remove(mountain);
        }
    }
    
    this.mountains = [];
    
    // Criar montanhas em um círculo ao redor do ponto inicial
    const radius = 500; // Distância das montanhas
    const segments = 16; // Número de segmentos ao redor do círculo
    
    for (let i = 0; i < segments; i++) {
        const angle = (i / segments) * Math.PI * 2;
        const x = Math.sin(angle) * radius;
        const z = Math.cos(angle) * radius;
        
        // Criar uma montanha
        const mountainHeight = 50 + Math.random() * 50;
        const mountainWidth = 100 + Math.random() * 100;
        
        const mountainGeometry = new THREE.ConeGeometry(
            mountainWidth / 2, // Raio da base
            mountainHeight,    // Altura
            4,                 // Número de lados (4 para forma piramidal)
            1,                 // Segmentos de altura
            false              // Aberto ou fechado
        );
        
        // Cor da montanha (tons de cinza/azul para dar sensação de distância)
        const shade = 0.4 + Math.random() * 0.2;
        const mountainMaterial = new THREE.MeshPhongMaterial({
            color: new THREE.Color(shade * 0.5, shade * 0.6, shade * 0.7),
            flatShading: true
        });
        
        const mountain = new THREE.Mesh(mountainGeometry, mountainMaterial);
        mountain.position.set(x, mountainHeight / 2 - 0.5, z);
        mountain.rotation.y = Math.random() * Math.PI; // Rotação aleatória
        
        this.scene.add(mountain);
        this.mountains.push(mountain);
    }
}

// Método para popular a paisagem com elementos
populateLandscape() {
    // Tipos de elementos de paisagem
    const landscapeTypes = [
        { type: 'tree', probability: 0.6 },
        { type: 'house', probability: 0.3 },
        { type: 'building', probability: 0.1 }
    ];
    
    // Adicionar elementos em ambos os lados da pista
    for (let z = 0; z < 500; z += 20) {
        // Lado esquerdo
        if (Math.random() < 0.3) {
            const distanceFromRoad = 15 + Math.random() * 30;
            const x = -distanceFromRoad;
            this.addLandscapeElement(x, z, landscapeTypes);
        }
        
        // Lado direito
        if (Math.random() < 0.3) {
            const distanceFromRoad = 15 + Math.random() * 30;
            const x = distanceFromRoad;
            this.addLandscapeElement(x, z, landscapeTypes);
        }
    }
}

// Método para criar uma cadeia de montanhas
createMountainRange(angle) {
    const distance = this.mountainsConfig.distance;
    const segments = this.mountainsConfig.segments;
    
    // Criar geometria para a cadeia de montanhas
    const mountainGeometry = new THREE.BufferGeometry();
    const vertices = [];
    const mountainColors = [];
    
    // Largura total da cadeia de montanhas
    const rangeWidth = 1000;
    
    // Gerar pontos para as montanhas
    for (let i = 0; i < segments; i++) {
        const x = -rangeWidth/2 + i * (rangeWidth / segments);
        const height = 30 + Math.random() * 70;
        
        // Ponto base esquerdo
        vertices.push(x - rangeWidth/(segments*2), 0, 0);
        // Ponto do topo
        vertices.push(x, height, 0);
        // Ponto base direito
        vertices.push(x + rangeWidth/(segments*2), 0, 0);
        
        // Cores para as montanhas (tons de azul/cinza para dar sensação de distância)
        const shade = 0.4 + Math.random() * 0.2;
        mountainColors.push(shade * 0.5, shade * 0.6, shade * 0.7);
        mountainColors.push(shade * 0.6, shade * 0.7, shade * 0.8);
        mountainColors.push(shade * 0.5, shade * 0.6, shade * 0.7);
    }
    
    mountainGeometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    mountainGeometry.setAttribute('color', new THREE.Float32BufferAttribute(mountainColors, 3));
    
    const mountainMaterial = new THREE.MeshBasicMaterial({ 
        vertexColors: true,
        side: THREE.DoubleSide
    });
    
    const mountains = new THREE.Mesh(mountainGeometry, mountainMaterial);
    
    // Posicionar e rotacionar a cadeia de montanhas
    mountains.position.y = 0;
    mountains.rotation.y = angle;
    
    // Adicionar à cena
    this.scene.add(mountains);
    
    // Armazenar referência
    this.mountainsConfig.mountains.push({
        mesh: mountains,
        angle: angle
    });
}

// Método para adicionar um elemento de paisagem
addLandscapeElement(x, z, landscapeTypes) {
    // Escolher tipo de elemento com base nas probabilidades
    let elementType = null;
    const rand = Math.random();
    let cumulativeProbability = 0;
    
    for (const type of landscapeTypes) {
        cumulativeProbability += type.probability;
        if (rand < cumulativeProbability) {
            elementType = type.type;
            break;
        }
    }
    
    // Criar o elemento com base no tipo
    let element;
    
    // Verificar se há um elemento disponível na pool
    const poolElement = this.getElementFromPool(elementType);
    if (poolElement) {
        element = poolElement;
        element.position.set(x, 0, z);
    } else {
        // Criar novo elemento se não houver na pool
        switch (elementType) {
            case 'tree':
                element = this.createTree(x, z);
                break;
            case 'house':
                element = this.createHouse(x, z);
                break;
            case 'building':
                element = this.createBuilding(x, z);
                break;
            default:
                element = this.createTree(x, z);
        }
    }
    
    // Adicionar à lista de elementos de paisagem
    this.landscapeElements.push({
        mesh: element,
        type: elementType,
        position: { x, z }
    });
}

// Método para criar uma árvore
createTree(x, z) {
    // Tronco
    const trunkGeometry = new THREE.CylinderGeometry(0.5, 0.8, 4, 8);
    const trunkMaterial = new THREE.MeshPhongMaterial({ color: 0x8B4513 });
    const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
    trunk.position.set(x, 2, z);
    
    // Copa
    const topGeometry = new THREE.ConeGeometry(3, 6, 8);
    const topMaterial = new THREE.MeshPhongMaterial({ 
        color: Math.random() > 0.3 ? 0x228B22 : 0x006400 // Variação de verde
    });
    const top = new THREE.Mesh(topGeometry, topMaterial);
    top.position.set(0, 5, 0);
    
    // Grupo para a árvore completa
    const tree = new THREE.Group();
    tree.add(trunk);
    tree.add(top);
    tree.position.set(x, 0, z);
    
    this.scene.add(tree);
    return tree;
}

// Método para criar uma casa
createHouse(x, z) {
    // Corpo da casa
    const bodyGeometry = new THREE.BoxGeometry(8, 6, 8);
    const bodyMaterial = new THREE.MeshPhongMaterial({ 
        color: Math.random() > 0.5 ? 0xF5F5DC : 0xD3D3D3 // Bege ou cinza claro
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.set(0, 3, 0);
    
    // Telhado
    const roofGeometry = new THREE.ConeGeometry(8, 4, 4);
    const roofMaterial = new THREE.MeshPhongMaterial({ 
        color: Math.random() > 0.5 ? 0x8B0000 : 0x800000 // Tons de vermelho
    });
    const roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.set(0, 8, 0);
    roof.rotation.y = Math.PI / 4;
    
    // Grupo para a casa completa
    const house = new THREE.Group();
    house.add(body);
    house.add(roof);
    house.position.set(x, 0, z);
    
    this.scene.add(house);
    return house;
}

// Método para criar um prédio
createBuilding(x, z) {
    // Altura aleatória para o prédio
    const height = 10 + Math.random() * 20;
    
    // Corpo do prédio
    const bodyGeometry = new THREE.BoxGeometry(10, height, 10);
    const bodyMaterial = new THREE.MeshPhongMaterial({ 
        color: Math.random() > 0.5 ? 0x808080 : 0xA9A9A9 // Tons de cinza
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.set(0, height/2, 0);
    
    // Janelas (textura procedural)
    const windowsGeometry = new THREE.BoxGeometry(10.1, height, 10.1);
    const windowsMaterial = new THREE.MeshPhongMaterial({
        color: 0xFFFFFF,
        transparent: true,
        opacity: 0.3,
        emissive: 0xFFFF00,
        emissiveIntensity: 0.2
    });
    const windows = new THREE.Mesh(windowsGeometry, windowsMaterial);
    windows.position.set(0, height/2, 0);
    
    // Grupo para o prédio completo
    const building = new THREE.Group();
    building.add(body);
    building.add(windows);
    building.position.set(x, 0, z);
    
    this.scene.add(building);
    return building;
}

// Método para obter um elemento da pool
getElementFromPool(type) {
    for (let i = 0; i < this.landscapePool.length; i++) {
        if (this.landscapePool[i].type === type) {
            const element = this.landscapePool[i].mesh;
            this.landscapePool.splice(i, 1);
            return element;
        }
    }
    return null;
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

// Método para atualizar a paisagem
updateLandscape(carPosition) {
    // Verificar elementos que ficaram para trás e reciclá-los
    const elementsToRemove = [];
    
    for (let i = 0; i < this.landscapeElements.length; i++) {
        const element = this.landscapeElements[i];
        
        // Se o elemento ficou muito para trás, reciclar
        if (element.position.z < carPosition.z - 100) {
            elementsToRemove.push(i);
            
            // Adicionar à pool para reutilização
            this.landscapePool.push({
                mesh: element.mesh,
                type: element.type
            });
            
            // Remover da cena
            this.scene.remove(element.mesh);
        }
    }
    
    // Remover elementos (do último para o primeiro para não afetar os índices)
    for (let i = elementsToRemove.length - 1; i >= 0; i--) {
        this.landscapeElements.splice(elementsToRemove[i], 1);
    }
    
    // Adicionar novos elementos à frente
    if (this.landscapeElements.length < 100) { // Limitar número de elementos
        const landscapeTypes = [
            { type: 'tree', probability: 0.6 },
            { type: 'house', probability: 0.3 },
            { type: 'building', probability: 0.1 }
        ];
        
        // Calcular posição Z para novos elementos
        let maxZ = carPosition.z;
        for (const element of this.landscapeElements) {
            if (element.position.z > maxZ) {
                maxZ = element.position.z;
            }
        }
        
        // Adicionar novos elementos
        for (let z = maxZ; z < carPosition.z + 500; z += 20) {
            // Lado esquerdo
            if (Math.random() < 0.3) {
                const distanceFromRoad = 15 + Math.random() * 30;
                const x = -distanceFromRoad;
                this.addLandscapeElement(x, z, landscapeTypes);
            }
            
            // Lado direito
            if (Math.random() < 0.3) {
                const distanceFromRoad = 15 + Math.random() * 30;
                const x = distanceFromRoad;
                this.addLandscapeElement(x, z, landscapeTypes);
            }
        }
    }
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

        // Atualizar o terreno para seguir o jogador
        if (this.ground) {
            this.ground.position.x = carPosition.x;
            this.ground.position.z = carPosition.z;
        }

        this.updateMountains(carPosition);
        
        // Atualizar elementos de paisagem
        this.updateLandscape(carPosition);
        
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

    // Método para atualizar o terreno
updateTerrain(carPosition) {
    const tileSize = this.terrainConfig.tileSize;
    
    // Calcular em qual tile o jogador está atualmente
    const currentTileX = Math.floor(carPosition.x / tileSize);
    const currentTileZ = Math.floor(carPosition.z / tileSize);
    
    // Verificar se precisamos reposicionar os tiles
    const tilesToUpdate = [];
    
    for (const tile of this.terrainConfig.tiles) {
        // Calcular a distância em tiles entre este tile e a posição atual do jogador
        const distX = Math.abs(tile.gridX - currentTileX);
        const distZ = Math.abs(tile.gridZ - currentTileZ);
        
        // Se o tile estiver muito longe, marcá-lo para atualização
        if (distX > 1 || distZ > 1) {
            tilesToUpdate.push(tile);
        }
    }
    
    // Reposicionar os tiles que estão muito longe
    for (const tile of tilesToUpdate) {
        // Calcular nova posição na grade
        let newGridX = currentTileX;
        let newGridZ = currentTileZ;
        
        // Determinar em qual direção mover o tile
        if (tile.gridX < currentTileX - 1) newGridX = currentTileX + 1;
        else if (tile.gridX > currentTileX + 1) newGridX = currentTileX - 1;
        else newGridX = tile.gridX;
        
        if (tile.gridZ < currentTileZ - 1) newGridZ = currentTileZ + 1;
        else if (tile.gridZ > currentTileZ + 1) newGridZ = currentTileZ - 1;
        else newGridZ = tile.gridZ;
        
        // Verificar se já existe um tile nesta posição
        const tileExists = this.terrainConfig.tiles.some(t => 
            t !== tile && t.gridX === newGridX && t.gridZ === newGridZ);
        
        if (!tileExists) {
            // Atualizar posição do tile
            tile.gridX = newGridX;
            tile.gridZ = newGridZ;
            tile.mesh.position.x = newGridX * tileSize;
            tile.mesh.position.z = newGridZ * tileSize;
        }
    }

    // Atualizar posição das montanhas
    this.updateMountains(carPosition);
}

// Método para atualizar as montanhas
updateMountains(carPosition) {
    if (!this.mountains) return;
    
    for (const mountain of this.mountains) {
        // Manter a mesma posição relativa ao jogador
        const dx = mountain.position.x - this.lastCarPosition.x;
        const dz = mountain.position.z - this.lastCarPosition.z;
        
        mountain.position.x = carPosition.x + dx;
        mountain.position.z = carPosition.z + dz;
    }
    
    // Armazenar a posição atual do carro para o próximo frame
    this.lastCarPosition = {
        x: carPosition.x,
        z: carPosition.z
    };
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