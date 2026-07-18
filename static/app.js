// static/app.js

const API_BASE_URL = '/api/v1';
const AUTH_URL = '/api/auth/login/';

const WEEKS_LABEL = {
    1: 'Semana 1: 29 a 05',
    2: 'Semana 2: 06 a 12',
    3: 'Semana 3: 13 a 19',
    4: 'Semana 4: 20 a 26',
    5: 'Semana 5: 27 a 02'
};

const CATEGORY_COLORS = {
    'Consumo': 'bg-blue-100 text-blue-800 border-blue-200',
    'Operacional': 'bg-slate-100 text-slate-800 border-slate-200',
    'Pessoal': 'bg-purple-100 text-purple-800 border-purple-200',
    'Empréstimos': 'bg-amber-100 text-amber-800 border-amber-200',
    'Impostos': 'bg-red-100 text-red-800 border-red-200',
    'Cartões': 'bg-teal-100 text-teal-800 border-teal-200'
};

let currentWeek = 1;
let expenses = [];
let revenues = { 1: '', 2: '', 3: '', 4: '', 5: '' };

// --- INICIALIZAÇÃO ---
document.addEventListener("DOMContentLoaded", () => {
    lucide.createIcons();
    checkLoginState();
    renderWeeksTabs();
});

// --- COMUNICAÇÃO SEGURA COM A API ---
async function apiFetch(endpoint, options = {}) {
    const token = localStorage.getItem('almaza_access_token');
    
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
        'Authorization': `Bearer ${token}`
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, { ...options, headers });
    
    if (response.status === 401) {
        alert("Sua sessão expirou por segurança. Por favor, faça login novamente.");
        handleLogout();
        return null;
    }
    
    if (!response.ok) {
        throw new Error(`Erro na requisição: ${response.status}`);
    }

    return await response.json();
}

// --- CONTROLE DE AUTENTICAÇÃO ---
function checkLoginState() {
    const loggedUser = localStorage.getItem('almaza_logged_user');
    const token = localStorage.getItem('almaza_access_token');
    
    if (loggedUser && token) {
        document.getElementById('logged-user-name').innerText = loggedUser;
        document.getElementById('login-screen').classList.add('hidden');
        document.getElementById('main-dashboard').classList.remove('hidden');
        loadCloudData(currentWeek);
    }
}

async function handleLogin(e) {
    e.preventDefault();
    const pass = document.getElementById('password').value.trim();
    const user = document.getElementById('username').value.trim();
    const error = document.getElementById('login-error');

    try {
        const response = await fetch(AUTH_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: user, password: pass })
        });

        if (response.ok) {
            const data = await response.json();
            error.classList.add('hidden');
            
            localStorage.setItem('almaza_access_token', data.access);
            localStorage.setItem('almaza_refresh_token', data.refresh);
            localStorage.setItem('almaza_logged_user', user);
            
            document.getElementById('logged-user-name').innerText = user;
            
            document.getElementById('login-screen').classList.add('opacity-0', 'transition-opacity', 'duration-300');
            setTimeout(() => {
                document.getElementById('login-screen').classList.add('hidden');
                document.getElementById('main-dashboard').classList.remove('hidden');
                loadCloudData(currentWeek);
            }, 300);
            
            showToast('Sessão autenticada na nuvem com sucesso!');
        } else {
            error.classList.remove('hidden');
        }
    } catch (err) {
        console.error("Erro no login:", err);
        alert("Não foi possível conectar ao servidor de autenticação.");
    }
}

function handleLogout() {
    if (confirm('Deseja encerrar a sessão de acesso?')) {
        localStorage.removeItem('almaza_access_token');
        localStorage.removeItem('almaza_refresh_token');
        localStorage.removeItem('almaza_logged_user');
        location.reload();
    }
}

function togglePassword() {
    const passInput = document.getElementById('password');
    const eyeIcon = document.getElementById('eye-icon');
    if (passInput.type === 'password') {
        passInput.type = 'text';
        eyeIcon.setAttribute('data-lucide', 'eye-off');
    } else {
        passInput.type = 'password';
        eyeIcon.setAttribute('data-lucide', 'eye');
    }
    lucide.createIcons();
}

// --- SINCRONIZAÇÃO DE DADOS (BANCO DE DADOS NUVEM) ---
async function loadCloudData(weekNum) {
    try {
        const data = await apiFetch(`/despesas/?mes_ano=2026-07&semana=${weekNum}`);
        if (data) {
            expenses = data.map(item => ({
                id: item.id,
                week: item.semana,
                name: item.descricao,
                day: item.dia_vencimento,
                amount: parseFloat(item.valor_original),
                paid: parseFloat(item.valor_pago),
                status: item.status,
                category: item.categoria,
                notes: item.observacoes || ''
            }));
            renderExpenses();
            updateMetrics();
        }
    } catch (error) {
        console.error("Erro ao sincronizar dados:", error);
    }
}

