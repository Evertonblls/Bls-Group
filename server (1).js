const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ─── DATABASE SETUP ───────────────────────────────────────────────────────────
const db = new Database(process.env.DB_PATH || './bls.db');

db.exec('DROP TABLE IF EXISTS events; DROP TABLE IF EXISTS tasks; DROP TABLE IF EXISTS metas; DROP TABLE IF EXISTS clients;');

db.exec(`
  CREATE TABLE IF NOT EXISTS clients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    origem TEXT DEFAULT 'Indicação',
    mrr REAL DEFAULT 0,
    entrada TEXT,
    pag_jan REAL DEFAULT 0,
    pag_fev REAL DEFAULT 0,
    pag_mar REAL DEFAULT 0,
    status TEXT DEFAULT 'Ativo',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    text TEXT NOT NULL,
    cliente TEXT DEFAULT '-',
    prioridade TEXT DEFAULT 'Media',
    status TEXT DEFAULT 'Pendente',
    prazo TEXT DEFAULT '-',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS metas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    indicador TEXT UNIQUE NOT NULL,
    meta REAL DEFAULT 0,
    atual REAL DEFAULT 0,
    unidade TEXT DEFAULT 'un',
    inverso INTEGER DEFAULT 0,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tipo TEXT,
    descricao TEXT,
    payload TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Seed initial data if empty
const clientCount = db.prepare('SELECT COUNT(*) as c FROM clients').get().c;
if (clientCount === 0) {
  const insertClient = db.prepare(`
    INSERT INTO clients (nome, origem, mrr, entrada, pag_jan, pag_fev, pag_mar)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  const clients = [
    ['Clínica Amanda Grahl', 'SEO Orgânico', 2300, 'abr/25', 2200, 2500, 1800],
    ['Clinica Ananda Rodrigues', 'Indicação', 1000, 'dez/25', 1000, 1000, 0],
    ['Bm Toys', 'Meta Ads', 1500, 'ago/25', 1500, 1500, 1500],
    ['Loja do Bambolê', 'SEO Orgânico', 1000, 'ago/25', 1000, 1000, 1000],
    ['Gilberto Cruz', 'Indicação', 3500, 'fev/26', 0, 3500, 0],
    ['Clinica Diovana', 'Indicação', 1000, 'fev/26', 0, 1000, 1000],
    ['Clinica Caroline Guimarães', 'SEO Orgânico', 500, 'abr/24', 500, 500, 0],
    ['Kafua Delivery', 'Meta Ads', 1200, 'out/25', 1250, 0, 0],
    ['Clinica Silvana', 'Indicação', 800, 'nov/25', 800, 800, 200],
    ['Costa Flores', 'Indicação', 1500, 'out/25', 1500, 1500, 0],
    ['Murillo Hair', 'Indicação', 1200, 'mar/26', 0, 0, 1200],
    ['Clinica Elaine', 'Meta Ads', 1250, 'jan/26', 1250, 1250, 0],
    ['PG Body Queen', 'SEO Orgânico', 1000, 'mar/26', 0, 0, 1000],
  ];
  clients.forEach(c => insertClient.run(...c));

  const insertTask = db.prepare(`
    INSERT INTO tasks (text, cliente, prioridade, status, prazo)
    VALUES (?, ?, ?, ?, ?)
  `);
  [
    ['Enviar relatório semanal — Clínica Amanda', 'Clínica Amanda Grahl', 'Alta', 'Pendente', '14/03'],
    ['Criar novos criativos — Gilberto Cruz', 'Gilberto Cruz', 'Alta', 'Pendente', '15/03'],
    ['Cobrar pagamento — Costa Flores', 'Costa Flores', 'Alta', 'Pendente', '13/03'],
    ['Cobrar pagamento — Clinica Elaine', 'Clinica Elaine', 'Alta', 'Pendente', '13/03'],
    ['Otimizar campanha — Kafua Delivery', 'Kafua Delivery', 'Média', 'Pendente', '16/03'],
    ['Onboarding — Murillo Hair', 'Murillo Hair', 'Alta', 'Em andamento', '14/03'],
    ['Onboarding — PG Body Queen', 'PG Body Queen', 'Alta', 'Em andamento', '14/03'],
  ].forEach(t => insertTask.run(...t));

  const insertMeta = db.prepare(`
    INSERT INTO metas (indicador, meta, atual, unidade, inverso) VALUES (?, ?, ?, ?, ?)
  `);
  [
    ['MRR Total (R$)', 20000, 16750, 'R$', 0],
    ['Clientes Ativos', 18, 13, 'un', 0],
    ['Novos Clientes/mês', 3, 2, 'un', 0],
    ['Leads Gerados/mês', 50, 35, 'un', 0],
    ['CPL Médio (R$)', 25, 30, 'R$', 1],
    ['Taxa de Conversão', 20, 15, '%', 0],
    ['Taxa de Churn', 5, 0, '%', 1],
  ].forEach(m => insertMeta.run(...m));
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function logEvent(tipo, descricao, payload = {}) {
  db.prepare('INSERT INTO events (tipo, descricao, payload) VALUES (?, ?, ?)')
    .run(tipo, descricao, JSON.stringify(payload));
}

// ─── ROUTES ───────────────────────────────────────────────────────────────────

// GET all data (used by dashboard on load / polling)
app.get('/api/data', (req, res) => {
  const clients = db.prepare('SELECT * FROM clients ORDER BY nome').all();
  const tasks = db.prepare('SELECT * FROM tasks ORDER BY CASE prioridade WHEN "Alta" THEN 0 WHEN "Média" THEN 1 ELSE 2 END, created_at DESC').all();
  const metas = db.prepare('SELECT * FROM metas ORDER BY id').all();
  const events = db.prepare('SELECT * FROM events ORDER BY created_at DESC LIMIT 20').all();
  res.json({ clients, tasks, metas, events, updated_at: new Date().toISOString() });
});

// CLIENTS
app.get('/api/clients', (req, res) => {
  res.json(db.prepare('SELECT * FROM clients ORDER BY nome').all());
});

app.post('/api/clients', (req, res) => {
  const { nome, origem = 'Indicacao', mrr = 0, entrada = 'mar/26' } = req.body;
  if (!nome) return res.status(400).json({ error: 'Nome obrigatório' });
  const r = db.prepare('INSERT INTO clients (nome, origem, mrr, entrada) VALUES (?, ?, ?, ?)')
    .run(nome, origem, mrr, entrada);
  logEvent('cliente_adicionado', `Novo cliente: ${nome}`, { nome, origem, mrr });
  res.json({ id: r.lastInsertRowid, nome, origem, mrr, entrada });
});

app.patch('/api/clients/:id', (req, res) => {
  const { id } = req.params;
  const fields = req.body;
  const allowed = ['nome','origem','mrr','entrada','pag_jan','pag_fev','pag_mar','status'];
  const updates = Object.keys(fields).filter(k => allowed.includes(k));
  if (!updates.length) return res.status(400).json({ error: 'Nenhum campo válido' });
  const set = updates.map(k => `${k} = ?`).join(', ');
  const vals = updates.map(k => fields[k]);
  db.prepare(`UPDATE clients SET ${set}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`)
    .run(...vals, id);
  const updated = db.prepare('SELECT * FROM clients WHERE id = ?').get(id);
  logEvent('pagamento_registrado', `Cliente ${updated.nome} atualizado`, fields);
  res.json(updated);
});

app.delete('/api/clients/:id', (req, res) => {
  const c = db.prepare('SELECT nome FROM clients WHERE id = ?').get(req.params.id);
  db.prepare('DELETE FROM clients WHERE id = ?').run(req.params.id);
  logEvent('cliente_removido', `Cliente removido: ${c?.nome}`);
  res.json({ ok: true });
});

// TASKS
app.get('/api/tasks', (req, res) => {
  res.json(db.prepare('SELECT * FROM tasks ORDER BY created_at DESC').all());
});

app.post('/api/tasks', (req, res) => {
  const { text, cliente = '-', prioridade = 'Media', status = 'Pendente', prazo = '-' } = req.body;
  if (!text) return res.status(400).json({ error: 'Texto obrigatório' });
  const r = db.prepare('INSERT INTO tasks (text, cliente, prioridade, status, prazo) VALUES (?, ?, ?, ?, ?)')
    .run(text, cliente, prioridade, status, prazo);
  logEvent('tarefa_adicionada', `Nova tarefa: ${text}`, { text, cliente, prioridade });
  res.json({ id: r.lastInsertRowid, text, cliente, prioridade, status, prazo });
});

app.patch('/api/tasks/:id', (req, res) => {
  const { id } = req.params;
  const { status, text, prioridade, prazo, cliente } = req.body;
  const allowed = { status, text, prioridade, prazo, cliente };
  const updates = Object.entries(allowed).filter(([, v]) => v !== undefined);
  if (!updates.length) return res.status(400).json({ error: 'Nenhum campo' });
  const set = updates.map(([k]) => `${k} = ?`).join(', ');
  const vals = updates.map(([, v]) => v);
  db.prepare(`UPDATE tasks SET ${set}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(...vals, id);
  const updated = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
  logEvent('tarefa_atualizada', `Tarefa ${id} atualizada`, req.body);
  res.json(updated);
});

app.delete('/api/tasks/:id', (req, res) => {
  db.prepare('DELETE FROM tasks WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// METAS
app.patch('/api/metas/:id', (req, res) => {
  const { meta, atual } = req.body;
  if (meta !== undefined) db.prepare('UPDATE metas SET meta = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(meta, req.params.id);
  if (atual !== undefined) db.prepare('UPDATE metas SET atual = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(atual, req.params.id);
  const updated = db.prepare('SELECT * FROM metas WHERE id = ?').get(req.params.id);
  logEvent('meta_atualizada', `Meta "${updated.indicador}" atualizada`, req.body);
  res.json(updated);
});

// COMMAND — natural language from Claude
app.post('/api/command', (req, res) => {
  const { action, data } = req.body;
  let result = {};

  try {
    switch (action) {
      case 'register_payment': {
        const { client_name, month, amount } = data;
        const c = db.prepare("SELECT * FROM clients WHERE LOWER(nome) LIKE ?").get(`%${client_name.toLowerCase()}%`);
        if (!c) return res.status(404).json({ error: `Cliente "${client_name}" não encontrado` });
        const col = { jan: 'pag_jan', fev: 'pag_fev', mar: 'pag_mar' }[month] || 'pag_mar';
        db.prepare(`UPDATE clients SET ${col} = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(amount, c.id);
        logEvent('pagamento', `${c.nome} pagou R$ ${amount} (${month})`, data);
        result = { ok: true, message: `Pagamento de R$ ${amount} registrado para ${c.nome}` };
        break;
      }
      case 'add_task': {
        const { text, cliente = '-', prioridade = 'Media', prazo = '-' } = data;
        const r = db.prepare('INSERT INTO tasks (text, cliente, prioridade, prazo) VALUES (?, ?, ?, ?)')
          .run(text, cliente, prioridade, prazo);
        logEvent('tarefa', `Nova tarefa: ${text}`, data);
        result = { ok: true, message: `Tarefa "${text}" criada`, id: r.lastInsertRowid };
        break;
      }
      case 'add_client': {
        const { nome, mrr, origem = 'Indicacao' } = data;
        const r = db.prepare('INSERT INTO clients (nome, mrr, origem, entrada) VALUES (?, ?, ?, ?)')
          .run(nome, mrr, origem, 'mar/26');
        logEvent('cliente', `Novo cliente: ${nome}`, data);
        result = { ok: true, message: `Cliente "${nome}" adicionado com MRR R$ ${mrr}`, id: r.lastInsertRowid };
        break;
      }
      case 'update_meta': {
        const { indicador, valor, campo = 'atual' } = data;
        const m = db.prepare("SELECT * FROM metas WHERE LOWER(indicador) LIKE ?").get(`%${indicador.toLowerCase()}%`);
        if (!m) return res.status(404).json({ error: `Meta "${indicador}" não encontrada` });
        db.prepare(`UPDATE metas SET ${campo} = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`).run(valor, m.id);
        logEvent('meta', `Meta "${m.indicador}" atualizada: ${campo}=${valor}`, data);
        result = { ok: true, message: `Meta "${m.indicador}" atualizada para ${valor}` };
        break;
      }
      case 'complete_task': {
        const { task_id } = data;
        db.prepare("UPDATE tasks SET status = 'Concluído', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(task_id);
        logEvent('tarefa_concluida', `Tarefa ${task_id} concluída`, data);
        result = { ok: true, message: `Tarefa marcada como concluída` };
        break;
      }
      default:
        return res.status(400).json({ error: `Ação desconhecida: ${action}` });
    }
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Serve dashboard HTML
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => console.log(`BLS API rodando na porta ${PORT}`));
