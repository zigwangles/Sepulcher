# Sepulcher Survivor

A web-based, top-down survival game inspired by Vampire Survivors.

## Gameplay

- **Control** a character that automatically fires equipped weapons.
- **Survive** against waves of enemies that spawn and move towards you.
- **Collect** score by defeating enemies.
- **Upgrade** your arsenal by selecting new weapons at score milestones (every 100 points).
- **Weapons** include various projectile types like Icicle Shards, Fire Storms, Thunderbolts, and Light Beams, each with unique effects (e.g., slowing, burning).
- The **goal** is to survive for as long as possible and achieve the highest score.
- The game ends when your health reaches zero.

## Running Locally

1.  You need a local web server to handle ES module imports correctly.
2.  If you have Python installed, you can run `python -m http.server` in the project directory.
3.  If you have Node.js installed, you can install a simple server: `npm install -g serve` and then run `serve` in the project directory.
4.  Open your browser and navigate to the local address provided (e.g., `http://localhost:8000` or `http://localhost:3000`).

## Deployment (Vercel)

This project is configured for easy deployment on Vercel:

1.  Push your code to a Git repository (GitHub, GitLab, Bitbucket).
2.  Import the project into Vercel.
3.  Vercel should automatically detect the static site configuration (`vercel.json`).
4.  Deploy!
