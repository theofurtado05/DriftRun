// Ponto de entrada da aplicação
let game;
let totalCoins = 0;
let playerName = "";

let ownedCars = ['default']; // Carros que o jogador possui
let selectedCar = 'default'; // Carro atualmente selecionado

// Função para inicializar o jogo quando a página carregar
// Modificar a função initGame para carregar os dados dos carros
function initGame() {
    // Verificar se é a primeira vez que o usuário acessa o jogo
    checkFirstVisit();
    
    // Carregar dados dos carros
    loadOwnedCars();
    loadSelectedCar();
    
    // Configurar os botões da tela de boas-vindas
    setupWelcomeScreen();
    
    // Configurar os botões da loja
    setupShopScreen();
}

// Configurar os botões da tela da loja
function setupShopScreen() {
    // Botão para fechar a loja
    document.getElementById('shop-close-btn').addEventListener('click', () => {
        document.getElementById('shop-screen').style.display = 'none';
        document.getElementById('game-over').style.display = 'block';
    });
}

// Função para abrir a loja
function openShop() {
    // Atualizar o contador de moedas na loja
    document.getElementById('shop-coins-value').textContent = totalCoins;
    
    // Atualizar o estado dos botões com base nos carros possuídos
    updateCarButtons();
    
    // Mostrar a tela da loja
    document.getElementById('shop-screen').style.display = 'flex';
}

// Função para atualizar os botões dos carros
function updateCarButtons() {
    // Verificar carros possuídos e atualizar botões
    document.querySelectorAll('.car-item').forEach(item => {
        const carId = item.dataset.car;
        const buyButton = item.querySelector('.buy-car-btn');
        
        if (ownedCars.includes(carId)) {
            // Se o jogador já possui o carro, mostrar botão de seleção
            if (buyButton) {
                const price = buyButton.dataset.price;
                buyButton.outerHTML = `<button class="select-car-btn ${carId === selectedCar ? 'selected' : ''}" data-car="${carId}">${carId === selectedCar ? 'Selecionado' : 'Selecionar'}</button>`;
            }
        } else if (buyButton) {
            // Se o jogador não possui o carro, verificar se tem moedas suficientes
            const price = parseInt(buyButton.dataset.price);
            buyButton.disabled = totalCoins < price;
        }
    });
    
    // Adicionar eventos aos botões
    document.querySelectorAll('.buy-car-btn').forEach(button => {
        button.addEventListener('click', buyCar);
    });
    
    document.querySelectorAll('.select-car-btn').forEach(button => {
        button.addEventListener('click', selectCar);
    });
}

// Função para comprar um carro
function buyCar(event) {
    const button = event.target;
    const carId = button.dataset.car;
    const price = parseInt(button.dataset.price);
    
    if (totalCoins >= price) {
        // Deduzir moedas
        totalCoins -= price;
        saveCoins();
        
        // Adicionar carro à lista de possuídos
        ownedCars.push(carId);
        saveOwnedCars();
        
        // Selecionar o novo carro
        selectedCar = carId;
        saveSelectedCar();
        
        // Atualizar a interface
        updateCarButtons();
        updateCoinCounter();
        document.getElementById('shop-coins-value').textContent = totalCoins;
        
        // Mostrar mensagem de sucesso
        alert(`Parabéns! Você comprou o ${carId === 'beetle' ? 'Fusca Amarelo' : 'Lamborghini Laranja'}!`);
    }
}

// Função para selecionar um carro
function selectCar(event) {
    const button = event.target;
    const carId = button.dataset.car;
    
    // Atualizar carro selecionado
    selectedCar = carId;
    saveSelectedCar();
    
    // Atualizar interface
    document.querySelectorAll('.select-car-btn').forEach(btn => {
        btn.classList.remove('selected');
        btn.textContent = 'Selecionar';
    });
    
    button.classList.add('selected');
    button.textContent = 'Selecionado';
    
    // Atualizar o modelo do carro no jogo
    if (game) {
        game.updateCarModel(selectedCar);
    }
}

// Funções para salvar/carregar dados dos carros
function saveOwnedCars() {
    localStorage.setItem('driftRaceOwnedCars', JSON.stringify(ownedCars));
}

function loadOwnedCars() {
    const saved = localStorage.getItem('driftRaceOwnedCars');
    if (saved) {
        ownedCars = JSON.parse(saved);
    }
}

function saveSelectedCar() {
    localStorage.setItem('driftRaceSelectedCar', selectedCar);
}

function loadSelectedCar() {
    const saved = localStorage.getItem('driftRaceSelectedCar');
    if (saved) {
        selectedCar = saved;
    }
}


// Verificar se é a primeira visita do usuário
function checkFirstVisit() {
    playerName = localStorage.getItem('driftRacePlayerName');
    
    if (playerName) {
        // Se já temos o nome do jogador, esconder a tela de boas-vindas
        document.getElementById('welcome-screen').style.display = 'none';
        // Iniciar o jogo
        startGame();
    }
    // Caso contrário, a tela de boas-vindas permanece visível
}

