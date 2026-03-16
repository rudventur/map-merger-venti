# 🐾 SNOUT FIRST — Claude Code Project Prompt

## Project Identity

**Snout First** is a social media platform for pets — built by RudVentur (rudventur.com). Think Instagram meets Tamagotchi, but the *pets* are the main characters. Owners are just the ones holding the phone.

This is part of the RudVentur creative web universe alongside ChemVentur and splash_splash.

---

## Core Concept

A playful, mobile-first social platform where pet profiles are the star. Every feature is designed from the pet's perspective — posts are "sniffs", follows are "pack joins", likes are "tail wags", and the feed is "The Trail".

---

## Tech Stack

- **Frontend**: HTML / CSS / Vanilla JS (single-file where possible, RudVentur style)
- **Backend / Database**: Firebase Realtime Database (project: `chemventurmulti117` or new dedicated project)
- **Hosting**: GitHub Pages (github.com/rudventur/) + linked from rudventur.com
- **Auth**: Firebase Anonymous Auth to start, upgrade path to Google/email later
- **Style**: Bold, fun, hand-drawn feeling — NOT corporate. Think paw prints, snout shapes, warm earthy + vibrant accent colours. Rounded corners everywhere. Wobbly/bouncy micro-animations.

---

## MVP Features (Phase 1)

### 1. Pet Profiles
- Pet name, species, breed (optional), personality tags (e.g. "Zoomie King", "Lap Monster", "Treat Goblin")
- Profile pic upload (stored as base64 or Firebase Storage)
- Bio written *as the pet* ("I bark at the mailman because he's suspicious. No further questions.")
- Owner displayed small, secondary — this is the PET's page

### 2. The Trail (Feed)
- Reverse-chronological feed of "Sniffs" (posts)
- Each Sniff: image/video + caption (from pet's POV) + timestamp
- Tail Wags (likes) counter with bouncy paw animation on tap
- "Howl" (comment) section — short replies

### 3. Pack System (Following)
- "Join Pack" button on profiles (= follow)
- Pack members list on each pet's profile
- The Trail filters to your Pack by default

### 4. Sniff Composer
- Upload photo/video
- Write caption as your pet
- Optional mood tag: 😴 Sleepy | 🎾 Playful | 🍖 Hungry | 👑 Majestic | 🤡 Chaos Mode
- Post to The Trail

### 5. Firebase Realtime Structure
```
snoutfirst/
├── pets/
│   └── {petId}/
│       ├── name
│       ├── species
│       ├── breed
│       ├── bio
│       ├── personality_tags[]
│       ├── owner_uid
│       ├── avatar (base64 or URL)
│       └── created_at
├── sniffs/
│   └── {sniffId}/
│       ├── pet_id
│       ├── image
│       ├── caption
│       ├── mood
│       ├── timestamp
│       ├── wags_count
│       └── howls/
│           └── {howlId}/
│               ├── pet_id
│               ├── text
│               └── timestamp
├── packs/
│   └── {petId}/
│       └── following/
│           └── {otherPetId}: true
└── wags/
    └── {sniffId}/
        └── {petId}: true
```

---

## Design Direction

- **Vibe**: Warm, chaotic-friendly, joyful. Like a dog park on a sunny day.
- **Palette**: Warm sand/cream base, deep chocolate browns, pops of tennis-ball green and fire-hydrant red. Optional: breed-specific accent themes.
- **Typography**: Rounded, chunky display font for headers (think: Baloo, Fredoka, Bubblegum Sans). Clean readable body font.
- **Signature Elements**:
  - Paw print loading spinners
  - Nose/snout-shaped UI elements (the logo is literally a snout silhouette)
  - Wobbly hover animations (CSS `@keyframes` wiggle)
  - Tail wag animation on like
  - "Sniff sniff..." placeholder text in search bars
  - Bone-shaped dividers between posts

---

## Build Rules (for Claude Code)

1. **Single-file first** — get it working in one HTML file before splitting
2. **Firebase wide open** — no security rules blocking reads/writes (RudVentur standard approach for accessibility)
3. **Mobile-first** — design for phone screens, scale up for desktop
4. **Fast and fun** — prioritize feel over perfection. Bouncy > polished.
5. **Pet-first language everywhere** — never say "user", say "pet" or "pack member"
6. **RudVentur branding** — subtle "part of RudVentur" footer link to rudventur.com
7. **No frameworks overkill** — vanilla JS unless there's a real reason for React
8. **Immediate gratification** — every interaction should feel alive (animations, sounds optional, visual feedback mandatory)

---

## Future Phases (don't build yet, but design with these in mind)

- **Phase 2**: Pet Meetup Map (Firebase + geolocation), Treat Economy (virtual currency), Pet Achievements/Badges
- **Phase 3**: Pet vs Pet mini-games, AI-generated pet diary entries, breed community groups
- **Phase 4**: Integration with ChemVentur universe — pets as lab assistants? Chemical treats? Cross-pollination with the RudVentur ecosystem

---

## Voice & Tone

Everything in Snout First should feel like it was written by an enthusiastic golden retriever who somehow learned to code. Playful, warm, slightly chaotic, endlessly optimistic. Error messages should be things like "Uh oh, dropped the ball! 🎾 Try again?" not "Error 500".

---

*Built with 🐾 by RudVentur — rudventur.com*
