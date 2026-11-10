const JORNADA = 360; // 6h em minutos
const KEY = "folhaPontoSMS";
let regs = JSON.parse(localStorage.getItem(KEY) || "[]");

const $ = id => document.getElementById(id);
const hoje = new Date().toISOString().slice(0,10);
$("data").value = hoje;
$("mes").value = hoje.slice(0,7);

$("tipo").onchange = () => {
  const f = $("tipo").value === "folga";
  $("lbE").style.display = $("lbS").style.display = f ? "none" : "flex";
};

const toMin = t => { const [h,m] = t.split(":").map(Number); return h*60+m; };
function fmt(min){
  const s = min < 0 ? "-" : "";
  min = Math.abs(min);
  return `${s}${Math.floor(min/60)}h${String(min%60).padStart(2,"0")}`;
}
function calc(r){
  if (r.tipo === "folga") return {trab:0, saldo:-JORNADA};
  let trab = toMin(r.saida) - toMin(r.entrada);
  if (trab < 0) trab += 1440;
  return {trab, saldo: trab - JORNADA};
}
function persistir(){ localStorage.setItem(KEY, JSON.stringify(regs)); render(); }

function salvar(){
  const data = $("data").value, tipo = $("tipo").value;
  if (!data) return alert("Informe a data.");
  const r = {data, tipo, entrada:$("entrada").value, saida:$("saida").value};
  if (tipo === "trab" && (!r.entrada || !r.saida)) return alert("Informe entrada e saída.");
  regs = regs.filter(x => x.data !== data);
  regs.push(r);
  regs.sort((a,b) => a.data.localeCompare(b.data));
  persistir();
}
function remover(data){ regs = regs.filter(x => x.data !== data); persistir(); }

function render(){
  const mes = $("mes").value;
  let banco = 0, total = 0;
  regs.forEach(r => { const c = calc(r); banco += c.saldo; total += c.trab; });
  $("banco").textContent = fmt(banco);
  $("banco").className = banco < 0 ? "neg" : "pos";
  $("folgas").textContent = Math.max(0, Math.floor(banco / JORNADA));
  $("total").textContent = fmt(total);

  $("lista").innerHTML = regs.filter(r => r.data.startsWith(mes)).map(r => {
    const c = calc(r), f = r.tipo === "folga";
    return `<tr><td>${r.data.split("-").reverse().join("/")}</td>
      <td>${f ? "FOLGA" : r.entrada}</td><td>${f ? "-" : r.saida}</td>
      <td>${fmt(c.trab)}</td><td class="${c.saldo < 0 ? "neg" : "pos"}">${fmt(c.saldo)}</td>
      <td><button class="del" onclick="remover('${r.data}')">x</button></td></tr>`;
  }).join("");
}

function download(nome, conteudo, tipo){
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([conteudo], {type:tipo}));
  a.download = nome; a.click();
}
function exportCSV(){
  const mes = $("mes").value;
  let csv = "Data;Tipo;Entrada;Saida;Trabalhado;Saldo\n";
  regs.filter(r => r.data.startsWith(mes)).forEach(r => {
    const c = calc(r);
    csv += `${r.data};${r.tipo};${r.entrada||""};${r.saida||""};${fmt(c.trab)};${fmt(c.saldo)}\n`;
  });
  download(`ponto-${mes}.csv`, csv, "text/csv");
}
function backup(){ download("backup-ponto.json", JSON.stringify(regs), "application/json"); }
function restaurar(e){
  const f = e.target.files[0]; if (!f) return;
  const rd = new FileReader();
  rd.onload = () => { regs = JSON.parse(rd.result); persistir(); };
  rd.readAsText(f);
}
render();