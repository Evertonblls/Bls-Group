const express = require('express');
const Database = require('better-sqlite3');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 8080;
const DB_FILE = process.env.DB_PATH || path.join(__dirname, 'bls.db');

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ========== DATABASE SETUP ==========
const db = new Database(DB_FILE);
db.pragma('journal_mode = WAL');

// Drop tables individually (SQLite doesn't support multiple statements in one exec)
try { db.exec('DROP TABLE IF EXISTS clientes'); } catch(e) {}
try { db.exec('DROP TABLE IF EXISTS tarefas'); } catch(e) {}
try { db.exec('DROP TABLE IF EXISTS metas'); } catch(e) {}
try { db.exec('DROP TABLE IF EXISTS pagamentos'); } catch(e) {}

// Create tables
db.exec(`CREATE TABLE IF NOT EXISTS clientes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT NOT NULL,
  contato TEXT DEFAULT '',
  email TEXT DEFAULT '',
  origem TEXT DEFAULT 'Direto',
  status TEXT DEFAULT 'Ativo',
  mensalidade REAL DEFAULT 0,
  data_inicio TEXT DEFAULT '',
  saude INTEGER DEFAULT 100,
  notas TEXT DEFAULT ''
)`);

db.exec(`CREATE TABLE IF NOT EXISTS tarefas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  titulo TEXT NOT NULL,
  cliente TEXT DEFAULT '',
  prioridade TEXT DEFAULT 'Media',
  status TEXT DEFAULT 'Pendente',
  data_criacao TEXT DEFAULT '',
  data_limite TEXT DEFAULT '',
  concluida INTEGER DEFAULT 0
)`);

db.exec(`CREATE TABLE IF NOT EXISTS metas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT NOT NULL,
  valor_atual REAL DEFAULT 0,
  valor_meta REAL DEFAULT 0,
  tipo TEXT DEFAULT 'numero'
)`);

db.exec(`CREATE TABLE IF NOT EXISTS pagamentos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cliente_id INTEGER,
  cliente_nome TEXT DEFAULT '',
  mes TEXT DEFAULT '',
  valor REAL DEFAULT 0,
  status TEXT DEFAULT 'Pendente',
  data_pagamento TEXT DEFAULT ''
)`);

