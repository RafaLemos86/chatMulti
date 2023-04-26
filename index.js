// Importando módulos
const express = require("express")
const cluster = require("cluster");
const numCPUs = require("os").cpus().length;
const http = require("http");
const socketio = require("socket.io");

// contador de usuários conectados
let connectedUsersCount = 0
// let username = ""

// Verificando se o processo atual é o processo mestre
if (cluster.isMaster) {
    console.log(`Número de CPUs: ${numCPUs}`)

    // Se o processo atual é o processo mestre, crie processos trabalhadores
    for (let i = 0; i < numCPUs; i++) {
        cluster.fork();
    }

    // Tratando eventos de falha de processos trabalhadores
    cluster.on("exit", (worker, code, signal) => {
        console.error(`Processo ${worker.process.pid} morreu com código ${code} e sinal ${signal}`);
        console.log("Iniciando novo processo trabalhador...");
        cluster.fork();
    });

} else {
    // Se o processo atual é um processo trabalhador, inicie o servidor HTTP

    // Configurando servidor HTTP e Socket.io
    const app = express()
    const server = http.createServer(app)
    const io = socketio(server);

    // Configurando rotas
    app.set("view engine", "ejs")

    app.get("/", (req, res) => {
        res.render("username")
    })

    app.get("/chat", (req, res) => {
        res.render("index");
    })




    // Configurando eventos do Socket.io
    io.on("connection", (socket) => {
        connectedUsersCount++
        io.emit("connectedUsersCount", (connectedUsersCount))

        // escutando evento de desconexao
        socket.on("disconnect", () => {
            connectedUsersCount--
            io.emit("connectedUsersCount", (connectedUsersCount))
            io.emit("desconectedUser", (socket.id))

        });

        // escutando mensagem enviada do frontend
        socket.on("msg", (data) => {
            // emitindo msg para o front GLOBALMENTE
            io.emit("showImg", data)
        });

        // socket.on("username", (newUsername) => {
        //     username = newUsername
        //     io.emit("userJoined", username)
        // })
    })




    // Iniciando servidor HTTP
    const PORT = process.env.PORT || 8080;
    server.listen(PORT, () => {
        console.log(`Servidor rodando na porta ${PORT}`);
    });
}
