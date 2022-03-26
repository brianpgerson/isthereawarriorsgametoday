const codesToNames = {
  ATL: 'Atlanta Hawks',
  BOS: 'Boston Celtics',
  CHA: 'Charlotte Hornets',
  CHI: 'Chicago Bulls',
  CLE: 'Cleveland Cavaliers',
  DAL: 'Dallas Mavericks',
  DEN: 'Denver Nuggets',
  DET: 'Detroit Pistons',
  GSW: 'Golden State Warriors',
  HOU: 'Houston Rockets',
  IND: 'Indiana Pacers',
  LAC: 'Los Angeles Clippers',
  LAL: 'Los Angeles Lakers',
  MEM: 'Memphis Grizzlies',
  MIA: 'Miami Heat',
  MIL: 'Milwaukee Bucks',
  MIN: 'Minnesota Timberwolves',
  NOP: 'New Orleans Pelicans',
  NYK: 'New York Knicks',
  BKN: 'Brooklyn Nets',
  OKC: 'Oklahoma City Thunder',
  ORL: 'Orlando Magic',
  PHI: 'Philadelphia 76ers',
  PHX: 'Phoenix Suns',
  POR: 'Portland Trail Blazers',
  SAC: 'Sacramento Kings',
  TOR: 'Toronto Raptors',
  UTA: 'Utah Jazz',
  WAS: 'Washington Wizards',
  SAS: 'San Antonio Spurs',
}

const quarters = {
  1: '1st',
  2: '2nd',
  3: '3rd',
  4: '4th'
}

const EST = new Intl.DateTimeFormat('en-US', {
  timeZone: "America/New_York", year: 'numeric', month:  '2-digit', day:  "2-digit",
});

const fetchTodaysGames = async () => {
  const todayEST = EST.format(new Date()).split('/');
  const res = await fetch(`https://data.nba.net/prod/v2/${todayEST[2]}${todayEST[0]}${todayEST[1]}/scoreboard.json`);
  // const res = await fetch(`https://data.nba.net/prod/v2/20220324/scoreboard.json`);
  const { Message: error, games } = await res.json();
  return res.ok ? { games } : { error };
}

const fetchDubsSchedule = async () => {
  const now = new Date();
  const thisYear = now.getFullYear();
  const thisMonth = now.getMonth();
  const useThisYear = thisMonth <= 11 && thisMonth >=9;
  const res = await fetch(`https://data.nba.net/prod/v1/${useThisYear ? thisYear : thisYear - 1}/teams/1610612744/schedule.json`);

  if (!res.ok) {
    console.error('error fetching GSW schedule');
    return {};
  }
  const { league: { standard } } = await res.json();
  return { schedule: standard }
}

const findWarriorsGame = (games) => games.find(g => g.gameUrlCode.includes('GSW'));

const handleError = (error) => {
  const errDiv = document.querySelector('#error');
  errDiv.innerText = `Something went wrong! Error: ${error}`;
}

const updateElement = (selector, text, attributes) => {
  const el = document.querySelector(selector);
  el.innerText = text;
  for (const key in attributes) {
    if (attributes.hasOwnProperty(key)) {
      el.setAttribute(key, attributes[key])
    }
  }
}

const updateBroadcasts = ({ broadcasters: { hTeam, vTeam }}) => {
  const el = document.querySelector("#broadcasts");
  const broadcasts = [...hTeam, ...vTeam]
  const header = document.createElement('div')
  header.innerText = 'BROADCASTS:'
  el.appendChild(header)
  
  for (const { shortName, longName } of broadcasts) {
    const bc = document.createElement('div')
    bc.innerText = `${shortName} - ${longName}`
    el.appendChild(bc)
  }
}

const updateNoGame = (schedule) => {
  document.querySelector('table').setAttribute('class', 'hide')
  const noText = 'No, the Warriors do not play today.'
  if (!schedule) return updateElement('#answer', noText);

  const nextGame = schedule.find(g => new Date().getTime() < new Date(g.startTimeUTC).getTime())
  if (!nextGame) return;

  const { isHomeTeam, gameUrlCode, startTimeUTC } = nextGame;
  const start = new Date(startTimeUTC)
  const dateString = start.toLocaleDateString();
  const timeString = start.toLocaleTimeString().split(':00 ').join('').toLocaleLowerCase();
  const oppTeam = codesToNames[gameUrlCode.split('/')[1].split('GSW').filter(s => !!s)[0]];
  const ledeText = `The next scheduled game is on ${dateString} ${isHomeTeam ? 'hosting' : '@'} the ${oppTeam} at ${timeString}`
  updateElement('#lede', ledeText);
  updateElement('#answer', noText, { class: isHomeTeam ? 'dubs-blue' : 'dubs-yellow' });
}