// Configurar os botões da tela de boas-vindas
function setupWelcomeScreen() {
    // Botão para iniciar o jogo
    document.getElementById('start-game-btn').addEventListener('click', function() {
        const nameInput = document.getElementById('name-input');
        playerName = nameInput.value.trim();
        
        if (playerName) {
            // Salvar o nome do jogador
            localStorage.setItem('driftRacePlayerName', playerName);
            
            // Esconder a tela de boas-vindas
            document.getElementById('welcome-screen').style.display = 'none';
            
            // Iniciar o jogo
            startGame();
        } else {
            alert('Por favor, digite seu nome para continuar.');
        }
    });
    
    // Botão para patrocinar
    document.getElementById('sponsor-btn').addEventListener('click', function() {
        // Abrir página de patrocínio ou formulário de contato
        window.open('https://abacatepay.com/pay/bill_shn66fGZChStgc4HwzbRAUGx', '_blank');
    });
}

// Iniciar o jogo
function startGame() {
    // Carregar moedas do localStorage
    loadCoins();
    
    // Criar nova instância do jogo
    game = new Game(selectedCar);
    
    // Adicionar manipulador para limpeza do jogo quando a página for fechada
    window.addEventListener('beforeunload', () => {
        if (game) {
            game.cleanup();
        }
    });
    
    // Criar e adicionar o contador de moedas total
    createCoinCounter();
    
    // Mostrar mensagem de boas-vindas com o nome do jogador
    showWelcomeMessage();
    
    // Log para indicar que o jogo foi inicializado
    console.log('Drift Race 3D inicializado para ' + playerName);
}

// Mostrar mensagem de boas-vindas temporária
function showWelcomeMessage() {
    const welcomeMsg = document.createElement('div');
    welcomeMsg.id = 'welcome-message';
    welcomeMsg.textContent = `Bem-vindo, ${playerName}! Boa corrida!`;
    
    // Estilizar a mensagem
    welcomeMsg.style.position = 'fixed';
    welcomeMsg.style.top = '50%';
    welcomeMsg.style.left = '50%';
    welcomeMsg.style.transform = 'translate(-50%, -50%)';
    welcomeMsg.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    welcomeMsg.style.color = 'white';
    welcomeMsg.style.padding = '20px';
    welcomeMsg.style.borderRadius = '10px';
    welcomeMsg.style.fontSize = '24px';
    welcomeMsg.style.fontWeight = 'bold';
    welcomeMsg.style.zIndex = '1500';
    welcomeMsg.style.textAlign = 'center';
    
    document.body.appendChild(welcomeMsg);
    
    // Remover a mensagem após 3 segundos
    setTimeout(() => {
        document.body.removeChild(welcomeMsg);
    }, 3000);
}

// Carregar moedas do localStorage
function loadCoins() {
    const savedCoins = localStorage.getItem('driftRaceCoins');
    if (savedCoins !== null) {
        totalCoins = parseInt(savedCoins);
    } else {
        totalCoins = 0;
    }
}

// Salvar moedas no localStorage
function saveCoins() {
    localStorage.setItem('driftRaceCoins', totalCoins.toString());
}

// Adicionar moedas ao total
function addCoins(amount) {
    totalCoins += amount;
    saveCoins();
    updateCoinCounter();
}

// Criar o contador de moedas
function createCoinCounter() {
    const coinCounter = document.createElement('div');
    coinCounter.id = 'total-coin-counter';
    coinCounter.innerHTML = `
        <img src="assets/coin-icon.png" alt="Moedas" width="24" height="24">
        <span id="total-coins-value">${totalCoins}</span>
    `;
    
    // Estilizar o contador
    coinCounter.style.position = 'fixed';
    coinCounter.style.top = '10px';
    coinCounter.style.right = '10px';
    coinCounter.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    coinCounter.style.color = 'gold';
    coinCounter.style.padding = '5px 10px';
    coinCounter.style.borderRadius = '20px';
    coinCounter.style.display = 'flex';
    coinCounter.style.alignItems = 'center';
    coinCounter.style.gap = '5px';
    coinCounter.style.fontWeight = 'bold';
    coinCounter.style.zIndex = '1000';
    
    document.body.appendChild(coinCounter);
    
    // Se não tiver uma imagem de moeda, podemos usar um emoji como fallback
    const coinImg = coinCounter.querySelector('img');
    coinImg.onerror = function() {
        this.outerHTML = '<span style="font-size: 20px; color: gold;">🪙</span>';
    };
}

// Atualizar o contador de moedas
function updateCoinCounter() {
    const coinValueElement = document.getElementById('total-coins-value');
    if (coinValueElement) {
        coinValueElement.textContent = totalCoins;
    }
}

// Iniciar o jogo quando a página estiver carregada
window.addEventListener('load', initGame);