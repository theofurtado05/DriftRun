// Ponto de entrada da aplicação
// Variáveis para estatísticas
let totalCoins = 0;
let playerName = "";
let totalTimePlayed = 0;
let totalObstaclesPassed = 0;
let totalTurnsMade = 0;
let gamesPlayed = 0;
let bestGameTime = 0; // Novo: recorde de tempo de partida

let ownedCars = ['default']; // Carros que o jogador possui
let selectedCar = 'default'; // Carro atualmente selecionado

// Função para inicializar o jogo quando a página carregar
function initGame() {
    // Verificar se o usuário está autenticado
    checkAuthState((user) => {
        if (user) {
            // Usuário já está logado
            playerName = user.displayName || user.email.split('@')[0];
            
            // Carregar dados do usuário do Firestore
            getUserData(user.uid).then((userData) => {
                if (userData) {
                    // Carregar dados salvos
                    if (userData.totalCoins !== undefined) totalCoins = userData.totalCoins;
                    if (userData.ownedCars) ownedCars = userData.ownedCars;
                    if (userData.selectedCar) selectedCar = userData.selectedCar;
                    if (userData.totalTimePlayed) totalTimePlayed = userData.totalTimePlayed;
                    if (userData.totalObstaclesPassed) totalObstaclesPassed = userData.totalObstaclesPassed;
                    if (userData.totalTurnsMade) totalTurnsMade = userData.totalTurnsMade;
                    if (userData.gamesPlayed) gamesPlayed = userData.gamesPlayed;
                    if (userData.bestGameTime) bestGameTime = userData.bestGameTime;
                }
                
                // Esconder a tela de boas-vindas
                document.getElementById('welcome-screen').style.display = 'none';
                
                // Iniciar o jogo
                startGame();
            });
        } else {
            // Usuário não está logado, mostrar tela de boas-vindas
            setupWelcomeScreen();
        }
    });
    
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
    const user = getCurrentUser();
    
    if (user) {
        // Salvar no Firestore (já incluído em saveUserData)
        saveUserData();
    } else {
        // Fallback para localStorage
        localStorage.setItem('driftRaceOwnedCars', JSON.stringify(ownedCars));
    }
}

function loadOwnedCars() {
    const user = getCurrentUser();
    
    if (user) {
        // Dados já carregados do Firestore
        return;
    }
    
    // Fallback para localStorage
    const saved = localStorage.getItem('driftRaceOwnedCars');
    if (saved) {
        ownedCars = JSON.parse(saved);
    }
}

function saveSelectedCar() {
    const user = getCurrentUser();
    
    if (user) {
        // Salvar no Firestore
        saveUserData();
    } else {
        // Fallback para localStorage
        localStorage.setItem('driftRaceSelectedCar', selectedCar);
    }
}

