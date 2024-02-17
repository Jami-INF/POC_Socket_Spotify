const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const httpServer = http.createServer();

var lobbies = {};

const wordsToGuess = [
  "chat",
  "chien",
  "maison",
  "voiture",
  "arbre",
  "soleil",
  "ordinateur",
  "musique",
  "football",
  "pizza",
];

const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:3000", // Replace with your frontend URL
    methods: ["GET", "POST"],
    allowedHeaders: ["my-custom-header"],
    credentials: true,
  },
});

io.on("connection", (socket) => {
  socket.on("createLobby", (userName) => {
    const lobbyId = generateLobbyId();
    socket.join(lobbyId);
    // Crée un nouvel objet pour ce lobby s'il n'existe pas déjà
    if (!lobbies[lobbyId]) {
      lobbies[lobbyId] = {
        players: [],
        word: "",
      };
    }
    // Ajoute le joueur à la liste des joueurs du lobby
    lobbies[lobbyId].players.push({
      id: socket.id,
      username: userName,
      point: 0,
    });
    socket.emit("lobbyCreated", lobbyId, socket.id);
    //io.to(lobbyId).emit("updatePlayerList", lobbies[lobbyId].players);
    console.log("Lobby created:", lobbyId);

    // Émet un mot au lobby
    const newWordIndex = Math.floor(Math.random() * wordsToGuess.length);
    const newWord = wordsToGuess[newWordIndex];
    //lobbies[lobbyId].word.shift; // Supprime le mot actuel au cas ou
    //lobbies[lobbyId].word.push(newWord);
    lobbies[lobbyId].word = newWord;

    // Émet un événement pour indiquer le changement de mot à tous les clients dans le lobby
    io.to(lobbyId).emit("wordChanged", lobbies[lobbyId].word);
    io.to(lobbyId).emit("updatePlayerList", lobbies[lobbyId].players);
  });

  socket.on("joinLobby", (lobbyId, userName) => {
    // Vérifie si le lobby existe
    if (lobbies[lobbyId]) {
      // Ajoute le joueur à la liste des joueurs du lobby
      lobbies[lobbyId].players.push({
        id: socket.id,
        username: userName,
        point: 0,
      });
      // Rejoint le socket.io room correspondant au lobby
      socket.join(lobbyId);
      // Émet un événement pour indiquer que le joueur a rejoint le lobby avec succès
      io.to(socket.id).emit(
        "playerJoined",
        lobbyId,
        socket.id,
        userName,
        lobbies[lobbyId].word
      );
      // Émet un événement pour mettre à jour la liste des joueurs pour tous les clients dans le lobby
      io.to(lobbyId).emit("updatePlayerList", lobbies[lobbyId].players);
      io.to(lobbyId).emit("wordChanged", lobbies[lobbyId].word);
      console.log(`Player ${userName} joined lobby ${lobbyId}`);
    } else {
      // Émet un événement pour indiquer que le lobby n'a pas été trouvé
      io.to(socket.id).emit("lobbyNotFound");
      console.log("Lobby not found");
    }
  });

  socket.on("deconnexion", (lobbyId, userId) => {
    console.log(lobbyId);
    console.log(userId);
    const lobby = lobbies[lobbyId];
    if (lobby && lobby.players) {
      const index = getIndexPlayer(lobbyId, userId);
      if (index !== -1) {
        console.log("Disconnected:", userId);
        lobby.players.splice(index, 1);
        io.to(lobbyId).emit("updatePlayerList", lobby.players);
      }
    } else {
      console.error("Lobby not found or players not defined in lobby.");
    }
  });

  //Gestion d'une partie
  socket.on("guessWord", (wordGuess, lobbyId, playerId) => {
    if (lobbies[lobbyId]) {
      const correctWord = lobbies[lobbyId].word; // Récupère le premier mot de la liste
      if (wordGuess === correctWord) {
        const indexPlayer = getIndexPlayer(lobbyId, playerId);
        console.log(indexPlayer);
        if (indexPlayer != -1) {
          lobbies[lobbyId].players[indexPlayer].point += 1;

          io.to(socket.id).emit("resultResponse", 1); // Émet un événement pour indiquer que la réponse est correcte
          io.to(lobbyId).emit("updatePlayerList", lobbies[lobbyId].players); //met a jour la liste des joueurs et de leurs points
          // Génère un nouveau mot
          const newWordIndex = Math.floor(Math.random() * wordsToGuess.length);
          const newWord = wordsToGuess[newWordIndex];

          // Met à jour la liste des mots dans le lobby avec le nouveau mot
          //lobbies[lobbyId].word.shift(); // Supprime le mot correct de la liste
          //lobbies[lobbyId].word.push(newWord);
          lobbies[lobbyId].word = newWord;

          // Émet un événement pour indiquer le changement de mot à tous les clients dans le lobby
          io.to(lobbyId).emit("wordChanged", newWord);
        } else {
          console.error("Joueur non trouvé dans le lobby");
        }
      } else {
        io.to(socket.id).emit("guessResponse", 0); // Émet un événement pour indiquer que la réponse est incorrecte
      }
    }
  });
});

function generateLobbyId() {
  return Math.random().toString(36).substr(2, 9);
}

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Socket.io server is running on port ${PORT}`);
});

function findLobbyPlayerId(playerId) {
  for (const lobbyId in lobbies) {
    if (lobbies.hasOwnProperty(lobbyId)) {
      if (
        lobbies[lobbyId].players &&
        lobbies[lobbyId].players.some((player) => player.id === playerId)
      ) {
        return lobbyId;
      }
    }
  }
  return null; // Retourne null si le joueur n'est pas trouvé dans aucun lobby
}

function getIndexPlayer(lobbyId, idPlayer) {
  const lobby = lobbies[lobbyId];
  if (lobby && lobby.players) {
    console.log("parcours");
    for (let i = 0; i < lobby.players.length; i++) {
      console.log("la" + lobby.players[i].id + "lo+" + idPlayer);
      if (lobby.players[i].id === idPlayer) {
        return i; // Renvoie l'index du joueur dans le tableau
      }
    }
  }
  return -1; // Renvoie -1 si le joueur n'est pas trouvé ou si le lobby est invalide
}
