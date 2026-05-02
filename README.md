# juMper 🚀

![juMper Preview](jumper_game_preview_1777706786550.png)

A minimalist, high-octane endless platformer built for the web. Experience fluid movement, dynamic level progression, and compete on a global scale.

## ✨ Features

### 🕹️ Multiple Game Modes
*   **Endless Classic**: The original experience. Jump higher, avoid the fall, and survive as the speed increases.
*   **The Descent**: A reverse challenge where you must navigate downwards through treacherous platforms.
*   **Gravity Shift**: A chaotic unranked mode where the rules of physics are constantly changing.

### 🏆 Global Leaderboards
Powered by **Supabase**, juMper features a real-time global ranking system. 
*   Separate leaderboards for different game modes.
*   Automatic name saving and score synchronization.
*   Track your rank against players worldwide.

### 🛒 In-Game Economy & Shop
*   **Collect Coins**: Gather gold coins scattered across platforms.
*   **Power-Ups**: Visit the shop to purchase **Jetpacks** to boost your height and save yourself from falls.

### 🎨 Modern Aesthetic
*   **Swiss Design**: Clean typography using the Inter font family with high-contrast color palettes.
*   **Dynamic Palettes**: Backgrounds and themes shift procedurally as you level up (every 1500 points).
*   **Sketchy Filter**: A unique hand-drawn SVG filter effect for a distinct visual style.
*   **Background Grid**: A subtle stationary grid that provides a sense of speed and scale.

### 📱 Full Mobile Support
*   Custom touch controls for seamless gameplay on smartphones and tablets.
*   Responsive canvas scaling for any screen size.

### 🛠️ Developer Suite
*   Built-in **Dev Tools** panel for testing levels, granting coins, and toggling God mode.
*   Toggleable physics debug views and instant level/coin granting.

---

## 🔍 Hidden Secrets & Easter Eggs

juMper is packed with hidden features for the curious player:

*   **DRAW Mode**: Type `D-R-A-W` on your keyboard to toggle a hand-drawn sketchy aesthetic across the entire game.
*   **Cheat Menu**: Type `fannymagnet` (a nod to classic cheats) to instantly unlock the Developer Panel and grant yourself 9999 coins.
*   **The Moon Dimension**: Enter a hidden low-gravity realm via Portals. In this dimension, jump higher, move slower, and experience a unique "night mode" palette.
*   **God Mode**: Available via Dev Tools, this allows you to survive falls and screen-crushes, letting you explore the infinite heights (or depths) of the game.

---

## 🧠 Game Mechanics Explained

### Movement Physics
The game uses a custom physics engine with:
*   **Inertia & Friction**: Smooth acceleration and deceleration for a "weighty" feel.
*   **Variable Jump Height**: Jump higher by holding the button (Classic platforming logic).
*   **Screen Wrapping**: Moving off one side of the screen transports you to the other.

### Score & Progression
*   **Altitude-Based**: Your score is your highest point reached (Classic) or depth reached (Descent).
*   **Coin Bonus**: Each coin collected adds a significant bonus to your final score upon Game Over.
*   **Leveling Up**: Every 1500 points, the game "levels up," changing the color palette and increasing difficulty.

### Items & Power-ups
*   **🚀 Jetpack**: Provides constant upward thrust for 5 seconds.
*   **☄️ Heavy Fall**: (Descent Mode) Increases fall speed to help you stay ahead of the screen.
*   **💎 Gold Coins**: The primary currency, found on platforms or dropped by level progression.

## ⌨️ Controls

| Action | Keyboard | Mobile |
| :--- | :--- | :--- |
| **Move Left** | `A` or `Left Arrow` | Left Button |
| **Move Right** | `D` or `Right Arrow` | Right Button |
| **Jump** | `W`, `Up Arrow`, or `Space` | Jump Button |
| **Jetpack** | `B` | Rocket Button |
| **Pause** | `P` or `ESC` | - |
| **Dev Tools** | `~` (Tilde) | - |

---

## 🚀 Getting Started

### Prerequisites
A modern web browser (Chrome, Firefox, Safari, Edge).

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/adwaithwas/jumper.git
   ```
2. Open `index.html` in your browser.
3. (Optional) For the leaderboard to work, ensure you have your Supabase keys configured in `js/config.js`.

---

## 🛠️ Tech Stack
*   **Core**: HTML5 Canvas, JavaScript (ES6+)
*   **Backend**: Supabase (Database & Real-time)
*   **Styling**: Vanilla CSS3
*   **Fonts**: [Inter](https://fonts.google.com/specimen/Inter)

---

## 📄 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

*Made with ❤️ by Adwaith*