// --- ABAS E SELEÇÃO DE PERÍODO ---
function renderWeeksTabs() {
    const container = document.getElementById('weeks-tab-container');
    container.innerHTML = '';

    for (let w = 1; w <= 5; w++) {
        const btn = document.createElement('button');
        const isActive = (w === currentWeek);
        btn.className = `px-3.5 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
            isActive 
            ? 'bg-slate-900 text-white shadow-md' 
            : 'text-slate-600 hover:bg-slate-100'
        }`;
        btn.innerHTML = `
            <i data-lucide="${isActive ? 'folder-open' : 'folder'}" class="w-3.5 h-3.5 ${isActive ? 'text-emerald-400' : 'text-slate-400'}"></i>
            ${WEEKS_LABEL[w]}
        `;
        btn.onclick = () => selectWeek(w);
        container.appendChild(btn);
    }
    lucide.createIcons();
}

function selectWeek(weekNum) {
    currentWeek = weekNum;
    document.getElementById('current-week-badge').innerText = `Semana ${weekNum}`;
    document.getElementById('weekly-revenue-input').value = revenues[currentWeek] || '';
    renderWeeksTabs();
    loadCloudData(currentWeek);
}

// --- TABELA DE VENCIMENTOS ---
function renderExpenses() {
    const tbody = document.getElementById('expenses-table-body');
    const emptyState = document.getElementById('table-empty-state');
    const search = document.getElementById('search-input').value.toLowerCase();
    const categoryFilter = document.getElementById('filter-category').value;

    tbody.innerHTML = '';

    const filtered = expenses.filter(item => {
        const matchWeek = item.week === currentWeek;
        const matchSearch = item.name.toLowerCase().includes(search) || (item.notes && item.notes.toLowerCase().includes(search));
        const matchCategory = categoryFilter === 'ALL' || item.category === categoryFilter;
        return matchWeek && matchSearch && matchCategory;
    });

    if (filtered.length === 0) {
        emptyState.classList.remove('hidden');
    } else {
        emptyState.classList.add('hidden');
    }

    filtered.sort((a, b) => a.day - b.day);

    filtered.forEach(item => {
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-slate-50/80 transition duration-150';
        
        const remaining = Math.max(0, item.amount - item.paid);
        
        let statusHtml = '';
        if (item.status === 'Pago' || remaining === 0) {
            statusHtml = `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200"><i data-lucide="check" class="w-3 h-3"></i> Pago</span>`;
        } else if (item.status === 'Parcial' || item.paid > 0) {
            statusHtml = `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200"><i data-lucide="clock" class="w-3 h-3"></i> Parcial</span>`;
        } else {
            statusHtml = `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200"><i data-lucide="circle" class="w-3 h-3"></i> Pendente</span>`;
        }

        const catStyle = CATEGORY_COLORS[item.category] || 'bg-slate-100 text-slate-700';

        tr.innerHTML = `
            <td class="py-3 px-4 text-center">${statusHtml}</td>
            <td class="py-3 px-3 font-semibold text-slate-700">Dia ${item.day}</td>
            <td class="py-3 px-4">
                <div class="font-bold text-slate-900 uppercase">${item.name}</div>
                ${item.notes ? `<span class="text-xs text-amber-600 flex items-center gap-1 mt-0.5"><i data-lucide="alert-circle" class="w-3 h-3"></i> ${item.notes}</span>` : ''}
            </td>
            <td class="py-3 px-4">
                <span class="px-2.5 py-0.5 rounded-md text-xs font-medium border ${catStyle}">${item.category}</span>
            </td>
            <td class="py-3 px-4 text-right font-medium text-slate-600">R$ ${item.amount.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</td>
            <td class="py-3 px-4 text-right font-bold ${item.paid > 0 ? 'text-emerald-600' : 'text-slate-400'}">
                R$ ${item.paid.toLocaleString('pt-BR', {minimumFractionDigits: 2})}
            </td>
            <td class="py-3 px-4 text-right font-bold ${remaining > 0 ? 'text-slate-800' : 'text-slate-300'}">
                R$ ${remaining.toLocaleString('pt-BR', {minimumFractionDigits: 2})}
            </td>
            <td class="py-3 px-4 text-center">
                <div class="flex items-center justify-center gap-1">
                    ${remaining > 0 ? `
                        <button onclick="markAsPaid('${item.id}')" title="Quitar Integralmente" class="p-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-lg transition">
                            <i data-lucide="check-check" class="w-4 h-4"></i>
                        </button>
                        <button onclick="promptPartialPayment('${item.id}')" title="Dar Baixa Parcial" class="p-1.5 bg-amber-50 text-amber-600 hover:bg-amber-600 hover:text-white rounded-lg transition">
                            <i data-lucide="coins" class="w-4 h-4"></i>
                        </button>
                    ` : `
                        <button onclick="undoPayment('${item.id}')" title="Desfazer Quitação" class="p-1.5 bg-slate-100 text-slate-500 hover:bg-slate-200 rounded-lg transition">
                            <i data-lucide="rotate-ccw" class="w-4 h-4"></i>
                        </button>
                    `}
                    <button onclick="editExpense('${item.id}')" title="Editar" class="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition">
                        <i data-lucide="edit-2" class="w-4 h-4"></i>
                    </button>
                    <button onclick="deleteExpense('${item.id}')" title="Remover" class="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition">
                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
    lucide.createIcons();
    updateMetrics();
}

// --- CÁLCULO E MÉTRICAS ---
function updateMetrics() {
    const weekExpenses = expenses.filter(item => item.week === currentWeek);
    
    const totalAmount = weekExpenses.reduce((acc, item) => acc + item.amount, 0);
    const totalPaid = weekExpenses.reduce((acc, item) => acc + item.paid, 0);
    const totalPending = Math.max(0, totalAmount - totalPaid);
    
    const progress = totalAmount > 0 ? Math.round((totalPaid / totalAmount) * 100) : 0;

    document.getElementById('metric-total-expenses').innerText = `R$ ${totalAmount.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`;
    document.getElementById('metric-expenses-count').innerText = `${weekExpenses.length} contas cadastradas nesta semana`;
    document.getElementById('metric-total-paid').innerText = `R$ ${totalPaid.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`;
    document.getElementById('metric-total-pending').innerText = `R$ ${totalPending.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`;
    
    document.getElementById('metric-progress-percent').innerText = `${progress}%`;
    document.getElementById('metric-progress-bar').style.width = `${progress}%`;

    const revVal = parseFloat(document.getElementById('weekly-revenue-input').value) || 0;
    revenues[currentWeek] = revVal > 0 ? revVal : '';

    const balance = revVal - totalAmount;
    const balEl = document.getElementById('metric-balance');
    const balDesc = document.getElementById('metric-balance-desc');
    const balIcon = document.getElementById('balance-icon-container');
    const covTag = document.getElementById('metric-coverage-tag');

    if (revVal === 0) {
        balEl.innerText = `R$ 0,00`;
        balEl.className = 'text-2xl font-bold text-slate-400';
        balDesc.innerText = 'Insira a entrada da semana acima e distribua.';
        balIcon.className = 'w-12 h-12 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center shrink-0';
        covTag.innerText = 'Aguardando Entrada';
        covTag.className = 'px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-semibold';
    } else if (balance >= 0) {
        balEl.innerText = `+ R$ ${balance.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`;
        balEl.className = 'text-2xl font-bold text-emerald-600';
        balDesc.innerText = `Superávit! Entrada cobre todas as despesas da semana.`;
        balIcon.className = 'w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0';
        covTag.innerText = '100% Coberto + Sobra';
        covTag.className = 'px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-semibold';
    } else {
        balEl.innerText = `- R$ ${Math.abs(balance).toLocaleString('pt-BR', {minimumFractionDigits: 2})}`;
        balEl.className = 'text-2xl font-bold text-red-600';
        balDesc.innerText = `Déficit! Faltarão R$ ${Math.abs(balance).toLocaleString('pt-BR', {minimumFractionDigits: 2})} para quitar tudo.`;
        balIcon.className = 'w-12 h-12 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0';
        covTag.innerText = 'Cobertura Parcial';
        covTag.className = 'px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-semibold';
    }
}

// --- ALGORITMO EM CASCATA NO BACKEND ---
async function distributeRevenue() {
    const revInput = document.getElementById('weekly-revenue-input').value;
    const availableCash = parseFloat(revInput) || 0;

    if (availableCash <= 0) {
        alert('Por favor, insira o valor da Entrada da Semana primeiro.');
        document.getElementById('weekly-revenue-input').focus();
        return;
    }

    try {
        const result = await apiFetch('/despesas/distribuir-caixa/', {
            method: 'POST',
            body: JSON.stringify({
                mes_ano: '2026-07',
                semana: currentWeek,
                valor_entrada: availableCash
            })
        });

        if (result) {
            showToast(result.mensagem || 'Caixa distribuído com sucesso pela prioridade!');
            loadCloudData(currentWeek);
        }
    } catch (error) {
        console.error("Erro na distribuição:", error);
        alert("Falha ao processar distribuição de caixa no servidor.");
    }
}

// --- AÇÕES RÁPIDAS DE PAGAMENTO VIA API ---
async function markAsPaid(id) {
    const item = expenses.find(i => i.id === id);
    if (item) {
        try {
            await apiFetch(`/despesas/${id}/`, {
                method: 'PATCH',
                body: JSON.stringify({ valor_pago: item.amount, status: 'Pago' })
            });
            showToast(`"${item.name}" marcado como quitado!`);
            loadCloudData(currentWeek);
        } catch (error) {
            console.error("Erro na quitação:", error);
        }
    }
}

async function promptPartialPayment(id) {
    const item = expenses.find(i => i.id === id);
    if (item) {
        const remaining = item.amount - item.paid;
        const val = prompt(`Valor original: R$ ${item.amount.toFixed(2)}\nJá pago: R$ ${item.paid.toFixed(2)}\n\nDigite o valor que deseja dar baixa agora:`, remaining.toFixed(2));
        
        if (val !== null && !isNaN(parseFloat(val))) {
            const addPaid = parseFloat(val);
            try {
                await apiFetch(`/despesas/${id}/baixa-parcial/`, {
                    method: 'POST',
                    body: JSON.stringify({ valor: addPaid })
                });
                showToast('Baixa parcial sincronizada com sucesso!');
                loadCloudData(currentWeek);
            } catch (error) {
                console.error("Erro na baixa parcial:", error);
            }
        }
    }
}

async function undoPayment(id) {
    const item = expenses.find(i => i.id === id);
    if (item) {
        try {
            await apiFetch(`/despesas/${id}/`, {
                method: 'PATCH',
                body: JSON.stringify({ valor_pago: 0, status: 'Pendente' })
            });
            showToast(`Pagamento desfeito para "${item.name}".`);
            loadCloudData(currentWeek);
        } catch (error) {
            console.error("Erro ao desfazer:", error);
        }
    }
}

async function deleteExpense(id) {
    if (confirm('Tem certeza que deseja remover este vencimento permanentemente?')) {
        try {
            await apiFetch(`/despesas/${id}/`, { method: 'DELETE' });
            showToast('Vencimento removido.');
            loadCloudData(currentWeek);
        } catch (error) {
            console.error("Erro ao remover:", error);
        }
    }
}

// --- GESTÃO DE MODAIS E FORMULÁRIOS ---
function openModal(id = null) {
    document.getElementById('expense-modal').classList.remove('hidden');
    if (id) {
        const item = expenses.find(i => i.id === id);
        document.getElementById('modal-title').innerHTML = `<i data-lucide="edit-2" class="w-5 h-5 text-emerald-600"></i> Editar Vencimento`;
        document.getElementById('expense-id').value = item.id;
        document.getElementById('form-week').value = item.week;
        document.getElementById('form-name').value = item.name;
        document.getElementById('form-day').value = item.day;
        document.getElementById('form-amount').value = item.amount;
        document.getElementById('form-category').value = item.category;
        document.getElementById('form-notes').value = item.notes || '';
    } else {
        document.getElementById('modal-title').innerHTML = `<i data-lucide="plus-circle" class="w-5 h-5 text-emerald-600"></i> Cadastrar Novo Vencimento`;
        document.getElementById('expense-form').reset();
        document.getElementById('expense-id').value = '';
        document.getElementById('form-week').value = currentWeek;
    }
    lucide.createIcons();
}

function closeModal() {
    document.getElementById('expense-modal').classList.add('hidden');
}

function editExpense(id) {
    openModal(id);
}

async function saveExpense(e) {
    e.preventDefault();
    const id = document.getElementById('expense-id').value;
    
    const despesaData = {
        mes_ano: "2026-07",
        semana: parseInt(document.getElementById('form-week').value),
        descricao: document.getElementById('form-name').value.trim(),
        dia_vencimento: parseInt(document.getElementById('form-day').value),
        valor_original: parseFloat(document.getElementById('form-amount').value),
        categoria: document.getElementById('form-category').value,
        observacoes: document.getElementById('form-notes').value.trim()
    };

    try {
        const endpoint = id ? `/despesas/${id}/` : '/despesas/';
        const method = id ? 'PUT' : 'POST';
        
        await apiFetch(endpoint, {
            method: method,
            body: JSON.stringify(despesaData)
        });

        closeModal();
        
        if (despesaData.semana !== currentWeek) {
            selectWeek(despesaData.semana);
        } else {
            loadCloudData(currentWeek);
        }
        showToast('Vencimento sincronizado no servidor!');
    } catch (error) {
        console.error("Erro ao salvar:", error);
        alert("Ocorreu um erro ao salvar o vencimento. Verifique os dados.");
    }
}

// --- NOTIFICAÇÕES TOAST ---
function showToast(message) {
    const toast = document.getElementById('toast');
    document.getElementById('toast-message').innerText = message;
    toast.classList.remove('hidden');
    setTimeout(() => {
        toast.classList.add('hidden');
    }, 3500);
}