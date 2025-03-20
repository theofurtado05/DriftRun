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
    
    // Adicionar estilos para o leaderboard
    addLeaderboardStyles();
    
    // Reestruturar o game-over
    restructureGameOver();
    
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

// Carregar moedas exclusivamente do Firestore
function loadCoins() {
    // Não fazemos nada aqui, pois os dados já são carregados no initGame
    // quando o usuário está autenticado
    return;
}

// Salvar moedas no Firestore
function saveCoins() {
    const user = getCurrentUser();
    
    if (user) {
        // Salvar no Firestore
        saveUserData();
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

   // Criar botão de pause separadamente
   createPauseButton();
}

// Adicionar variável para controlar o estado de pausa
let isPaused = false;

// Função para pausar o jogo
function pauseGame() {
    if (!game || !game.gameActive) return;
    
    isPaused = true;
    
    // Armazenar o estado atual do jogo para restaurar depois
    const savedGameState = {
        speed: game.car.speed,
        targetSpeed: game.targetSpeed,
        gameActive: game.gameActive
    };
    
    // Pausar o jogo interrompendo o loop de animação
    game.gameActive = false;
    
    // Criar overlay de pausa
    const pauseOverlay = document.createElement('div');
    pauseOverlay.id = 'pause-overlay';
    
    // Estilizar o overlay
    pauseOverlay.style.position = 'fixed';
    pauseOverlay.style.top = '0';
    pauseOverlay.style.left = '0';
    pauseOverlay.style.width = '100%';
    pauseOverlay.style.height = '100%';
    pauseOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    pauseOverlay.style.display = 'flex';
    pauseOverlay.style.justifyContent = 'center';
    pauseOverlay.style.alignItems = 'center';
    pauseOverlay.style.zIndex = '2000';
    
    // Criar botão de continuar
    const continueButton = document.createElement('button');
    continueButton.textContent = 'Continuar';
    continueButton.style.padding = '15px 30px';
    continueButton.style.fontSize = '18px';
    continueButton.style.backgroundColor = '#4CAF50';
    continueButton.style.color = 'white';
    continueButton.style.border = 'none';
    continueButton.style.borderRadius = '5px';
    continueButton.style.cursor = 'pointer';
    continueButton.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
    continueButton.style.transition = 'background-color 0.3s';
    
    // Efeito hover
    continueButton.onmouseover = function() {
        this.style.backgroundColor = '#45a049';
    };
    continueButton.onmouseout = function() {
        this.style.backgroundColor = '#4CAF50';
    };
    
    // Adicionar evento de clique para continuar o jogo
    continueButton.addEventListener('click', () => {
        // Remover o overlay
        document.body.removeChild(pauseOverlay);
        
        // Restaurar estado do jogo
        game.car.speed = savedGameState.speed;
        game.targetSpeed = savedGameState.targetSpeed;
        game.gameActive = true;
        
        // Reiniciar o loop de animação
        game.animate();
        
        // Atualizar estado de pausa
        isPaused = false;
    });
    
    // Adicionar botão ao overlay
    pauseOverlay.appendChild(continueButton);
    
    // Adicionar overlay ao corpo do documento
    document.body.appendChild(pauseOverlay);
}

// Modificar a função createPauseButton para usar pauseGame em vez de game.stop()
function createPauseButton() {
    const pauseButton = document.createElement('button');
    pauseButton.id = 'pause-button';
    pauseButton.textContent = 'Pause';
    
    // Estilizar o botão de pause
    pauseButton.style.position = 'fixed';
    pauseButton.style.top = '50px';
    pauseButton.style.right = '10px'; // Posicionado à esquerda do contador de moedas
    pauseButton.style.backgroundColor = '#f44336';
    pauseButton.style.color = 'white';
    pauseButton.style.border = 'none';
    pauseButton.style.padding = '5px 10px';
    pauseButton.style.borderRadius = '5px';
    pauseButton.style.cursor = 'pointer';
    pauseButton.style.zIndex = '1000';
    
    // Adicionar evento de clique para pausar o jogo
    pauseButton.addEventListener('click', () => {
        if (game && game.gameActive && !isPaused) {
            pauseGame(); // Chama a nova função pauseGame
        }
    });
    
    // Adicionar o botão diretamente ao corpo do documento
    document.body.appendChild(pauseButton);
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

// Adicionar função para carregar e exibir o leaderboard
function showLeaderboard(category = 'bestGameTime') {
    console.log("Carregando leaderboard para categoria:", category);
    
    // Obter a seção do leaderboard
    const leaderboardSection = document.getElementById('leaderboard-section');
    
    // Criar ou atualizar o container do leaderboard
    let leaderboardContainer = document.getElementById('leaderboard-container');
    
    if (!leaderboardContainer) {
        leaderboardContainer = document.createElement('div');
        leaderboardContainer.id = 'leaderboard-container';
        
        // Adicionar à seção do leaderboard
        leaderboardSection.appendChild(leaderboardContainer);
    }
    
    // Definir título e unidade para cada categoria
    const categoryConfig = {
        'bestGameTime': { title: 'Tempo Recorde', unit: 's', icon: '⏱️' },
        'totalCoins': { title: 'Total de Moedas', unit: '', icon: '💰' },
        'totalTimePlayed': { title: 'Tempo Total Jogado', unit: 's', icon: '⌛' },
        'totalObstaclesPassed': { title: 'Obstáculos Ultrapassados', unit: '', icon: '🚧' },
        'totalTurnsMade': { title: 'Curvas Feitas', unit: '', icon: '↩️' },
        'gamesPlayed': { title: 'Partidas Jogadas', unit: '', icon: '🎮' }
    };
    
    // Criar HTML para o leaderboard com barra de pesquisa ajustada
    let leaderboardHTML = `
        <div class="leaderboard-header">
            <h3>${categoryConfig[category].icon} ${categoryConfig[category].title}</h3>
            
            <div class="leaderboard-tabs">
                ${Object.keys(categoryConfig).map(cat => 
                    `<button class="leaderboard-tab ${cat === category ? 'active' : ''}" 
                     data-category="${cat}" title="${categoryConfig[cat].title}">${categoryConfig[cat].icon}</button>`
                ).join('')}
            </div>
            
            <div class="leaderboard-search">
                <input type="text" id="leaderboard-search-input" placeholder="Buscar jogador...">
                <button id="leaderboard-search-btn" type="button" aria-label="Buscar">🔍</button>
            </div>
        </div>
        
        <div class="leaderboard-content">
            <table class="leaderboard-table">
                <thead>
                    <tr>
                        <th>Pos</th>
                        <th>Jogador</th>
                        <th>${categoryConfig[category].title}</th>
                    </tr>
                </thead>
                <tbody id="leaderboard-body">
                    <tr><td colspan="3">Carregando...</td></tr>
                </tbody>
            </table>
        </div>
    `;
    
    leaderboardContainer.innerHTML = leaderboardHTML;
    
    // Adicionar event listeners para os botões de categoria
    document.querySelectorAll('.leaderboard-tab').forEach(tab => {
        tab.addEventListener('click', (e) => {
            const newCategory = e.target.dataset.category;
            showLeaderboard(newCategory);
        });
    });
    
    // Adicionar event listener para o botão de busca
    document.getElementById('leaderboard-search-btn').addEventListener('click', () => {
        const searchTerm = document.getElementById('leaderboard-search-input').value.trim();
        if (searchTerm) {
            searchLeaderboard(searchTerm, category);
        }
    });
    
    // Adicionar event listener para busca ao pressionar Enter
    document.getElementById('leaderboard-search-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const searchTerm = e.target.value.trim();
            if (searchTerm) {
                searchLeaderboard(searchTerm, category);
            }
        }
    });
    
    // Carregar dados do leaderboard
    loadLeaderboardData(category);
}

