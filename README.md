# Project Trains

A virtual toy-train city with a Japanese theme. Lay track on a 56 x 56 board, build stations
and signals, bridge rivers, tunnel through hills, lay roads with level crossings and road
bridges, build highways on pillars up to three levels high, run express and local trains
that overtake and couple at stations, ride them, and watch passengers walk to their trains
and grow a town round your stations, in any season, by day or with the windows lit at night.
It runs in the browser and is built with three.js.

## Run it on your computer

You need [Node.js](https://nodejs.org) 20.19 or newer.

```
npm install
npm run dev
```

Then open http://localhost:5173. Leave the window running while you play; `Ctrl+C` stops it.

## Build it

```
npm run build
npm run preview
```

`build` writes the finished site to `dist/`. `preview` serves that folder so you can check it.

## Put it on GitHub Pages

This gives the game its own public address, `https://YOUR-USERNAME.github.io/project-trains/`.
It does not change your existing GitHub page. Wherever you see `YOUR-USERNAME`, type your
GitHub user name.

### Once only: get Git ready

1. Open a terminal in this folder (the one that holds `package.json`), the same way you do
   for `npm run dev`.
2. Type `git --version`. If it prints a version number, Git is installed. If it says the
   command is not recognised, install Git from https://git-scm.com/download/win with the
   default choices, then close the terminal and open it again.
3. Tell Git who you are (use the email of your GitHub account):
   ```
   git config --global user.name "Your Name"
   git config --global user.email "you@example.com"
   ```

### Publish the game

1. On github.com click **+** (top right) → **New repository**.
   - Repository name: `project-trains`
   - Choose **Public** (GitHub Pages is free for public repositories).
   - Leave "Add a README", ".gitignore" and "license" switched off. The repository must
     start empty.
   - Click **Create repository**.
2. In the terminal, in this folder, run these one line at a time:
   ```
   git init -b main
   git add .
   git commit -m "Project Trains"
   git remote add origin https://github.com/YOUR-USERNAME/project-trains.git
   git push -u origin main
   ```
   The first push opens a browser window asking you to sign in to GitHub. Sign in and
   allow it.
3. On GitHub, open the repository, then **Settings → Pages**. Under **Build and
   deployment**, set **Source** to **GitHub Actions**.
4. Open the **Actions** tab. The first run, started by your push, has probably failed with a
   red cross, because Pages was not switched on yet. Click it, then **Re-run all jobs**.
5. Wait about a minute for the green tick, then open
   `https://YOUR-USERNAME.github.io/project-trains/`.

What is uploaded: the source code, not `node_modules` or `dist` (the file `.gitignore`
keeps them out). GitHub builds the site itself, using `.github/workflows/deploy.yml`.

### Link it from your main page

Your main page lives in its own repository, normally called `YOUR-USERNAME.github.io`.

1. Open that repository's home page file: usually `index.html` (or `index.md` / `README.md`
   if the page is written in Markdown).
2. Paste one of these where the link should appear.

   A plain link, for an HTML page:
   ```html
   <a href="/project-trains/">Project Trains: a toy-train city in the browser</a>
   ```
   The same for a Markdown page:
   ```
   [Project Trains: a toy-train city in the browser](/project-trains/)
   ```
   A card with a picture (HTML). The picture is `public/preview.jpg` from this project,
   which is published with the game:
   ```html
   <a href="/project-trains/" style="display:block;max-width:420px;text-decoration:none;color:inherit;border:1px solid #ccc;border-radius:12px;overflow:hidden">
     <img src="/project-trains/preview.jpg" alt="A toy-train city with a highway and bullet trains" style="display:block;width:100%">
     <span style="display:block;padding:12px 16px"><strong>Project Trains</strong><br>Build a Japanese toy-train city and run bullet trains through it.</span>
   </a>
   ```
3. Save, then publish the main page the way you normally do. If it is a Git repository on
   your computer, that is, in its folder:
   ```
   git add .
   git commit -m "Link to Project Trains"
   git push
   ```
   You can also edit the file on github.com: open it, click the pencil, paste, **Commit changes**.

The link starts with `/project-trains/` and no site name, so it works from your main page
whether that is at `YOUR-USERNAME.github.io` or at a domain of your own. Publish the game
first; until then the link leads to a "not found" page.

### Update the site later