const createTeamCol = (row, teamCode, wins, losses) => {
  let td = document.createElement('td')
  td = row.insertCell(-1);
  const team = document.createElement('span')
  team.innerText = teamCode;
  const wl = document.createElement('span')
  wl.innerText = ` (${wins}-${losses})`
  td.appendChild(team)
  td.appendChild(wl)
  td.setAttribute('class', 'long-cell')
}

const addTDToRow = (row, val) => {
  let td = document.createElement('td');
  td = row.insertCell(-1);
  td.innerText = val;
}

const addBlankBoxScoreColumns = () => {
  const headersRow = document.querySelector('tbody').children[0]
  const homeLineRow = document.querySelector('tbody').children[1]
  const awayLineRow = document.querySelector('tbody').children[2]
  
  for (let i = 0; i < 5; i++) {
    addTDToRow(headersRow, i == 4 ? 'T' : i)
    addTDToRow(homeLineRow, '-')
    addTDToRow(awayLineRow, '-')
  }
}

const handleGame = (games, schedule) => {
  const dubsGame = findWarriorsGame(games);
  if (!dubsGame) {
    return updateNoGame(schedule)
  }

  const { 
    startTimeUTC, 
    endTimeUTC,
    clock,
    gameDuration: { hours, minutes },
    arena: { name: arenaName }, 
    period: { current, isHalftime, isEndOfPeriod },
    hTeam: { triCode: homeTeamCode, win: homeWins, loss: homeLosses, linescore: homeLineScore, score: homeScore },
    vTeam: { triCode: awayTeamCode, win: awayWins, loss: awayLosses, linescore: awayLineScore, score: awayScore },
    watch: { broadcast },
  } = dubsGame;

  const isHomeGame = homeTeamCode === 'GSW';
  const alreadyStarted = !!hours && !!minutes;
  const alreadyEnded = !!endTimeUTC;
  const timeString = new Date(startTimeUTC).toLocaleTimeString().split(':00 ').join('').toLocaleLowerCase();
  const dubs = isHomeGame ? codesToNames[homeTeamCode] : codesToNames[awayTeamCode];
  const otherTeam = isHomeGame ? codesToNames[awayTeamCode] : codesToNames[homeTeamCode];
  const ledeText = `The ${dubs} ${alreadyEnded ? 'played' : alreadyStarted ? 'started playing' : 'play'} the ${otherTeam} at ${timeString}`;
  const mainAnswerText = `Yes, ${isHomeGame ? 'at home' : 'away'}`

  updateElement('#lede', ledeText);
  updateElement('#main-answer', mainAnswerText, { class: isHomeGame ? 'dubs-blue' : 'dubs-yellow' });
  updateElement('#answer-details', ` at ${arenaName}`);
  updateBroadcasts(broadcast);

  const headersRow = document.querySelector('tbody').children[0]
  const homeLineRow = document.querySelector('tbody').children[1]
  const awayLineRow = document.querySelector('tbody').children[2]
  createTeamCol(homeLineRow, homeTeamCode, homeWins, homeLosses);
  createTeamCol(awayLineRow, awayTeamCode, awayWins, awayLosses);

  if (!alreadyStarted) {
    addBlankBoxScoreColumns()
  } else {
    const qtrText = isHalftime ? 'HT' 
      : isEndOfPeriod ? `End ${quarters[current]}` 
      : alreadyEnded ? 'FT' 
      : alreadyStarted ? `${clock} in ${quarters[current]}` : '';
    headersRow.children[0].innerText = qtrText;
    
    for (let i = 0; i < homeLineScore.length; i++) {
      let { score: homeQScore } = homeLineScore[i];
      let { score: awayQScore } = awayLineScore[i];
      addTDToRow(headersRow, i);
      addTDToRow(homeLineRow, homeQScore ? homeQScore : '-');
      addTDToRow(awayLineRow, awayQScore ? awayQScore : '-');
    }

    addTDToRow(headersRow, 'T');
    addTDToRow(homeLineRow, homeScore);
    addTDToRow(awayLineRow, awayScore);
  }
}

window.onload = async () => {
  const { games, error } = await fetchTodaysGames();
  if (error) {
    return handleError(error)
  } 

  const { schedule } = await fetchDubsSchedule();
  handleGame(games, schedule)
};