// Função para carregar dados do leaderboard do Firestore
function loadLeaderboardData(category, searchTerm = null) {
    const leaderboardBody = document.getElementById('leaderboard-body');
    const currentUser = getCurrentUser();
    const currentUserId = currentUser ? currentUser.uid : null;
    
    // Referência para a coleção de usuários
    const usersRef = db.collection('users');
    
    // Criar a consulta base
    let query = usersRef.orderBy(category, 'desc').limit(10);
    
    // Se houver um termo de busca, modificar a consulta
    if (searchTerm) {
        // Firebase não suporta LIKE, então precisamos buscar todos e filtrar
        query = usersRef.orderBy('username');
    }
    
    // Executa a consulta
    query.get().then((snapshot) => {
        // Array para armazenar todos os resultados
        let allResults = [];
        
        // Extrair os resultados e adicionar à array
        snapshot.forEach((doc) => {
            const userData = doc.data();
            allResults.push({
                id: doc.id,
                ...userData
            });
        });
        
        // Se houver um termo de busca, filtrar os resultados
        if (searchTerm) {
            const lowerSearchTerm = searchTerm.toLowerCase();
            allResults = allResults.filter(user => 
                user.username && user.username.toLowerCase().includes(lowerSearchTerm)
            );
            
            // Ordenar novamente por categoria
            allResults.sort((a, b) => (b[category] || 0) - (a[category] || 0));
        }
        
        // Verificar se o usuário atual está nos resultados
        let currentUserData = null;
        let currentUserIndex = -1;
        
        if (currentUserId) {
            currentUserIndex = allResults.findIndex(user => user.id === currentUserId);
            if (currentUserIndex !== -1) {
                currentUserData = allResults[currentUserIndex];
            }
        }
        
        // Preparar dados para exibição
        let topPlayers = allResults.slice(0, 10);
        
        // Construir o HTML da tabela
        let tableHTML = '';
        
        if (topPlayers.length === 0) {
            tableHTML = `<tr><td colspan="3">Nenhum resultado encontrado</td></tr>`;
        } else {
            // Mostrar os top 10 players
            topPlayers.forEach((user, index) => {
                const isCurrentUser = user.id === currentUserId;
                tableHTML += `
                    <tr class="${isCurrentUser ? 'current-user' : ''}">
                        <td>${index + 1}</td>
                        <td>${user.username || 'Anônimo'}</td>
                        <td>${user[category] || 0}</td>
                    </tr>
                `;
            });
            
            // Se o usuário atual não está nos top 10, mas existe
            if (currentUserData && currentUserIndex >= 10) {
                tableHTML += `
                    <tr class="not-in-top current-user">
                        <td>${currentUserIndex + 1}</td>
                        <td>${currentUserData.username || 'Anônimo'}</td>
                        <td>${currentUserData[category] || 0}</td>
                    </tr>
                `;
            }
        }
        
        // Atualizar a tabela
        leaderboardBody.innerHTML = tableHTML;
    }).catch((error) => {
        console.error("Erro ao carregar leaderboard:", error);
        leaderboardBody.innerHTML = `<tr><td colspan="3">Erro ao carregar dados</td></tr>`;
    });
}