// ========== SEED DATA ==========
const clienteCount = db.prepare('SELECT COUNT(*) as c FROM clientes').get().c;
if (clienteCount === 0) {
  const insertCliente = db.prepare('INSERT INTO clientes (nome, contato, email, origem, status, mensalidade, data_inicio, saude) VALUES (?,?,?,?,?,?,?,?)');
  const clientes = [
    ['Gilberto Cruz','(11)99999-0001','gilberto@email.com','Indicacao','Ativo',3500,'2025-01-10',92],
    ['Costa Flores','(11)99999-0002','costa@email.com','Meta Ads','Ativo',1500,'2025-02-01',68],
    ['Clinica Silvana','(11)99999-0003','silvana@email.com','Indicacao','Ativo',2000,'2025-01-15',85],
    ['Bm Toys','(11)99999-0004','bmtoys@email.com','Meta Ads','Ativo',1200,'2025-03-01',78],
    ['Clinica Elaine','(11)99999-0005','elaine@email.com','SEO Organico','Ativo',1500,'2025-01-20',60],
    ['Pet Shop Lar','(11)99999-0006','petlar@email.com','Meta Ads','Ativo',1000,'2025-02-10',71],
    ['Clinica Ananda','(11)99999-0007','ananda@email.com','Indicacao','Ativo',1800,'2025-01-05',55],
    ['Studio Beleza','(11)99999-0008','studio@email.com','SEO Organico','Ativo',800,'2025-03-01',90],
    ['Kafua Delivery','(11)99999-0009','kafua@email.com','Meta Ads','Ativo',1200,'2025-02-15',45],
    ['Auto Center VP','(11)99999-0010','autovp@email.com','Indicacao','Ativo',1000,'2025-01-25',82],
    ['Dra. Patricia','(11)99999-0011','patricia@email.com','SEO Organico','Ativo',1500,'2025-02-01',88],
    ['Emporio Natural','(11)99999-0012','emporio@email.com','Meta Ads','Ativo',750,'2025-03-10',75],
    ['Padaria Trigo','(11)99999-0013','trigo@email.com','Indicacao','Ativo',1000,'2025-02-20',80]
  ];
  const tx = db.transaction(() => { clientes.forEach(c => insertCliente.run(...c)); });
  tx();

  // Seed pagamentos
  const insertPag = db.prepare('INSERT INTO pagamentos (cliente_id, cliente_nome, mes, valor, status, data_pagamento) VALUES (?,?,?,?,?,?)');
  const txPag = db.transaction(() => {
    clientes.forEach((c, i) => {
      const id = i + 1;
      insertPag.run(id, c[0], '2025-01', c[5], 'Pago', '2025-01-15');
      insertPag.run(id, c[0], '2025-02', c[5], 'Pago', '2025-02-15');
      if (['Costa Flores','Clinica Elaine','Clinica Ananda','Kafua Delivery'].includes(c[0])) {
        insertPag.run(id, c[0], '2025-03', c[5], 'Pendente', '');
      } else {
        insertPag.run(id, c[0], '2025-03', c[5], 'Pago', '2025-03-15');
      }
    });
  });
  txPag();

  // Seed metas
  const insertMeta = db.prepare('INSERT INTO metas (nome, valor_atual, valor_meta, tipo) VALUES (?,?,?,?)');
  const txMeta = db.transaction(() => {
    insertMeta.run('MRR', 16750, 20000, 'moeda');
    insertMeta.run('Leads/mes', 35, 50, 'numero');
    insertMeta.run('Clientes ativos', 13, 20, 'numero');
    insertMeta.run('Taxa conversao', 12, 20, 'porcentagem');
    insertMeta.run('ROAS medio', 3.2, 5, 'numero');
  });
  txMeta();

  // Seed tarefas
  const insertTarefa = db.prepare('INSERT INTO tarefas (titulo, cliente, prioridade, status, data_criacao, data_limite, concluida) VALUES (?,?,?,?,?,?,?)');
  const txTar = db.transaction(() => {
    insertTarefa.run('Cobrar pagamento marco', 'Costa Flores', 'Alta', 'Pendente', '2025-03-10', '2025-03-17', 0);
    insertTarefa.run('Enviar relatorio mensal', 'Gilberto Cruz', 'Media', 'Pendente', '2025-03-10', '2025-03-20', 0);
    insertTarefa.run('Criar criativos novos', 'Pet Shop Lar', 'Alta', 'Pendente', '2025-03-08', '2025-03-15', 0);
    insertTarefa.run('Revisar campanha Meta', 'Bm Toys', 'Media', 'Em andamento', '2025-03-05', '2025-03-18', 0);
    insertTarefa.run('Onboarding completo', 'Emporio Natural', 'Alta', 'Em andamento', '2025-03-10', '2025-03-14', 0);
    insertTarefa.run('Cobrar pagamento marco', 'Clinica Elaine', 'Alta', 'Pendente', '2025-03-10', '2025-03-17', 0);
    insertTarefa.run('Ajustar SEO on-page', 'Dra. Patricia', 'Baixa', 'Pendente', '2025-03-12', '2025-03-25', 0);
    insertTarefa.run('Reuniao de alinhamento', 'Clinica Silvana', 'Media', 'Pendente', '2025-03-11', '2025-03-19', 0);
  });
  txTar();
}

// ========== API ROUTES ==========

