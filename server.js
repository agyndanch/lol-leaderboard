const express = require('express');
const cheerio = require('cheerio');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Serve static files
app.use(express.static('public'));

// Helper function to convert division number to roman numeral
function divisionToRoman(division) {
  const romanMap = {
    '1': 'I',
    '2': 'II',
    '3': 'III',
    '4': 'IV'
  };
  return romanMap[division] || '';
}

// Helper function to capitalize first letter
function capitalizeRank(rank) {
  return rank.charAt(0).toUpperCase() + rank.slice(1).toLowerCase();
}

// Rank hierarchy for proper sorting
function getRankValue(tier, division) {
  const tierHierarchy = {
    'IRON': 1,
    'BRONZE': 2,
    'SILVER': 3,
    'GOLD': 4,
    'PLATINUM': 5,
    'EMERALD': 6,
    'DIAMOND': 7,
    'MASTER': 8,
    'GRANDMASTER': 9,
    'CHALLENGER': 10
  };
  
  const divisionValues = {
    'IV': 0.25,
    'III': 0.5,
    'II': 0.75,
    'I': 1.0
  };
  
  const baseRankValue = tierHierarchy[tier.toUpperCase()] || 0;
  
  // For Master and above, no divisions
  if (baseRankValue >= 8) {
    return baseRankValue;
  }
  
  // For ranks below Master, add division value
  const divisionValue = divisionValues[division] || 0;
  return baseRankValue + divisionValue;
}

// Scraping function for U.GG
async function scrapeLoLData(username, tag = 'NA1', region = 'na1') {
  try {
    // Format username for URL (replace spaces with -)
    const formattedUsername = username.toLowerCase().replace(/\s+/g, '-');
    const formattedTag = tag.toLowerCase();
    const url = `https://u.gg/lol/profile/${region}/${formattedUsername}-${formattedTag}/overview`;
    console.log(`Scraping URL: ${url}`);
    
    const response = await fetch(url);
    const html = await response.text();
    const $ = cheerio.load(html);
    
    // Extract summoner name and tag
    const summonerName = `${username}#${tag}`;
    
    // Extract profile icon from rank-sub-content
    const profileIcon = $('img.w-full.h-full.rounded-\\[2px\\]').attr('src') || 
                       $('img[src*="profileicon"]').attr('src') ||
                       '';
    
    // Extract rank image
    const rankImage = $('.rank-image-container img.rank-img').attr('src') || '';
    
    // Extract rank tier and division from rank-text
    const rankTitle = $('.rank-title').text().trim();
    const rankParts = rankTitle.split(/\s+/);
    let tier = capitalizeRank(rankParts[0] || 'Unranked');
    let divisionNum = rankParts[1] || '';
    let division = divisionToRoman(divisionNum);
    
    // Extract LP
    const lpText = $('.rank-text span').filter((i, el) => {
      return $(el).text().includes('LP');
    }).text().trim();
    const lpMatch = lpText.match(/(\d+)\s*LP/);
    const LP = lpMatch ? parseInt(lpMatch[1]) : 0;
    
    // Extract wins, losses, and win rate from rank-wins
    // Get all text from rank-wins and parse wins/losses
    const rankWinsText = $('.rank-wins').text().trim();
    console.log(`Raw rank-wins text: "${rankWinsText}"`);
    
    // Match pattern like "3W 5L" or "3 W 5 L"
    const winsMatch = rankWinsText.match(/(\d+)\s*W/);
    const lossesMatch = rankWinsText.match(/(\d+)\s*L/);
    
    const wins = winsMatch ? parseInt(winsMatch[1]) : 0;
    const losses = lossesMatch ? parseInt(lossesMatch[1]) : 0;
    const totalGames = wins + losses;
    
    console.log(`Parsed wins: ${wins}, losses: ${losses}, total: ${totalGames}`);
    
    const winRateText = $('.rank-wins span').filter((i, el) => {
      return $(el).text().includes('Win Rate');
    }).text().trim();
    const winRateMatch = winRateText.match(/([\d.]+)%/);
    const winRate = winRateMatch ? parseFloat(winRateMatch[1]) : 0;
    
    const result = {
      user: summonerName,
      region: region.toUpperCase(),
      avatar: profileIcon,
      rankImage: rankImage,
      rank: division ? `${tier} ${division}` : tier,
      tier: tier,
      division: division,
      LP: LP,
      wins: wins,
      losses: losses,
      games: totalGames,
      winRate: winRate,
      profileUrl: url
    };
    
    console.log(`Scraped data for ${username}:`, JSON.stringify(result, null, 2));
    return result;
    
  } catch (error) {
    console.error(`Error scraping data for ${username}:`, error);
    return null;
  }
}

// API endpoint to get LoL leaderboard data
app.get('/api/lol-leaderboard', async (req, res) => {
  console.log('Fetching LoL leaderboard data...');
  
  const players = [
    { username: 'Monoceros', tag: 'atlas', region: 'na1' },
    { username: 'ashwu', tag: '0321', region: 'na1' },
    { username: 'noa6', tag: '6367', region: 'na1' },
    { username: 'nicc', tag: '1004',  region: 'na1' },
    { username: 'uoo', tag: '3009',  region: 'na1' },
    { username: 'noafknhandsome', tag: 'kim',  region: 'na1' },
    { username: 'testosteronepump', tag: '999',  region: 'na1' },
    { username: 'albertkanggg', tag: 'NA1',  region: 'na1' },
    { username: 'masheep', tag: 'baaa',  region: 'na1' },
  ];
  
  const leaderboardData = [];
  
  for (const player of players) {
    console.log(`Scraping data for ${player.username}#${player.tag}...`);
    const data = await scrapeLoLData(player.username, player.tag, player.region);
    if (data) {
      leaderboardData.push(data);
    }
  }
  
  if (leaderboardData.length > 0) {
    // Sort by rank first (descending), then by LP (descending)
    leaderboardData.sort((a, b) => {
      const rankDiff = getRankValue(b.tier, b.division) - getRankValue(a.tier, a.division);
      if (rankDiff !== 0) {
        return rankDiff;
      }
      return b.LP - a.LP;
    });
    
    console.log('Final LoL leaderboard data:', JSON.stringify(leaderboardData, null, 2));
    res.json(leaderboardData);
  } else {
    res.status(500).json({ error: 'Failed to fetch any player data' });
  }
});

// Serve the HTML page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`LoL Leaderboard server running at http://localhost:${PORT}`);
});


