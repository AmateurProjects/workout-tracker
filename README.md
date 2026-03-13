# Workout Tracker

A minimal, mobile-first workout tracking app designed for iPhone. Built with vanilla HTML, CSS, and JavaScript — no frameworks, no build step.

## Features

- **Tap to log**: Simply tap an exercise card to record that you performed it (3 sets per tap)
- **Muscle group tabs**: Exercises organized by Back, Shoulders, Chest, Legs, Arms, Cardio
- **14-day volume summary**: Visual progress bars showing sets completed vs. target for each muscle group
- **Freshness indicators**: Color-coded labels showing how recently each exercise was performed
  - 🟢 Green = within 7 days
  - 🟡 Yellow = 7-21 days
  - 🔴 Red = 21+ days or never
- **Set dots**: Visual indicators showing how many times you've logged an exercise today
- **History view**: Tap ⋯ to see full exercise history grouped by date
- **Undo**: 5-second undo window after each log
- **Offline-capable**: All data stored in `localStorage`
- **PWA-ready**: Includes manifest for "Add to Home Screen"

## Usage

1. Deploy to any static hosting (GitHub Pages, Netlify, Vercel, etc.)
2. Open on your iPhone and add to home screen for a native app feel
3. Tap exercises as you complete them during your workout

## Data

Data persists in your browser's `localStorage`. On first load, historical seed data from the attached spreadsheet is loaded. Clear browser data to reset.

## Exercises

| Group | Exercises |
|-------|-----------|
| Back | Pull Up/Down, Row, Upper Back, Misc |
| Shoulders | Lateral Raise, Overhead Press, Rear Delt, Misc |
| Chest | Press, Flys, Misc |
| Legs | Leg Press, Extension, Curl, Calf Raise, RDL, Squats, Misc |
| Arms | Bicep Curls, Forearms, Triceps, Misc |
| Cardio | Run |
