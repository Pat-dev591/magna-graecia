// src/main.js - Phaser 3 Starter (deutsche Texte) with NPC support
class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }
  preload() {
    // Platzhalter: kann Artassets laden
  }
  create() {
    this.scene.start('WorldMap');
  }
}

class WorldMap extends Phaser.Scene {
  constructor() { super('WorldMap'); }
  preload() {
  }
  create() {
    const { width, height } = this.sys.game.canvas;
    // Hintergrund
    this.add.rectangle(width/2,height/2,width,height,0x2b3a42);
    this.add.text(20,20,'Echos der Magna Graecia', { fontSize: '28px', color:'#fff' });

    // Knoten - einfache Platzierung
    this.nodes = [
      {id:'taras', name:'Taras', x:150, y:180},
      {id:'kroton', name:'Kroton', x:420, y:110},
      {id:'sybaris', name:'Sybaris', x:700, y:200},
      {id:'metapontum', name:'Metapontum', x:300, y:330},
      {id:'rhegion', name:'Rhegion', x:780, y:330}
    ];

    this.nodes.forEach(n => {
      const circle = this.add.circle(n.x, n.y, 36, 0xd4af37).setInteractive({ cursor: 'pointer' });
      const label = this.add.text(n.x-30, n.y-8, n.name, { fontSize:'14px', color:'#000' });
      circle.on('pointerdown', () => {
        this.scene.start('NodeScene', { nodeId: n.id });
      });
    });

    // Kurze Anleitung
    this.add.text(20, 60, 'Klicke auf einen Ort, um dorthin zu reisen.', { fontSize:'18px', color:'#fff' });

    // Lade Daten in Hintergrund
    this.cache.json.remove('nodes');
    this.load.json('nodes','data/nodes.json');
    this.load.json('quests','data/quests_de.json');
    this.load.json('dialogues','data/dialogues_de.json');
    this.load.json('npcs','data/npcs.json');
    this.load.start();
    this.load.on('complete', () => {
      // Daten im Cache verfügbar
    });
  }
}

class NodeScene extends Phaser.Scene {
  constructor() { super('NodeScene'); }
  init(data) { this.nodeId = data.nodeId; }
  create() {
    const w = this.sys.game.canvas.width;
    const h = this.sys.game.canvas.height;
    this.add.rectangle(w/2,h/2,w,h,0x3b2f2f);

    const nodes = this.cache.json.get('nodes');
    const node = nodes.find(n => n.id === this.nodeId) || {name:'Unbekannt', desc:'Keine Beschreibung'};

    this.add.text(20,20, node.name, { fontSize:'28px', color:'#fff' });
    this.add.text(20,70, node.short, { fontSize:'16px', color:'#fff', wordWrap:{width: w-40} });

    // Buttons: Dialoge, Quest, Zurück
    const btnDialog = this.add.rectangle(120, h-60, 140,40,0x6a4fff).setInteractive({cursor:'pointer'});
    const txtDialog = this.add.text(60, h-70, 'Gespräch', { color:'#fff' });
    btnDialog.on('pointerdown', () => { this.showDialogueForNode(this.nodeId); });

    const btnQuest = this.add.rectangle(320, h-60, 160,40,0x2eb85c).setInteractive({cursor:'pointer'});
    this.add.text(260, h-70, 'Quest ansehen', { color:'#fff' });
    btnQuest.on('pointerdown', () => { this.openQuestLog(this.nodeId); });

    const btnBack = this.add.rectangle(w-80, h-60, 120,40,0xff6b6b).setInteractive({cursor:'pointer'});
    this.add.text(w-140, h-70, 'Zur Karte', { color:'#fff' });
    btnBack.on('pointerdown', () => { this.scene.start('WorldMap'); });

    // NPCs an diesem Ort
    const npcs = this.cache.json.get('npcs') || [];
    const localNpcs = npcs.filter(p => p.node === this.nodeId);
    const state = JSON.parse(localStorage.getItem('mg_state') || '{}');
    const completedQuests = state.quests || [];

    localNpcs.forEach((npc, idx) => {
      const y = 120 + idx*40;
      if (npc.availableFrom === 'start' || completedQuests.includes(npc.availableFrom)) {
        const btn = this.add.rectangle(w-260, y+10, 200,32,0x4f6ef7).setInteractive({cursor:'pointer'});
        this.add.text(w-360, y+2, npc.name, { fontSize:'14px', color:'#fff' });
        btn.on('pointerdown', () => { this.showNpcDialog(npc); });
      } else {
        this.add.text(w-360, y+2, npc.name + ' (gesperrt)', { fontSize:'14px', color:'#aaa' });
        this.add.text(w-260, y+2, 'Frei durch: '+npc.availableFrom, { fontSize:'12px', color:'#ffcc99' });
      }
    });
  }

  showDialogueForNode(nodeId) {
    const dialogues = this.cache.json.get('dialogues');
    const entries = dialogues[nodeId] || [{text:'Es gibt hier niemanden.'}];
    const entry = entries[0];
    this.showDialogueBox(entry.text);
  }

  showNpcDialog(npc) {
    const dialogues = this.cache.json.get('dialogues') || {};
    const entries = dialogues['npc_'+npc.id] || [{text: npc.name + ' sagt nichts.'}];
    const entry = entries[0];
    this.showDialogueBox(entry.text);
  }

