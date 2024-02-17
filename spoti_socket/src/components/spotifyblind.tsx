"use client"
import React, { useEffect, useState } from "react";
import style from "./spotifyblind.module.css";

const SpotifyBlindTest = ({ socket, userId, roomId }: any) => {
  const [word, setWord] = useState("");
  const [wordGuess, setWordGuess] = useState("");
  const [score, setScore] = useState(0)

  const handleGuess = () => {
    socket.emit("guessWord", wordGuess, roomId, userId);
  };

  socket.on('resultResponse', (poinWinned) => {
    setScore(score+poinWinned)
    console.log("vous avez gagné "+poinWinned+" points")
    //alert("vous avez gagné "+poinWinned+" points")
  });
  socket.on('wordChanged', (word) => {
    setWord(word)
  });

  return (
    <div>
      <h1>BLIND TEST</h1>
      <h2>Votre score : {score}</h2>
      <h1>Le mot a écrire est : {word}</h1>
      <div>
        
        <input
          type="text"
          placeholder="mot"
          onChange={(e) => setWordGuess(e.target.value)}
        />
        <button className={style.main_button} onClick={handleGuess}>
          Valider
        </button>
      </div>

    </div>
  );
};

export default SpotifyBlindTest;