// Get all data
app.get('/api/data', (req, res) => {
  try {
    const clientes = db.prepare('SELECT * FROM clientes ORDER BY nome').all();
    const tarefas = db.prepare('SELECT * FROM tarefas ORDER BY concluida ASC, prioridade ASC, data_limite ASC').all();
    const metas = db.prepare('SELECT * FROM metas').all();
    const pagamentos = db.prepare('SELECT * FROM pagamentos ORDER BY mes DESC').all();
    res.json({ ok: true, clientes, tarefas, metas, pagamentos });
  } catch(e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// Add cliente
app.post('/api/clientes', (req, res) => {
  try {
    const { nome, contato, email, origem, mensalidade } = req.body;
    const r = db.prepare('INSERT INTO clientes (nome, contato, email, origem, status, mensalidade, data_inicio, saude) VALUES (?,?,?,?,?,?,?,?)').run(
      nome || 'Novo Cliente', contato || '', email || '', origem || 'Direto', 'Ativo', mensalidade || 0, new Date().toISOString().split('T')[0], 100
    );
    res.json({ ok: true, id: r.lastInsertRowid });
  } catch(e) { res.status(500).json({ ok: false, error: e.message }); }
});

// Update cliente
app.put('/api/clientes/:id', (req, res) => {
  try {
    const fields = req.body;
    const sets = Object.keys(fields).map(k => `${k} = ?`).join(', ');
    const vals = Object.values(fields);
    db.prepare(`UPDATE clientes SET ${sets} WHERE id = ?`).run(...vals, req.params.id);
    res.json({ ok: true });
  } catch(e) { res.status(500).json({ ok: false, error: e.message }); }
});

// Delete cliente
app.delete('/api/clientes/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM clientes WHERE id = ?').run(req.params.id);
    res.json({ ok: true });
  } catch(e) { res.status(500).json({ ok: false, error: e.message }); }
});

// Add tarefa
app.post('/api/tarefas', (req, res) => {
  try {
    const { titulo, cliente, prioridade, data_limite } = req.body;
    const r = db.prepare('INSERT INTO tarefas (titulo, cliente, prioridade, status, data_criacao, data_limite, concluida) VALUES (?,?,?,?,?,?,?)').run(
      titulo || 'Nova tarefa', cliente || '', prioridade || 'Media', 'Pendente', new Date().toISOString().split('T')[0], data_limite || '', 0
    );
    res.json({ ok: true, id: r.lastInsertRowid });
  } catch(e) { res.status(500).json({ ok: false, error: e.message }); }
});

// Update tarefa
app.put('/api/tarefas/:id', (req, res) => {
  try {
    const fields = req.body;
    const sets = Object.keys(fields).map(k => `${k} = ?`).join(', ');
    const vals = Object.values(fields);
    db.prepare(`UPDATE tarefas SET ${sets} WHERE id = ?`).run(...vals, req.params.id);
    res.json({ ok: true });
  } catch(e) { res.status(500).json({ ok: false, error: e.message }); }
});

// Delete tarefa
app.delete('/api/tarefas/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM tarefas WHERE id = ?').run(req.params.id);
    res.json({ ok: true });
  } catch(e) { res.status(500).json({ ok: false, error: e.message }); }
});

// Update meta
app.put('/api/metas/:id', (req, res) => {
  try {
    const { valor_atual, valor_meta } = req.body;
    if (valor_atual !== undefined) db.prepare('UPDATE metas SET valor_atual = ? WHERE id = ?').run(valor_atual, req.params.id);
    if (valor_meta !== undefined) db.prepare('UPDATE metas SET valor_meta = ? WHERE id = ?').run(valor_meta, req.params.id);
    res.json({ ok: true });
  } catch(e) { res.status(500).json({ ok: false, error: e.message }); }
});

// Register payment
app.post('/api/pagamentos', (req, res) => {
  try {
    const { cliente_id, cliente_nome, mes, valor, status } = req.body;
    const existing = db.prepare('SELECT id FROM pagamentos WHERE cliente_id = ? AND mes = ?').get(cliente_id, mes);
    if (existing) {
      db.prepare('UPDATE pagamentos SET valor = ?, status = ?, data_pagamento = ? WHERE id = ?').run(
        valor, status || 'Pago', new Date().toISOString().split('T')[0], existing.id
      );
    } else {
      db.prepare('INSERT INTO pagamentos (cliente_id, cliente_nome, mes, valor, status, data_pagamento) VALUES (?,?,?,?,?,?)').run(
        cliente_id, cliente_nome || '', mes, valor, status || 'Pago', new Date().toISOString().split('T')[0]
      );
    }
    res.json({ ok: true });
  } catch(e) { res.status(500).json({ ok: false, error: e.message }); }
});