function loadSelectedCar() {
    const user = getCurrentUser();
    
    if (user) {
        // Dados já carregados do Firestore
        return;
    }
    
    // Fallback para localStorage
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
// Configurar os botões da tela de boas-vindas
function setupWelcomeScreen() {
    // Adicionar botão de login com Google
    const googleLoginBtn = document.createElement('button');
    googleLoginBtn.id = 'google-login-btn';
    googleLoginBtn.innerHTML = '<img src="https://img.icons8.com/?size=512&id=17949&format=png" alt="Google" width="20" height="20"> Entrar com Google';
    googleLoginBtn.style.backgroundColor = 'white';
    googleLoginBtn.style.color = '#4285F4';
    googleLoginBtn.style.border = 'none';
    googleLoginBtn.style.padding = '10px 20px';
    googleLoginBtn.style.borderRadius = '5px';
    googleLoginBtn.style.cursor = 'pointer';
    googleLoginBtn.style.fontSize = '1rem';
    googleLoginBtn.style.marginTop = '10px';
    googleLoginBtn.style.display = 'flex';
    googleLoginBtn.style.alignItems = 'center';
    googleLoginBtn.style.justifyContent = 'center';
    googleLoginBtn.style.gap = '10px';
    googleLoginBtn.style.margin = '10px auto'; // Adiciona margem automática nas laterais
    
    // Adicionar o botão à primeira seção de boas-vindas
    const welcomeSection = document.querySelector('.welcome-section');
    
    // Limpar o conteúdo existente da seção de boas-vindas
    welcomeSection.innerHTML = '<h2>Bem-vindo ao Jogo!</h2><p>Entre com sua conta Google para começar:</p>';
    
    // Configurar a seção de boas-vindas para centralizar o conteúdo
    welcomeSection.style.display = 'flex';
    welcomeSection.style.flexDirection = 'column';
    welcomeSection.style.alignItems = 'center';
    welcomeSection.style.textAlign = 'center';
    
    // Adicionar o botão de login com Google
    welcomeSection.appendChild(googleLoginBtn);
    
    // Adicionar evento de clique para login com Google
    googleLoginBtn.addEventListener('click', () => {
        loginWithGoogle()
            .then((user) => {
                playerName = user.displayName || user.email.split('@')[0];
                
                // Esconder a tela de boas-vindas
                document.getElementById('welcome-screen').style.display = 'none';
                
                // Iniciar o jogo
                startGame();
            })
            .catch((error) => {
                alert('Erro ao fazer login: ' + error.message);
            });
    });
    
    // Botão para patrocinar
    document.getElementById('sponsor-btn').addEventListener('click', function() {
        window.open('https://abacatepay.com/pay/bill_shn66fGZChStgc4HwzbRAUGx', '_blank');
    });
}

// Iniciar o jogo
function startGame() {
    // Carregar moedas do localStorage ou Firestore
    loadCoins();
    
    // Criar nova instância do jogo
    game = new Game(selectedCar);
    
    // Adicionar manipulador para limpeza do jogo quando a página for fechada
    window.addEventListener('beforeunload', () => {
        if (game) {
            game.cleanup();
        }
        
        // Salvar dados do usuário
        saveUserData();
    });
    
    // Criar e adicionar o contador de moedas total
    createCoinCounter();
    
    // Mostrar mensagem de boas-vindas com o nome do jogador
    showWelcomeMessage();
    
    
    
    // Log para indicar que o jogo foi inicializado
    console.log('Drift Race 3D inicializado para ' + playerName);
}

// Adicionar botão de logout
function addLogoutButton() {
    const user = getCurrentUser();
    if (!user) return;
    
    const logoutBtn = document.createElement('button');
    logoutBtn.id = 'logout-btn';
    logoutBtn.textContent = 'Sair';
    
    // Estilizar o botão
    logoutBtn.style.position = 'fixed';
    logoutBtn.style.top = '50px';
    logoutBtn.style.left = '10px';
    logoutBtn.style.backgroundColor = '#f44336';
    logoutBtn.style.color = 'white';
    logoutBtn.style.border = 'none';
    logoutBtn.style.padding = '5px 10px';
    logoutBtn.style.borderRadius = '5px';
    logoutBtn.style.cursor = 'pointer';
    logoutBtn.style.zIndex = '1000';
    
    document.body.appendChild(logoutBtn);
    
    // Adicionar evento de clique
    logoutBtn.addEventListener('click', () => {
        // Salvar dados antes de sair
        saveUserData();
        
        logout().then(() => {
            // Recarregar a página após logout
            window.location.reload();
        });
    });
}

function removeLogoutButton() {
    const logoutBtn = document.getElementById('logout-btn');
    if (!logoutBtn) return;
    
    logoutBtn.remove();
}



// Salvar dados do usuário no Firestore
function saveUserData() {
    const user = getCurrentUser();
    if (!user) return;
    
    const userData = {
        username: playerName,
        totalCoins: totalCoins,
        ownedCars: ownedCars,
        selectedCar: selectedCar,
        totalTimePlayed: totalTimePlayed,
        totalObstaclesPassed: totalObstaclesPassed,
        totalTurnsMade: totalTurnsMade,
        gamesPlayed: gamesPlayed,
        bestGameTime: bestGameTime,
        lastUpdated: new Date()
    };
    
    saveUserDataToFirestore(user.uid, userData)
        .catch(error => console.error("Erro ao salvar dados:", error));
}

// Carregar moedas do localStorage ou Firestore
function loadCoins() {
    const user = getCurrentUser();
    
    if (user) {
        // Se o usuário estiver logado, os dados já foram carregados do Firestore
        return;
    }
    
    // Fallback para localStorage se não estiver logado
    const savedCoins = localStorage.getItem('driftRaceCoins');
    if (savedCoins !== null) {
        totalCoins = parseInt(savedCoins);
    } else {
        totalCoins = 0;
    }
}

// Salvar moedas no localStorage ou Firestore
function saveCoins() {
    const user = getCurrentUser();
    
    if (user) {
        // Salvar no Firestore
        saveUserData();
    } else {
        // Fallback para localStorage
        localStorage.setItem('driftRaceCoins', totalCoins.toString());
    }
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