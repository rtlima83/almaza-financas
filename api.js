// Configuração do Cliente API na Interface
const API_BASE_URL = 'http://localhost:8000/api/v1';
const AUTH_URL = 'http://localhost:8000/api/auth/login/';

// 1. Função de Login Real (Substitui a verificação estática)
async function handleRealLogin(username, password) {
    try {
        const response = await fetch(AUTH_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        if (!response.ok) throw new Error('Credenciais inválidas');
        
        const data = await response.json();
        // Salva o Token JWT seguro no navegador
        localStorage.setItem('almaza_access_token', data.access);
        localStorage.setItem('almaza_refresh_token', data.refresh);
        
        return true;
    } catch (error) {
        console.error("Erro no login:", error);
        return false;
    }
}

// 2. Wrapper para chamadas autenticadas
async function apiFetch(endpoint, options = {}) {
    const token = localStorage.getItem('almaza_access_token');
    
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
        'Authorization': `Bearer ${token}`
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, { ...options, headers });
    
    // Se o token expirou, desloga ou tenta refresh
    if (response.status === 401) {
        alert("Sessão expirada. Por favor, faça login novamente.");
        handleLogout();
        return null;
    }
    
    return await response.json();
}

// 3. Carregando dados direto do PostgreSQL
async function loadExpensesFromPostgres(weekNumber) {
    const data = await apiFetch(`/despesas/?mes_ano=2026-07&semana=${weekNumber}`);
    if (data) {
        expenses = data; // Atualiza o estado global da tela com dados reais
        renderExpenses();
        updateMetrics();
    }
}

// 4. Acionando a Distribuição em Cascata no Servidor
async function triggerServerDistribution(weekNumber, revenueAmount) {
    const result = await apiFetch('/despesas/distribuir-caixa/', {
        method: 'POST',
        body: JSON.stringify({
            mes_ano: '2026-07',
            semana: weekNumber,
            valor_entrada: revenueAmount
        })
    });

    if (result) {
        showToast(result.mensagem);
        expenses = result.despesas; // Atualiza a tela com as baixas que o Postgres calculou
        renderExpenses();
        updateMetrics();
    }
}