// Função para buscar um jogador no leaderboard
function searchLeaderboard(searchTerm, category) {
    // Mostrar uma mensagem de carregamento
    const leaderboardBody = document.getElementById('leaderboard-body');
    leaderboardBody.innerHTML = `<tr><td colspan="3">Buscando "${searchTerm}"...</td></tr>`;
    
    // Carregar dados com o termo de busca
    loadLeaderboardData(category, searchTerm);
}

// Modificar a função showGameOver para exibir o leaderboard
function showGameOver() {
    // Primeiro, remover quaisquer anúncios existentes
    removeAdScript("left-ad");
    removeAdScript("right-ad");
    
    // Limpar os contêineres de anúncios
    document.getElementById("left-ad").innerHTML = "";
    document.getElementById("right-ad").innerHTML = "";
    
    // Depois, carregar os novos anúncios com base no tamanho da tela
    if (window.innerWidth <= 768) {
        console.log("Mobile");
        loadAdScript("left-ad", 320, 50, CONTAINER_AD_MOBILE);
        loadAdScript("right-ad", 320, 50, CONTAINER_AD_MOBILE);
    } else {
        console.log("Desktop");
        loadAdScript("left-ad", 160, 300, CONTAINER_AD_DESKTOP);
        loadAdScript("right-ad", 160, 300, CONTAINER_AD_DESKTOP);
    }

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
    
    // Adicionar moedas coletadas ao total - garantir que sejam salvas no Firestore
    const user = getCurrentUser();
    if (user) {
        // Adicionar moedas e salvar diretamente no Firestore
        totalCoins += gameCoins;
        
        // Salvar dados no Firestore
        saveUserData();
        
        // Atualizar contador
        updateCoinCounter();
    }
    
    // Mostrar modal de game over
    document.getElementById('game-over').style.display = 'flex';
    
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
    
    // Adicionar o leaderboard com a categoria padrão (tempo recorde)
    showLeaderboard('bestGameTime');

    // Parar o carro
    this.car.speed = 0;
}

// Adicionar estilos para o layout de game-over com leaderboard
function addLeaderboardStyles() {
    updateLeaderboardStyles();
}

