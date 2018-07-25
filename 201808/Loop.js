const { Style } = require('./helper.js');

const COUP = require('./Coup.js');

class Loop {
	constructor(debug = false, rounds = 1000, playerNames = []) {
		this.LOG = '';
		this.ERROR = false;
		this.SCORE = {};
		this.ROUND = 0;
		this.ROUNDS = rounds;

		this.PLAYERNAMES = playerNames;
		this.WINNERS = playerNames.reduce((acc, p) => ({ ...acc, [p]: 0 }), {});
		this.SCORE = playerNames.reduce((acc, p) => ({ ...acc, [p]: 0 }), {});
	}

	GetScore( winners, allPlayer ) {
		const winnerCount = winners.length;
		const loserCount = allPlayer.length - winnerCount;
		const loserScore = -1 / ( allPlayer.length - 1 );
		const winnerScore = ( loserScore * loserCount ) / winnerCount * -1;

		allPlayer.forEach( player => {
			if( winners.includes( player ) ) {
				this.SCORE[ player ] += winnerScore;
			}
			else {
				this.SCORE[ player ] += loserScore;
			}
		});

		winners.forEach( player => {
			this.WINNERS[ player ] ++;
		});
	}

	DisplayScore( clear = false ) {
		if( this.ROUND % 20 !== 0) return;
		if( clear ) process.stdout.write(`\u001b[${ Object.keys( this.SCORE ).length + 3 }A\u001b[2K`);

		const done = ((this.ROUND/this.ROUNDS) * 100).toFixed( 3 ).padStart(8);
		process.stdout.write(`\u001b\n[2K${ done }% ${String(this.ROUND).padStart( 8 )} / ${String(this.ROUNDS)} games played\n\n`);

		Object
			.keys( this.SCORE )
			.sort( ( a, b ) => this.SCORE[b] - this.SCORE[a] )
			.forEach( player => {
				const percentage = ( this.ROUND > 0 ) ? `${ ( ( this.WINNERS[ player ] * 100 ) / this.ROUND ).toFixed( 3 ) }%` : '-';
				const perc = `\u001b[2K${ Style.gray( percentage.padStart( 9 ) ) }`;
				const score = `${ Style.red( String( this.SCORE[ player ].toFixed( 2 ) ).padStart( 11 ) ) } pts`;
				const wins = `${ Style.red( String( this.WINNERS[ player ] ).padStart( 8 ) ) } wins`;
				process.stdout.write(`${perc} ${score} ${wins}   ${Style.yellow( player )}\n`);
			});
	}

	Play() {
		this.ROUND ++;
		this.LOG = '';

		const game = new COUP();
		const winners = game.Play(this.PLAYERNAMES);
		this.GetScore( winners, game.PLAYERNAMES );

		if( !winners || this.ERROR ) {
			console.info( this.LOG );
			// console.info( JSON.stringify( game.HISTORY, null, 2 ) );
			this.ROUND = this.ROUNDS;
		}

		if( this.ROUND < this.ROUNDS ) {
			// We run on next tick so the GC can get to work.
			// Otherwise it will work up a large memory footprint
			// when running over 100,000 games
			// (cause loops won't let the GC run efficiently)
			process.nextTick( () => this.Play());
		}

		this.DisplayScore( true );
	}

	Run() {
		console.log = text => { this.LOG += `${ text }\n` };
		console.error = text => {
			if( this.DEBUG ) {
				this.ERROR = true;
				this.LOG += Style.red(`🛑  ${ text }\n`);
			}
		};

		this.DisplayScore( false );
		this.Play();
	}
};

module.exports = Loop;
