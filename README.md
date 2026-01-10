# League of Legends Leaderboard

Web scraper and leaderboard for tracking League of Legends player rankings from OP.GG.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start the server:
```bash
npm start
```

3. Open browser to `http://localhost:3001`

## How to Add Your Players

Edit `lol-server.js` and find the players array in the `/api/lol-leaderboard` endpoint:

```javascript
const players = [
  { username: 'YourSummonerName', tag: 'NA1', region: 'na' },
  { username: 'AnotherPlayer', tag: 'EUW', region: 'euw' }
];
```

### Player Format

- **username**: Summoner name (without the #tag)
- **tag**: The tag after the # symbol
- **region**: Server region code

### Region Codes

- `na` - North America
- `euw` - Europe West
- `eune` - Europe Nordic & East
- `kr` - Korea
- `br` - Brazil
- `lan` - Latin America North
- `las` - Latin America South
- `oce` - Oceania
- `ru` - Russia
- `tr` - Turkey
- `jp` - Japan
- `ph` - Philippines
- `sg` - Singapore
- `th` - Thailand
- `tw` - Taiwan
- `vn` - Vietnam

## Example Players

The default setup tracks:
- Hide on bush (KR)
- Doublelift (NA)
- Tyler1 (NA)
- Faker (KR)

Replace these with players you want to track.

## How It Works

The server scrapes player data from OP.GG including:
- Rank and LP
- Win/Loss record
- Total games played
- Win rate
- Profile icons
- Rank images

Players are sorted by rank tier and LP.

## Features

- Real-time data from OP.GG
- Clickable player cards (opens OP.GG profile)
- Responsive design
- Automatic rank sorting
- Visual rank images
- Win rate statistics

## Technical Details

- Built with Express.js and Cheerio
- Scrapes OP.GG HTML pages
- Runs on port 3001 (configurable)
- No API key required

## Notes

Web scraping depends on OP.GG's HTML structure. Updates to their site may break the scraper.

For production use, consider using the official Riot Games API instead.