// Modificar a estrutura do game-over quando o jogo iniciar
function restructureGameOver() {
    const gameOverDiv = document.getElementById('game-over');
    if (!gameOverDiv) return;
    
    // Salvar os anúncios antes de modificar
    const leftAd = document.getElementById('left-ad');
    const rightAd = document.getElementById('right-ad');
    
    // Nova estrutura com botão para leaderboard
    gameOverDiv.innerHTML = `
        <h2>GAME OVER</h2>
        <div class="game-over-layout">
            <div class="ad-container" id="left-ad-container"></div>
            <div class="game-over-content">
                <div class="game-over-stats">
                    <p>⏳ Tempo total: <span id="total-time">0</span>s</p>
                    <p>🏆 Seu recorde: <span id="best-time">0</span>s</p>
                    <p>💰 Moedas coletadas: <span id="total-coins">0</span></p>
                    <p>➰ Curvas feitas: <span id="total-turns">0</span></p>
                    <p>🚧 Obstáculos desviados: <span id="total-obstacles">0</span></p>
                </div>
                <div class="game-over-actions">
                    <button id="restart-button">Recomeçar</button>
                    <button id="open-shop-btn">Loja de Carros</button>
                    <button id="show-leaderboard-btn">Ranking Mundial 🏆</button>
                </div>
                <div id="leaderboard-section" style="display: none;">
                    <!-- O leaderboard será adicionado aqui -->
                </div>
            </div>
            <div class="ad-container" id="right-ad-container"></div>
        </div>
    `;
    
    // Mover os anúncios para os novos containers
    if (leftAd) document.getElementById('left-ad-container').appendChild(leftAd);
    if (rightAd) document.getElementById('right-ad-container').appendChild(rightAd);
    
    // Reconectar evento ao botão de restart
    document.getElementById('restart-button').addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        game.restart();
    });
    
    // Reconectar evento ao botão da loja
    document.getElementById('open-shop-btn').addEventListener('click', () => {
        document.getElementById('game-over').style.display = 'none';
        openShop();
    });
    
    // Adicionar evento ao botão de leaderboard
    document.getElementById('show-leaderboard-btn').addEventListener('click', toggleLeaderboard);
    
    // Estilizar o botão de leaderboard
    const leaderboardBtn = document.getElementById('show-leaderboard-btn');
    leaderboardBtn.style.backgroundColor = '#8E44AD'; // Cor roxa
    leaderboardBtn.style.color = 'white';
    leaderboardBtn.style.border = 'none';
    leaderboardBtn.style.padding = '10px 20px';
    leaderboardBtn.style.borderRadius = '5px';
    leaderboardBtn.style.cursor = 'pointer';
    leaderboardBtn.style.marginTop = '10px';
}

// Função para alternar a visibilidade do leaderboard
function toggleLeaderboard() {
    const leaderboardSection = document.getElementById('leaderboard-section');
    const leaderboardBtn = document.getElementById('show-leaderboard-btn');
    
    if (leaderboardSection.style.display === 'none') {
        // Mostrar o leaderboard
        leaderboardSection.style.display = 'block';
        leaderboardBtn.textContent = 'Esconder Ranking ▲';
        
        // Verificar se o leaderboard já foi carregado
        if (!document.getElementById('leaderboard-container')) {
            // Carregar o leaderboard apenas na primeira vez
            showLeaderboard('bestGameTime');
        }
    } else {
        // Esconder o leaderboard
        leaderboardSection.style.display = 'none';
        leaderboardBtn.textContent = 'Ranking Mundial 🏆';
    }
}

