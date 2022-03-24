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

const fetchTodaysGames = async () => {
  const splitDate = new Date().toLocaleString().split(',')[0].split('/')
  if (splitDate[0].length == 1) splitDate[0] = '0' + splitDate[0];
  const res = await fetch(`https://data.nba.net/prod/v2/${splitDate[2]}${splitDate[0]}${splitDate[1]}/scoreboard.json`);
  const { Message: error, games } = await res.json();
  return res.ok ? { games } : { error };
}

const findWarriorsGame = (games) => games.find(g => g.gameUrlCode.includes('GSW'));

const handleError = (error) => {
  const errDiv = document.querySelector('#error');
  errDiv.innerText = error;
}


const updateNoGame = () => {
  const lede = document.querySelector('#lede');
  lede.innerText = 'No, the Warriors do not play today.';
  document.querySelector('table').setAttribute('class', 'hide')
}

const handleGame = (games) => {
  const dubsGame = findWarriorsGame(games);
  console.log(dubsGame)
  if (!dubsGame) {
    return updateNoGame()
  }
  const lede = document.querySelector('#lede');
  const mainAnswer = document.querySelector('#main-answer');
  const answerDetails = document.querySelector('#answer-details');

  const { 
    startTimeUTC, 
    endTimeUTC,
    clock,
    gameDuration: { hours, minutes },
    arena: { name: arenaName }, 
    period: { current, isHalftime, isEndOfPeriod },
    hTeam: { triCode: homeTeamCode, win: homeWins, loss: homeLosses, linescore: homeLineScore, score: homeScore },
    vTeam: { triCode: awayTeamCode, win: awayWins, loss: awayLosses, linescore: awayLineScore, score: awayScore },
  } = dubsGame;
  const isHomeGame = homeTeamCode === 'GSW';
  const alreadyStarted = !!hours && !!minutes;
  const alreadyEnded = !!endTimeUTC;
  const localStartTime = new Date(startTimeUTC)
  const timeString = localStartTime.toLocaleTimeString().split(':00 ').join('').toLocaleLowerCase();

  const dubs = isHomeGame ? codesToNames[homeTeamCode] : codesToNames[awayTeamCode];
  const otherTeam = isHomeGame ? codesToNames[awayTeamCode] : codesToNames[homeTeamCode];
  lede.innerText = `The ${dubs} ${alreadyEnded ? 'played' : alreadyStarted ? 'are playing' : 'play'} the ${otherTeam} at ${timeString}`
  mainAnswer.innerText = `Yes, ${isHomeGame ? 'at home' : 'away'}`
  mainAnswer.setAttribute('class', isHomeGame ? 'dubs-blue' : 'dubs-yellow')
  answerDetails.innerText = ` at ${arenaName}`

  const headersRow = document.querySelector('tbody').children[0]
  const homeLineRow = document.querySelector('tbody').children[1]
  const awayLineRow = document.querySelector('tbody').children[2]

  let homeTd = document.createElement('td')
  let awayTd = document.createElement('td')
  homeTd = homeLineRow.insertCell(-1);
  awayTd = awayLineRow.insertCell(-1);
  const homeTeam = document.createElement('span')
  const awayTeam = document.createElement('span')
  homeTeam.innerText = homeTeamCode;
  awayTeam.innerText = awayTeamCode;
  const homeWL = document.createElement('span')
  const awayWL = document.createElement('span')
  homeWL.innerText = ` (${homeWins}-${homeLosses})`
  awayWL.innerText = ` (${awayWins}-${awayLosses})`
  homeTd.appendChild(homeTeam)
  homeTd.appendChild(homeWL)
  homeTd.setAttribute('class', 'long-cell')
  awayTd.appendChild(awayTeam)
  awayTd.appendChild(awayWL)
  awayTd.setAttribute('class', 'long-cell')

  if (!alreadyStarted) {
    for (let i = 0; i < 5; i++) {
      let headerTd = document.createElement('td');
      let homeTd = document.createElement('td');
      let awayTd = document.createElement('td');
      headerTd = headersRow.insertCell(-1);
      homeTd = homeLineRow.insertCell(-1);
      awayTd = awayLineRow.insertCell(-1);
      headerTd.innerText = i == 4 ? 'T' : i;  
      homeTd.innerText = '-'  
      awayTd.innerText = '-'  
    }
  } else {
    const qtrText = isHalftime ? 'HT' 
      : isEndOfPeriod ? `End ${quarters[current]}` 
      : alreadyEnded ? 'FT' 
      : alreadyStarted ? `${clock} in ${quarters[current]}` : '';

    headersRow.children[0].innerText = qtrText;
    
    for (let i = 0; i < homeLineScore.length; i++) {
      let { score: homeScore } = homeLineScore[i];
      let { score: awayScore } = awayLineScore[i];
      let headerTd = document.createElement('td');
      let homeTd = document.createElement('td');
      let awayTd = document.createElement('td');
      headerTd = headersRow.insertCell(-1);
      homeTd = homeLineRow.insertCell(-1);
      awayTd = awayLineRow.insertCell(-1);
      headerTd.innerText = i;  
      homeTd.innerText = homeScore ? homeScore : '-'; 
      awayTd.innerText = awayScore ? awayScore : '-';
    }

    let headerTd = document.createElement('td');
    let homeTd = document.createElement('td');
    let awayTd = document.createElement('td');
    headerTd = headersRow.insertCell(-1);
    homeTd = homeLineRow.insertCell(-1);
    awayTd = awayLineRow.insertCell(-1);
    headerTd.innerText = 'T'
    homeTd.innerText = homeScore;
    awayTd.innerText = awayScore;
  }
}

window.onload = async () => {
  const { games, error } = await fetchTodaysGames();
  console.log('games! ', games);
  console.log('error! ', error);

  if (error) {
    return handleError(error)
  } 
  handleGame(games)
};