  showDialogueBox(text) {
    const dom = document.createElement('div');
    dom.className = 'dialogue-box';
    dom.innerText = text;
    const btn = document.createElement('div');
    btn.className = 'button'; btn.innerText = 'Schließen';
    btn.onclick = () => { dom.remove(); };
    dom.appendChild(btn);
    document.body.appendChild(dom);
  }

  openQuestLog(nodeId) {
    const quests = this.cache.json.get('quests');
    const qlist = quests.filter(q => q.startNode === nodeId);
    if (qlist.length === 0) { this.showDialogueBox('Keine Quests an diesem Ort.'); return; }
    const q = qlist[0];
    const dom = document.createElement('div');
    dom.className = 'dialogue-box';
    dom.innerHTML = '<strong>'+q.title+'</strong>\n\n'+q.desc;
    const startBtn = document.createElement('div'); startBtn.className='button'; startBtn.innerText='Quest starten';
    startBtn.onclick = () => { dom.remove(); this.startQuest(q.id); };
    const closeBtn = document.createElement('div'); closeBtn.className='button'; closeBtn.innerText='Schließen'; closeBtn.onclick = () => dom.remove();
    dom.appendChild(startBtn); dom.appendChild(closeBtn);
    document.body.appendChild(dom);
  }

  startQuest(qid) {
    const quests = this.cache.json.get('quests');
    const q = quests.find(x=>x.id===qid);
    if (!q) return;
    if (q.type === 'combat') {
      this.scene.start('CombatScene', { questId: qid });
    } else {
      // mark non‑combat quest as accepted and completed immediately for demo
      const state = JSON.parse(localStorage.getItem('mg_state')||'{}');
      state.quests = state.quests||[]; if(!state.quests.includes(qid)) state.quests.push(qid);
      localStorage.setItem('mg_state', JSON.stringify(state));
      this.showDialogueBox('Quest abgeschlossen (Demo): '+q.title);
    }
  }
}

class CombatScene extends Phaser.Scene {
  constructor() { super('CombatScene'); }
  init(data) { this.questId = data.questId; }
  create() {
    const w = this.sys.game.canvas.width, h = this.sys.game.canvas.height;
    this.add.rectangle(w/2,h/2,w,h,0x101820);
    this.add.text(20,20,'Kampf', { fontSize:'26px', color:'#fff' });

    // Spieler & Gegner
    this.player = { hp: 30, atk: 6 };
    this.enemy = { hp: 20, atk: 4 };

    this.playerText = this.add.text(40, 80, 'Spieler HP: '+this.player.hp, { fontSize:'18px', color:'#fff' });
    this.enemyText = this.add.text(400, 80, 'Gegner HP: '+this.enemy.hp, { fontSize:'18px', color:'#fff' });

    const attackBtn = this.add.rectangle(120, h-80, 140,48,0xd64545).setInteractive({cursor:'pointer'});
    this.add.text(80, h-94, 'Angreifen', { color:'#fff' });
    attackBtn.on('pointerdown', () => { this.playerAttack(); });

    const fleeBtn = this.add.rectangle(320, h-80, 160,48,0xaaaaaa).setInteractive({cursor:'pointer'});
    this.add.text(280, h-94, 'Fliehen', { color:'#000' });
    fleeBtn.on('pointerdown', () => { this.endCombat('flucht'); });

    // einfacher Gegner-AI Timer
    this.enemyTimer = this.time.addEvent({ delay:1200, callback:() => { this.enemyAttack(); }, loop:true });
  }

  playerAttack() {
    const dmg = Phaser.Math.Between(this.player.atk-2, this.player.atk+2);
    this.enemy.hp -= dmg; if (this.enemy.hp < 0) this.enemy.hp = 0;
    this.enemyText.setText('Gegner HP: '+this.enemy.hp);
    if (this.enemy.hp <= 0) { this.endCombat('gewinn'); }
  }

  enemyAttack() {
    if (this.enemy.hp <= 0) return;
    const dmg = Phaser.Math.Between(this.enemy.atk-1, this.enemy.atk+1);
    this.player.hp -= dmg; if (this.player.hp < 0) this.player.hp = 0;
    this.playerText.setText('Spieler HP: '+this.player.hp);
    if (this.player.hp <= 0) { this.endCombat('verloren'); }
  }

  endCombat(outcome) {
    this.enemyTimer.remove(false);
    if (outcome === 'gewinn') {
      // markiere Quest als abgeschlossen (falls questId gesetzt)
      if (this.questId) {
        const state = JSON.parse(localStorage.getItem('mg_state')||'{}');
        state.quests = state.quests||[]; if(!state.quests.includes(this.questId)) state.quests.push(this.questId);
        localStorage.setItem('mg_state', JSON.stringify(state));
      }
      this.showResult('Sie haben gewonnen!');
    } else if (outcome === 'verloren') {
      this.showResult('Sie haben verloren. Keine Sorge — try again.');
    } else {
      this.showResult('Sie sind geflohen.');
    }
  }

  showResult(text) {
    const dom = document.createElement('div'); dom.className='dialogue-box'; dom.innerText = text;
    const btn = document.createElement('div'); btn.className='button'; btn.innerText='Zur Karte'; btn.onclick = () => { dom.remove(); this.scene.start('WorldMap'); };
    dom.appendChild(btn); document.body.appendChild(dom);
  }
}

const config = {
  type: Phaser.AUTO,
  width: 960,
  height: 540,
  parent: 'game-container',
  backgroundColor: '#000000',
  scene: [ BootScene, WorldMap, NodeScene, CombatScene ]
};

window.onload = () => {
  const game = new Phaser.Game(config);
};