After changing the game, in this folder:
```
git add .
git commit -m "What changed"
git push
```
Every push to `main` rebuilds and publishes the site in about a minute. The **Actions** tab
shows whether it worked.

Good to know: a layout is saved in the browser for each address separately, so the published
game starts with the starter city, not with the board you built at `localhost`. To carry a
board across, use **More → Copy share link** and change the start of the link to the
published address.

## How to play

| Tool | Key | What it does |
|---|---|---|
| Track | `1` | Drag to lay track. Crossing a line makes a junction or a crossing. |
| Ramp up / down | `2` / `3` | Click to build a ramp to the next level. `R` turns it. |
| Station | `4` | Click straight track to build a platform, drag to lengthen it. Platforms on tracks side by side join into one bigger station. Click again to swap sides, a third time to remove. |
| Signal | `5` | Click straight track to put up a signal. Click it again to take it down. |
| Operate | `6` | Click a junction to change its route; after its three routes comes a setting where it takes turns by itself. Click a signal to hold trains or release them. Click a train to change its service (local, express, not stopping). Click a coupled train to split it. Click a station to make it a coupling station. |
| Erase | `7` | Click a train to remove it, or drag over track, highway, scenery, roads, water and hills. A walkway that crosses track comes off first; the track stays. |
| Look around | `8` | Drag to orbit the camera. |
| Ride | `9` | Click a train to ride it. `V` changes the view (driver's cab, chase, passenger window), `N` hops to the next train, `Esc` leaves. Drag to look around. |
| Road | `0` | Drag to lay a road. Cars arrive by themselves. A road across straight ground-level track becomes a level crossing; a road across water becomes a road bridge. |
| River | `-` | Drag to paint water. Track that crosses water becomes a bridge. |
| Hill | `=` | Drag to raise a hill. Ground-level track through a hill becomes a tunnel. |
| Highway | `H` | Drag to build a road on pillars, on the level you have selected (1, 2 or 3). Run it straight up to the end of a road, or of a highway one level down, and its last two squares become a ramp. |

- **Trains**: pick one in the depot, then click a piece of track. That square becomes its home.
- **Coupling**: with a train picked in the depot, click a train already on the track to couple
  yours on behind it. Hayabusa + Komachi comes ready coupled. Operate splits a pair again.
- **Scenery**: open the depot's Scenery tab, pick an item, then click or drag over empty ground.
  Large buildings (3 x 2, 4 x 2 and 4 x 4 squares) show the ground they need; `R` turns them,
  one click builds them, and Erase on any of their squares removes the whole building.
  A few items go in special places and turn themselves to fit:
  - **Footbridge** and **Toll gate**: click a straight piece of road.
  - **Shops under the tracks**: click or drag along straight level-1 track or highway. Click a
    square again to take them away; erasing the track or highway above removes them too.
  - **Station building**: click a station to build a concourse across all its tracks at that
    point; click it again to remove it.
  - **Pedestrian deck**: stands on pillars, so it may be built over road squares.
  - **Raised walkway**: a footpath on pillars at the same height as the deck and the
    footbridge. Drag to lay it, over roads and over plain ground-level track too (not over a
    station, signal or switch). Each square joins the walkway squares, decks and footbridge
    ends beside it, and an end that leads nowhere gets stairs down to the ground.
  - **Ticket hall** (2 x 1 squares): a station entrance on the ground. Put it beside a small
    station; people walking on to the platform come from its end.
- **Levels**: `G 1 2 3` buttons, or `[` and `]`.
- **Camera**: right-drag to orbit, scroll to zoom, `W A S D` or arrows to move, `Q E` to turn.
  Tilt the view down low to see the sky and the mountain. The camera rises over hills,
  buildings, stations and viaducts instead of passing through them.
- `Space` pauses (with the board focused), `Ctrl+Z` undoes.
- **More** menu: reset camera, time of day (day, sunset, night), season, sound on or off, careful
  or reckless drivers, town growth on or off, departure board on or off, copy a share link,
  remove all trains, load the starter layout, clear the board.
- **Departure board** (top right): the next stop of every train, soonest first, with its
  service, platform and time. Click a line to move the camera to that train.

### How the railway behaves

- **Station names**: every station takes a name from a list of forty Shinkansen stations, and
  no two stations on the board share one.
- **Stations**: a train that calls at a station stops for a few seconds with its doors at the
  marks on the platform, then moves on. How a
  station looks depends on how many platform tracks lie side by side:
  one is a halt with a small roof, two get a footbridge, three a glass roof over all the
  tracks, four or more a terminal with a great train shed and a clock tower.
- **Services**: every train runs one of three services. Change it by clicking the train with
  Operate.
  - **Local**: stops at every station. This is what a train from the depot starts as.
  - **Express**: stops only at stations of three tracks or more, and runs through the rest.
  - **Not in service**: stops nowhere. Doctor Yellow starts like this.
- **Choosing a platform**: where the two ways out of a junction both lead to platforms of the
  same station, the train chooses for itself. A local takes the loop platform and leaves the
  through line clear. Any other train keeps to the through line. Every train avoids a platform
  with a train standing at it if the other is free. Lay each extra platform track as a loop
  that leaves the main line before the station and rejoins after it.
- **Overtaking**: a train standing at a station of two tracks or more waits for a faster
  service coming up behind (an express, or a train not in service) to go past before it
  leaves. It waits 12 seconds at most.
- **Coupling stations**: click a station with Operate to make it one; its sign gets a red
  band and the mark 連結. A coupled train that stops there uncouples: the front set leaves and
  the set behind follows. The two sets remember each other. The next time one of them stops at
  a coupling station with the other coming up behind, it waits (22 seconds at most), the
  second runs in on the same platform, and they join.
- **Platform doors**: stations of two tracks or more have a fence along the platform edge
  with gates that slide open while a train stands there.
- **Queues**: waiting passengers line up two abreast behind the marks where the doors come.
  The marks, the gates in the platform fence and the train doors all line up: every train has
  three coaches of the same length between its two end cars, and stops centred on the
  platform. (In a coupled pair the front set lines up; the set behind may be half a car out.)
- **People walk**: passengers walk in along the platform to their place in the queue, walk
  from the queue into the train when it stops, and those getting off walk away along the
  platform. People also stroll on raised walkways, pedestrian decks and footbridges, coming up
  and going down by the stairs.
- **Station staff**: every platform has a conductor, who points at the train while the
  departure melody plays and raises an arm as it leaves. A terminal also has a cleaning crew
  on each platform: they bow as the train comes in, go aboard while it stands (seven seconds
  rather than the usual three and a half), and bow again as it leaves.
- **Departure melodies**: every station name has its own short tune, composed by the game from
  the letters of the name. It plays just before the train leaves, followed by the conductor's
  whistle.
- **Station forecourt** (Scenery tab, 3 x 2 squares): a bus bay, taxi rank, bicycle racks,
  clock and a lunch-box stall. Put its kerb along a road, within three squares of a station;
  its tarmac then runs out to join the road. Buses and taxis driving past on the kerb side
  pull off the road into the bay, set people down, and pull out again; those people join the
  queue on the station's emptiest platform. A forecourt also draws more passengers
  to a nearby station, as buildings do.
- **Signals** work in both directions. An automatic signal is red while another train is on the
  line ahead (up to the next signal, or eight squares). Held signals stay red until released.
- **Junctions**: the amber line shows the live route. A train arriving from the leg that is not
  on that route pushes the switch over and it stays there. A train joining from a side leg
  carries on in the direction it was already travelling. New junctions start set for the
  through line.
- **Switches that take turns**: click a junction with Operate until all three routes show
  amber. Each train on the through line then goes the other way from the train before it:
  straight on, then down the branch, then straight on. A train that took the branch carries on
  the way it was going when it comes back. If a train is still down the branch when the next
  turn comes, that train goes straight on instead.
- **Crossings**: trains always go straight over.
- **Dead ends**: a train stops and runs back the other way.
- **Bridges**: any track over water gets a deck, red railings and a lamp. There is no bridge
  tool; lay track across a river on any level.
- **Tunnels**: ground-level track in a hill square runs inside the hill, with a stone arch
  wherever the rails come out. Hills rise towards the middle, so a wide one becomes a mountain;
  raised track cannot cross a hill. Ride a train through to see the inside.
- **Highway**: a road on pillars at level 1, 2 or 3. It joins up and curves like a road, and
  passes over roads, track, stations and water on the levels below it; track on higher levels
  passes over it. It cannot share a square with track on its own level, or with a hill. Where
  it reaches the edge of the board it carries on across the countryside. Where three or four
  highways meet, the corners are rounded slip roads.
- **Ramps and flyovers**: where a level-1 highway runs straight up to the end of a road, its
  last two squares slope down to meet it, provided the ground under those two squares is
  empty. A highway on level 2 or 3 comes down in the same way to a highway one level below.
  A short highway between two road ends (two squares of ramp, at least one of deck, two of
  ramp) is a flyover, an alternative to a level crossing.
- **Road bridges**: a road painted across water crosses it on a bridge with railings. A road
  bridge and a railway cannot share a square. Erasing the bridge leaves the water.
- **Level crossings**: where a road meets straight ground-level track. The gates come down, the
  lamps flash and a bell rings when a train is on the crossing or within about four squares.
- **Roads** curve at corners and at junctions, and where a road or a river reaches the edge of
  the board it carries on across the countryside.
- **Cars**: about one for every six squares of road and highway: sedans, kei trucks, taxis,
  buses and lorries. They keep left, follow the curves, turn at random at junctions, turn
  round at dead ends, queue, and wait at closed gates. They climb ramps onto the highway and
  drive faster there. They stop for a moment at a toll gate.
- **Traffic beyond the board**: at the edge of the board cars drive on out into the
  countryside, and new ones drive in from out there.
- **Parking**: some cars passing a multi-storey car park on their kerb side turn in, stay a
  while and come out again. At a service area cars turn into a bay and park in view, while
  buses and lorries stop in the lane along its front.
- **Careful drivers** (the default): a driver never enters a piece of track another train is on
  or is about to need, so trains queue behind each other and take turns at junctions and
  crossings. Two trains that meet nose to nose wait a moment, then turn back. Three or more
  trains waiting for each other round a ring of track are untangled too: if they all face the
  same way they move off together as a convoy, otherwise one of them backs away.
- **Reckless drivers** (More menu): trains ignore each other. If two touch, both crash, and a
  moment later each is put back on the square where it was first placed. Signals are then the
  only protection. Some cars also jump the crossing gates, and a train will knock them off the road.
- **Passengers**: people gather on every platform, faster where homes, shops, offices and
  forecourts are near. A stopping train lets passengers off and takes on those waiting. The header counts how
  many have been carried.
- **Town growth**: passengers getting off at a station count towards its next building. When
  enough have arrived, a house, shop or office rises on free ground near the platform; busier
  stations get offices and now and then a large building, and new buildings prefer plots
  beside a road. Each building costs more
  arrivals than the last. Switch it off in the
  More menu if you want to place everything yourself.
- **Seasons** (More menu): spring blossom, green summer, red and gold autumn, snowy winter. Trees,
  ground, rice fields, hills and the mountain's snow line change, snow lies on the roofs in
  winter, and petals, leaves or snow drift through the air.
- **Night**: at sunset and night, train, station and building windows light up.
- **Sound**: running noise (deeper in a tunnel, with a hollow thump on a bridge), arrival
  chimes, departure melodies, the conductor's whistle, the crossing bell, bus doors, crashes
  and clicks are all generated in the browser; there are no sound files. Sound starts after
  your first click.

Your layout is saved in the browser automatically. **Copy share link** packs the whole layout
into a link; anyone who opens it gets their own copy.

### The starter layout

**More → Load starter layout** builds a small city that uses every feature:

- The **main line** runs round the outside: Tokyo terminal (four tracks) in the south, Morioka
  (three tracks, a coupling station) in the north, Nagoya (two tracks, with a station building)
  in the west and the Karuizawa halt in the east. It bridges the river twice and tunnels through
  the mountain. Three expresses and two locals share it; locals are overtaken at Nagoya.
- The **highway** crosses the north of the board from a toll gate, over the river and out into
  the countryside, with a slip road down to the village on the far bank. A **second highway**
  leaves it at a junction, climbs to level 2 over the hot-spring line and comes down in two
  ramps to the east street. The **loop line** runs beside the first on a viaduct, with shops
  underneath.
- Inside the loop line: a tram loop crossed by a second line (two diamond crossings), a
  shuttle on level 2 that passes over the highway, and one on level 3.
- The **hot-spring line** leaves the loop line at a switch that takes turns, comes down a
  ramp, bridges the river, crosses a road at a level crossing and ends at the Atami halt.
  Every other train on the loop line goes down to Atami and back.
- **Roads** form a grid, with a bus bay in front of every main-line station. The high street
  crosses the river on a road bridge to the village. A flyover carries the south road over
  the main line; the west road has a level crossing.
- **People have their own level**: decks over the high street and the north street, joined by
  a raised walkway that crosses the avenue. A second walkway leaves the park, crosses the tram
  line and joins a footbridge over the avenue.
- **Ticket halls** stand beside the Karuizawa and Atami halts and the tram stop in the park.

## How the code is laid out

```
index.html                 the page and its buttons
src/
  main.js                  starts everything and runs the frame loop
  style.css
  core/                    renderer, shared constants (board size is G in constants.js), colours,
                           settings, the shape builder
  world/board.js           the board itself
  tracks/
    model.js               the layout data
    paths.js               how trains find their way from piece to piece
    edit.js  render.js     changing the layout, drawing it
    pieces/                one file per kind of track
      straight.js  curve.js  junction.js  crossing.js  ramp.js
    features/              station.js  signal.js  bridge.js  tunnel.js  crossing.js
                           gates.js (platform doors)  hall.js (the station building)
  trains/
    index.js               the roster: which trains are in the depot
    shinkansen/            one file per train, plus kit.js which they share
    archive/               trains from the first prototype, not loaded (see its README)
    runtime.js             how trains move, stop and reverse
    driving.js             careful driving: who has right of way
    coupling.js            two trains joined into one
    service.js             local, express and not in service; overtaking
    autocouple.js          coupling stations: splitting and joining by themselves
    collisions.js  crash.js  proximity.js
  city/                    passengers.js (people on platforms), growth.js (buildings that appear),
                           staff.js (conductors and cleaning crews), forecourt.js (bus and taxi set-downs),
                           people.js (everyone who walks: passengers and pedestrians)
  terrain/                 model.js (which squares are water, hill or road), render.js,
                           water.js  hills.js  roads.js
                           highway.js (the raised road and its ramps), highway-draw.js
  roads/                   crossings.js (gates), cars.js (traffic), vehicles/ one file per vehicle
  scenery/
    index.js               which items are in the Scenery tab
    items/                 one file per item (sakura, pagoda, castle, ...)
    placed.js              items the player has put on the board
    sky.js  clouds.js  mountains.js  landscape.js  daylight.js  seasons.js  weather.js
  input/                   one file per kind of input
    pointer.js  wheel.js  keyboard.js  camera.js  ride.js  picking.js  ghost.js
    obstacles.js (keeps the camera out of hills and buildings)
  tools/                   one file per tool
    track.js  ramp.js  station.js  signal.js  operate.js  erase.js  train.js  scenery.js  look.js  ride.js
    road.js  river.js  hill.js  (all three built on ground.js)  highway.js
  ui/                      depot.js  menu.js  ridebar.js  board.js (the departure board)
  audio/                   engine.js, and sounds/ with one file per kind of sound
  save/                    layout.js  history.js  share.js  starter.js (the starter layout)
```

### Adding a train

Copy a file in `src/trains/shinkansen/`, change its name, colours and nose numbers, then import
it in `src/trains/index.js` and add it to `ROSTER`. It appears in the depot with its own picture.
Add `service: 'express'` or `service: 'through'` if it should not start as a local.

### Adding a scenery item

Copy a file in `src/scenery/items/`, then import it in `src/scenery/index.js` and add it to `SCENERY`.
Give it `size: [wide, deep]` to make it cover more than one square; build it centred on the
middle of that block. `on: 'road'` makes it stand over a straight road square, `under: true`
puts it under raised track or highway, `overRoad: true` lets it cover road squares, and
`overTrack: true` lets it cross plain ground-level track.

### Adding a tool

Write a file in `src/tools/` that exports an object with `id`, `hint()` and any of `hover`, `start`,
`move`, `end`; register it in `src/tools/index.js`; add a button with `data-tool="<id>"` to `index.html`.

## Notes

- three.js is pinned to 0.128.0 because the code uses that release's colour settings.
- Fonts load from Google Fonts; offline, the page falls back to system fonts.
- The train models are simplified toys inspired by real trains. The real names and liveries
  belong to the railway companies, so check licensing before any commercial use.
