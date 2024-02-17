"use client";
import styles from "./page.module.css";
import { io } from "socket.io-client";
import { useState, useEffect } from "react";
import SpotifyBlindTest from "@/components/spotifyblind";

export default function Home() {
  const [FormRoomId, setFormRoomId] = useState("");
  const [showGame, setShowGame] = useState(false);
  const [userName, setUserName] = useState("");
  const [showSpinner, setShowSpinner] = useState(false);

  const [roomId, setRoomId] = useState("");
  const [userId, setUserId] = useState("");
  const [playerList, setPlayerList] = useState([])



  var socket: any;
  socket = io("http://localhost:3001");

  const handleJoin = () => {
    if (userName !== "" && FormRoomId !== "") {
      socket.emit("joinLobby", FormRoomId, userName);
      setShowSpinner(true);
    } else {
      alert("Entrez un pseudo et un id de lobby");
    }
  };

  const handleDeconect = () => {
    socket.emit("deconnexion", roomId, userId);
    socket.off('resultResponse');
    socket.off('wordChanged');
    socket.off('updatePlayerList');
    setRoomId("")
    setUserId("")
    setPlayerList([])
    setShowGame(false)
  }


  const handleCreate = () => {
    if (userName !== ""){
      setShowSpinner(true);
      socket.emit("createLobby", userName);
    }else{
      alert("Entrez un pseudo");
    }
    
  };

  socket.on('lobbyCreated', (newLobbyId, socketId) => {
    setRoomId(newLobbyId)
    setUserId(socketId)
    console.log("Le lobby a été crée" + newLobbyId)
    setShowSpinner(false)
    setShowGame(true)
  });
  socket.on('lobbyNotFound', () => {
    console.log("lobby introuvable")
    alert("lobby introuvable")
    setShowSpinner(false)
  });

  socket.on('updatePlayerList', (newPlayerList) => {
    setPlayerList(newPlayerList)
    console.log(newPlayerList)
    console.log("List des joueurs mise a jour")
  });
  

  socket.on('playerJoined', (roomId, playerId, playerName) => {
    if(playerId == socket.id){// le joueur qui a rejoint est moi-même
      alert(`Vous avez bien rejoint la partie, félicitation`)
      setUserId(playerId)
      setRoomId(roomId)
      setShowGame(true)
    }else{//Un autre joueur a rejoint la partie
      alert(`Le joueur ${playerName} a rejoint la partie.`);
    }
  });

  

  return (
    <div>
      <h1>ID de room : {roomId}</h1>
      <div>
        <p>Liste des joueurs ({playerList.length})</p>
        <ul>
          {playerList.map((player, index) => (
            <li key={index}>{player.username} {player.id} ({player.point} points)</li>
          ))}
        </ul>
      </div>
      <div>
        <button className={styles.main_button} onClick={handleDeconect}>
          Déconnexion
        </button>
      </div>
      <div className={styles.main_div} style={{ display: showGame ? "none" : "" }}>
        <input
          className={styles.main_input}
          type="text"
          placeholder="Pseudo"
          onChange={(e) => setUserName(e.target.value)}
          disabled={showSpinner}
        />
        
        
        <label>Rejoindre une room ?</label>
        <input
          className={styles.main_input}
          type="text"
          placeholder="room id"
          onChange={(e) => setFormRoomId(e.target.value)}
          disabled={showSpinner}
        />
        <button className={styles.main_button} onClick={handleJoin}>
          {!showSpinner ? (
            "Rejoindre"
          ) : (
            <div className={styles.loading_spinner}></div>
          )}
        </button>
        <label>Créer une room ?</label>
        <button className={styles.main_button} onClick={handleCreate}>
          Créer une room
        </button>
      </div>
      <div style={{ display: !showGame ? "none" : "" }}>
        <SpotifyBlindTest socket={socket} userId={userId} roomId={roomId} />
      </div>
    </div>
  );
}