// Natural language command processor
app.post('/api/command', (req, res) => {
  try {
    const { text } = req.body;
    const t = (text || '').trim().toLowerCase();

    // Payment: "costa flores pagou 1500" or "costa flores pagou R$ 1500"
    const pagMatch = t.match(/^(.+?)\s+pagou\s+r?\$?\s*([\d.,]+)/i);
    if (pagMatch) {
      const nome = pagMatch[1].trim();
      const valor = parseFloat(pagMatch[2].replace(',', '.'));
      const cliente = db.prepare("SELECT id, nome FROM clientes WHERE LOWER(nome) LIKE ?").get(`%${nome}%`);
      if (cliente) {
        const mes = new Date().toISOString().slice(0, 7);
        const existing = db.prepare('SELECT id FROM pagamentos WHERE cliente_id = ? AND mes = ?').get(cliente.id, mes);
        if (existing) {
          db.prepare("UPDATE pagamentos SET valor = ?, status = 'Pago', data_pagamento = ? WHERE id = ?").run(valor, new Date().toISOString().split('T')[0], existing.id);
        } else {
          db.prepare("INSERT INTO pagamentos (cliente_id, cliente_nome, mes, valor, status, data_pagamento) VALUES (?,?,?,?,?,?)").run(
            cliente.id, cliente.nome, mes, valor, 'Pago', new Date().toISOString().split('T')[0]
          );
        }
        return res.json({ ok: true, msg: `Pagamento de R$ ${valor} registrado para ${cliente.nome}` });
      }
      return res.json({ ok: false, msg: `Cliente "${nome}" nao encontrado` });
    }

    // New task: "nova tarefa: titulo" or "tarefa: titulo para cliente"
    const taskMatch = t.match(/(?:nova\s+)?tarefa[:\s]+(.+?)(?:\s+para\s+(.+))?$/i);
    if (taskMatch) {
      const titulo = taskMatch[1].trim();
      const clienteNome = taskMatch[2] ? taskMatch[2].trim() : '';
      db.prepare('INSERT INTO tarefas (titulo, cliente, prioridade, status, data_criacao, data_limite, concluida) VALUES (?,?,?,?,?,?,?)').run(
        titulo, clienteNome, 'Media', 'Pendente', new Date().toISOString().split('T')[0], '', 0
      );
      return res.json({ ok: true, msg: `Tarefa "${titulo}" criada${clienteNome ? ' para ' + clienteNome : ''}` });
    }

    // New client: "novo cliente: Nome R$ 2000"
    const clientMatch = t.match(/novo\s+cliente[:\s]+(.+?)\s+r?\$?\s*([\d.,]+)/i);
    if (clientMatch) {
      const nome = clientMatch[1].trim();
      const mensalidade = parseFloat(clientMatch[2].replace(',', '.'));
      db.prepare('INSERT INTO clientes (nome, contato, email, origem, status, mensalidade, data_inicio, saude) VALUES (?,?,?,?,?,?,?,?)').run(
        nome, '', '', 'Direto', 'Ativo', mensalidade, new Date().toISOString().split('T')[0], 100
      );
      return res.json({ ok: true, msg: `Cliente "${nome}" adicionado com mensalidade R$ ${mensalidade}` });
    }

    // Update meta: "meta leads: 60"
    const metaMatch = t.match(/meta\s+(.+?)[:\s]+(\d+)/i);
    if (metaMatch) {
      const metaNome = metaMatch[1].trim();
      const valor = parseFloat(metaMatch[2]);
      const meta = db.prepare("SELECT id FROM metas WHERE LOWER(nome) LIKE ?").get(`%${metaNome}%`);
      if (meta) {
        db.prepare('UPDATE metas SET valor_atual = ? WHERE id = ?').run(valor, meta.id);
        return res.json({ ok: true, msg: `Meta "${metaNome}" atualizada para ${valor}` });
      }
      return res.json({ ok: false, msg: `Meta "${metaNome}" nao encontrada` });
    }

    return res.json({ ok: false, msg: 'Comando nao reconhecido. Tente: "[cliente] pagou [valor]", "tarefa: [titulo]", "novo cliente: [nome] [valor]", "meta [nome]: [valor]"' });
  } catch(e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// Fallback to index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`BLS API rodando na porta ${PORT}`);
});
