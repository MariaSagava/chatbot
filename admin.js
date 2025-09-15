let adminPassword = "";

function showPainel() {
    document.getElementById("login").classList.add("hidden");
    document.getElementById("painel").classList.remove("hidden");
}

function showLoginError(msg) {
    document.getElementById("login-error").textContent = msg;
}

document.getElementById("login-btn").onclick = async () => {
    adminPassword = document.getElementById("admin-password").value;
    // Testa senha buscando stats
    const res = await fetch("/api/admin/stats", {
        headers: { "x-admin-password": adminPassword }
    });
    if (res.status === 403) {
        showLoginError("Senha incorreta!");
        return;
    }
    showPainel();
    carregarPainel();
};

async function carregarPainel() {
    // Stats
    const statsRes = await fetch("/api/admin/stats", {
        headers: { "x-admin-password": adminPassword }
    });
    const stats = await statsRes.json();
    document.getElementById("total-conversas").textContent = stats.totalConversas;
    document.getElementById("total-mensagens").textContent = stats.totalMensagens;
    document.getElementById("ultimas-conversas").innerHTML = stats.ultimasConversas.map(
        c => `<li>${c.sessionId} (${new Date(c.startTime).toLocaleString()})</li>`
    ).join("");

    // System instruction
    const instrRes = await fetch("/api/admin/system-instruction", {
        headers: { "x-admin-password": adminPassword }
    });
    const instr = await instrRes.json();
    document.getElementById("system-instruction").value = instr.instruction || "";
}

document.getElementById("save-instruction").onclick = async () => {
    const instruction = document.getElementById("system-instruction").value;
    const res = await fetch("/api/admin/system-instruction", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "x-admin-password": adminPassword
        },
        body: JSON.stringify({ instruction })
    });
    if (res.ok) {
        document.getElementById("save-msg").textContent = "Salvo!";
    } else {
        document.getElementById("save-msg").textContent = "Erro ao salvar.";
    }
    setTimeout(() => document.getElementById("save-msg").textContent = "", 2000);
};