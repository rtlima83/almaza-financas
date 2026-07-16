# 💰 Almaza Financas

Sistema web de controle financeiro desenvolvido para a **Esfiharia Almaza**, com o objetivo de centralizar e automatizar a gestão financeira da empresa.

O sistema foi projetado para oferecer uma visão completa da saúde financeira do negócio, permitindo o gerenciamento de receitas, despesas, fluxo de caixa, contas a pagar e a receber, além da geração de indicadores para apoio à tomada de decisão.

---

## 🚀 Tecnologias

### Backend

- Python
- Django
- Django REST Framework
- PostgreSQL

### Frontend

- React
- TypeScript
- Tailwind CSS
  

### Ferramentas

- Git
- GitHub
- Docker (em desenvolvimento)

---

## ✨ Funcionalidades

### Dashboard

- Visão geral da situação financeira
- Indicadores financeiros
- Gráficos
- Fluxo de caixa

### Receitas

- Cadastro
- Edição
- Exclusão
- Pesquisa
- Filtros

### Despesas

- Cadastro
- Edição
- Exclusão
- Categorias
- Filtros

### Contas

- Contas a pagar
- Contas a receber
- Controle de vencimentos
- Controle de pagamentos

### Fluxo de Caixa

- Entradas
- Saídas
- Saldo diário
- Saldo mensal

### Relatórios

- Receitas
- Despesas
- Fluxo de caixa
- Demonstrativos financeiros

### Usuários

- Login
- Autenticação
- Controle de permissões

---

## 📂 Estrutura do Projeto

```
almaza-finance/
│
├── backend/
│   ├── apps/
│   ├── config/
│   ├── requirements.txt
│   └── manage.py
│
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── vite.config.ts
│
└── README.md
```

---

## ⚙️ Instalação

### Clone o projeto

```bash
git clone https://github.com/rtlima83/almaza-financas.git
```

### Backend

```bash
cd backend

python -m venv venv

# Windows
venv\Scripts\activate

# Linux
source venv/bin/activate

pip install -r requirements.txt

python manage.py migrate

python manage.py runserver
```

### Frontend

```bash
cd frontend

npm install

npm run dev
```

---

## 📈 Roadmap

- [x] Estrutura inicial
- [x] Cadastro de receitas
- [x] Cadastro de despesas
- [ ] Dashboard financeiro
- [ ] Contas a pagar
- [ ] Contas a receber
- [ ] Fluxo de caixa
- [ ] Relatórios
- [ ] Exportação para PDF
- [ ] Exportação para Excel
- [ ] API REST completa
- [ ] Docker
- [ ] Deploy

---

## 🧪 Testes

Em desenvolvimento.

---

## 🤖 Assistência de IA

Durante o desenvolvimento deste projeto foram utilizadas ferramentas de Inteligência Artificial como apoio ao desenvolvimento, principalmente para:

- geração de sugestões de código;
- esclarecimento de conceitos;
- revisão e refatoração de implementações;
- auxílio na resolução de problemas.

Todo o código foi analisado, adaptado, testado e integrado manualmente ao projeto.

---

## 🎯 Objetivo

Este projeto foi desenvolvido para atender às necessidades reais de controle financeiro da **Esfiharia Almaza**, servindo também como projeto de portfólio para demonstrar conhecimentos em desenvolvimento Full Stack utilizando Python, Django, React, TypeScript e PostgreSQL.

---

## 📄 Licença

Este projeto está licenciado sob a licença MIT.

---

## 👨‍💻 Autor

**Rodrigo Lima**

GitHub: https://github.com/rtlima83
LinkedIn: https://linkedin.com/in/rodrigo-lima-developer