// Atualizar os estilos do leaderboard com a barra de pesquisa corrigida
function updateLeaderboardStyles() {
    // Verificar se já existe um estilo personalizado para o leaderboard
    const existingStyle = document.getElementById('leaderboard-styles');
    if (existingStyle) {
        existingStyle.remove();
    }
    
    // Criar novo elemento de estilo
    const styleElement = document.createElement('style');
    styleElement.id = 'leaderboard-styles';
    styleElement.textContent = `
        #game-over {
            display: flex;
            flex-direction: column;
            align-items: center;
            max-height: 90vh;
            overflow-y: auto;
        }
        
        .game-over-stats {
            margin-bottom: 20px;
            text-align: center;
        }
        
        .game-over-actions {
            display: flex;
            flex-wrap: wrap;
            justify-content: center;
            gap: 10px;
            margin: 15px 0;
        }
        
        #leaderboard-container {
            max-height: 400px;
            overflow-y: auto;
            scrollbar-width: thin;
            width: 100%;
            max-width: 600px;
            margin: 20px auto;
            background-color: rgba(0, 0, 0, 0.7);
            border-radius: 10px;
            padding: 15px;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
        }
        
        #leaderboard-container::-webkit-scrollbar {
            width: 8px;
        }
        
        #leaderboard-container::-webkit-scrollbar-track {
            background: rgba(0, 0, 0, 0.3);
            border-radius: 4px;
        }
        
        #leaderboard-container::-webkit-scrollbar-thumb {
            background-color: rgba(255, 255, 255, 0.3);
            border-radius: 4px;
        }
        
        .leaderboard-header {
            display: flex;
            flex-direction: column;
            align-items: center;
            margin-bottom: 15px;
        }
        
        .leaderboard-header h3 {
            color: white;
            margin: 0 0 15px 0;
            font-size: 1.3em;
            text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
        }
        
        .leaderboard-tabs {
            display: flex;
            flex-wrap: wrap;
            justify-content: center;
            gap: 12px;
            margin-bottom: 15px;
        }
        
        .leaderboard-tab {
            background-color: #444;
            color: white;
            border: none;
            border-radius: 8px;
            padding: 10px 14px;
            cursor: pointer;
            font-size: 16px;
            transition: all 0.3s ease;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
        
        .leaderboard-tab:hover {
            background-color: #666;
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
        }
        
        .leaderboard-tab.active {
            background-color: #8E44AD;
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
        }
        
        .leaderboard-content {
            width: 100%;
            display: flex;
            justify-content: center;
        }
        
        .leaderboard-table {
            width: 95%;
            border-collapse: collapse;
            color: white;
            margin: 0 auto;
        }
        
        .leaderboard-table th,
        .leaderboard-table td {
            padding: 10px 12px;
            text-align: center;
            border-bottom: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        .leaderboard-table th {
            background-color: rgba(0, 0, 0, 0.3);
            font-weight: bold;
            text-transform: uppercase;
            font-size: 0.85em;
            letter-spacing: 0.5px;
        }
        
        .leaderboard-table tr.current-user {
            background-color: rgba(142, 68, 173, 0.3);
            font-weight: bold;
        }
        
        .not-in-top {
            margin-top: 10px;
            padding-top: 10px;
            border-top: 2px dashed rgba(255, 255, 255, 0.3);
        }
        
        .leaderboard-search {
            display: flex;
            width: 100%;
            max-width: 300px;
            margin: 8px auto 15px;
            box-shadow: 0 3px 6px rgba(0, 0, 0, 0.3);
            border-radius: 0;
            overflow: visible;
            transition: all 0.3s ease;
            background: transparent;
            border: none;
            height: 36px;
            align-items: center;
            justify-content: center;
            gap: 2px;
        }
        
        .leaderboard-search:hover, 
        .leaderboard-search:focus-within {
            box-shadow: none;
            transform: none;
        }
        
        #leaderboard-search-input {
            flex: 1;
            padding: 0 15px;
            height: 100%;
            background: rgba(40, 40, 40, 0.8);
            color: white;
            border: 1px solid rgba(120, 120, 120, 0.5);
            border-right: none;
            border-radius: 18px 0 0 18px;
            font-size: 14px;
            font-family: 'Arial', sans-serif;
            letter-spacing: 0.5px;
            font-weight: 400;
            outline: none;
            transition: all 0.3s ease;
        }
        
        #leaderboard-search-input:focus {
            background: rgba(50, 50, 50, 0.9);
            border-color: rgba(150, 150, 150, 0.7);
            box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.2);
        }
        
        #leaderboard-search-input::placeholder {
            color: rgba(200, 200, 200, 0.7);
            transition: all 0.2s ease;
        }
        
        #leaderboard-search-input:focus::placeholder {
            color: rgba(160, 160, 160, 0.5);
            transform: translateX(5px);
        }
        
        #leaderboard-search-btn {
            background: linear-gradient(135deg, #8E44AD, #9B59B6);
            color: white;
            border: none;
            height: 100%;
            width: 42px;
            cursor: pointer;
            font-size: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            text-align: center;
            border-radius: 0 18px 18px 0;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
        }
        
        #leaderboard-search-btn:hover {
            background: linear-gradient(135deg, #9B59B6, #8E44AD);
            transform: translateX(2px);
        }
        
        /* Estilos responsivos para dispositivos móveis */
        @media (max-width: 768px) {
            .leaderboard-search {
                max-width: 85%;
                height: 34px;
            }
        }
    `;
    
    document.head.appendChild(styleElement);
}