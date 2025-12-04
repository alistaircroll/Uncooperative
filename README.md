# Uncooperative - Multiplayer Game

A real-time multiplayer game built with Next.js and Firebase, exploring the tragedy of the commons.

How to play
In Uncooperative, players extract money from a treasury each turn. And each turn, the treasury earns interest. The winner is the person with the most money at the end of the game. But there's a catch: If the treasury ever runs out, the game is over, and everyone loses. Since each player doesn't know how much the other players took, they have to coordinate.

If everyone cooperates, there's an optimal strategy to get as much wealth as possible. But to win, you need to do better than others. The question is: Can you do better than everyone else without breaking the bank?

To begin, simply have your players scan the QR code on their phones and enter their names, then click "Start Game". To clear the players who are signed in click "Clear Players".

To play the game:
1. Visit https://uncooperative-game.vercel.app/
2. Have 3 or more players scan the QR code with their phones, then enter their names on the web page that loads.
3. Once all players have signed in, adjust the parameters in Game Settings. You can use the defaults or change the initial treasury, number of turns, maximum extraction per turn, and interest per turn. You can also choose to see how much each person extracted after the turn is finished.
4. Click Start Game.
5. Each turn, all players enter the amount they extract that turn by sliding the slider on their phone and tapping Extract. When all extractions are in, the main screen shows the total amount extracted, what interest was earned, and what's left in the treasury.

If you make it to the end of the game without draining the treasury, the winner is the person with the most money.

To learn more about coordination problems, and see some simulations of the optimal way to play the game, visit https://uncooperative-game.vercel.app/about
